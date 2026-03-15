import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WebView, { type WebViewNavigation } from 'react-native-webview';

import { StorefrontPalette } from '@/constants/theme';
import { buildStorefrontUrl, getStorefrontBaseUrlCandidates } from '@/constants/storefront';

type StorefrontRouteScreenProps = {
  route: string;
};

function StorefrontRouteScreen({ route }: StorefrontRouteScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const handledFailureRef = useRef(false);
  const candidates = useMemo(() => getStorefrontBaseUrlCandidates(), []);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState('');

  const activeBaseUrl = candidates[candidateIndex];
  const targetUrl = buildStorefrontUrl(activeBaseUrl, route);

  useEffect(() => {
    handledFailureRef.current = false;
    setLoadError('');
  }, [candidateIndex, route]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) {
        return false;
      }

      webViewRef.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  function advanceCandidate(message: string) {
    if (handledFailureRef.current) {
      return;
    }

    handledFailureRef.current = true;

    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((currentIndex) => currentIndex + 1);
      return;
    }

    setLoadError(message);
  }

  function handleError() {
    advanceCandidate(
      'Unable to reach the web storefront. Start the web app or set EXPO_PUBLIC_STOREFRONT_URL.',
    );
  }

  function handleNavigationStateChange(event: WebViewNavigation) {
    setCanGoBack(event.canGoBack);
  }

  function handleShouldStartLoad(request: WebViewNavigation) {
    const url = request.url;

    if (!url || url.startsWith(activeBaseUrl) || url.startsWith('about:blank')) {
      return true;
    }

    void Linking.openURL(url);
    return false;
  }

  if (loadError) {
    return (
      <View style={styles.stateShell}>
        <View style={styles.stateCard}>
          <Text style={styles.eyebrow}>Storefront unavailable</Text>
          <Text style={styles.title}>Expo is now mirroring the website directly.</Text>
          <Text style={styles.copy}>{loadError}</Text>
          <Text style={styles.copy}>Tried: {candidates.join(', ')}</Text>
          <Pressable
            onPress={() => {
              handledFailureRef.current = false;
              setCandidateIndex(0);
              setLoadError('');
            }}
            style={styles.button}>
            <Text style={styles.buttonText}>Retry storefront</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        allowsBackForwardNavigationGestures
        cacheEnabled={false}
        domStorageEnabled
        javaScriptEnabled
        onError={handleError}
        onHttpError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        originWhitelist={['*']}
        pullToRefreshEnabled
        renderLoading={() => (
          <View style={styles.loadingShell}>
            <ActivityIndicator color={StorefrontPalette.accent} size="large" />
            <Text style={styles.loadingText}>Loading web storefront...</Text>
          </View>
        )}
        setSupportMultipleWindows={false}
        sharedCookiesEnabled
        source={{ uri: targetUrl }}
        startInLoadingState
        style={styles.webView}
        thirdPartyCookiesEnabled
      />
    </View>
  );
}

export function createStorefrontRouteScreen(route: string) {
  return function StorefrontRoute() {
    return <StorefrontRouteScreen route={route} />;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StorefrontPalette.background,
  },
  webView: {
    flex: 1,
    backgroundColor: StorefrontPalette.background,
  },
  loadingShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: StorefrontPalette.background,
    paddingHorizontal: 24,
  },
  loadingText: {
    color: StorefrontPalette.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  stateShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: StorefrontPalette.background,
    padding: 24,
  },
  stateCard: {
    width: '100%',
    maxWidth: 420,
    gap: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: StorefrontPalette.border,
    backgroundColor: StorefrontPalette.panelMuted,
    padding: 24,
  },
  eyebrow: {
    color: StorefrontPalette.accentLight,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: StorefrontPalette.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  copy: {
    color: StorefrontPalette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: StorefrontPalette.accent,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonText: {
    color: StorefrontPalette.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
