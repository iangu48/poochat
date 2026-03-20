import { POOP_VOLUME_OPTIONS, type PoopEntry } from '../../types/domain';
import type { ThemeMode } from '../../theme';

export type CalendarCell = {
  day: number;
  dateKey: string;
  rating: number | null;
  entryCount: number;
  isToday: boolean;
  inCurrentMonth: boolean;
};

export type MonthSummary = {
  monthEntries: PoopEntry[];
  averageMonthRating: number | null;
  averageMonthBristol: number | null;
  uniqueLoggedDays: number;
  latestRatingByDay: Record<string, number>;
  calendarCells: CalendarCell[];
};

export type DaySummary = {
  dayEntries: PoopEntry[];
  averageDayRating: number | null;
  averageDayBristol: number | null;
  latestEntryTimeLabel: string | null;
};

export function getMonthSummary(entries: PoopEntry[], visibleMonthStart: Date, now: Date): MonthSummary {
  const daysInMonth = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth() + 1, 0).getDate();
  const monthEntries = entries.filter((entry) => {
    const date = new Date(entry.occurredAt);
    return date.getFullYear() === visibleMonthStart.getFullYear() && date.getMonth() === visibleMonthStart.getMonth();
  });

  const averageMonthRating = monthEntries.length > 0
    ? monthEntries.reduce((sum, entry) => sum + Number(entry.rating), 0) / monthEntries.length
    : null;

  const averageMonthBristol = monthEntries.length > 0
    ? monthEntries.reduce((sum, entry) => sum + Number(entry.bristolType), 0) / monthEntries.length
    : null;

  const uniqueLoggedDays = new Set(monthEntries.map((entry) => getLocalDateKey(new Date(entry.occurredAt)))).size;

  const latestRatingByDay: Record<string, number> = {};
  const entryCountByDay: Record<string, number> = {};
  const sorted = [...monthEntries].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  for (const entry of sorted) {
    const key = getLocalDateKey(new Date(entry.occurredAt));
    entryCountByDay[key] = (entryCountByDay[key] ?? 0) + 1;
    if (latestRatingByDay[key] == null) {
      latestRatingByDay[key] = Number(entry.rating);
    }
  }

  let leadingEmpty = visibleMonthStart.getDay();
  if (leadingEmpty === 0) leadingEmpty = 7;
  const prevMonthDays = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth(), 0).getDate();
  const calendarCells: CalendarCell[] = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    const day = prevMonthDays - leadingEmpty + i + 1;
    const current = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth() - 1, day);
    calendarCells.push({
      day,
      dateKey: getLocalDateKey(current),
      rating: null,
      entryCount: 0,
      isToday: false,
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth(), day);
    const key = getLocalDateKey(current);
    calendarCells.push({
      day,
      dateKey: key,
      rating: latestRatingByDay[key] ?? null,
      entryCount: entryCountByDay[key] ?? 0,
      isToday:
        current.getFullYear() === now.getFullYear() &&
        current.getMonth() === now.getMonth() &&
        current.getDate() === now.getDate(),
      inCurrentMonth: true,
    });
  }

  let nextMonthDay = 1;
  while (calendarCells.length < 42) {
    const current = new Date(visibleMonthStart.getFullYear(), visibleMonthStart.getMonth() + 1, nextMonthDay);
    calendarCells.push({
      day: nextMonthDay,
      dateKey: getLocalDateKey(current),
      rating: null,
      entryCount: 0,
      isToday: false,
      inCurrentMonth: false,
    });
    nextMonthDay += 1;
  }

  return {
    monthEntries,
    averageMonthRating,
    averageMonthBristol,
    uniqueLoggedDays,
    latestRatingByDay,
    calendarCells,
  };
}

