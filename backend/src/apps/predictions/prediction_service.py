"""
Predictions app services for ML integration.
"""

import os
import joblib
import logging
import pandas as pd
import numpy as np
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .models import PredictionReport, PredictionIssues, RiskLevel
from apps.reports.models import WeeklyReport
from apps.schools.models import School, SchoolProfile, SchoolInfrastructure

logger = logging.getLogger(__name__)


class ModelRegistry:
    """
    Singleton registry to load and cache ML models.
    """
    _instance = None
    _models = {}
    _scalers = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
        return cls._instance

    def get_model(self, name: str):
        if name not in self._models:
            model_path = os.path.join(settings.ML_MODELS_ROOT, f"{name}_model.pkl")
            if os.path.exists(model_path):
                self._models[name] = joblib.load(model_path)
                logger.info(f"Loaded model: {name}")
            else:
                logger.error(f"Model file not found: {model_path}")
                return None
        return self._models[name]

    def get_scaler(self):
        if "scaler" not in self._scalers:
            scaler_path = os.path.join(settings.ML_MODELS_ROOT, "standard_scaler.pkl")
            if os.path.exists(scaler_path):
                self._scalers["scaler"] = joblib.load(scaler_path)
            else:
                logger.error("Standard scaler not found.")
                return None
        return self._scalers["scaler"]


class FeatureEngineer:
    """
    Transforms Django models into ML feature vectors (Pandas DataFrames).
    """

    @staticmethod
    def extract_features(report: WeeklyReport):
        """
        Builds feature sets for Plumbing, Electrical, and Structural models.
        """
        school = report.school
        profile = getattr(school, 'profile', None)
        
        # Get latest infra survey
        infra = school.infrastructure_surveys.order_by('-survey_date').first()
        
        # Base school data
        school_data = {
            'num_students': profile.total_students if profile else 500,
            'building_age': school.building_age,
            'girls_school': 1 if school.is_girls_school else 0,
            'flood_prone_area': 1 if school.flood_prone_area else 0,
            'crack_width_mm': infra.crack_width_mm if infra else 0.0,
        }

        # Handle One-Hot Encoded School Fields
        zones = ['Coastal', 'Dry', 'Heavy Rain', 'Tribal']
        for zone in zones:
            school_data[f'weather_zone_{zone}'] = 1 if school.weather_zone == zone else 0
            
        materials = ['Brick', 'Mixed', 'RCC', 'Temporary']
        for mat in materials:
            school_data[f'material_type_{mat}'] = 1 if school.material_type == mat else 0

        # Plumbing Features
        plumbing = getattr(report, 'plumbing_report', None)
        pl_features = school_data.copy()
        pl_features.update({
            'water_leak': 1 if (plumbing and plumbing.leakage_points_count > 0) else 0,
            'toilet_functional_ratio': (infra.boys_toilets_functional + infra.girls_toilets_functional) / 
                                      (infra.boys_toilets_total + infra.girls_toilets_total + 1) if infra else 0.5,
            'roof_leak_flag': 1 if (report.structural_report and report.structural_report.roof_leakage) else 0,
            'condition_score': 7.0, # Placeholder logic
            'students_per_toilet': (profile.total_students if profile else 500) / 
                                  (infra.boys_toilets_total + infra.girls_toilets_total + 1) if infra else 30,
            'weeks_since_last_repair': 12, # To be calculated from contracts
            'days_since_repair': 84,
            'repair_done': 0,
            'condition_trend': 0,
            'deterioration_rate': 0.1,
            'urgency_score': 5.0,
        })

        # Electrical Features
        elect = getattr(report, 'electrical_report', None)
        el_features = school_data.copy()
        el_features.update({
            'wiring_exposed': 1 if (elect and elect.wiring_issues) else 0,
            'power_outage_hours_weekly': elect.power_outage_hours if elect else 0,
            'condition_score': 8.0,
            'issue_flag': 1 if (elect and (elect.wiring_issues or elect.switchboard_issues)) else 0,
            'students_per_classroom': (profile.total_students if profile else 500) / 
                                     (profile.classrooms_count if (profile and profile.classrooms_count) else 10),
            'weeks_since_last_repair': 12,
            'days_since_repair': 84,
            'repair_done': 0,
            'condition_trend': 0,
            'deterioration_rate': 0.05,
            'urgency_score': 3.0,
            'water_leak': pl_features['water_leak'],
            'roof_leak_flag': pl_features['roof_leak_flag'],
        })

        # Structural Features
        struc = getattr(report, 'structural_report', None)
        st_features = school_data.copy()
        st_features.update({
            'crack_growth_rate': 0.0, # Computed from history
            'condition_score': 9.0,
            'roof_leak_flag': pl_features['roof_leak_flag'],
            'weeks_since_last_repair': 12,
            'days_since_repair': 84,
            'repair_done': 0,
            'condition_trend': 0,
            'deterioration_rate': 0.02,
            'urgency_score': 2.0,
            'water_leak': pl_features['water_leak'],
            'wiring_exposed': el_features['wiring_exposed'],
            'issue_flag': 1 if (struc and (struc.wall_cracks or struc.plaster_damage)) else 0,
        })

        return pl_features, el_features, st_features


