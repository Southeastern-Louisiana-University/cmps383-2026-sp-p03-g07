import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredStorefrontBaseUrl = process.env.EXPO_PUBLIC_STOREFRONT_URL?.trim();
const storefrontPort = process.env.EXPO_PUBLIC_STOREFRONT_PORT?.trim() || '5174';

function trimTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function getExpoDevHost() {
  return Constants.expoConfig?.hostUri?.split(':')[0]?.trim() || null;
}

export function getStorefrontBaseUrlCandidates() {
  const candidates = new Set<string>();

  if (configuredStorefrontBaseUrl) {
    candidates.add(trimTrailingSlash(configuredStorefrontBaseUrl));
  }

  const expoDevHost = getExpoDevHost();
  if (expoDevHost) {
    candidates.add(`http://${expoDevHost}:${storefrontPort}`);
  }

  if (Platform.OS === 'android') {
    candidates.add(`http://10.0.2.2:${storefrontPort}`);
  }

  candidates.add(`http://localhost:${storefrontPort}`);

  return [...candidates];
}

export function buildStorefrontUrl(baseUrl: string, route: string) {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  return `${trimTrailingSlash(baseUrl)}/#${normalizedRoute}`;
}