export function formatEntryTimestamp(isoValue: string): string {
  const date = new Date(isoValue);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEntryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfToday.getTime() - startOfEntryDay.getTime();
  const diffDays = Math.max(1, Math.floor(diffMs / 86400000));
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export function getRatingEmotion(value: number): string {
  switch (Math.round(value)) {
    case 1:
      return 'Frustrated';
    case 2:
      return 'Uncomfortable';
    case 3:
      return 'Neutral';
    case 4:
      return 'Content';
    case 5:
      return 'Great';
    default:
      return 'Unknown';
  }
}

export function getRatingEmoji(value: number): string {
  switch (Math.round(value)) {
    case 1:
      return '😣';
    case 2:
      return '😕';
    case 3:
      return '😐';
    case 4:
      return '🙂';
    case 5:
      return '😄';
    default:
      return '❔';
  }
}

export function getVolumeLabel(value: number): string {
  return POOP_VOLUME_OPTIONS.find((option) => option.value === Math.max(0, Math.min(4, Math.round(value))))?.label ?? 'Medium';
}

export function getVolumeShortLabel(value: number): string {
  return POOP_VOLUME_OPTIONS.find((option) => option.value === Math.max(0, Math.min(4, Math.round(value))))?.shortLabel ?? 'Medium';
}

export function getVolumeEmoji(value: number): string {
  return POOP_VOLUME_OPTIONS.find((option) => option.value === Math.max(0, Math.min(4, Math.round(value))))?.emoji ?? '◻️';
}

export function formatDateInput(value: Date): string {
  if (Number.isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeInput(value: Date): string {
  if (Number.isNaN(value.getTime())) return '';
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateTimeButtonLabel(value: Date): string {
  if (Number.isNaN(value.getTime())) return 'Set date & time';
  if (isCurrentMinute(value)) return 'Now';
  return value.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isCurrentMinute(value: Date): boolean {
  if (Number.isNaN(value.getTime())) return false;
  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate() &&
    value.getHours() === now.getHours() &&
    value.getMinutes() === now.getMinutes()
  );
}

export function getRatingColor(value: number, themeMode: ThemeMode = 'dark'): string {
  if (themeMode === 'light') {
    switch (Math.round(value)) {
      case 1:
        return '#c63b32';
      case 2:
        return '#c86a1a';
      case 3:
        return '#a37a00';
      case 4:
        return '#2f8a41';
      case 5:
        return '#1f7a34';
      default:
        return '#1b1f24';
    }
  }
  switch (Math.round(value)) {
    case 1:
      return '#ff7b72';
    case 2:
      return '#ffa657';
    case 3:
      return '#f2cc60';
    case 4:
      return '#7ee787';
    case 5:
      return '#3fb950';
    default:
      return '#f0f6fc';
  }
}

export function getRatingCardStyle(value: number, themeMode: ThemeMode = 'dark'): { backgroundColor: string; borderColor: string } {
  if (themeMode === 'light') {
    switch (Math.round(value)) {
      case 1:
        return { backgroundColor: '#ffe5e3', borderColor: '#f29690' };
      case 2:
        return { backgroundColor: '#ffeddc', borderColor: '#f6b16f' };
      case 3:
        return { backgroundColor: '#fff4d8', borderColor: '#e5c46f' };
      case 4:
        return { backgroundColor: '#e7f6ea', borderColor: '#8ec99a' };
      case 5:
        return { backgroundColor: '#ddf2e3', borderColor: '#6fbd82' };
      default:
        return { backgroundColor: '#ffffff', borderColor: '#d0d8e3' };
    }
  }
  switch (Math.round(value)) {
    case 1:
      return { backgroundColor: '#331818', borderColor: '#ff7b72' };
    case 2:
      return { backgroundColor: '#352114', borderColor: '#ffa657' };
    case 3:
      return { backgroundColor: '#332b12', borderColor: '#f2cc60' };
    case 4:
      return { backgroundColor: '#162a1c', borderColor: '#7ee787' };
    case 5:
      return { backgroundColor: '#122919', borderColor: '#3fb950' };
    default:
      return { backgroundColor: '#161b22', borderColor: '#30363d' };
  }
}

export function getRatingDayStyle(value: number, themeMode: ThemeMode = 'dark'): { backgroundColor: string; borderColor: string } {
  if (themeMode === 'light') {
    switch (Math.round(value)) {
      case 1:
        return { backgroundColor: '#ffd7d4', borderColor: '#ef8b83' };
      case 2:
        return { backgroundColor: '#ffe7cf', borderColor: '#edaa63' };
      case 3:
        return { backgroundColor: '#ffefc7', borderColor: '#ddbe63' };
      case 4:
        return { backgroundColor: '#daf1df', borderColor: '#83c591' };
      case 5:
        return { backgroundColor: '#d0ecd8', borderColor: '#65b57a' };
      default:
        return { backgroundColor: '#ffffff', borderColor: '#d0d8e3' };
    }
  }
  switch (Math.round(value)) {
    case 1:
      return { backgroundColor: '#5a2424', borderColor: '#ff7b72' };
    case 2:
      return { backgroundColor: '#5c3215', borderColor: '#ffa657' };
    case 3:
      return { backgroundColor: '#584818', borderColor: '#f2cc60' };
    case 4:
      return { backgroundColor: '#1f4c2b', borderColor: '#7ee787' };
    case 5:
      return { backgroundColor: '#1b4a25', borderColor: '#3fb950' };
    default:
      return { backgroundColor: '#161b22', borderColor: '#30363d' };
  }
}

export function getRatingPillColors(value: number, selected: boolean, themeMode: ThemeMode = 'dark'): {
  backgroundColor: string;
  borderColor: string;
  levelColor: string;
  labelColor: string;
} {
  if (themeMode === 'light') {
    switch (Math.round(value)) {
      case 1:
        return selected
          ? { backgroundColor: '#ffd7d4', borderColor: '#ef8b83', levelColor: '#8e241c', labelColor: '#8e241c' }
          : { backgroundColor: '#fff0ee', borderColor: '#efb1ab', levelColor: '#c04f46', labelColor: '#b96a64' };
      case 2:
        return selected
          ? { backgroundColor: '#ffe7cf', borderColor: '#edaa63', levelColor: '#8a4a12', labelColor: '#8a4a12' }
          : { backgroundColor: '#fff4e8', borderColor: '#eec99f', levelColor: '#bd7a38', labelColor: '#b28355' };
      case 3:
        return selected
          ? { backgroundColor: '#ffefc7', borderColor: '#ddbe63', levelColor: '#795d00', labelColor: '#795d00' }
          : { backgroundColor: '#fff8e5', borderColor: '#e4cf95', levelColor: '#a8872a', labelColor: '#a08948' };
      case 4:
        return selected
          ? { backgroundColor: '#daf1df', borderColor: '#83c591', levelColor: '#1f6a30', labelColor: '#1f6a30' }
          : { backgroundColor: '#eef9f0', borderColor: '#abd8b4', levelColor: '#4a9d5d', labelColor: '#5b9166' };
      case 5:
        return selected
          ? { backgroundColor: '#d0ecd8', borderColor: '#65b57a', levelColor: '#155c2a', labelColor: '#155c2a' }
          : { backgroundColor: '#e7f7eb', borderColor: '#96d3a5', levelColor: '#368c4d', labelColor: '#4b8660' };
      default:
        return selected
          ? { backgroundColor: '#e2ebfb', borderColor: '#80a9ef', levelColor: '#1b4ea3', labelColor: '#1b4ea3' }
          : { backgroundColor: '#f7f9fc', borderColor: '#d0d8e3', levelColor: '#1b1f24', labelColor: '#5c6877' };
    }
  }
  switch (Math.round(value)) {
    case 1:
      return selected
        ? { backgroundColor: '#5a2424', borderColor: '#ff7b72', levelColor: '#ffd5d0', labelColor: '#ffd5d0' }
        : { backgroundColor: '#2c1515', borderColor: '#8e3c38', levelColor: '#ffb3ac', labelColor: '#d58d87' };
    case 2:
      return selected
        ? { backgroundColor: '#5c3215', borderColor: '#ffa657', levelColor: '#ffe0c2', labelColor: '#ffe0c2' }
        : { backgroundColor: '#2f1f14', borderColor: '#8f5c34', levelColor: '#ffc58e', labelColor: '#d7a06f' };
    case 3:
      return selected
        ? { backgroundColor: '#584818', borderColor: '#f2cc60', levelColor: '#fff0be', labelColor: '#fff0be' }
        : { backgroundColor: '#2d2714', borderColor: '#8f7b36', levelColor: '#efd78f', labelColor: '#cbb97d' };
    case 4:
      return selected
        ? { backgroundColor: '#1f4c2b', borderColor: '#7ee787', levelColor: '#dcffe1', labelColor: '#dcffe1' }
        : { backgroundColor: '#152a1b', borderColor: '#3d7b46', levelColor: '#a4e6ad', labelColor: '#86c68f' };
    case 5:
      return selected
        ? { backgroundColor: '#1b4a25', borderColor: '#3fb950', levelColor: '#d3f9d9', labelColor: '#d3f9d9' }
        : { backgroundColor: '#13261a', borderColor: '#2f7f3c', levelColor: '#92dd9f', labelColor: '#79ba85' };
    default:
      return selected
        ? { backgroundColor: '#1f2d3f', borderColor: '#58a6ff', levelColor: '#f0f6fc', labelColor: '#f0f6fc' }
        : { backgroundColor: '#0f141b', borderColor: '#30363d', levelColor: '#f0f6fc', labelColor: '#8b949e' };
  }
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthlyTip(averageBristol: number | null, averageRating: number | null, entryCount: number): string {
  if (entryCount === 0) return 'Start with one log today to build your baseline.';
  if (averageBristol == null || averageRating == null) return 'Keep logging to unlock more personalized tips.';
  if (averageBristol < 3) return 'Try more water, fiber, and light movement to ease harder stools.';
  if (averageBristol > 5.5) return 'Hydrate well and consider binding foods if stools are frequently loose.';
  if (averageRating < 3) return 'You are showing up consistently. Small routine tweaks can improve comfort.';
  if (averageRating >= 4 && averageBristol >= 3.5 && averageBristol <= 4.5) return "You're doing great. Keep your routine steady.";
  return 'Nice consistency this month. Keep tracking to spot patterns early.';
}

export function getDaySummary(entries: PoopEntry[], dateKey: string): DaySummary {
  const dayEntries = entries
    .filter((entry) => getLocalDateKey(new Date(entry.occurredAt)) === dateKey)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const averageDayRating = dayEntries.length > 0
    ? dayEntries.reduce((sum, entry) => sum + Number(entry.rating), 0) / dayEntries.length
    : null;

  const averageDayBristol = dayEntries.length > 0
    ? dayEntries.reduce((sum, entry) => sum + Number(entry.bristolType), 0) / dayEntries.length
    : null;

  const latestEntryTimeLabel = dayEntries.length > 0
    ? new Date(dayEntries[0].occurredAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return { dayEntries, averageDayRating, averageDayBristol, latestEntryTimeLabel };
}

export function getDateLabelFromKey(dateKey: string): string {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return dateKey;
  return new Date(year, month - 1, day).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDailyTip(averageBristol: number | null, averageRating: number | null, entryCount: number): string {
  if (entryCount === 0) return 'No logs on this date yet.';
  if (averageBristol == null || averageRating == null) return 'Add another entry for better signal.';
  if (averageBristol < 3) return 'This day trended on the harder side. Hydration and fiber may help.';
  if (averageBristol > 5.5) return 'This day trended loose. Hydrate and monitor patterns.';
  if (averageRating >= 4) return 'Comfort looked good on this day.';
  if (averageRating <= 2.5) return 'Lower comfort on this day. Watch for triggers.';
  return 'Moderate day. Keep logging consistently.';
}
