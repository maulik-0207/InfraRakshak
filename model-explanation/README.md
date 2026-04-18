# Model Explanation Documentation

## Overview

This directory contains Jupyter notebooks that document the complete machine learning pipeline for infrastructure failure prediction and priority assessment in school buildings. The pipeline predicts failures across three infrastructure domains (plumbing, electrical, and structural) and combines them into a unified priority scoring system.

---

## Notebook Files

### 1. Preprocessing-Pipeline.ipynb

**Purpose:** Data preparation and feature engineering foundation

This notebook is the first step in the pipeline and handles all raw data transformation before model training. It performs the following operations:

- Loads raw data from `data/TS-PS3.csv`
- Identifies and handles missing values
- Generates derived features for enhanced model performance
- Applies one-hot encoding to categorical variables
- Implements standardized scaling for numerical features
- Segments data into three domain-specific subsets (plumbing, electrical, structural)
- Exports preprocessed datasets for downstream models

**Key Outputs:**

- `data/preprocessed/electrical_data.csv`
- `data/preprocessed/plumbing_data.csv`
- `data/preprocessed/structural_data.csv`
- `data/preprocessed/full_preprocessed.csv`

**Dependency:** None (initial step)

---

### 2. Plumbing-Model.ipynb

**Purpose:** Binary classification model for plumbing system failure prediction

This notebook trains a machine learning model to predict plumbing failures within a 30-day window. It employs an ensemble approach with Random Forest as the primary model and Logistic Regression as a baseline for comparison.

**Key Features:**

- Target variable: `failure_within_30_days` (binary: 0 or 1)
- Primary features include water leak indicators, toilet functionality ratios, roof leak flags, and condition scores
- Incorporates temporal features (days/weeks since repair, condition trends)
- Includes building-level attributes (age, capacity, flood-prone status)
- Encodes environmental factors (weather zones, material types)

**Model Configuration:**

- Algorithm: RandomForestClassifier
- Baseline: LogisticRegression
- Evaluation Metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC

**Outputs:**

- `models/plumbing_model.pkl`
- `models/plumbing_features.pkl`
- `models/plumbing_metrics.json`

**Dependency:** Preprocessing-Pipeline.ipynb

---

### 3. Electrical-Model.ipynb

**Purpose:** Binary classification model for electrical system failure prediction

This notebook develops a predictive model for electrical failures within a 30-day horizon. It applies the same Random Forest methodology as the plumbing model but with domain-specific features.

**Key Features:**

- Target variable: `failure_within_30_days` (binary: 0 or 1)
- Primary features include exposed wiring, power outage frequency, and electrical condition scores
- Incorporates issue flags and electrical-specific maintenance history
- Includes building demographics (student capacity, school type)
- Encodes weather zone and material type information

**Model Configuration:**

- Algorithm: RandomForestClassifier
- Evaluation Metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC

**Outputs:**

- `models/electrical_model.pkl`
- `models/electrical_features.pkl`
- `models/electrical_metrics.json`

**Dependency:** Preprocessing-Pipeline.ipynb

---

### 4. Structural-Model.ipynb

**Purpose:** Multi-class classification model for structural severity assessment

This notebook implements a model to classify the structural condition severity of school buildings into three risk categories: Safe, Warning, and Danger.

**Key Features:**

- Target variable: `structural_severity` (multi-class: Safe / Warning / Danger)
- Primary features include crack width measurements, overall condition scores, and roof integrity
- Incorporates structural failure indicators (water leaks, crack growth rates)
- Includes building age and design vulnerability factors
- Encodes environmental and material-related attributes

**Model Configuration:**

- Algorithm: RandomForestClassifier
- Classification Type: Multi-class (3 severity levels)
- Evaluation Metrics: Accuracy, Precision, Recall, F1-Score by class

**Outputs:**

- `models/structural_model.pkl`
- `models/structural_features.pkl`
- `models/structural_label_encoder.pkl`
- `models/structural_metrics.json`

