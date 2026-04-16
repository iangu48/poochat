import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PoopEntry } from '../types/domain';
import { getThemePalette, type ThemeMode } from '../theme';
import { styles } from './styles';
import { getDailyTip, getMonthlyTip, getRatingEmoji, getVolumeLabel } from './home/utils';

type Props = {
  themeMode: ThemeMode;
  entries: PoopEntry[];
  loadingEntries: boolean;
  entryError: string;
  onRefreshInsights: () => void;
};

export function InsightsScreen({ themeMode, entries, loadingEntries, entryError, onRefreshInsights }: Props) {
  const insets = useSafeAreaInsets();
  const colors = getThemePalette(themeMode);
  const [range, setRange] = useState<InsightRange>('30d');
  const [selectedBristol, setSelectedBristol] = useState<number | null>(null);
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [selectedTimeBucket, setSelectedTimeBucket] = useState<string | null>(null);

  const filters = useMemo<InsightFilters>(() => ({
    bristolType: selectedBristol,
    weekdayIndex: selectedWeekday,
    timeBucket: selectedTimeBucket,
  }), [selectedBristol, selectedWeekday, selectedTimeBucket]);

  const insights = useMemo(() => buildInsights(entries, range, filters), [entries, range, filters]);
  const hasActiveFilters = Boolean(selectedBristol != null || selectedWeekday != null || selectedTimeBucket != null);
  const selectedBristolBar = selectedBristol == null
    ? null
    : insights.bristolDistribution.find((item) => item.type === selectedBristol) ?? null;
  const selectedWeekdayBar = selectedWeekday == null
    ? null
    : insights.weekdayPattern.find((item) => item.weekdayIndex === selectedWeekday) ?? null;
  const selectedTimeBucketBar = selectedTimeBucket == null
    ? null
    : insights.timeOfDayPattern.find((item) => item.label === selectedTimeBucket) ?? null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.screen, { paddingTop: Math.max(12, insets.top + 8), backgroundColor: colors.background }]}
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        <RefreshControl
          refreshing={loadingEntries}
          onRefresh={onRefreshInsights}
          tintColor={colors.text}
          progressViewOffset={0}
        />
      }
    >
      {loadingEntries ? (
        <View style={styles.refreshGapIndicator}>
          <ActivityIndicator size="small" color={colors.text} />
        </View>
      ) : null}

      <Text style={[styles.title, { color: colors.text, marginTop: 0 }]}>Insights</Text>

      <View style={styles.segmentRow}>
        {INSIGHT_RANGE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.segmentButton, range === option.value && styles.segmentButtonActive]}
            onPress={() => {
              setRange(option.value);
              setSelectedBristol(null);
              setSelectedWeekday(null);
              setSelectedTimeBucket(null);
            }}
          >
            <Text style={styles.segmentText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasActiveFilters ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {selectedBristol != null ? (
            <TouchableOpacity
              style={[styles.feedReactionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedBristol(null)}
            >
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{`Type ${selectedBristol}`}</Text>
            </TouchableOpacity>
          ) : null}
          {selectedWeekdayBar ? (
            <TouchableOpacity
              style={[styles.feedReactionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedWeekday(null)}
            >
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{selectedWeekdayBar.label}</Text>
            </TouchableOpacity>
          ) : null}
          {selectedTimeBucketBar ? (
            <TouchableOpacity
              style={[styles.feedReactionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedTimeBucket(null)}
            >
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{selectedTimeBucketBar.label}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.feedReactionChip, { backgroundColor: colors.primary, borderColor: colors.primaryBorder }]}
            onPress={() => {
              setSelectedBristol(null);
              setSelectedWeekday(null);
              setSelectedTimeBucket(null);
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>{insights.rangeLabel}</Text>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {insights.rangeCount > 0 ? `${insights.rangeCount} logs, ${insights.avgRatingLabel} average comfort` : 'No recent logs yet'}
        </Text>
        <Text style={[styles.cardBody, { color: colors.mutedText }]}>
          {insights.headline}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Signals</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{insights.comparisonLabel}</Text>
        <Text style={[styles.cardBody, { color: colors.text }]}>
          {insights.comparisonSummary}
        </Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          {insights.ratingSignal}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Consistency Strip</Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          {insights.consistencyLabel}
        </Text>
        <View style={{ marginTop: 10, marginBottom: 12, gap: insights.consistencyGap }}>
          {insights.consistencyRows.map((row, rowIndex) => (
            <View key={`consistency-row-${rowIndex}`} style={{ flexDirection: 'row', gap: insights.consistencyGap }}>
              {row.map((bucket) => (
                <View
                  key={bucket.key}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: row.length >= 12 ? 3 : row.length >= 8 ? 4 : 5,
                    backgroundColor: bucket.placeholder ? colors.surfaceAlt : bucket.count > 0 ? colors.primary : colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: bucket.placeholder ? colors.border : bucket.count > 0 ? colors.primaryBorder : colors.border,
                    opacity: bucket.placeholder ? 0.7 : bucket.count > 0 ? Math.max(0.45, Math.min(1, 0.45 + bucket.count * 0.18)) : 1,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
        <Text style={[styles.cardBody, { color: colors.text }]}>
          {insights.consistencySummary}
        </Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          {insights.consistencyHint}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Bristol Distribution</Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          Tap a bar to inspect your most common types in the selected range.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8, marginBottom: 10 }}>
          {insights.bristolDistribution.map((item) => {
            const isSelected = selectedBristol === item.type;
            return (
              <TouchableOpacity
                key={item.type}
                style={{ flex: 1, alignItems: 'center' }}
                onPress={() => setSelectedBristol((prev) => (prev === item.type ? null : item.type))}
                activeOpacity={0.85}
              >
                <View
                  style={{
                    width: '100%',
                    maxWidth: 34,
                    height: 120,
                    justifyContent: 'flex-end',
                  }}
                >
                  <View
                    style={{
                      height: Math.max(8, item.height),
                      borderRadius: 10,
                      backgroundColor: isSelected ? colors.primary : colors.text,
                      opacity: item.count > 0 ? 1 : 0.18,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: isSelected ? colors.primaryBorder : 'transparent',
                    }}
                  />
                </View>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: isSelected ? '700' : '600', marginTop: 6 }}>
                  {item.type}
                </Text>
                <Text style={{ color: colors.mutedText, fontSize: 11 }}>
                  {item.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.cardBody, { color: colors.text }]}>
          {selectedBristolBar
            ? `Type ${selectedBristolBar.type} shows up ${selectedBristolBar.count} time${selectedBristolBar.count === 1 ? '' : 's'} in this range (${selectedBristolBar.shareLabel}).`
            : `Most common Bristol type: ${insights.commonBristolLabel}.`}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Weekday Comfort Pattern</Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          Tap a day to compare average comfort and logging volume.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8, marginBottom: 10 }}>
          {insights.weekdayPattern.map((item) => {
            const isSelected = selectedWeekday === item.weekdayIndex;
            return (
              <TouchableOpacity
                key={item.weekdayIndex}
                style={{ flex: 1, alignItems: 'center' }}
                onPress={() => setSelectedWeekday((prev) => (prev === item.weekdayIndex ? null : item.weekdayIndex))}
                activeOpacity={0.85}
              >
                <View
                  style={{
                    width: '100%',
                    maxWidth: 34,
                    height: 120,
                    justifyContent: 'flex-end',
                  }}
                >
                  <View
                    style={{
                      height: Math.max(8, item.height),
                      borderRadius: 10,
                      backgroundColor: isSelected ? colors.primary : '#7ee787',
                      opacity: item.count > 0 ? 1 : 0.18,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: isSelected ? colors.primaryBorder : 'transparent',
                    }}
                  />
                </View>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: isSelected ? '700' : '600', marginTop: 6 }}>
                  {item.shortLabel}
                </Text>
                <Text style={{ color: colors.mutedText, fontSize: 11 }}>
                  {item.averageLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.cardBody, { color: colors.text }]}>
          {selectedWeekdayBar
            ? `${selectedWeekdayBar.label} averages ${selectedWeekdayBar.averageLabel} comfort across ${selectedWeekdayBar.count} log${selectedWeekdayBar.count === 1 ? '' : 's'}.`
            : `Best weekday: ${insights.bestWeekdayLabel}.`}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Time of Day Pattern</Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          Tap a time block to compare comfort and frequency throughout the day.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 8, marginBottom: 10 }}>
          {insights.timeOfDayPattern.map((item) => {
            const isSelected = selectedTimeBucket === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                style={{ flex: 1, alignItems: 'center' }}
                onPress={() => setSelectedTimeBucket((prev) => (prev === item.label ? null : item.label))}
                activeOpacity={0.85}
              >
                <View
                  style={{
                    width: '100%',
                    maxWidth: 46,
                    height: 120,
                    justifyContent: 'flex-end',
                  }}
                >
                  <View
                    style={{
                      height: Math.max(8, item.height),
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.primary : '#f2cc60',
                      opacity: item.count > 0 ? 1 : 0.18,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: isSelected ? colors.primaryBorder : 'transparent',
                    }}
                  />
                </View>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: isSelected ? '700' : '600', marginTop: 6 }}>
                  {item.shortLabel}
                </Text>
                <Text style={{ color: colors.mutedText, fontSize: 11 }}>
                  {item.averageLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.cardBody, { color: colors.text }]}>
          {selectedTimeBucketBar
            ? `${selectedTimeBucketBar.label} averages ${selectedTimeBucketBar.averageLabel} comfort across ${selectedTimeBucketBar.count} log${selectedTimeBucketBar.count === 1 ? '' : 's'}.`
            : `Most common time: ${insights.favoriteTimeBucket}.`}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Rhythm</Text>
        <Text style={[styles.cardBody, { color: colors.text }]}>
          {insights.weeklyPaceLabel} with a {insights.activeStreak}-day active streak.
        </Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          Best weekday: {insights.bestWeekdayLabel}. Most common time: {insights.favoriteTimeBucket}.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Pattern Snapshot</Text>
        <Text style={[styles.cardBody, { color: colors.text }]}>
          Most common Bristol type: {insights.commonBristolLabel}. Typical volume: {insights.commonVolumeLabel}.
        </Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          {insights.patternSummary}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggestions</Text>

      <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{insights.tipTitle}</Text>
        <Text style={[styles.cardBody, { color: colors.text }]}>
          {insights.tip}
        </Text>
      </View>

      {!!entryError ? <Text style={styles.error}>{entryError}</Text> : null}
      {!loadingEntries && entries.length === 0 ? (
        <Text style={[styles.muted, { color: colors.mutedText }]}>Add a few entries and this tab will start surfacing trends.</Text>
      ) : null}
      <View style={styles.scrollBottomSpacer} />
    </ScrollView>
  );
}

type BuiltInsights = {
  rangeLabel: string;
  rangeCount: number;
  avgRatingLabel: string;
  headline: string;
  comparisonLabel: string;
  comparisonSummary: string;
  ratingSignal: string;
  weeklyPaceLabel: string;
  activeStreak: number;
  bestWeekdayLabel: string;
  favoriteTimeBucket: string;
  commonBristolLabel: string;
  commonVolumeLabel: string;
  patternSummary: string;
  tipTitle: string;
  tip: string;
  consistencyBuckets: ConsistencyBucket[];
  consistencyRows: ConsistencyBucket[][];
  consistencyGap: number;
  consistencyLabel: string;
  consistencySummary: string;
  consistencyHint: string;
  bristolDistribution: BristolBar[];
  weekdayPattern: WeekdayBar[];
  timeOfDayPattern: TimeBucketBar[];
};

type InsightRange = '7d' | '30d' | '90d' | 'all';

type InsightFilters = {
  bristolType: number | null;
  weekdayIndex: number | null;
  timeBucket: string | null;
};

type BristolBar = {
  type: number;
  count: number;
  height: number;
  shareLabel: string;
};

type WeekdayBar = {
  weekdayIndex: number;
  shortLabel: string;
  label: string;
  average: number | null;
  averageLabel: string;
  count: number;
  height: number;
};

type TimeBucketBar = {
  label: string;
  shortLabel: string;
  average: number | null;
  averageLabel: string;
  count: number;
  height: number;
};

type ConsistencyBucket = {
  key: string;
  count: number;
  placeholder?: boolean;
};

const INSIGHT_RANGE_OPTIONS: Array<{ value: InsightRange; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
];

function buildInsights(entries: PoopEntry[], range: InsightRange, filters: InsightFilters): BuiltInsights {
  const now = new Date();
  const rangeStart = getRangeStart(now, range);
  const rangeEntries = applyInsightFilters(
    entries.filter((entry) => range === 'all' || new Date(entry.occurredAt) >= rangeStart),
    filters,
  );
  const rangeDays = range === 'all' ? Math.max(7, Math.ceil((now.getTime() - oldestEntryDate(entries).getTime()) / 86400000) + 1) : getRangeDays(range);
  const previousPeriodStart = range === 'all' ? null : shiftDays(now, -((rangeDays * 2) - 1));
  const previousPeriodEnd = range === 'all' ? null : shiftDays(now, -rangeDays);
  const previousPeriodEntries = previousPeriodStart == null || previousPeriodEnd == null
    ? []
    : applyInsightFilters(entries.filter((entry) => {
        const occurredAt = new Date(entry.occurredAt);
        return occurredAt >= previousPeriodStart && occurredAt < previousPeriodEnd;
      }), filters);

  const avgRating = average(rangeEntries.map((entry) => Number(entry.rating)));
  const avgPrevRating = average(previousPeriodEntries.map((entry) => Number(entry.rating)));
  const avgBristol = average(rangeEntries.map((entry) => Number(entry.bristolType)));
  const dailyLoggedKeys = Array.from(new Set(rangeEntries.map((entry) => localDateKey(new Date(entry.occurredAt)))));
  const weeklyPace = dailyLoggedKeys.length > 0 ? (rangeEntries.length / Math.max(1, rangeDays / 7)) : 0;
  const commonBristol = mostCommon(rangeEntries.map((entry) => entry.bristolType));
  const commonVolume = mostCommon(rangeEntries.map((entry) => entry.volume));
  const timeBucket = mostCommon(rangeEntries.map((entry) => getTimeBucket(new Date(entry.occurredAt))));
  const bestWeekday = bestWeekdayByRating(rangeEntries);
  const streak = calculateActiveStreak(rangeEntries);
  const ratingDelta = avgRating != null && avgPrevRating != null ? avgRating - avgPrevRating : null;
  const avgRatingLabel = avgRating != null ? `${avgRating.toFixed(1)}/5` : '—';
  const monthlyTip = getMonthlyTip(avgBristol, avgRating, rangeEntries.length);
  const dailyTip = getDailyTip(avgBristol, avgRating, rangeEntries.length);
  const consistencyView = buildConsistencyView(rangeEntries, range);
  const bristolDistribution = buildBristolDistribution(rangeEntries);
  const weekdayPattern = buildWeekdayPattern(rangeEntries);
  const timeOfDayPattern = buildTimeOfDayPattern(rangeEntries);

  return {
    rangeLabel: formatRangeLabel(range),
    rangeCount: rangeEntries.length,
    avgRatingLabel,
    headline:
      rangeEntries.length === 0
        ? 'Insights appear once you have enough recent logs to compare patterns.'
        : `${getRatingEmoji(Math.round(avgRating ?? 3))} ${describeRating(avgRating)} in this range, with ${dailyLoggedKeys.length} active logging days.`,
    comparisonLabel: range === 'all' ? 'Comfort Baseline' : `${formatRangeLabel(range)} vs Previous ${formatRangePeriodLabel(range)}`,
    comparisonSummary:
      range === 'all'
        ? avgRating == null
          ? 'Keep logging to build a reliable comfort baseline.'
          : `Across all logged history, average comfort sits at ${avgRating.toFixed(1)}/5.`
        : ratingDelta == null
          ? `Keep logging to compare this ${formatRangePeriodLabel(range).toLowerCase()} with the one before it.`
          : `Comfort is ${ratingDelta >= 0 ? 'up' : 'down'} ${Math.abs(ratingDelta).toFixed(1)} points versus the previous ${formatRangePeriodLabel(range).toLowerCase()}.`,
    ratingSignal:
      range === 'all'
        ? monthlyTip
        : ratingDelta == null
          ? monthlyTip
          : ratingDelta >= 0
            ? 'The recent trend is moving in a better direction.'
            : 'There has been a recent dip, which makes this a good time to look for triggers or routine changes.',
    weeklyPaceLabel: `${weeklyPace.toFixed(1)} logs per week`,
    activeStreak: streak,
    bestWeekdayLabel: bestWeekday ?? 'Not enough data yet',
    favoriteTimeBucket: timeBucket ?? 'Not enough data yet',
    commonBristolLabel: commonBristol ? `Type ${commonBristol}` : 'Not enough data yet',
    commonVolumeLabel: commonVolume != null ? getVolumeLabel(commonVolume) : 'Not enough data yet',
    patternSummary:
      rangeEntries.length === 0
        ? 'Once you build a little history, this card will start highlighting your most stable patterns.'
        : `${bestWeekday ? `${bestWeekday} tends to be your strongest day.` : 'A strongest weekday will appear with more data.'} ${timeBucket ? `${timeBucket} is your most frequent logging window.` : ''}`.trim(),
    tipTitle: range === '7d' ? 'Focus This Week' : range === '30d' ? 'Focus This Month' : range === '90d' ? 'Focus This Quarter' : 'Focus Right Now',
    tip: rangeEntries.length >= 5 ? monthlyTip : dailyTip,
    consistencyBuckets: consistencyView.buckets,
    consistencyRows: consistencyView.rows,
    consistencyGap: consistencyView.gap,
    consistencyLabel: consistencyView.label,
    consistencySummary: consistencyView.summary,
    consistencyHint: consistencyView.hint,
    bristolDistribution,
    weekdayPattern,
    timeOfDayPattern,
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateActiveStreak(entries: PoopEntry[]): number {
  const days = Array.from(new Set(entries.map((entry) => localDateKey(new Date(entry.occurredAt))))).sort().reverse();
  if (days.length === 0) return 0;

  let streak = 1;
  let current = parseDateKey(days[0]);
  for (let index = 1; index < days.length; index += 1) {
    const next = parseDateKey(days[index]);
    const previousDay = shiftDays(current, -1);
    if (localDateKey(previousDay) !== days[index]) break;
    streak += 1;
    current = next;
  }
  return streak;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function mostCommon<T extends string | number>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let winner: T | null = null;
  let topCount = -1;
  for (const [value, count] of counts.entries()) {
    if (count > topCount) {
      winner = value;
      topCount = count;
    }
  }
  return winner;
}

function getTimeBucket(date: Date): string {
  const hour = date.getHours();
  if (hour < 6) return 'Late night';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 22) return 'Evening';
  return 'Night';
}

function applyInsightFilters(entries: PoopEntry[], filters: InsightFilters): PoopEntry[] {
  return entries.filter((entry) => {
    if (filters.bristolType != null && entry.bristolType !== filters.bristolType) return false;
    if (filters.weekdayIndex != null && new Date(entry.occurredAt).getDay() !== filters.weekdayIndex) return false;
    if (filters.timeBucket != null && getTimeBucket(new Date(entry.occurredAt)) !== filters.timeBucket) return false;
    return true;
  });
}

function bestWeekdayByRating(entries: PoopEntry[]): string | null {
  if (entries.length === 0) return null;
  const buckets = new Map<number, { total: number; count: number }>();
  for (const entry of entries) {
    const day = new Date(entry.occurredAt).getDay();
    const current = buckets.get(day) ?? { total: 0, count: 0 };
    current.total += Number(entry.rating);
    current.count += 1;
    buckets.set(day, current);
  }
  let bestDay: number | null = null;
  let bestAverage = -1;
  for (const [day, bucket] of buckets.entries()) {
    const avg = bucket.total / bucket.count;
    if (avg > bestAverage) {
      bestAverage = avg;
      bestDay = day;
    }
  }
  return bestDay == null ? null : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][bestDay];
}

function describeRating(value: number | null): string {
  if (value == null) return 'Still building a baseline';
  if (value < 2.5) return 'comfort has been rough';
  if (value < 3.5) return 'comfort has been mixed';
  if (value < 4.5) return 'comfort has been fairly steady';
  return 'comfort has been strong';
}

function getRangeStart(now: Date, range: InsightRange): Date {
  if (range === 'all') return new Date(0);
  return shiftDays(now, -(getRangeDays(range) - 1));
}

function getRangeDays(range: Exclude<InsightRange, 'all'>): number {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  return 90;
}

function formatRangeLabel(range: InsightRange): string {
  if (range === '7d') return 'Last 7 Days';
  if (range === '30d') return 'Last 30 Days';
  if (range === '90d') return 'Last 90 Days';
  return 'All Time';
}

function formatRangePeriodLabel(range: Exclude<InsightRange, 'all'>): string {
  if (range === '7d') return '7 Days';
  if (range === '30d') return '30 Days';
  return '90 Days';
}

function buildBristolDistribution(entries: PoopEntry[]): BristolBar[] {
  const counts = new Map<number, number>();
  for (let type = 1; type <= 7; type += 1) counts.set(type, 0);
  for (const entry of entries) {
    counts.set(entry.bristolType, (counts.get(entry.bristolType) ?? 0) + 1);
  }
  const maxCount = Math.max(0, ...counts.values());
  const total = entries.length;
  return Array.from({ length: 7 }, (_, index) => {
    const type = index + 1;
    const count = counts.get(type) ?? 0;
    return {
      type,
      count,
      height: maxCount > 0 ? (count / maxCount) * 108 : 0,
      shareLabel: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
    };
  });
}

function buildWeekdayPattern(entries: PoopEntry[]): WeekdayBar[] {
  const buckets = new Map<number, { total: number; count: number }>();
  for (let day = 0; day < 7; day += 1) buckets.set(day, { total: 0, count: 0 });
  for (const entry of entries) {
    const day = new Date(entry.occurredAt).getDay();
    const current = buckets.get(day) ?? { total: 0, count: 0 };
    current.total += Number(entry.rating);
    current.count += 1;
    buckets.set(day, current);
  }
  const labels = [
    { short: 'Sun', full: 'Sunday' },
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' },
  ];
  return labels.map((label, weekdayIndex) => {
    const bucket = buckets.get(weekdayIndex) ?? { total: 0, count: 0 };
    const averageValue = bucket.count > 0 ? bucket.total / bucket.count : null;
    return {
      weekdayIndex,
      shortLabel: label.short,
      label: label.full,
      average: averageValue,
      averageLabel: averageValue != null ? averageValue.toFixed(1) : '—',
      count: bucket.count,
      height: averageValue != null ? (averageValue / 5) * 108 : 0,
    };
  });
}

function buildTimeOfDayPattern(entries: PoopEntry[]): TimeBucketBar[] {
  const buckets = [
    { label: 'Morning', shortLabel: 'AM', match: (hour: number) => hour >= 6 && hour < 12 },
    { label: 'Afternoon', shortLabel: 'PM', match: (hour: number) => hour >= 12 && hour < 17 },
    { label: 'Evening', shortLabel: 'Eve', match: (hour: number) => hour >= 17 && hour < 22 },
    { label: 'Night', shortLabel: 'Night', match: (hour: number) => hour < 6 || hour >= 22 },
  ] as const;

  const stats = buckets.map((bucket) => ({ ...bucket, total: 0, count: 0 }));
  for (const entry of entries) {
    const hour = new Date(entry.occurredAt).getHours();
    const bucket = stats.find((candidate) => candidate.match(hour));
    if (!bucket) continue;
    bucket.total += Number(entry.rating);
    bucket.count += 1;
  }

  return stats.map((bucket) => {
    const averageValue = bucket.count > 0 ? bucket.total / bucket.count : null;
    return {
      label: bucket.label,
      shortLabel: bucket.shortLabel,
      average: averageValue,
      averageLabel: averageValue != null ? averageValue.toFixed(1) : '—',
      count: bucket.count,
      height: averageValue != null ? (averageValue / 5) * 108 : 0,
    };
  });
}

function buildConsistencyView(entries: PoopEntry[], range: InsightRange): {
  buckets: ConsistencyBucket[];
  rows: ConsistencyBucket[][];
  gap: number;
  label: string;
  summary: string;
  hint: string;
} {
  if (range === 'all') {
    const buckets = buildDailyConsistencyBuckets(entries, Math.max(1, Math.ceil((new Date().getTime() - oldestEntryDate(entries).getTime()) / 86400000) + 1));
    const activeBuckets = buckets.filter((bucket) => bucket.count > 0).length;
    const rows = buildFixedColumnConsistencyRows(buckets, getAdaptiveTargetColumns(buckets.length));
    return {
      buckets,
      rows,
      gap: getAdaptiveConsistencyGap(rows),
      label: 'A day-by-day look at how consistently you logged across your full history.',
      summary:
        buckets.length === 0
          ? 'Keep logging to start building a consistency pattern.'
          : `You logged on ${activeBuckets} of ${buckets.length} days across your history.`,
      hint:
        activeBuckets === 0
          ? 'Once you have a few logs, this strip will show how your habit has developed over time.'
          : activeBuckets >= Math.ceil(buckets.length * 0.66)
            ? 'Your long-term logging habit looks pretty steady.'
            : 'There are some gaps in the long-term pattern, which is normal early on.',
    };
  }

  const lookbackDays = getRangeDays(range);
  const buckets = buildDailyConsistencyBuckets(entries, lookbackDays);
  const activeBuckets = buckets.filter((bucket) => bucket.count > 0).length;
  const rows = splitConsistencyBuckets(buckets, getConsistencyRowSizes(range));
  return {
    buckets,
    rows,
    gap: lookbackDays <= 7 ? 6 : lookbackDays <= 30 ? 6 : 4,
    label: `A quick look at how steady your logging has been over the last ${lookbackDays} days.`,
    summary:
      buckets.length === 0
        ? 'Keep logging to start building a consistency pattern.'
        : `You logged on ${activeBuckets} of the last ${buckets.length} days.`,
    hint:
      activeBuckets === 0
        ? 'Once you have a few recent logs, this strip will show your rhythm at a glance.'
        : activeBuckets >= Math.ceil(buckets.length * 0.66)
          ? 'Your recent logging has been pretty steady.'
          : 'A few more check-ins would make your patterns easier to trust.',
  };
}

function getConsistencyRowSizes(range: Exclude<InsightRange, 'all'>): number[] {
  if (range === '7d') return [7];
  if (range === '30d') return [10, 10, 10];
  return [15, 15, 15, 15, 15, 15];
}

function splitConsistencyBuckets(buckets: ConsistencyBucket[], rowSizes: number[]): ConsistencyBucket[][] {
  const rows: ConsistencyBucket[][] = [];
  let cursor = 0;
  for (const size of rowSizes) {
    rows.push(buckets.slice(cursor, cursor + size));
    cursor += size;
  }
  return rows.filter((row) => row.length > 0);
}

function buildUniformRowSizes(total: number, rowCount: number): number[] {
  if (total <= 0 || rowCount <= 0) return [];
  const baseSize = Math.floor(total / rowCount);
  const remainder = total % rowCount;
  return Array.from({ length: rowCount }, (_, index) => (
    baseSize + (index < remainder ? 1 : 0)
  )).filter((size) => size > 0);
}

function buildAdaptiveRowSizes(total: number): number[] {
  if (total <= 0) return [];
  return buildUniformRowSizes(total, Math.ceil(total / getAdaptiveTargetColumns(total)));
}

function getAdaptiveTargetColumns(total: number): number {
  if (total <= 30) return 12;
  if (total <= 90) return 18;
  if (total <= 180) return 22;
  if (total <= 365) return 28;
  return 36;
}

function buildFixedColumnConsistencyRows(buckets: ConsistencyBucket[], columns: number): ConsistencyBucket[][] {
  if (buckets.length === 0 || columns <= 0) return [];
  const rowCount = Math.ceil(buckets.length / columns);
  const totalSlots = rowCount * columns;
  const placeholderCount = totalSlots - buckets.length;
  const paddedBuckets = [
    ...buildPlaceholderConsistencyBuckets(placeholderCount),
    ...buckets,
  ];
  return splitConsistencyBuckets(paddedBuckets, Array.from({ length: rowCount }, () => columns));
}

function buildPlaceholderConsistencyBuckets(count: number): ConsistencyBucket[] {
  return Array.from({ length: count }, (_, index) => ({
    key: `placeholder-${index}`,
    count: 0,
    placeholder: true,
  }));
}

function getAdaptiveConsistencyGap(rows: ConsistencyBucket[][]): number {
  const densestRow = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (densestRow >= 40) return 0;
  if (densestRow >= 32) return 1;
  if (densestRow >= 24) return 2;
  if (densestRow >= 16) return 3;
  if (densestRow >= 10) return 4;
  return 5;
}

function buildDailyConsistencyBuckets(entries: PoopEntry[], lookbackDays: number): ConsistencyBucket[] {
  if (lookbackDays <= 0) return [];
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const dateKey = localDateKey(new Date(entry.occurredAt));
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  const days: ConsistencyBucket[] = [];
  const today = shiftDays(new Date(), 0);
  for (let offset = lookbackDays - 1; offset >= 0; offset -= 1) {
    const date = shiftDays(today, -offset);
    const dateKey = localDateKey(date);
    days.push({
      key: dateKey,
      count: counts.get(dateKey) ?? 0,
    });
  }
  return days;
}

function oldestEntryDate(entries: PoopEntry[]): Date {
  if (entries.length === 0) return new Date();
  return entries.reduce((oldest, entry) => {
    const occurredAt = new Date(entry.occurredAt);
    return occurredAt < oldest ? occurredAt : oldest;
  }, new Date(entries[0].occurredAt));
}
