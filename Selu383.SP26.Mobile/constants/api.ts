import { Platform } from 'react-native';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const productionBaseUrl = 'https://selu383-sp26-p03-g07.azurewebsites.net';
const devBaseUrl = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

export const API_BASE_URL = (configuredBaseUrl || (__DEV__ ? devBaseUrl : productionBaseUrl)).replace(/\/$/, '');

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