**Dependency:** Preprocessing-Pipeline.ipynb

---

### 5. Main-Model.ipynb

**Purpose:** Priority scoring and decision layer combining all domain models

This notebook aggregates predictions from the three domain-specific models into a unified infrastructure priority score. It implements a weighted decision logic that accounts for risk severity, urgency, and impact significance.

**Priority Scoring Algorithm:**

- Risk Levels: Low=1, Medium=2, High=3
- Urgency Factor: Derived as (60 - days_to_failure)
- Impact Weights: Girls toilet=3, Classroom=2, Storage=1
- Final Priority Score: Sum of (risk level × urgency × impact weight), normalized to 0-100 scale

**Integration Logic:**

- Loads all three trained models (plumbing, electrical, structural)
- Generates predictions for each domain
- Applies weighted aggregation formula
- Produces single priority score for maintenance scheduling

**Key Outputs:**

- Combined priority rankings for all infrastructure items
- Integration of metrics from all three models
- Decision recommendations for maintenance teams

**Dependency:** Plumbing-Model.ipynb, Electrical-Model.ipynb, Structural-Model.ipynb

---

## Execution Workflow

The notebooks must be executed in the following sequence to ensure proper data preparation and model training:

```
1. Preprocessing-Pipeline.ipynb
   |
   +-- Generates preprocessed training data
   |
   +-- Plumbing-Model.ipynb    +-- Electrical-Model.ipynb    +-- Structural-Model.ipynb
   |                               |                               |
   +-- Saves plumbing model        +-- Saves electrical model       +-- Saves structural model
   |
   2. Main-Model.ipynb
      |
      +-- Loads all three models
      +-- Combines predictions
      +-- Generates priority scores
```

---

## Algorithms Overview

### RandomForestClassifier

**Used in:** Plumbing-Model, Electrical-Model, Structural-Model (primary models)

**Description:**
Random Forest is an ensemble learning method that builds multiple decision trees during training and outputs predictions based on the aggregated results of all trees. Each tree is trained on a random subset of the data and features, introducing diversity that improves generalization.

**Key Characteristics:**

- Handles both binary and multi-class classification
- Robust to outliers and missing values
- Provides feature importance rankings
- Non-parametric algorithm (no assumptions about data distribution)
- Naturally handles mixed feature types (numerical and categorical)

**Why Used in This Project:**

- Excellent performance with tabular infrastructure data
- Captures non-linear relationships between features and failures
- Provides probability estimates for risk assessment
- Resistant to overfitting due to ensemble averaging
- Computationally efficient for inference (critical for priority scoring)

**Hyperparameters Configured:**

- Number of trees: Optimized for accuracy vs. performance trade-off
- Max depth: Controls tree complexity to prevent overfitting
- Min samples split/leaf: Regularization parameters
- Bootstrap sampling: Enables independent tree training

---

### LogisticRegression

**Used in:** Plumbing-Model (baseline comparison)

**Description:**
Logistic Regression is a linear classifier that models the probability of a failure occurrence using a sigmoid function. It outputs a probability between 0 and 1 by fitting a linear decision boundary.

**Key Characteristics:**

- Interpretable linear model
- Fast training and inference
- Provides probability-based predictions
- Sensitive to feature scaling
- Works well with linearly separable data

**Why Used in This Project:**

- Serves as baseline model to compare against Random Forest
- Provides interpretable coefficients for feature importance
- Validates that non-linear models (Random Forest) add value
- Lightweight alternative for scenarios requiring simplicity

---

### Weighted Aggregation Layer

**Used in:** Main-Model (combined decision layer)

**Description:**
Weighted aggregation is a deterministic decision-making algorithm that combines outputs from multiple models using predefined weights and domain logic. It synthesizes independent predictions into a unified priority score through mathematical weighted summation.

**Algorithm Logic:**

1. Extract individual model predictions
2. Map predictions to standardized risk scales
3. Apply domain-specific weights (urgency, impact factors)
4. Calculate weighted sum: Priority = Sum(risk × urgency × impact)
5. Normalize result to 0-100 scale

