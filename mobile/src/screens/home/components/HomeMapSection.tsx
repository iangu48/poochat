import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PoopEntry, Profile } from '../../../types/domain';
import { styles } from '../../styles';
import { getThemePalette, type ThemeMode } from '../../../theme';
import { getEntryLocations, getInitialRegion, type MapRegion } from '../mapUtils';

const MapsLib = loadMapsLibrary();
const CLUSTERING_ENABLED = Platform.OS !== 'ios' && Boolean(MapsLib?.ClusteredMapView);
const MapViewComponent = (
  CLUSTERING_ENABLED
    ? MapsLib?.ClusteredMapView
    : MapsLib?.MapView
) ?? null;
const MarkerComponent = MapsLib?.Marker ?? null;
const CircleComponent = MapsLib?.Circle ?? null;
const CROSSHAIR_DEFAULT_X_RATIO = 0.5;
const CROSSHAIR_DEFAULT_Y_RATIO = 0.33;
const MARKER_FOCUS_X_RATIO = 0.5;
const MARKER_FOCUS_Y_RATIO = 0.14;
const RECENTER_TARGET_LONGITUDE_DELTA = 0.020;
const RECENTER_ZOOM_TOLERANCE = 0.0006;

type Props = {
  themeMode: ThemeMode;
  entries: PoopEntry[];
  currentUserId: string;
  profilesById: Record<string, Profile>;
  selectedEntryId?: string | null;
  addEntryLoading: boolean;
  updatingEntryLocationIds: string[];
  fullScreen?: boolean;
  showComposer: boolean;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
  onOpenFriends: () => void;
  onPressEntryMarker?: (entryId: string) => void;
  onUpdateEntryLocation: (entryId: string, latitude: number, longitude: number) => void;
  onComposerLocationChange: (latitude: number, longitude: number, source?: 'gps' | 'manual') => void;
};

