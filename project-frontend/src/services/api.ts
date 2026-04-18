/**
 * All backend API endpoints used by the frontend.
 * All paths go through the Next.js proxy (/api/[...path]/route.ts)
 * which forwards to Django and injects the JWT from the httpOnly cookie.
 */
export const API = {
  dashboard: "/api/v1/accounts/dashboard/",

  schools: {
    list: "/api/v1/schools/",
    export: "/api/v1/schools/export/",
    registrationRequests: "/api/v1/schools/registration-requests/",
  },

  reports: {
    list: "/api/v1/reports/weekly-reports/",
    export: "/api/v1/reports/weekly-reports/export/",
  },

  predictions: {
    list: "/api/v1/predictions/reports/",
    district: "/api/v1/predictions/district-reports/",
  },

  contracts: {
    list: "/api/v1/contracts/",
    bids: "/api/v1/contracts/bids/",
    export: "/api/v1/contracts/export/",
  },

  profiles: {
    adminStaff: "/api/v1/accounts/profiles/admin-staff/",
    staff: "/api/v1/accounts/profiles/staff/",
    schools: "/api/v1/accounts/profiles/schools/",
    contractors: "/api/v1/accounts/profiles/contractors/",
    deos: "/api/v1/accounts/profiles/deos/",
  },

  onboard: {
    bulk: "/api/v1/accounts/onboard/bulk/",
  },
} as const;
