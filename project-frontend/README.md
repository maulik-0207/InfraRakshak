# InfraRakshak Frontend

InfraRakshak is a comprehensive infrastructure monitoring and failure prediction platform designed for educational institutions. The frontend is built using Next.js, providing a robust and responsive interface for schools, district education officers (DEOs), and contractors.

## Core Features

- **Predictive Dashboards**: Visualizes infrastructure failure probabilities across plumbing, electrical, and structural domains.
- **Role-Based Access Control**: Tailored interfaces for Administrators, DEOs, School Staff, and Contractors.
- **Infrastructure Reporting**: Streamlined submission of weekly maintenance reports with domain-specific metrics.
- **Contract Management**: Integrated bidding and progress tracking for infrastructure repair contracts.
- **Bulk Onboarding**: Efficient management of multiple institution accounts via Excel-based bulk uploads.

## Technical Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **UI Components**: shadcn/ui

## Project Structure

```text
src/
├── app/              # Next.js App Router (Pages and API Routes)
│   ├── (auth)/       # Authentication related layouts and pages
│   ├── (dashboard)/  # Role-specific dashboard views
│   └── api/          # Server-side proxy for backend communication
├── components/       # Reusable UI components
│   ├── ui/           # Base shadcn components
│   └── sidebars/     # Role-specific navigation menus
├── services/         # API service definitions and axios instances
├── store/            # Zustand store definitions
└── lib/              # Utility functions and constants
```

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm, yarn, or pnpm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   BACKEND_API_URL=http://your-django-backend:8000/api
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Module Architecture

The application is divided into specialized modules based on user roles and core functionality:

- **DEO (District Education Officer) Module**: Centralized management of schools within a district. Includes tools for bulk account creation, cross-school analytics, and contract approval workflows.
- **School & Staff Modules**: Interface for school administrators and staff to submit infrastructure health reports. Features include real-time validation of plumbing, electrical, and structural data.
- **Contractor Module**: Dedicated portal for engineering firms to bid on maintenance contracts, upload proofs of work, and track payment milestones.
- **Predictions & Analytics**: A data-heavy module that transforms raw sensor and report data into actionable failure probabilities using the integrated Machine Learning models.

## State Management

Global application state is managed using **Zustand**, focused on:
- **Authentication State**: Persistence of user profiles and role-based session management.
- **UI State**: Sidebar toggles, theme preferences (Dark/Light mode via `next-themes`), and global notification queues.
- **Hydration**: Client-side state hydration to ensure consistent UI across page refreshes.

## Data Visualization & Reporting

Infrastructure health is communicated through complex data visualizations:
- **Failure Probability Charts**: Recharts-based line and bar charts showing the 30-day failure horizon for facilities.
- **Severity Heatmaps**: Visual indicators for structural integrity (Safe, Warning, Danger).
- **Export Engine**: Support for exporting district-wide analytics and contract reports to PDF and Excel formats.

## Security & Authentication

A multi-layered security approach is implemented:
- **Next.js Proxy Layer**: All requests to the Django backend are proxied through server-side routes (`/api/[...path]`). This prevents the exposure of the backend IP and mitigates CORS risks.
- **Secure Sessions**: Authentication uses JWT (JSON Web Tokens). Access tokens are stored in `httpOnly` cookies, making them inaccessible to client-side scripts (XSS protection).
- **Silent Refresh**: The proxy layer automatically handles token expiration by intercepting 401 responses and attempting a silent refresh using the refresh token before retrying the original request.
- **Role-Based Guards**: Middleware and layout-level checks ensure users can only access routes authorized for their specific role.

## Component System

The UI is built on an atomic design philosophy using **shadcn/ui**:
- **Tailwind CSS 4**: Utilizes the latest utility-first CSS features for high-performance styling.
- **Responsive Layouts**: Mobile-first design ensures that field staff can submit reports via tablets or smartphones.
- **Micro-animations**: Enhanced UX through subtle transitions provided by `tw-animate-css`.

## Development Guidelines

- **Component Creation**: Use the `src/components/ui` directory for low-level components and `src/components/shared` for domain-specific components.
- **API Integration**: Add new endpoints to `src/services/api.ts` to maintain a single source of truth for backend paths.
- **State Changes**: Update the `auth-store.ts` for any changes to user session requirements.