export function HomeMapSection(props: Props) {
  const {
    themeMode,
    entries,
    currentUserId,
    profilesById,
    selectedEntryId = null,
    addEntryLoading,
    updatingEntryLocationIds,
    fullScreen = false,
    showComposer,
    onOpenComposer,
    onCloseComposer,
    onOpenFriends,
    onPressEntryMarker,
    onUpdateEntryLocation,
    onComposerLocationChange,
  } = props;
  const colors = getThemePalette(themeMode);
  const mapControlSurface =
    themeMode === 'light'
      ? 'rgba(255, 255, 255, 0.96)'
      : 'rgba(15, 20, 27, 0.9)';
  const mapControlBorder = themeMode === 'light' ? '#c7d3e2' : '#2f3f54';
  const markerOutlineColor = themeMode === 'light' ? 'rgba(83, 98, 118, 0.45)' : 'rgba(15, 20, 27, 0.45)';
  const markerShadowColor = themeMode === 'light' ? '#6f7f95' : '#0f141b';
  const selectedMarkerOutlineColor = themeMode === 'light' ? '#2d74da' : '#58a6ff';
  const currentLocationCenterBorder = themeMode === 'light' ? '#b9d7fb' : '#dcecff';
  const locations = useMemo(() => getEntryLocations(entries), [entries]);
  const [region, setRegion] = useState<MapRegion>(() => getInitialRegion(locations));
  const initialRegionRef = useRef<MapRegion>(getInitialRegion(locations));
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showCrosshairOverlay, setShowCrosshairOverlay] = useState(false);
  const [selectedMarkerEntryId, setSelectedMarkerEntryId] = useState<string | null>(null);
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [mapFrameInWindow, setMapFrameInWindow] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [crosshairCenterInWindow, setCrosshairCenterInWindow] = useState<{ x: number; y: number } | null>(null);
  const [projectionBias, setProjectionBias] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [mapIsMoving, setMapIsMoving] = useState(false);
  const [markerIdsTrackingViewChanges, setMarkerIdsTrackingViewChanges] = useState<Record<string, true>>({});
  const mapRef = useRef<any>(null);
  const superClusterRef = useRef<any>(null);
  const crosshairRef = useRef<View | null>(null);
  const suppressNextMapPressClearRef = useRef(false);
  const composerDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const motionSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markerViewChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapIsMovingRef = useRef(false);
  const hasInitialRegionSettledRef = useRef(false);
  const programmaticMoveRef = useRef(false);
  const previousSelectedMarkerEntryIdRef = useRef<string | null>(null);
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
    anchorRatio?: { x: number; y: number },
    allowZoomIn = true,
  ): Promise<void> {
    programmaticMoveRef.current = true;
    const mapInstance = mapRef.current;
    const crosshairPoint = anchorRatio
      ? {
          x: mapSize.width > 0 ? mapSize.width * anchorRatio.x : 0,
          y: mapSize.height > 0 ? mapSize.height * anchorRatio.y : 0,
        }
      : getCrosshairPointInMap();
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
    const shouldZoomIn = allowZoomIn && region.longitudeDelta > (targetLongitudeDelta + RECENTER_ZOOM_TOLERANCE);

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
      if (markerViewChangeTimerRef.current) {
        clearTimeout(markerViewChangeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showComposer) {
      setShowCrosshairOverlay(false);
    }
  }, [showComposer]);

  useEffect(() => {
    if (!selectedEntryId) {
      setSelectedMarkerEntryId(null);
      return;
    }
    setSelectedMarkerEntryId(selectedEntryId);
  }, [selectedEntryId]);

  useEffect(() => {
    if (!selectedMarkerEntryId) return;
    if (entryById.has(selectedMarkerEntryId)) return;
    setSelectedMarkerEntryId(null);
  }, [entryById, selectedMarkerEntryId]);

  useEffect(() => {
    const idsToRefresh = [previousSelectedMarkerEntryIdRef.current, selectedMarkerEntryId]
      .filter((value): value is string => Boolean(value));
    previousSelectedMarkerEntryIdRef.current = selectedMarkerEntryId;
    if (idsToRefresh.length === 0) return;

    setMarkerIdsTrackingViewChanges((prev) => {
      const next = { ...prev };
      for (const id of idsToRefresh) next[id] = true;
      return next;
    });

    if (markerViewChangeTimerRef.current) {
      clearTimeout(markerViewChangeTimerRef.current);
    }
    markerViewChangeTimerRef.current = setTimeout(() => {
      setMarkerIdsTrackingViewChanges((prev) => {
        const next = { ...prev };
        for (const id of idsToRefresh) {
          delete next[id];
        }
        return next;
      });
      markerViewChangeTimerRef.current = null;
    }, 250);
  }, [selectedMarkerEntryId]);

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

  function handleExpandAll(): void {
    if (mapIsMovingRef.current) return;
    if (locations.length === 0) return;
    const coordinates = locations.map((location) => ({
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    const mapInstance = mapRef.current;
    const canFit = mapInstance && typeof mapInstance.fitToCoordinates === 'function';
    if (canFit) {
      programmaticMoveRef.current = true;
      setMapMoving(true);
      mapInstance.fitToCoordinates(coordinates, {
        edgePadding: { top: 96, right: 72, bottom: 260, left: 72 },
        animated: true,
      });
      return;
    }

    const nextRegion = getInitialRegion(locations);
    programmaticMoveRef.current = true;
    setMapMoving(true);
    mapRef.current?.animateToRegion?.(nextRegion, 380);
    setRegion(nextRegion);
  }

  const addEntryDisabled = addEntryLoading || mapIsMoving;
  const findMeDisabled = !currentLocation || mapIsMoving;
  const expandAllDisabled = locations.length === 0 || mapIsMoving;

  return (
    <View style={[styles.homeMapSection, fullScreen ? styles.homeMapSectionFull : null]}>
      <View
        style={[
          styles.homeMapCard,
          fullScreen ? styles.homeMapCardFull : null,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        ]}
      >
        <View style={styles.homeMapTopActionsLeft}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.iconButtonGhost,
              styles.homeMapActionButton,
              { backgroundColor: mapControlSurface, borderColor: mapControlBorder },
            ]}
            onPress={onOpenFriends}
            accessibilityLabel="Open friends"
          >
            <Ionicons name="people" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.homeMapTopActions}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.iconButtonGhost,
              styles.homeMapActionButton,
              { backgroundColor: mapControlSurface, borderColor: mapControlBorder },
              findMeDisabled ? styles.buttonDisabled : null,
            ]}
            onPress={handleFindMe}
            disabled={findMeDisabled}
            accessibilityLabel="Find my location"
          >
            <Ionicons name="locate" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.iconButtonGhost,
              styles.homeMapActionButton,
              { backgroundColor: mapControlSurface, borderColor: mapControlBorder },
              expandAllDisabled ? styles.buttonDisabled : null,
            ]}
            onPress={handleExpandAll}
            disabled={expandAllDisabled}
            accessibilityLabel="Show all entries"
          >
            <Ionicons name="globe-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.homeMapAddButton,
            { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
            addEntryDisabled ? styles.buttonDisabled : null,
          ]}
          onPress={handleOpenComposer}
          disabled={addEntryDisabled}
          accessibilityLabel="Add entry"
        >
          <Ionicons name="add" size={30} color="#ffffff" />
        </TouchableOpacity>
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
            userInterfaceStyle={themeMode}
            {...(CLUSTERING_ENABLED ? {
              clusterColor: themeMode === 'light' ? '#2d74da' : '#1f6feb',
              clusterTextColor: '#ffffff',
              radius: 44,
              animationEnabled: false,
              tracksViewChanges: false,
              preserveClusterPressBehavior: true,
              superClusterRef,
              onClusterPress: (_cluster: any, markers?: any[]) => {
                const coordinates = (markers ?? [])
                  .map((marker) => {
                    const longitude = Number(marker?.geometry?.coordinates?.[0]);
                    const latitude = Number(marker?.geometry?.coordinates?.[1]);
                    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
                    return { latitude, longitude };
                  })
                  .filter((item): item is { latitude: number; longitude: number } => item != null);
                if (coordinates.length === 0) return;
                const nextRegion = getClusterPressRegion(coordinates);
                mapRef.current?.animateToRegion?.(nextRegion, 280);
                setRegion(nextRegion);
              },
            } : {})}
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
              if (suppressNextMapPressClearRef.current) {
                suppressNextMapPressClearRef.current = false;
              }
              if (showComposer) onCloseComposer();
            }}
          >
            {currentLocation && CircleComponent ? (
              <CircleComponent
                key="current-location-radius"
                center={currentLocation}
                radius={90}
                strokeWidth={2}
                strokeColor={themeMode === 'light' ? 'rgba(45, 116, 218, 0.72)' : 'rgba(88, 166, 255, 0.88)'}
                fillColor={themeMode === 'light' ? 'rgba(72, 141, 233, 0.16)' : 'rgba(88, 166, 255, 0.26)'}
              />
            ) : null}
            {currentLocation ? (
              <MarkerComponent
                key="current-location-center"
                coordinate={currentLocation}
                cluster={false}
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={10000}
              >
                <View
                  style={[
                    styles.mapCurrentLocationCenterDot,
                    {
                      borderColor: currentLocationCenterBorder,
                      backgroundColor: themeMode === 'light' ? '#3f8de8' : '#2f81f7',
                    },
                  ]}
                />
              </MarkerComponent>
            ) : null}
            {locations.map((location) => {
              const entry = entryById.get(location.entryId);
              if (!entry) return null;
              const isSelected = selectedMarkerEntryId === entry.id;
              const canDragEntry = entry.userId === currentUserId;
              const tracksViewChanges = Boolean(markerIdsTrackingViewChanges[entry.id]);
              const profile = profilesById[entry.userId];
              const markerColor = entry.userId === currentUserId
                ? getPoopMarkerColor(Number(entry.bristolType))
                : (profile?.avatarTint ?? '#6b7c93');
              return (
                <MarkerComponent
                  key={`entry-${entry.id}`}
                  coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                  draggable={canDragEntry}
                  tracksViewChanges={tracksViewChanges}
                  userId={entry.userId}
                  avatarUrl={profile?.avatarUrl ?? null}
                  avatarTint={profile?.avatarTint ?? '#6b7c93'}
                  onPress={() => {
                    suppressNextMapPressClearRef.current = true;
                    setSelectedMarkerEntryId(entry.id);
                    onPressEntryMarker?.(entry.id);
                    void centerTargetAtCrosshair(
                      { latitude: location.latitude, longitude: location.longitude },
                      380,
                      { x: MARKER_FOCUS_X_RATIO, y: MARKER_FOCUS_Y_RATIO },
                      false,
                    );
                  }}
                  onDragEnd={(event: { nativeEvent?: { coordinate?: { latitude?: number; longitude?: number } } }) => {
                    if (entry.userId !== currentUserId) return;
                    const latitude = Number(event?.nativeEvent?.coordinate?.latitude);
                    const longitude = Number(event?.nativeEvent?.coordinate?.longitude);
                    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
                    onUpdateEntryLocation(entry.id, latitude, longitude);
                  }}
                >
                  <View style={styles.mapPoopMarkerWrap}>
                    {entry.userId === currentUserId ? (
                      <View
                        style={[
                          styles.mapPoopMarkerBubble,
                          {
                            backgroundColor: markerColor,
                            borderColor: markerOutlineColor,
                            shadowColor: markerShadowColor,
                          },
                          isSelected
                            ? [styles.mapPoopMarkerBubbleSelected, { borderColor: selectedMarkerOutlineColor, shadowColor: selectedMarkerOutlineColor }]
                            : null,
                        ]}
                      >
                        <Text style={styles.mapPoopMarkerEmoji}>💩</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.mapAvatarMarkerBubble,
                          {
                            backgroundColor: markerColor,
                            borderColor: markerOutlineColor,
                            shadowColor: markerShadowColor,
                          },
                          isSelected
                            ? [styles.mapPoopMarkerBubbleSelected, { borderColor: selectedMarkerOutlineColor, shadowColor: selectedMarkerOutlineColor }]
                            : null,
                        ]}
                      >
                        {profile?.avatarUrl ? (
                          <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                          <Ionicons name="person" size={17} color="#ffffff" />
                        )}
                      </View>
                    )}
                    <View
                      style={[
                        styles.mapPoopMarkerTip,
                        {
                          backgroundColor: markerColor,
                          borderColor: markerOutlineColor,
                        },
                        isSelected
                          ? [styles.mapPoopMarkerTipSelected, { borderColor: selectedMarkerOutlineColor }]
                          : null,
                      ]}
                    />
                  </View>
                </MarkerComponent>
              );
            })}
          </MapViewComponent>
        ) : (
          <View style={styles.homeMapFallback}>
            <Text style={[styles.muted, { color: colors.mutedText }]}>Install `react-native-maps` to enable map rendering.</Text>
          </View>
        )}
      </View>
      {locations.length === 0 ? (
        <Text
          style={[
            styles.homeMapEmptyHint,
            { color: colors.mutedText },
            fullScreen ? styles.homeMapHintOverlay : null,
            fullScreen ? { backgroundColor: colors.overlay, borderColor: colors.border } : null,
          ]}
        >
          No pinned logs yet. Add a new entry and allow location access to place your first pin.
        </Text>
      ) : null}
    </View>
  );
}

