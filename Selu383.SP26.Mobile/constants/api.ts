export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://selu383-sp26-p03-g07.azurewebsites.net";

const absoluteUrlPattern = /^(?:[a-z]+:)?\/\//i;

export function resolveApiAssetUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  if (absoluteUrlPattern.test(url)) {
    return url;
  }

  return url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
}
