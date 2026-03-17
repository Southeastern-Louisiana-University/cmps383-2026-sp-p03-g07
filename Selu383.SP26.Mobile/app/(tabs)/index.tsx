import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { locationService } from '@/services/locationService';
import { menuService } from '@/services/menuService';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';
import { useRewards } from '@/store/rewardsStore';
import type { Location, MenuItem } from '@/types/app';

const QUICK_ACTIONS = [
  {
    label: 'Order Online',
    route: '/(tabs)/menu' as const,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=200&h=200&fit=crop',
  },
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
    label: 'Rewards',
    route: '/(tabs)/rewards' as const,
    image: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=200&h=200&fit=crop',
  },
  {
    label: 'Feedback',
    route: '/feedback' as const,
    image: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=200&h=200&fit=crop',
  },
  {
    label: 'Account',
    route: '/(tabs)/profile' as const,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { items } = useCart();
  const { balance } = useRewards();
  const [locations, setLocations] = useState<Location[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    void Promise.all([locationService.getLocations(), menuService.getMenu()]).then(
      ([nextLocations, nextMenu]) => {
        setLocations(nextLocations.slice(0, 3));
        setFeaturedItems(nextMenu.filter((item) => item.isFeatured).slice(0, 4));
      },
    );
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Hero - olive green like the website */}
      <View style={styles.hero}>
        {/* Nav rail */}
        <View style={styles.heroNav}>
          <Pressable style={styles.navBagBtn} onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.navBagIcon}>◻</Text>
          </Pressable>
          <View style={styles.navLinks}>
            <Pressable onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.navLink}>Order Online</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/checkout')}>
              <Text style={styles.navLink}>Reservation</Text>
            </Pressable>
          </View>
          <Pressable style={styles.navCartBtn} onPress={() => router.push('/cart')}>
            <Text style={styles.navCartIcon}>◻</Text>
            {cartCount > 0 && (
              <View style={styles.navCartBadge}>
                <Text style={styles.navCartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Order Now circle button */}
        <Pressable style={styles.orderOrbit} onPress={() => router.push('/(tabs)/menu')}>
          <View style={styles.orderOrbitRing}>
            <Text style={styles.orderOrbitRingText}>ORDER NOW • ORDER NOW • </Text>
          </View>
          <View style={styles.orderOrbitCore}>
            <Text style={styles.orderOrbitIcon}>▤</Text>
          </View>
        </Pressable>

        {/* CAFFEINATED LIONS */}
        <View style={styles.heroCopy}>
          <Text style={styles.heroTop}>CAFFEINATED</Text>
          <Text style={styles.heroBottom}>LIONS</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Navigate</Text>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
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
      </View>

      {/* Featured Drinks */}
      {featuredItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Our menu</Text>
              <Text style={styles.sectionTitle}>Featured drinks</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.sectionLink}>View all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.drinkScroll} contentContainerStyle={styles.drinkScrollContent}>
            {featuredItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.drinkCard}
                onPress={() => router.push('/(tabs)/menu')}
              >
                <Image
                  source={{ uri: item.imageUrl ? `${item.imageUrl}?w=280&h=160&fit=crop` : 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=280&h=160&fit=crop' }}
                  style={styles.drinkImage}
                  resizeMode="cover"
                />
                <Text style={styles.drinkName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.drinkPrice}>${item.price.toFixed(2)}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.drinkCard, styles.drinkCardSeeAll]} onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.seeAllArrow}>›</Text>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* Earn Points Banner - olive themed */}
      <View style={styles.earnBanner}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800&h=300&fit=crop' }}
          style={styles.earnBannerImage}
          resizeMode="cover"
        />
        <View style={styles.earnBannerOverlay} />
        <View style={styles.earnBannerContent}>
          <Text style={styles.earnBannerKicker}>Lions Rewards</Text>
          <Text style={styles.earnBannerTitle}>Earn Points{'\n'}Every Visit.</Text>
          <Text style={styles.earnBannerSub}>
            {balance?.points ?? 0} pts - {(balance?.currentTier ?? 'member').toUpperCase()}
          </Text>
          <Pressable style={styles.earnBannerBtn} onPress={() => router.push('/(tabs)/rewards')}>
            <Text style={styles.earnBannerBtnText}>View Rewards</Text>
          </Pressable>
        </View>
      </View>

      {/* Locations */}
      {locations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Three Louisiana locations</Text>
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
const GOLD_DEEP = '#b48a48';
const BG = '#f6efcf';        // warm cream background
const CARD_BG = '#f0e8c0';
const TEXT = '#3a3a1a';
const TEXT_MID = '#5a5a2a';
const TEXT_SOFT = '#8a8a5a';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 48 },

  // Hero
  hero: {
    backgroundColor: OLIVE_LIGHT,
    minHeight: 420,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },

  // Nav
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    gap: 12,
  },
  navBagBtn: {
    padding: 4,
  },
  navBagIcon: {
    color: INK,
    fontSize: 28,
    lineHeight: 32,
  },
  navLinks: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
    paddingLeft: 8,
  },
  navLink: {
    color: INK,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  navCartBtn: {
    position: 'relative',
    padding: 4,
  },
  navCartIcon: {
    color: INK,
    fontSize: 28,
    lineHeight: 32,
  },
  navCartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCartBadgeText: {
    color: OLIVE_DEEP,
    fontSize: 9,
    fontWeight: '900',
  },

  // Order orbit button
  orderOrbit: {
    position: 'absolute',
    right: 20,
    top: 120,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderOrbitRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderOrbitRingText: {
    position: 'absolute',
    fontSize: 8,
    color: INK,
    letterSpacing: 2,
    top: 4,
  },
  orderOrbitCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderOrbitIcon: {
    fontSize: 28,
    color: OLIVE_DEEP,
    lineHeight: 34,
  },

  // CAFFEINATED LIONS text
  heroCopy: {
    paddingHorizontal: 20,
    paddingTop: 60,
    gap: 0,
  },
  heroTop: {
    fontSize: 32,
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

  // Sections
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

  // Quick Actions Grid
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

  // Drink Cards
  drinkScroll: { paddingLeft: 20 },
  drinkScrollContent: { gap: 12, paddingRight: 20 },
  drinkCard: {
    width: 150,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  drinkCardSeeAll: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OLIVE,
    padding: 14,
    height: 150,
  },
  drinkImage: {
    width: '100%',
    height: 100,
  },
  drinkName: {
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 18,
  },
  drinkPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD_DEEP,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  seeAllArrow: {
    fontSize: 40,
    color: INK,
    fontWeight: '300',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: INK,
  },

  // Earn Banner
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

  // Locations
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
});
