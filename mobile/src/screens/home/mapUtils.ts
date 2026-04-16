import type { PoopEntry } from '../../types/domain';

export type EntryLocation = {
  entryId: string;
  entryIds: string[];
  userId: string;
  latitude: number;
  longitude: number;
  rating: number;
  occurredAt: string;
  count: number;
};

export type MapCluster = {
  key: string;
  latitude: number;
  longitude: number;
  count: number;
  entryIds: string[];
  representativeEntryId: string;
  locationCount: number;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function getEntryLocations(entries: PoopEntry[]): EntryLocation[] {
  return entries
    .filter((entry) => Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude))
    .map((entry) => ({
      entryId: entry.id,
      entryIds: [entry.id],
      userId: entry.userId,
      latitude: Number(entry.latitude),
      longitude: Number(entry.longitude),
      rating: Number(entry.rating),
      occurredAt: entry.occurredAt,
      count: 1,
    }));
}

export function getInitialRegion(locations: EntryLocation[]): MapRegion {
  if (locations.length === 0) {
    return {
      latitude: 43.6532,
      longitude: -79.3832,
      latitudeDelta: 25,
      longitudeDelta: 25,
    };
  }

  const latest = [...locations].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];
  return {
    latitude: latest.latitude,
    longitude: latest.longitude,
    latitudeDelta: 0.25,
    longitudeDelta: 0.25,
  };
}

export function clusterEntryLocations(locations: EntryLocation[], region: MapRegion): MapCluster[] {
  if (locations.length === 0) return [];
  const baseDelta = Math.max(region.latitudeDelta, region.longitudeDelta);
  const cellSize = Math.max(0.002, baseDelta / 8);
  const grouped = new Map<string, EntryLocation[]>();

  for (const location of locations) {
    const latBucket = Math.floor(location.latitude / cellSize);
    const lngBucket = Math.floor(location.longitude / cellSize);
    const key = `${latBucket}:${lngBucket}`;
    const list = grouped.get(key) ?? [];
    list.push(location);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries()).map(([key, list]) => {
    const mergedByUser = Array.from(list.reduce((acc, location) => {
      const current = acc.get(location.userId);
      if (!current) {
        acc.set(location.userId, { ...location });
        return acc;
      }
      const nextRepresentative = new Date(location.occurredAt).getTime() > new Date(current.occurredAt).getTime()
        ? location
        : current;
      acc.set(location.userId, {
        ...nextRepresentative,
        entryIds: [...current.entryIds, ...location.entryIds],
        count: current.count + location.count,
      });
      return acc;
    }, new Map<string, EntryLocation>()).values());

    const centroid = mergedByUser.reduce(
      (acc, item) => {
        acc.latitude += item.latitude;
        acc.longitude += item.longitude;
        return acc;
      },
      { latitude: 0, longitude: 0 },
    );
    const representative = [...mergedByUser].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];
    return {
      key,
      latitude: centroid.latitude / mergedByUser.length,
      longitude: centroid.longitude / mergedByUser.length,
      count: mergedByUser.reduce((sum, item) => sum + item.count, 0),
      entryIds: mergedByUser.flatMap((item) => item.entryIds),
      representativeEntryId: representative.entryId,
      locationCount: mergedByUser.length,
    };
  });
}
