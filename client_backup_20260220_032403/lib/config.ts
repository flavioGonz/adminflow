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

const getApiBaseUrl = () => {
    // 1. If we are in the browser and running on HTTPS, we MUST use HTTPS
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
        // If the explicit URL is HTTP, ignore it and use the browser origin to avoid Mixed Content
        if (explicitApiUrl && explicitApiUrl.startsWith("http:")) {
            return resolveBrowserApiBase();
        }
    }

    // 2. Otherwise respect the explicit env var if set
    if (explicitApiUrl) {
        return explicitApiUrl.replace(/\/api\/?$/, "");
    }

    // 3. Fallback to resolution logic
    return typeof window !== "undefined" ? resolveBrowserApiBase() : "http://localhost:5000";
};

export const API_BASE_URL = getApiBaseUrl();

export const API_URL = explicitApiUrl && !explicitApiUrl.startsWith("http:")
    ? explicitApiUrl // Use explicit provided it's not the insecure one we just rejected (unless we are not on https)
    : `${API_BASE_URL}/api`;