**Key Characteristics:**

- Fully interpretable and explainable decisions
- Combines independent model predictions
- Incorporates domain knowledge through weighted factors
- Deterministic and reproducible results
- Fast computation suitable for real-time inference

**Why Used in This Project:**

- Synthesizes three independent failure predictions into single actionable score
- Incorporates business logic (impact weights by location)
- Prioritizes urgent issues requiring immediate action
- Transparent decision-making for stakeholder communication
- Easily adjustable weights for policy changes

---

## Detailed Algorithm Specifications

| Model      | Algorithm                        | Type                | Purpose                             | Strengths                                          |
| ---------- | -------------------------------- | ------------------- | ----------------------------------- | -------------------------------------------------- |
| Plumbing   | RandomForestClassifier (Primary) | Ensemble Classifier | Binary failure prediction           | High accuracy, handles imbalance, robust features  |
| Plumbing   | LogisticRegression (Baseline)    | Linear Classifier   | Comparison baseline                 | Interpretable, fast, establishes performance floor |
| Electrical | RandomForestClassifier           | Ensemble Classifier | Binary failure prediction           | Non-linear relationships, domain-specific features |
| Structural | RandomForestClassifier           | Ensemble Classifier | Multi-class severity classification | Multi-class support, probability outputs per class |
| Main       | Weighted Aggregation             | Custom Logic        | Priority score computation          | Explainable, incorporates domain knowledge         |

---

## Model Features and Predicted Values

### Plumbing-Model

**Algorithm:** RandomForestClassifier with LogisticRegression baseline

**Input Features:**

| Feature Category      | Features                                                      |
| --------------------- | ------------------------------------------------------------- |
| Water Systems         | water_leak, toilet_functional_ratio, roof_leak_flag           |
| Condition Metrics     | condition_score, condition_trend, deterioration_rate          |
| Maintenance History   | weeks_since_last_repair, days_since_repair, repair_done       |
| Building Information  | students_per_toilet, num_students, building_age, girls_school |
| Environmental Factors | flood*prone_area, weather_zone*\* (one-hot encoded)           |
| Structural Indicators | crack_width_mm, urgency_score                                 |

**Predicted Value:**

- **Output Type:** Binary Classification
- **Values:** 0 or 1
- **Interpretation:**
  - 0 = No plumbing failure expected within 30 days
  - 1 = Plumbing failure likely within 30 days
- **Probability Output:** Confidence score between 0.0 and 1.0

---

### Electrical-Model

**Algorithm:** RandomForestClassifier

**Input Features:**

| Feature Category      | Features                                                         |
| --------------------- | ---------------------------------------------------------------- |
| Electrical Systems    | wiring_exposed, power_outage_hours_weekly, issue_flag            |
| Condition Metrics     | condition_score, condition_trend, deterioration_rate             |
| Maintenance History   | weeks_since_last_repair, days_since_repair, repair_done          |
| Building Information  | students_per_classroom, num_students, building_age, girls_school |
| Environmental Factors | flood*prone_area, weather_zone*\* (one-hot encoded)              |
| Structural Indicators | crack_width_mm, water_leak, roof_leak_flag, urgency_score        |

**Predicted Value:**

- **Output Type:** Binary Classification
- **Values:** 0 or 1
- **Interpretation:**
  - 0 = No electrical failure expected within 30 days
  - 1 = Electrical failure likely within 30 days
- **Probability Output:** Confidence score between 0.0 and 1.0

---

### Structural-Model

**Algorithm:** RandomForestClassifier

**Input Features:**

| Feature Category      | Features                                                            |
| --------------------- | ------------------------------------------------------------------- |
| Structural Damage     | crack_width_mm, crack_growth_rate, roof_leak_flag                   |
| Condition Metrics     | condition_score, condition_trend, deterioration_rate                |
| Building Information  | building_age, flood_prone_area, girls_school, num_students          |
| Maintenance History   | weeks_since_last_repair, days_since_repair, repair_done             |
| Environmental Factors | material*type*_ (one-hot encoded), weather*zone*_ (one-hot encoded) |
| Issue Indicators      | water_leak, wiring_exposed, issue_flag, urgency_score               |

