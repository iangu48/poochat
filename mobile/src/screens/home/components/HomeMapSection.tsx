import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PoopEntry } from '../../../types/domain';
import { styles } from '../../styles';
import { clusterEntryLocations, getEntryLocations, getInitialRegion, type MapRegion } from '../mapUtils';

const MapsLib = loadMapsLibrary();
const MapViewComponent = MapsLib?.MapView ?? null;
const MarkerComponent = MapsLib?.Marker ?? null;
const CircleComponent = MapsLib?.Circle ?? null;
const CROSSHAIR_DEFAULT_X_RATIO = 0.5;
const CROSSHAIR_DEFAULT_Y_RATIO = 0.33;
const RECENTER_TARGET_LONGITUDE_DELTA = 0.020;
const RECENTER_ZOOM_TOLERANCE = 0.0006;

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
  onComposerLocationChange: (latitude: number, longitude: number, source?: 'gps' | 'manual') => void;
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
    onComposerLocationChange,
  } = props;
  const locations = useMemo(() => getEntryLocations(entries), [entries]);
  const [region, setRegion] = useState<MapRegion>(() => getInitialRegion(locations));
  const initialRegionRef = useRef<MapRegion>(getInitialRegion(locations));
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showCrosshairOverlay, setShowCrosshairOverlay] = useState(false);
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [mapFrameInWindow, setMapFrameInWindow] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [crosshairCenterInWindow, setCrosshairCenterInWindow] = useState<{ x: number; y: number } | null>(null);
  const [projectionBias, setProjectionBias] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [mapIsMoving, setMapIsMoving] = useState(false);
  const mapRef = useRef<any>(null);
  const crosshairRef = useRef<View | null>(null);
  const composerDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const motionSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapIsMovingRef = useRef(false);
  const hasInitialRegionSettledRef = useRef(false);
  const programmaticMoveRef = useRef(false);
  const clusters = useMemo(() => clusterEntryLocations(locations, region), [locations, region]);
  const mapMarkers = useMemo(() => {
    if (Platform.OS === 'ios') {
      return locations.map((location) => ({
        key: `entry-${location.entryId}`,
        latitude: location.latitude,
        longitude: location.longitude,
        count: 1,
        representativeEntryId: location.entryId,
      }));
    }
    return clusters.map((cluster) => ({
      key: `cluster-${cluster.key}`,
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      count: cluster.count,
      representativeEntryId: cluster.representativeEntryId,
    }));
  }, [clusters, locations]);
  const entryById = useMemo(() => {
    const next = new Map<string, PoopEntry>();
    for (const entry of entries) next.set(entry.id, entry);
    return next;
  }, [entries]);

  function getDesiredCrosshairPointInMap(): { x: number; y: number } {
    return {
      x: mapSize.width * CROSSHAIR_DEFAULT_X_RATIO,
      y: mapSize.height * CROSSHAIR_DEFAULT_Y_RATIO,
    };
  }

  function getCrosshairPointInMap(): { x: number; y: number } {
    if (mapFrameInWindow && crosshairCenterInWindow) {
      return {
        x: crosshairCenterInWindow.x - mapFrameInWindow.x,
        y: crosshairCenterInWindow.y - mapFrameInWindow.y,
      };
    }
    return getDesiredCrosshairPointInMap();
  }

  function getCrosshairOverlayStyle() {
    const crosshair = getDesiredCrosshairPointInMap();
    if (mapSize.width <= 0 || mapSize.height <= 0) return null;
    return {
      left: crosshair.x - 22,
      top: crosshair.y - 22,
    };
  }

  function refreshCrosshairGeometry(): void {
    const mapInstance = mapRef.current;
    const crosshairInstance = crosshairRef.current;
    if (!mapInstance || !crosshairInstance) return;
    if (typeof mapInstance.measureInWindow !== 'function' || typeof crosshairInstance.measureInWindow !== 'function') return;
    mapInstance.measureInWindow((mx: number, my: number, mw: number, mh: number) => {
      crosshairInstance.measureInWindow((cx: number, cy: number, cw: number, ch: number) => {
        if (
          !Number.isFinite(mx) || !Number.isFinite(my) || !Number.isFinite(mw) || !Number.isFinite(mh)
          || !Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(cw) || !Number.isFinite(ch)
        ) return;
        setMapFrameInWindow({ x: mx, y: my, width: mw, height: mh });
        setCrosshairCenterInWindow({ x: cx + cw / 2, y: cy + ch / 2 });
      });
    });
  }

  function getCrosshairCoordinate(nextRegion: MapRegion): { latitude: number; longitude: number } {
    const point = getCrosshairPointInMap();
    if (mapSize.width <= 0 || mapSize.height <= 0) {
      return {
        latitude: nextRegion.latitude + (0.5 - CROSSHAIR_DEFAULT_Y_RATIO) * nextRegion.latitudeDelta,
        longitude: nextRegion.longitude + (CROSSHAIR_DEFAULT_X_RATIO - 0.5) * nextRegion.longitudeDelta,
      };
    }
    const xRatio = point.x / mapSize.width;
    const yRatio = point.y / mapSize.height;
    const latitude = nextRegion.latitude + (0.5 - yRatio) * nextRegion.latitudeDelta;
    const longitude = nextRegion.longitude + (xRatio - 0.5) * nextRegion.longitudeDelta;
    return { latitude, longitude };
  }

  function getProjectionCorrectedPoint(point: { x: number; y: number }): { x: number; y: number } {
    return {
      x: point.x - projectionBias.dx,
      y: point.y - projectionBias.dy,
    };
  }

  async function calibrateProjectionBias(): Promise<void> {
    const mapInstance = mapRef.current;
    if (!mapInstance || mapSize.width <= 0 || mapSize.height <= 0) return;
    if (typeof mapInstance.coordinateForPoint !== 'function' || typeof mapInstance.pointForCoordinate !== 'function') return;
    const probe = getCrosshairPointInMap();
    try {
      const roundTripCoordinate = await mapInstance.coordinateForPoint(probe);
      const roundTripPoint = await mapInstance.pointForCoordinate(roundTripCoordinate);
      const x = Number(roundTripPoint?.x);
      const y = Number(roundTripPoint?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const nextBias = { dx: x - probe.x, dy: y - probe.y };
      setProjectionBias(nextBias);
    } catch {
      // Keep existing calibration if probing fails.
    }
  }

  async function publishCrosshairCoordinate(nextRegion: MapRegion, source: 'gps' | 'manual'): Promise<void> {
    const fallback = getCrosshairCoordinate(nextRegion);
    const mapInstance = mapRef.current;
    const canProject = mapInstance
      && typeof mapInstance.coordinateForPoint === 'function'
      && mapSize.width > 0
      && mapSize.height > 0;
    if (!canProject) {
      onComposerLocationChange(fallback.latitude, fallback.longitude, source);
      return;
    }

    try {
      const projected = await mapInstance.coordinateForPoint(
        getProjectionCorrectedPoint(getCrosshairPointInMap()),
      );
      const latitude = Number(projected?.latitude);
      const longitude = Number(projected?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        onComposerLocationChange(fallback.latitude, fallback.longitude, source);
        return;
      }
      onComposerLocationChange(latitude, longitude, source);
    } catch {
      onComposerLocationChange(fallback.latitude, fallback.longitude, source);
    }
  }

  async function centerTargetAtCrosshair(
    target: { latitude: number; longitude: number },
    durationMs: number,
  ): Promise<void> {
    programmaticMoveRef.current = true;
    const mapInstance = mapRef.current;
    const crosshairPoint = getCrosshairPointInMap();
    const hasProjection = mapInstance
      && typeof mapInstance.pointForCoordinate === 'function'
      && typeof mapInstance.coordinateForPoint === 'function'
      && mapSize.width > 0
      && mapSize.height > 0;

    let nextRegion: MapRegion | null = null;
    if (hasProjection) {
      try {
        const targetPoint = await mapInstance.pointForCoordinate(target);
        const targetX = Number(targetPoint?.x);
        const targetY = Number(targetPoint?.y);
        if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
          let centerPoint = { x: mapSize.width * 0.5, y: mapSize.height * 0.5 };
          try {
            const projectedCenter = await mapInstance.pointForCoordinate({
              latitude: region.latitude,
              longitude: region.longitude,
            });
            const centerX = Number(projectedCenter?.x);
            const centerY = Number(projectedCenter?.y);
            if (Number.isFinite(centerX) && Number.isFinite(centerY)) {
              centerPoint = { x: centerX, y: centerY };
            }
          } catch {
            // Keep geometric center fallback.
          }
          const desiredCenterPoint = {
            x: centerPoint.x + (targetX - crosshairPoint.x),
            y: centerPoint.y + (targetY - crosshairPoint.y),
          };
          const desiredCenterCoordinate = await mapInstance.coordinateForPoint(
            getProjectionCorrectedPoint(desiredCenterPoint),
          );
          const latitude = Number(desiredCenterCoordinate?.latitude);
          const longitude = Number(desiredCenterCoordinate?.longitude);
          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            nextRegion = {
              latitude,
              longitude,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            };
          }
        }
      } catch {
        // Fallback below when projection-based solve fails.
      }
    }

    if (!nextRegion) {
      const xRatio = mapSize.width > 0 ? crosshairPoint.x / mapSize.width : CROSSHAIR_DEFAULT_X_RATIO;
      const yRatio = mapSize.height > 0 ? crosshairPoint.y / mapSize.height : CROSSHAIR_DEFAULT_Y_RATIO;
      nextRegion = {
        latitude: target.latitude - (0.5 - yRatio) * region.latitudeDelta,
        longitude: target.longitude - (xRatio - 0.5) * region.longitudeDelta,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
    }

    const currentAspectRatio = (
      Number.isFinite(region.latitudeDelta)
      && Number.isFinite(region.longitudeDelta)
      && Math.abs(region.longitudeDelta) > 1e-9
    )
      ? region.latitudeDelta / region.longitudeDelta
      : 1.5;
    const targetLongitudeDelta = RECENTER_TARGET_LONGITUDE_DELTA;
    const targetLatitudeDelta = Math.max(0.0002, Math.abs(targetLongitudeDelta * currentAspectRatio));
    const shouldZoomIn = region.longitudeDelta > (targetLongitudeDelta + RECENTER_ZOOM_TOLERANCE);

    if (shouldZoomIn) {
      const latOffsetRatio = (target.latitude - nextRegion.latitude) / Math.max(region.latitudeDelta, 1e-9);
      const lngOffsetRatio = (target.longitude - nextRegion.longitude) / Math.max(region.longitudeDelta, 1e-9);
      nextRegion = {
        latitude: target.latitude - latOffsetRatio * targetLatitudeDelta,
        longitude: target.longitude - lngOffsetRatio * targetLongitudeDelta,
        latitudeDelta: targetLatitudeDelta,
        longitudeDelta: targetLongitudeDelta,
      };
    }

    mapRef.current?.animateToRegion?.(nextRegion, durationMs);
    setRegion(nextRegion);
  }

  function setMapMoving(next: boolean): void {
    if (mapIsMovingRef.current === next) return;
    mapIsMovingRef.current = next;
    setMapIsMoving(next);
  }

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
      if (motionSettleTimerRef.current) {
        clearTimeout(motionSettleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showComposer) {
      setShowCrosshairOverlay(false);
    }
  }, [showComposer]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCrosshairGeometry();
      void calibrateProjectionBias();
    }, 0);
    return () => clearTimeout(timer);
  }, [mapSize.width, mapSize.height, showCrosshairOverlay, region.latitude, region.longitude]);

  function handleOpenComposer(): void {
    if (mapIsMovingRef.current) return;
    if (currentLocation) {
      setShowCrosshairOverlay(true);
      onComposerLocationChange(currentLocation.latitude, currentLocation.longitude, 'gps');
      void centerTargetAtCrosshair(currentLocation, 650);
      if (composerDelayRef.current) clearTimeout(composerDelayRef.current);
      composerDelayRef.current = setTimeout(() => {
        onOpenComposer();
      }, 220);
      return;
    }
    onOpenComposer();
  }

  function handleFindMe(): void {
    if (!currentLocation || mapIsMovingRef.current) return;
    void centerTargetAtCrosshair(currentLocation, 420);
  }

  const addEntryDisabled = addEntryLoading || mapIsMoving;
  const findMeDisabled = !currentLocation || mapIsMoving;

  return (
    <View style={[styles.homeMapSection, fullScreen ? styles.homeMapSectionFull : null]}>
      <View style={[styles.homeMapCard, fullScreen ? styles.homeMapCardFull : null]}>
        <View style={styles.homeMapTopActions}>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonPrimary, addEntryDisabled ? styles.buttonDisabled : null, styles.homeMapActionButton]}
            onPress={handleOpenComposer}
            disabled={addEntryDisabled}
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
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonGhost, styles.homeMapActionButton, findMeDisabled ? styles.buttonDisabled : null]}
            onPress={handleFindMe}
            disabled={findMeDisabled}
            accessibilityLabel="Find my location"
          >
            <Ionicons name="locate" size={18} color="#f0f6fc" />
          </TouchableOpacity>
        </View>
        <View
          ref={crosshairRef}
          style={[styles.mapCrosshairOverlay, getCrosshairOverlayStyle(), !showCrosshairOverlay ? { opacity: 0 } : null]}
          pointerEvents="none"
        >
          <View style={styles.mapCrosshairHorizontal} />
          <View style={styles.mapCrosshairVertical} />
          <View style={styles.mapCrosshairCenterDot} />
        </View>
        {MapViewComponent && MarkerComponent ? (
          <MapViewComponent
            ref={mapRef}
            style={[styles.homeMap, fullScreen ? styles.homeMapFull : null]}
            initialRegion={initialRegionRef.current}
            onLayout={(event: any) => {
              const width = Number(event?.nativeEvent?.layout?.width);
              const height = Number(event?.nativeEvent?.layout?.height);
              if (!Number.isFinite(width) || !Number.isFinite(height)) return;
              setMapSize({ width, height });
              setTimeout(() => {
                refreshCrosshairGeometry();
              }, 0);
            }}
            onRegionChangeComplete={(nextRegion: MapRegion) => {
              void (async () => {
                hasInitialRegionSettledRef.current = true;
                setRegion(nextRegion);
                refreshCrosshairGeometry();
                if (showComposer) {
                  await publishCrosshairCoordinate(nextRegion, 'manual');
                }
                if (motionSettleTimerRef.current) {
                  clearTimeout(motionSettleTimerRef.current);
                }
                motionSettleTimerRef.current = setTimeout(() => {
                  programmaticMoveRef.current = false;
                  setMapMoving(false);
                }, 120);
              })();
            }}
            onRegionChange={() => {
              if (!hasInitialRegionSettledRef.current && !programmaticMoveRef.current) {
                return;
              }
              setMapMoving(true);
            }}
            onPress={() => {
              if (showComposer) onCloseComposer();
            }}
          >
            {currentLocation && CircleComponent ? (
              <CircleComponent
                key="current-location-radius"
                center={currentLocation}
                radius={90}
                strokeWidth={2}
                strokeColor="rgba(88, 166, 255, 0.88)"
                fillColor="rgba(88, 166, 255, 0.26)"
              />
            ) : null}
            {currentLocation ? (
              <MarkerComponent
                key="current-location-center"
                coordinate={currentLocation}
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={10000}
              >
                <View style={styles.mapCurrentLocationCenterDot} />
              </MarkerComponent>
            ) : null}
            {mapMarkers.map((marker) => {
              if (marker.count > 1) {
                return (
                  <MarkerComponent
                    key={marker.key}
                    coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                    pinColor="#1f6feb"
                    onPress={() => {
                      const next: MapRegion = {
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                        latitudeDelta: Math.max(0.015, region.latitudeDelta / 2),
                        longitudeDelta: Math.max(0.015, region.longitudeDelta / 2),
                      };
                      mapRef.current?.animateToRegion?.(next, 320);
                    }}
                  />
                );
              }

              const entry = entryById.get(marker.representativeEntryId);
              if (!entry) return null;
              return (
                <MarkerComponent
                  key={marker.key}
                  coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                  draggable
                  tracksViewChanges={false}
                  onDragEnd={(event: { nativeEvent?: { coordinate?: { latitude?: number; longitude?: number } } }) => {
                    const latitude = Number(event?.nativeEvent?.coordinate?.latitude);
                    const longitude = Number(event?.nativeEvent?.coordinate?.longitude);
                    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
                    onUpdateEntryLocation(entry.id, latitude, longitude);
                  }}
                >
                  <View style={styles.mapPoopMarkerWrap}>
                    <View style={[styles.mapPoopMarkerBubble, { backgroundColor: getPoopMarkerColor(Number(entry.bristolType)) }]}>
                      <Text style={styles.mapPoopMarkerEmoji}>💩</Text>
                    </View>
                    <View style={[styles.mapPoopMarkerTip, { backgroundColor: getPoopMarkerColor(Number(entry.bristolType)) }]} />
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

function loadMapsLibrary(): { MapView: any; Marker: any; Circle: any } | null {
  try {
    const mod = require('react-native-maps');
    const mapView = mod?.default;
    const marker = mod?.Marker;
    const circle = mod?.Circle;
    if (!mapView || !marker) return null;
    return { MapView: mapView, Marker: marker, Circle: circle };
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

function getPoopMarkerColor(bristolType: number): string {
  const type = Number.isFinite(bristolType) ? Math.max(1, Math.min(7, Math.round(bristolType))) : 4;
  // Darker for harder types, lighter for softer types.
  switch (type) {
    case 1:
      return '#5f2f12';
    case 2:
      return '#6e3a18';
    case 3:
      return '#7d4520';
    case 4:
      return '#8c562c';
    case 5:
      return '#9b6939';
    case 6:
      return '#ac7a48';
    case 7:
      return '#bf8e5a';
    default:
      return '#8c562c';
  }
}
