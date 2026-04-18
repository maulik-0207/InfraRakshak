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

## Notes for Users

1. Always execute Preprocessing-Pipeline.ipynb before running any domain-specific models
2. Run all domain models before executing Main-Model.ipynb
3. All outputs are saved to the `models/` and `data/preprocessed/` directories
4. Model pickles enable fast inference without retraining
5. The priority scoring logic in Main-Model.ipynb can be customized based on domain requirements