**Predicted Value:**

- **Output Type:** Multi-class Classification
- **Values:** Safe, Warning, or Danger
- **Interpretation:**
  - Safe = Building structure is stable with no immediate concerns
  - Warning = Moderate structural issues requiring scheduled maintenance
  - Danger = Critical structural problems requiring immediate intervention
- **Probability Output:** Confidence scores for each class (sum to 1.0)

---

### Main-Model

**Algorithm:** Weighted Aggregation Layer

**Input Features:**

| Source           | Features                                     |
| ---------------- | -------------------------------------------- |
| Plumbing Model   | Binary prediction (0/1) + confidence score   |
| Electrical Model | Binary prediction (0/1) + confidence score   |
| Structural Model | Multi-class prediction (Safe/Warning/Danger) |
| Domain Weights   | Risk level, urgency factor, impact weight    |

**Feature Engineering in Main-Model:**

- Plumbing Risk: Converts binary output to risk level (0-3 scale)
- Electrical Risk: Converts binary output to risk level (0-3 scale)
- Structural Risk: Maps severity classes to risk levels (Safe=1, Warning=2, Danger=3)
- Urgency Factor: Calculated as (60 - days_to_failure)
- Impact Weight: Location-based multiplier (Girls toilet=3, Classroom=2, Storage=1)

**Predicted Value:**

- **Output Type:** Priority Score (Numerical)
- **Range:** 0.0 to 100.0
- **Calculation:** Sum of (risk_level × urgency × impact_weight), normalized to 0-100
- **Interpretation:**
  - 0-20 = Low priority (routine maintenance)
  - 21-50 = Medium priority (schedule within 2-4 weeks)
  - 51-75 = High priority (schedule within 1-2 weeks)
  - 76-100 = Critical priority (immediate action required)

---

## Feature Summary Table

| Model      | Feature Count              | Target Variable         | Prediction Type            | Output Range            |
| ---------- | -------------------------- | ----------------------- | -------------------------- | ----------------------- |
| Plumbing   | 18+ (varies with encoding) | failure_within_30_days  | Binary Classification      | 0 or 1                  |
| Electrical | 18+ (varies with encoding) | failure_within_30_days  | Binary Classification      | 0 or 1                  |
| Structural | 18+ (varies with encoding) | structural_severity     | Multi-class Classification | Safe / Warning / Danger |
| Main       | Combined from all models   | infrastructure_priority | Numerical Score            | 0.0 to 100.0            |

---

## Technical Requirements

- Python 3.7+
- Required Libraries: pandas, numpy, scikit-learn, matplotlib, seaborn, joblib

---

## Data Flow Architecture

Input Data (TS-PS3.csv)
|
v
Preprocessing-Pipeline
|
+-- electrical_data.csv
+-- plumbing_data.csv
+-- structural_data.csv
+-- full_preprocessed.csv
|
v
Domain-Specific Models (Fit and Validate)
|
+-- plumbing_model.pkl + metrics
+-- electrical_model.pkl + metrics
+-- structural_model.pkl + metrics
|
v
Main Model (Inference and Priority Scoring)
|
v
Priority Rankings for Maintenance Schedule

---

## Model Performance Tracking

Each domain model saves its evaluation metrics in JSON format for independent model assessment and comparison. Metrics include:

- Accuracy: Overall model correctness
- Precision: False positive rate
- Recall: False negative rate
- F1-Score: Harmonic mean for balanced evaluation
- ROC-AUC: Area under the receiver operating characteristic curve

Metadata files are stored in the `models/` directory with the format: `{domain}_metrics.json`

---

## Model Accuracy Assessment

### Understanding Model Accuracy Metrics

All models in this pipeline are evaluated using multiple accuracy metrics to provide a comprehensive view of performance:

