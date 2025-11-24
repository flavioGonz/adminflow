export const API_BASE_URL =
    typeof window !== "undefined"
        ? `http://${window.location.hostname}:5000`
        : "http://localhost:5000";

export const API_URL = `${API_BASE_URL}/api`;