function loadMapsLibrary(): { MapView: any; ClusteredMapView: any; Marker: any; Circle: any } | null {
  try {
    const clustered = require('react-native-map-clustering');
    const maps = require('react-native-maps');
    const clusteredMapView = clustered?.default ?? clustered;
    const mapView = maps?.default ?? maps;
    const marker = maps?.Marker;
    const circle = maps?.Circle;
    if (!mapView || !marker) return null;
    return { MapView: mapView, ClusteredMapView: clusteredMapView, Marker: marker, Circle: circle };
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

function getClusterPressRegion(coordinates: Array<{ latitude: number; longitude: number }>): MapRegion {
  if (coordinates.length === 0) {
    return {
      latitude: 43.6532,
      longitude: -79.3832,
      latitudeDelta: 0.25,
      longitudeDelta: 0.25,
    };
  }

  if (coordinates.length === 1) {
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
  }

  let minLatitude = coordinates[0].latitude;
  let maxLatitude = coordinates[0].latitude;
  let minLongitude = coordinates[0].longitude;
  let maxLongitude = coordinates[0].longitude;

  for (const coordinate of coordinates) {
    minLatitude = Math.min(minLatitude, coordinate.latitude);
    maxLatitude = Math.max(maxLatitude, coordinate.latitude);
    minLongitude = Math.min(minLongitude, coordinate.longitude);
    maxLongitude = Math.max(maxLongitude, coordinate.longitude);
  }

  const latitudeSpan = Math.max(0.01, (maxLatitude - minLatitude) * 1.6);
  const longitudeSpan = Math.max(0.01, (maxLongitude - minLongitude) * 1.6);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: latitudeSpan,
    longitudeDelta: longitudeSpan,
  };
}
