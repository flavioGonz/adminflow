import { API_URL } from "@/lib/config";

export { API_URL };

export function apiFetch(input: string, init?: RequestInit) {
  const normalized = input.startsWith("/")
    ? input
    : input.startsWith("http")
    ? input.replace(API_URL, "")
    : `/${input}`;
  const url = normalized.startsWith("http")
    ? normalized
    : `${API_URL}${normalized}`;
  return fetch(url, init);
}
