import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PoopEntry } from '../../../types/domain';
import { styles } from '../../styles';
import { clusterEntryLocations, getEntryLocations, getInitialRegion, type MapRegion } from '../mapUtils';
import { getRatingColor, getRatingEmoji } from '../utils';

const MapsLib = loadMapsLibrary();
const MapViewComponent = MapsLib?.MapView ?? null;
const MarkerComponent = MapsLib?.Marker ?? null;

type Props = {
  entries: PoopEntry[];
  addEntryLoading: boolean;
  updatingEntryLocationIds: string[];
  fullScreen?: boolean;
  showComposer: boolean;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
  onOpenDetails: () => void;
  onUpdateEntryLocation: (entryId: string, latitude: number, longitude: number) => void;
};

export function HomeMapSection(props: Props) {
  const {
    entries,
    addEntryLoading,
    updatingEntryLocationIds,
    fullScreen = false,
    showComposer,
    onOpenComposer,
    onCloseComposer,
    onOpenDetails,
    onUpdateEntryLocation,
  } = props;
  const locations = useMemo(() => getEntryLocations(entries), [entries]);
  const [region, setRegion] = useState<MapRegion>(() => getInitialRegion(locations));
  const initialRegionRef = useRef<MapRegion>(getInitialRegion(locations));
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showCrosshairOverlay, setShowCrosshairOverlay] = useState(false);
  const mapRef = useRef<any>(null);
  const composerDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clusters = useMemo(() => clusterEntryLocations(locations, region), [locations, region]);
  const entryById = useMemo(() => {
    const next = new Map<string, PoopEntry>();
    for (const entry of entries) next.set(entry.id, entry);
    return next;
  }, [entries]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const Location = loadLocationLibrary();
      if (!Location) return;
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!mounted || permission.status !== 'granted') return;
        const cached = await Location.getLastKnownPositionAsync();
        const cachedLatitude = Number(cached?.coords?.latitude);
        const cachedLongitude = Number(cached?.coords?.longitude);
        if (mounted && Number.isFinite(cachedLatitude) && Number.isFinite(cachedLongitude)) {
          setCurrentLocation({ latitude: cachedLatitude, longitude: cachedLongitude });
        }

        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const latitude = Number(position?.coords?.latitude);
        const longitude = Number(position?.coords?.longitude);
        if (!mounted || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        setCurrentLocation({ latitude, longitude });
      } catch {
        // Leave current location unavailable when permission/location lookup fails.
      }
    })();
    return () => {
      mounted = false;
      if (composerDelayRef.current) {
        clearTimeout(composerDelayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showComposer) {
      setShowCrosshairOverlay(false);
    }
  }, [showComposer]);

  function handleOpenComposer(): void {
    if (currentLocation) {
      // Use stable target deltas so the "top-half center" offset is consistent
      // on first tap and doesn't depend on whatever zoom level the map currently has.
      const latitudeDelta = 0.03;
      const longitudeDelta = 0.03;
      const centeredRegion: MapRegion = {
        latitude: currentLocation.latitude - latitudeDelta * 0.32,
        longitude: currentLocation.longitude,
        latitudeDelta,
        longitudeDelta,
      };
      setShowCrosshairOverlay(true);
      mapRef.current?.animateToRegion?.(centeredRegion, 650);
      setRegion(centeredRegion);
      if (composerDelayRef.current) clearTimeout(composerDelayRef.current);
      composerDelayRef.current = setTimeout(() => {
        onOpenComposer();
      }, 220);
      return;
    }
    onOpenComposer();
  }

  return (
    <View style={[styles.homeMapSection, fullScreen ? styles.homeMapSectionFull : null]}>
      <View style={[styles.homeMapCard, fullScreen ? styles.homeMapCardFull : null]}>
        <View style={styles.homeMapTopActions}>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonPrimary, addEntryLoading ? styles.buttonDisabled : null, styles.homeMapActionButton]}
            onPress={handleOpenComposer}
            disabled={addEntryLoading}
            accessibilityLabel="Add entry"
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonGhost, styles.homeMapActionButton]}
            onPress={onOpenDetails}
            accessibilityLabel="Open home details"
          >
            <Ionicons name="stats-chart" size={18} color="#f0f6fc" />
          </TouchableOpacity>
        </View>
        {showCrosshairOverlay ? (
          <View style={styles.mapCrosshairOverlay} pointerEvents="none">
            <View style={styles.mapCrosshairHorizontal} />
            <View style={styles.mapCrosshairVertical} />
            <View style={styles.mapCrosshairCenterDot} />
          </View>
        ) : null}
        {MapViewComponent && MarkerComponent ? (
          <MapViewComponent
            ref={mapRef}
            style={[styles.homeMap, fullScreen ? styles.homeMapFull : null]}
            initialRegion={initialRegionRef.current}
            onRegionChangeComplete={(nextRegion: MapRegion) => setRegion(nextRegion)}
            onPress={() => {
              if (showComposer) onCloseComposer();
            }}
          >
            {currentLocation ? (
              <MarkerComponent key="current-location" coordinate={currentLocation}>
                <View style={styles.mapCurrentLocationWrap}>
                  <View style={styles.mapCurrentLocationDotOuter}>
                    <View style={styles.mapCurrentLocationDotBody}>
                      <View style={styles.mapCurrentLocationSpecular} />
                    </View>
                  </View>
                </View>
              </MarkerComponent>
            ) : null}
            {clusters.map((cluster) => {
              if (cluster.count > 1) {
                return (
                  <MarkerComponent
                    key={`cluster-${cluster.key}`}
                    coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                    onPress={() =>
                      setRegion((prev) => ({
                        latitude: cluster.latitude,
                        longitude: cluster.longitude,
                        latitudeDelta: Math.max(0.015, prev.latitudeDelta / 2),
                        longitudeDelta: Math.max(0.015, prev.longitudeDelta / 2),
                      }))
                    }
                  >
                    <View style={styles.mapClusterMarker}>
                      <Text style={styles.mapClusterMarkerText}>{cluster.count}</Text>
                    </View>
                  </MarkerComponent>
                );
              }

              const entry = entryById.get(cluster.representativeEntryId);
              if (!entry) return null;
              const isUpdating = updatingEntryLocationIds.includes(entry.id);
              return (
                <MarkerComponent
                  key={`entry-${entry.id}`}
                  coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                  draggable
                  onDragEnd={(event: { nativeEvent?: { coordinate?: { latitude?: number; longitude?: number } } }) => {
                    const latitude = Number(event?.nativeEvent?.coordinate?.latitude);
                    const longitude = Number(event?.nativeEvent?.coordinate?.longitude);
                    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
                    onUpdateEntryLocation(entry.id, latitude, longitude);
                  }}
                >
                  <View style={[styles.mapPinMarker, isUpdating ? styles.mapPinMarkerUpdating : null]}>
                    <Text style={[styles.mapPinMarkerText, { color: getRatingColor(Number(entry.rating)) }]}>
                      {getRatingEmoji(Number(entry.rating))}
                    </Text>
                  </View>
                </MarkerComponent>
              );
            })}
          </MapViewComponent>
        ) : (
          <View style={styles.homeMapFallback}>
            <Text style={styles.muted}>Install `react-native-maps` to enable map rendering.</Text>
          </View>
        )}
      </View>
      {locations.length === 0 ? (
        <Text style={[styles.homeMapEmptyHint, fullScreen ? styles.homeMapHintOverlay : null]}>
          No pinned logs yet. Add a new entry and allow location access to place your first pin.
        </Text>
      ) : (
        <Text style={[styles.homeMapLegendText, fullScreen ? styles.homeMapHintOverlay : null]}>
          Showing {locations.length} pinned log{locations.length === 1 ? '' : 's'} from {entries.length} total entries.
        </Text>
      )}
    </View>
  );
}

function loadMapsLibrary(): { MapView: any; Marker: any } | null {
  try {
    const mod = require('react-native-maps');
    const mapView = mod?.default;
    const marker = mod?.Marker;
    if (!mapView || !marker) return null;
    return { MapView: mapView, Marker: marker };
  } catch {
    return null;
  }
}

function loadLocationLibrary(): any | null {
  try {
    return require('expo-location');
  } catch {
    return null;
  }
}