class PredictionService:
    """
    Main service to execute ML inference and store results.
    """

    @staticmethod
    def run_inference(report_id: int):
        """
        Runs the 3-model pipeline for a specific weekly report.
        """
        try:
            report = WeeklyReport.objects.select_related('school', 'school__profile').get(id=report_id)
        except WeeklyReport.DoesNotExist:
            return None

        registry = ModelRegistry()
        pl_features, el_features, st_features = FeatureEngineer.extract_features(report)

        # 1. Plumbing Prediction
        pl_score = PredictionService._predict(registry, "plumbing", pl_features)
        
        # 2. Electrical Prediction
        el_score = PredictionService._predict(registry, "electrical", el_features)
        
        # 3. Structural Prediction
        st_score = PredictionService._predict(registry, "structural", st_features)

        # 4. Overall Weighted Score (based on priority config)
        # Weights: Structural (40%), Plumbing (30%), Electrical (30%)
        overall_score = (st_score * 0.4) + (pl_score * 0.3) + (el_score * 0.3)
        
        # Calculate Risk Levels
        pl_risk = PredictionService._get_risk_level(pl_score)
        el_risk = PredictionService._get_risk_level(el_score)
        st_risk = PredictionService._get_risk_level(st_score)
        overall_risk = PredictionService._get_risk_level(overall_score)

        # Save Prediction Report
        pred_report = PredictionReport.objects.create(
            school=report.school,
            weekly_report=report,
            overall_score=overall_score,
            overall_risk_level=overall_risk,
            plumbing_score=pl_score,
            plumbing_risk_level=pl_risk,
            electrical_score=el_score,
            electrical_risk_level=el_risk,
            structural_score=st_score,
            structural_risk_level=st_risk,
            model_version="v1.RF.Batch"
        )

        logger.info(f"Generated PredictionReport {pred_report.id} for {report.school.name}")
        return pred_report

    @staticmethod
    def _predict(registry, model_name, features_dict):
        model = registry.get_model(model_name)
        if not model:
            return 0.0
            
        # Convert to DF
        df = pd.DataFrame([features_dict])
        
        # Align features to what the model expects to avoid sklearn warnings/errors
        if hasattr(model, 'feature_names_in_'):
            expected_features = list(model.feature_names_in_)
            for feat in expected_features:
                if feat not in df.columns:
                    df[feat] = 0
            # Select and reorder columns
            df = df[expected_features]
        
        # Predict probability of class 1 (Failure)
        try:
            proba = model.predict_proba(df)[0][1]
            return float(proba * 100) # Scale to 0-100
        except Exception as e:
            logger.error(f"Prediction error for {model_name}: {e}")
            return 0.0

    @staticmethod
    def _get_risk_level(score: float) -> str:
        if score >= 70:
            return RiskLevel.HIGH
        if score >= 40:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW
