import type { PoopEntry } from '../../types/domain';

export type CalendarCell = {
  day: number;
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
    calendarCells.push({
      day: prevMonthDays - leadingEmpty + i + 1,
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
    calendarCells.push({
      day: nextMonthDay,
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

export function getRatingColor(value: number): string {
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

export function getRatingCardStyle(value: number): { backgroundColor: string; borderColor: string } {
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

export function getRatingDayStyle(value: number): { backgroundColor: string; borderColor: string } {
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

export function getRatingPillColors(value: number, selected: boolean): {
  backgroundColor: string;
  borderColor: string;
  levelColor: string;
  labelColor: string;
} {
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
