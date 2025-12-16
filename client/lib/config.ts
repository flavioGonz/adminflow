// API base resolution:
// 1) Respect NEXT_PUBLIC_API_URL when set (supports full URL like http://host:port/api)
// 2) In browser, default to same host. If app runs on port 3000, map to 5000 for API.
// 3) In SSR/node, default to localhost:5000

const resolveBrowserApiBase = () => {
    try {
        const { protocol, hostname, port } = window.location;
        if (port === "3000") {
            return `${protocol}//${hostname}:5000`;
        }
        // If a non-3000 port is used, assume same origin serves the API under /api
        return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
    } catch {
        return "http://localhost:5000";
    }
};

const explicitApiUrl = process.env.NEXT_PUBLIC_API_URL;
export const API_BASE_URL =
    explicitApiUrl?.replace(/\/api\/?$/, "") ||
    (typeof window !== "undefined" ? resolveBrowserApiBase() : "http://localhost:5000");

export const API_URL = explicitApiUrl || `${API_BASE_URL}/api`;