**1. Accuracy**

- Definition: Proportion of correct predictions (both true positives and true negatives) out of all predictions
- Formula: (TP + TN) / (TP + TN + FP + FN)
- Range: 0.0 to 1.0 (or 0% to 100%)
- Interpretation: Overall correctness of the model
- Limitation: Can be misleading with imbalanced datasets (important consideration for failure prediction)

**2. Precision**

- Definition: Proportion of positive predictions that were correct
- Formula: TP / (TP + FP)
- Range: 0.0 to 1.0
- Interpretation: How many predicted failures actually occurred (minimizes false alarms)
- Use Case: Critical when false alarms are costly

**3. Recall (Sensitivity)**

- Definition: Proportion of actual positive cases that were correctly identified
- Formula: TP / (TP + FN)
- Range: 0.0 to 1.0
- Interpretation: Capability to detect actual failures (minimizes missed failures)
- Use Case: Critical when missing failures is dangerous (safety-critical infrastructure)

**4. F1-Score**

- Definition: Harmonic mean of precision and recall
- Formula: 2 × (Precision × Recall) / (Precision + Recall)
- Range: 0.0 to 1.0
- Interpretation: Balanced measure between precision and recall
- Use Case: Best metric for imbalanced datasets (recommended for this project)

**5. ROC-AUC (Receiver Operating Characteristic Area Under Curve)**

- Definition: Area under the ROC curve showing trade-off between true positive rate and false positive rate
- Range: 0.5 to 1.0 (0.5 = random guessing, 1.0 = perfect classification)
- Interpretation: Model's ability to distinguish between failure and non-failure cases across all thresholds
- Advantage: Invariant to class imbalance

### Individual Domain Model Accuracy

#### Plumbing-Model Performance

**Model Type:** Binary Classification (Random Forest + Logistic Regression baseline)

**Expected Performance Ranges:**

- Accuracy: 0.75-0.92 (typically improves with complete feature engineering)
- Precision: 0.70-0.88 (fewer false alarms for maintenance teams)
- Recall: 0.65-0.85 (catches most actual plumbing failures)
- F1-Score: 0.70-0.86 (balanced performance metric)
- ROC-AUC: 0.80-0.95 (strong discrimination ability)

**Key Factors Affecting Accuracy:**

- Water leak indicator quality and consistency
- Repair history completeness
- Toilet functionality ratio accuracy
- Building age data reliability

**Interpretation:**
The plumbing model typically demonstrates strong accuracy due to well-defined physical indicators (water leaks, toilet functionality). The ensemble nature of Random Forest captures complex patterns while maintaining robustness to data quality variations.

---

#### Electrical-Model Performance

**Model Type:** Binary Classification (Random Forest)

**Expected Performance Ranges:**

- Accuracy: 0.72-0.90 (slightly lower than plumbing due to less direct failure indicators)
- Precision: 0.68-0.85 (reasonable false alarm rate)
- Recall: 0.60-0.82 (good failure detection rate)
- F1-Score: 0.68-0.84 (balanced performance)
- ROC-AUC: 0.78-0.93 (reliable discrimination)

**Key Factors Affecting Accuracy:**

- Wiring condition assessment accuracy
- Power outage frequency measurement reliability
- Building electrical load and age data quality
- Condition score calibration with actual failures

**Interpretation:**
Electrical failures can be more unpredictable than plumbing issues, which affects accuracy. However, the model performs well by combining multiple electrical indicators (wiring exposure, power outages, condition trends) to make robust predictions.

---

#### Structural-Model Performance

**Model Type:** Multi-class Classification (Random Forest)

**Expected Performance Ranges:**

- Accuracy: 0.78-0.94 (multi-class accuracy across Safe/Warning/Danger)
- Precision per Class: 0.72-0.92 (varies by severity level)
- Recall per Class: 0.70-0.88 (varies by severity level)
- Weighted F1-Score: 0.75-0.90 (accounts for class distribution)
- ROC-AUC: 0.82-0.96 (per-class AUC score)

