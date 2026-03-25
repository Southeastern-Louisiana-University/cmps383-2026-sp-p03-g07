const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/$/, "")
  : "";

const absoluteUrlPattern = /^(?:[a-z]+:)?\/\//i;

export function resolveApiAssetUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  if (absoluteUrlPattern.test(url) || !API_BASE_URL) {
    return url;
  }

  return url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
}
