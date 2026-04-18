/**
 * Separation of Concerns:
 * This layer handles pure API definitions.
 * It strictly calls the frontend NEXT.JS proxy route (/api/*).
 * React components DO NOT have fetch or axios logic in them.
 */

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export const authService = {
  /**
   * Logs a user in through the local proxy.
   * The proxy will securely bounce this to http://localhost:8000/api/v1/auth/jwt/create/
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Calling our NEXT.JS proxy layer
    const response = await fetch("/api/auth/jwt/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Authentication failed");
    }

    return response.json();
  }
};
