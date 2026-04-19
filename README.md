# InfraRakshak

InfraRakshak is an advanced infrastructure monitoring and failure prediction platform specifically engineered for school buildings. By combining machine learning with a multi-role management system, the platform transitions school maintenance from reactive repairs to data-driven predictive prevention.

## Project Overview

The mission of InfraRakshak is to ensure the safety and hygiene of educational environments by identifying structural, electrical, and plumbing risks before they manifest into failures. The system calculates high-precision priority scores to help government officials (DEOs) and contractors allocate resources where they are needed most.

## Repository Structure

The project is organized into three primary specialized environments:

- **[Predictive Engine (ML)](./model-explanation/)**: Contains the machine learning research, data preprocessing pipelines, and trained models for failure prediction.
- **[Backend (Django API)](./backend/)**: A robust Django-based API service that handles authentication, data management, and integration between the ML models and the frontend.
- **[Frontend (Next.js Dashboard)](./project-frontend/)**: A responsive, role-based web application providing actionable insights and reporting tools for various stakeholders.

## System Architecture

1.  **Data Collection**: School staff and automated systems report infrastructure metrics (e.g., crack width, wiring exposure, water leak status).
2.  **Intelligence Layer**: Domain-specific Random Forest models analyze the data to predict failure probabilities within a 30-day horizon.
3.  **Priority Scoring**: A weighted aggregation algorithm ranks maintenance tasks based on Risk, Urgency, and Social Impact (e.g., prioritizing drinking water and sanitation).
4.  **Operational Workflow**: District officers approve maintenance contracts, and contractors use the platform to bid and provide proof of work.

## Getting Started

To set up the complete environment, please follow the specific instructions in each submodule:

1.  **Models**: See [model-explanation/README.md](./model-explanation/README.md) for data preparation and model training details.
2.  **Backend**: Refer to [backend/Dockerfile](./backend/Dockerfile) and requirements for environment setup.
3.  **Frontend**: See [project-frontend/README.md](./project-frontend/README.md) for UI configuration and proxy settings.

## Core Stakeholders

- **Schools & Staff**: Report infrastructure status and track repair progress.
- **District Education Officers (DEOs)**: Monitor district-wide safety metrics and manage maintenance contracts.
- **Contractors**: Bid on priority tasks and submit digitized proofs of completed work.
- **Administrators**: Manage the overall platform integrity and user onboarding.

## Technical Summary

- **AI/ML**: Python, Scikit-Learn, Random Forest, Jupyter.
- **Backend**: Django, Django Rest Framework (DRF), Celery (for background tasks), JWT Authentication.
- **Frontend**: Next.js 15+, TypeScript, Tailwind CSS 4, Zustand, Recharts.
- **DevOps**: Docker, Docker Compose, Nginx.