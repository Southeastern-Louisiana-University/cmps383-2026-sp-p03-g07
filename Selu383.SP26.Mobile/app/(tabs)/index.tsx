import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { resolveApiAssetUrl } from '@/constants/api';
import { locationService } from '@/services/locationService';
import { menuService } from '@/services/menuService';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';
import { useRewards } from '@/store/rewardsStore';
import type { Location, MenuItem, Order } from '@/types/app';
import { FIRST_TIER_THRESHOLD, POINTS_PER_DOLLAR } from '@/utils/rewardsProgram';

const PRIMARY_ACTIONS = [
  {
    label: 'Reservation',
    route: '/checkout' as const,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=200&fit=crop',
  },
  {
    label: 'Locations',
    route: '/locations' as const,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop',
  },
  {
    label: 'Lions Rewards',
    route: '/(tabs)/rewards' as const,
    image: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=200&h=200&fit=crop',
  },
];

const SECONDARY_ACTIONS = [
  {
    label: 'Feedback',
    route: '/feedback' as const,
  },
  {
    label: 'Account',
    route: '/(tabs)/profile' as const,
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const { balance } = useRewards();
  const [locations, setLocations] = useState<Location[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [reorderingOrderId, setReorderingOrderId] = useState<number | null>(null);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let isMounted = true;

    async function loadHome() {
      try {
        const [nextLocations, nextMenu, nextOrders] = await Promise.all([
          locationService.getLocations(),
          menuService.getMenu(),
          user ? orderService.getOrders().catch(() => []) : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        setLocations(nextLocations.slice(0, 3));
        setMenuItems(nextMenu.filter((item) => item.isAvailable));
        setRecentOrders(nextOrders.slice(0, 3));
      } catch {
        if (isMounted) {
          setLocations([]);
          setMenuItems([]);
          setRecentOrders([]);
        }
      }
    }

    void loadHome();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const featuredItems = useMemo(() => {
    const imageReadyItems = menuItems.filter((item) => item.imageUrl);
    const featured = imageReadyItems.filter((item) => item.isFeatured);
    return (featured.length > 0 ? featured : imageReadyItems).slice(0, 6);
  }, [menuItems]);

  const heroShowcaseItems = featuredItems.slice(0, 3);
  const orderAgainCards = useMemo(() => {
    const menuItemById = new Map(menuItems.map((item) => [item.id, item]));

    return recentOrders.map((order) => {
      const leadOrderItem = order.items[0];
      const leadMenuItem = leadOrderItem ? menuItemById.get(leadOrderItem.menuItemId) : undefined;

      return {
        order,
        leadMenuItem,
        label:
          order.items.length > 1
            ? `${leadOrderItem?.itemName ?? 'House order'} +${order.items.length - 1} more`
            : (leadOrderItem?.itemName ?? `Order #${order.id}`),
      };
    });
  }, [menuItems, recentOrders]);

  const showOrderAgain = user && orderAgainCards.length > 0;

  async function reorder(orderId: number) {
    setReorderingOrderId(orderId);
    try {
      const nextOrder = await orderService.reorder(orderId);
      router.push(`/order-confirmation?id=${nextOrder.id}`);
    } catch {
      router.push('/(tabs)/orders');
    } finally {
      setReorderingOrderId(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar backgroundColor={OLIVE_LIGHT} style="light" translucent={false} />
      <View style={styles.hero}>
        <View style={styles.heroNav}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>CL</Text>
          </View>
          <View style={styles.heroNavCopy}>
            <Text style={styles.heroNavKicker}>Fresh roasted daily</Text>
            <Text style={styles.heroNavLocation}>{locations[0]?.name ?? 'Pilot favorites'}</Text>
          </View>
          <Pressable style={styles.navCartBtn} onPress={() => router.push('/cart')}>
            <Text style={styles.navCartIcon}>Cart</Text>
            {cartCount > 0 && (
              <View style={styles.navCartBadge}>
                <Text style={styles.navCartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>House blend ordering</Text>
          <Text style={styles.heroTop}>CAFFEINATED</Text>
          <Text style={styles.heroBottom}>LIONS</Text>
          <Text style={styles.heroDescription}>
            Order faster, jump back into a favorite, and keep the whole pilot flow one tap away.
          </Text>
          <View style={styles.heroActions}>
            <Pressable style={styles.heroPrimaryButton} onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.heroPrimaryButtonText}>Order now</Text>
            </Pressable>
            <Pressable style={styles.heroSecondaryButton} onPress={() => router.push('/checkout')}>
              <Text style={styles.heroSecondaryButtonText}>Reserve a table</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroShowcase}>
          {heroShowcaseItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.heroShowcaseCard,
                index === 0 && styles.heroShowcaseCardLead,
              ]}
              onPress={() => {
                addItem(item);
                router.push('/cart');
              }}>
              <Image source={{ uri: resolveApiAssetUrl(item.imageUrl) }} style={styles.heroShowcaseImage} resizeMode="cover" />
              <View style={styles.heroShowcaseOverlay} />
              <View style={styles.heroShowcaseCopy}>
                <Text style={styles.heroShowcaseName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.heroShowcasePrice}>${item.price.toFixed(2)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>{showOrderAgain ? 'Welcome back' : 'Start here'}</Text>
            <Text style={styles.sectionTitle}>{showOrderAgain ? 'Order It Again' : 'Top Items'}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.sectionLink}>Full menu</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.spotlightScrollContent}
          showsHorizontalScrollIndicator={false}
          style={styles.spotlightScroll}>
          {showOrderAgain
            ? orderAgainCards.map(({ order, leadMenuItem, label }) => (
                <View key={order.id} style={styles.spotlightCard}>
                  <Image
                    source={{
                      uri:
                        (leadMenuItem?.imageUrl
                          ? resolveApiAssetUrl(leadMenuItem.imageUrl)
                          : undefined) ??
                        'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=480&h=320&fit=crop',
                    }}
                    style={styles.spotlightImage}
                    resizeMode="cover"
                  />
                  <View style={styles.spotlightCopy}>
                    <Text style={styles.spotlightEyebrow}>
                      Last ordered {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.spotlightTitle} numberOfLines={2}>
                      {label}
                    </Text>
                    <Text style={styles.spotlightMeta}>
                      ${order.total.toFixed(2)} • {order.items.length} items • +{order.starsEarned} Lions
                    </Text>
                    <Pressable
                      style={[styles.spotlightButton, reorderingOrderId === order.id && styles.buttonDisabled]}
                      disabled={reorderingOrderId === order.id}
                      onPress={() => void reorder(order.id)}>
                      <Text style={styles.spotlightButtonText}>
                        {reorderingOrderId === order.id ? 'Reordering...' : 'Reorder this run'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            : featuredItems.map((item) => (
                <View key={item.id} style={styles.spotlightCard}>
                  <Image source={{ uri: resolveApiAssetUrl(item.imageUrl) }} style={styles.spotlightImage} resizeMode="cover" />
                  <View style={styles.spotlightCopy}>
                    <Text style={styles.spotlightEyebrow}>{item.category}</Text>
                    <Text style={styles.spotlightTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.spotlightMeta}>
                      ${item.price.toFixed(2)} • {item.preparationTag || 'Freshly made'}
                    </Text>
                    <Pressable
                      style={styles.spotlightButton}
                      onPress={() => {
                        addItem(item);
                        router.push('/cart');
                      }}>
                      <Text style={styles.spotlightButtonText}>Add to cart</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Navigate</Text>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {PRIMARY_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as Parameters<typeof router.push>[0])}
            >
              <View style={styles.actionImgWrap}>
                <Image
                  source={{ uri: action.image }}
                  style={styles.actionImg}
                  resizeMode="cover"
                />
                <View style={styles.actionImgOverlay} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <View style={styles.secondaryActionRow}>
          {SECONDARY_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={styles.secondaryActionChip}
              onPress={() => router.push(action.route as Parameters<typeof router.push>[0])}>
              <Text style={styles.secondaryActionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.earnBanner}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800&h=300&fit=crop' }}
          style={styles.earnBannerImage}
          resizeMode="cover"
        />
        <View style={styles.earnBannerOverlay} />
        <View style={styles.earnBannerContent}>
          <Text style={styles.earnBannerKicker}>Lions Rewards</Text>
          <Text style={styles.earnBannerTitle}>Earn Lions{'\n'}Every Visit.</Text>
          <Text style={styles.earnBannerSub}>{balance?.points ?? user?.points ?? 0} Lions available</Text>
          <Text style={styles.earnBannerMicro}>
            {POINTS_PER_DOLLAR} points per $1 • {FIRST_TIER_THRESHOLD} points = choose a reward
          </Text>
          <Pressable style={styles.earnBannerBtn} onPress={() => router.push('/(tabs)/rewards')}>
            <Text style={styles.earnBannerBtnText}>View Rewards</Text>
          </Pressable>
        </View>
      </View>

      {locations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Three pilot locations</Text>
              <Text style={styles.sectionTitle}>Find your Lions</Text>
            </View>
            <Pressable onPress={() => router.push('/locations')}>
              <Text style={styles.sectionLink}>Map</Text>
            </Pressable>
          </View>
          {locations.map((location) => (
            <Pressable
              key={location.id}
              style={styles.locationRow}
              onPress={() => router.push('/locations')}
            >
              <View style={styles.locationIcon}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80&h=80&fit=crop' }}
                  style={styles.locationIconImg}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAddress}>{location.address}</Text>
              </View>
              <Text style={styles.locationArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// Website color palette
const OLIVE = '#65711d';
const OLIVE_DEEP = '#5d6717';
const OLIVE_LIGHT = '#69761f';
const INK = '#d7d9a1';       // light yellow-green text (website --store-ink)
const GOLD = '#d7b26d';      // gold text (website --store-gold)
const BG = '#f6efcf';        // warm cream background
const CARD_BG = '#f0e8c0';
const TEXT = '#3a3a1a';
const TEXT_MID = '#5a5a2a';
const TEXT_SOFT = '#8a8a5a';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 48 },

  hero: {
    backgroundColor: OLIVE_LIGHT,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 22,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(215,217,161,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(215,217,161,0.18)',
  },
  brandBadgeText: {
    color: INK,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroNavCopy: {
    flex: 1,
    gap: 2,
  },
  heroNavKicker: {
    color: INK,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroNavLocation: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '800',
  },
  navCartBtn: {
    position: 'relative',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(215,217,161,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(215,217,161,0.18)',
  },
  navCartIcon: {
    color: INK,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  navCartBadge: {
    position: 'absolute',
    top: -5,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navCartBadgeText: {
    color: OLIVE_DEEP,
    fontSize: 10,
    fontWeight: '900',
  },
  heroCopy: {
    gap: 8,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: INK,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  heroTop: {
    fontSize: 30,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  heroBottom: {
    fontSize: 80,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: -2,
    lineHeight: 84,
    textTransform: 'uppercase',
  },
  heroDescription: {
    color: 'rgba(215,217,161,0.82)',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 320,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  heroPrimaryButton: {
    borderRadius: 999,
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  heroPrimaryButtonText: {
    color: OLIVE_DEEP,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroSecondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(215,217,161,0.26)',
    backgroundColor: 'rgba(215,217,161,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  heroSecondaryButtonText: {
    color: INK,
    fontSize: 14,
    fontWeight: '700',
  },
  heroShowcase: {
    flexDirection: 'row',
    gap: 12,
  },
  heroShowcaseCard: {
    flex: 1,
    height: 150,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#506015',
  },
  heroShowcaseCardLead: {
    flex: 1.2,
  },
  heroShowcaseImage: {
    width: '100%',
    height: '100%',
  },
  heroShowcaseOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(39,45,12,0.3)',
  },
  heroShowcaseCopy: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 4,
  },
  heroShowcaseName: {
    color: '#fff8e8',
    fontSize: 14,
    fontWeight: '800',
  },
  heroShowcasePrice: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 0,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  sectionKicker: {
    paddingHorizontal: 20,
    fontSize: 11,
    fontWeight: '700',
    color: OLIVE,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 22,
    fontWeight: '900',
    color: TEXT,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    color: OLIVE,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  spotlightScroll: { paddingLeft: 20 },
  spotlightScrollContent: { gap: 14, paddingRight: 20 },
  spotlightCard: {
    width: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
  },
  spotlightImage: {
    width: '100%',
    height: 170,
  },
  spotlightCopy: {
    gap: 6,
    padding: 16,
  },
  spotlightEyebrow: {
    color: OLIVE,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  spotlightTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  spotlightMeta: {
    color: TEXT_MID,
    fontSize: 13,
    lineHeight: 19,
  },
  spotlightButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: OLIVE,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  spotlightButtonText: {
    color: '#fffaf0',
    fontSize: 13,
    fontWeight: '800',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  actionCard: {
    width: '30%',
    flexGrow: 1,
    borderRadius: 16,
    overflow: 'hidden',
    height: 90,
  },
  actionImgWrap: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionImg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  actionImgOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(93,103,23,0.55)',
  },
  actionLabel: {
    color: INK,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingBottom: 10,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  secondaryActionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d8d0ab',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fbf6e0',
  },
  secondaryActionText: {
    color: OLIVE,
    fontSize: 13,
    fontWeight: '700',
  },
  earnBanner: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 24,
    overflow: 'hidden',
    height: 220,
    position: 'relative',
  },
  earnBannerImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  earnBannerOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(93,103,23,0.78)',
  },
  earnBannerContent: {
    flex: 1,
    padding: 24,
    gap: 6,
    justifyContent: 'flex-end',
  },
  earnBannerKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  earnBannerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: INK,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  earnBannerSub: {
    fontSize: 13,
    color: 'rgba(215,217,161,0.75)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  earnBannerMicro: {
    fontSize: 11,
    color: GOLD,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  earnBannerBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  earnBannerBtnText: {
    color: OLIVE_DEEP,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e0b0',
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationIconImg: {
    width: '100%',
    height: '100%',
  },
  locationInfo: { flex: 1, gap: 2 },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
  },
  locationAddress: {
    fontSize: 12,
    color: TEXT_SOFT,
  },
  locationArrow: {
    fontSize: 22,
    color: OLIVE,
    fontWeight: '300',
  },
  buttonDisabled: { opacity: 0.65 },
});