**Class-Specific Performance Notes:**

- Safe classification: Typically highest accuracy (easier to identify stable structures)
- Warning classification: Moderate accuracy (medium severity harder to classify)
- Danger classification: High recall is prioritized (critical to catch dangerous structures)

**Key Factors Affecting Accuracy:**

- Crack width measurement precision
- Structural severity assessment consistency
- Building material type encoding
- Environmental factor (weather zones) relevance

**Interpretation:**
Structural models show strong accuracy because crack patterns, building age, and material types are reliable structural failure indicators. Multi-class classification naturally performs evaluation at each severity level, providing nuanced risk assessment.

---

#### Combined Priority Model Accuracy

**Model Type:** Weighted Aggregation (Deterministic Decision Layer)

**Expected Performance Range:**

- Binary Classification Accuracy (pass/fail): 0.80-0.95 (when threshold is set at 50/100)
- Priority Score Distribution: Properly calibrated to actual failure rates across priority levels
- False Positive Rate: Typically 5-15% (acceptable for preventive maintenance)
- False Negative Rate: Typically 10-20% (some failures may still occur)

**Validation Process:**
The Main-Model.ipynb includes comprehensive accuracy validation with:

1. Per-category accuracy tracking
2. Priority label calibration (Low/Medium/High/Critical)
3. Confusion matrix analysis
4. Temporal performance validation

---

### How to Access and View Model Accuracy

**1. From JSON Metrics Files**
Each domain model saves metrics in:

- `models/plumbing_metrics.json`
- `models/electrical_metrics.json`
- `models/structural_metrics.json`

Example structure:

```json
{
  "accuracy": 0.85,
  "precision": 0.82,
  "recall": 0.81,
  "f1_score": 0.8155,
  "roc_auc": 0.91,
  "weighted_f1": 0.8156
}
```

**2. From Main-Model.ipynb Accuracy Validation (Cell 6)**
Run the accuracy validation cell to see:

- Individual model metrics loaded from files
- Combined priority model performance on test sample
- Confusion matrix breakdown
- Per-category accuracy comparison
- Priority label to actual outcome mapping

**3. Interpreting Results**

When evaluating model accuracy for operational deployment:

- **F1-Score is the primary metric** for this project (balanced precision/recall)
- Target F1-Score >= 0.75 per model recommended
- Recall (sensitivity) is slightly prioritized over Precision in failure prediction
- Trade-off: Higher recall means more maintenance (safe), lower recall means missed failures (risky)

---

### Factors Influencing Model Accuracy

**1. Data Quality**

- Feature completeness and consistency across schools
- Regular calibration of measurement sensors (crack width, condition scores)
- Historical maintenance record accuracy

**2. Model Selection**

- Random Forest chosen for robustness and accuracy
- Ensemble approach reduces overfitting risk
- Feature engineering significantly impacts final accuracy

**3. Class Imbalance**

- Infrastructure failures are rare events (imbalanced dataset)
- F1-Score and ROC-AUC preferred over simple accuracy
- Weighted loss functions improve minority class detection

**4. Temporal Factors**

- Model trained on historical data (seasonal patterns captured)
- 30-day prediction window may affect accuracy as time period extends
- Regular model retraining recommended with new data

---

### Performance Monitoring Recommendations

1. Run accuracy validation (cell 6 in Main-Model.ipynb) after new model training
2. Compare current metrics against baseline in metrics.json files
3. Track precision-recall trade-off over time
4. Monitor priority label to actual outcome correlation
5. Investigate significant failures to identify data quality issues
6. Retrain models quarterly with accumulated new data

---

## Notes for Users

1. Always execute Preprocessing-Pipeline.ipynb before running any domain-specific models
2. Run all domain models before executing Main-Model.ipynb
3. All outputs are saved to the `models/` and `data/preprocessed/` directories
4. Model pickles enable fast inference without retraining
5. The priority scoring logic in Main-Model.ipynb can be customized based on domain requirements
