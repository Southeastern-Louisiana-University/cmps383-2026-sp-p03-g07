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
    label: 'Reserve Table',
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

      {/* Hero */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroLogo}>
              <Text style={styles.heroLogoText}>CL</Text>
            </View>
            <Pressable style={styles.heroCartBtn} onPress={() => router.push('/cart')}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=80&h=80&fit=crop' }}
                style={styles.heroCartImg}
                resizeMode="cover"
              />
              {cartCount > 0 && (
                <View style={styles.heroCartBadge}>
                  <Text style={styles.heroCartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Great coffee.{'\n'}Every visit.</Text>
            <Text style={styles.heroSub}>Three Louisiana locations. Fresh brews daily.</Text>
            <Pressable style={styles.heroBtn} onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.heroBtnText}>Order Now</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
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
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Featured Drinks */}
      {featuredItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured drinks</Text>
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
              <Text style={styles.seeAllArrow}>+</Text>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* Earn Points Banner */}
      <View style={styles.earnBanner}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800&h=300&fit=crop' }}
          style={styles.earnBannerImage}
          resizeMode="cover"
        />
        <View style={styles.earnBannerOverlay} />
        <View style={styles.earnBannerContent}>
          <View style={styles.earnBannerBadge}>
            <Text style={styles.earnBannerBadgeText}>{balance?.points ?? 0} pts</Text>
          </View>
          <Text style={styles.earnBannerTitle}>Earn Lions Points</Text>
          <Text style={styles.earnBannerSub}>Every order brings you closer to a free drink.</Text>
          <Pressable style={styles.earnBannerBtn} onPress={() => router.push('/(tabs)/rewards')}>
            <Text style={styles.earnBannerBtnText}>View Rewards</Text>
          </Pressable>
        </View>
      </View>

      {/* Locations */}
      {locations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our locations</Text>
            <Pressable onPress={() => router.push('/locations')}>
              <Text style={styles.sectionLink}>Map view</Text>
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

const BROWN = '#2c1208';
const BROWN_DARK = '#1a0b04';
const AMBER = '#e07b2a';
const AMBER_LIGHT = '#fdf0e0';
const BRAND = '#1e6b3a';
const BRAND_LIGHT = '#e8f5ed';
const GOLD = '#c87941';
const BG = '#ffffff';
const CARD_BG = '#f7f3f0';
const TEXT = '#1a1a1a';
const TEXT_MID = '#555';
const TEXT_SOFT = '#888';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 48 },

  // Hero
  hero: {
    height: 420,
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(28,10,3,0.68)',
  },
  heroContent: {
    flex: 1,
    padding: 24,
    paddingTop: 56,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AMBER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLogoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  heroCartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCartImg: {
    width: '100%',
    height: '100%',
  },
  heroCartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AMBER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  heroCopy: {
    gap: 10,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
    lineHeight: 21,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: AMBER,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 4,
  },
  heroBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Sections
  section: {
    marginTop: 28,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    color: AMBER,
    fontWeight: '600',
  },

  // Quick Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  actionCard: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionImgWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
  },
  actionImg: {
    width: '100%',
    height: '100%',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
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
    backgroundColor: AMBER_LIGHT,
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
    color: GOLD,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  seeAllArrow: {
    fontSize: 36,
    color: AMBER,
    fontWeight: '300',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: AMBER,
  },

  // Earn Points Banner
  earnBanner: {
    marginHorizontal: 20,
    marginTop: 28,
    borderRadius: 24,
    overflow: 'hidden',
    height: 200,
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
    backgroundColor: 'rgba(28,10,3,0.72)',
  },
  earnBannerContent: {
    flex: 1,
    padding: 24,
    gap: 6,
    justifyContent: 'flex-end',
  },
  earnBannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AMBER,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  earnBannerBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  earnBannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.3,
  },
  earnBannerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  earnBannerBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  earnBannerBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Locations
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece8',
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
    color: TEXT_SOFT,
    fontWeight: '300',
  },
});
