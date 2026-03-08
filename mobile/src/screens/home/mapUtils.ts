import type { PoopEntry } from '../../types/domain';

export type EntryLocation = {
  entryId: string;
  latitude: number;
  longitude: number;
  rating: number;
  occurredAt: string;
};

export type MapCluster = {
  key: string;
  latitude: number;
  longitude: number;
  count: number;
  entryIds: string[];
  representativeEntryId: string;
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
      latitude: Number(entry.latitude),
      longitude: Number(entry.longitude),
      rating: Number(entry.rating),
      occurredAt: entry.occurredAt,
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
    const centroid = list.reduce(
      (acc, item) => {
        acc.latitude += item.latitude;
        acc.longitude += item.longitude;
        return acc;
      },
      { latitude: 0, longitude: 0 },
    );
    const representative = [...list].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];
    return {
      key,
      latitude: centroid.latitude / list.length,
      longitude: centroid.longitude / list.length,
      count: list.length,
      entryIds: list.map((item) => item.entryId),
      representativeEntryId: representative.entryId,
    };
  });
}
