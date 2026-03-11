import { useMemo, useState } from 'react';
import { Dimensions, Platform, ScrollView, StatusBar, Text, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import type { PoopEntry } from '../types/domain';
import { styles } from './styles';
import { MonthOverviewSection } from './home/components/MonthOverviewSection';
import { RecentEntriesSection } from './home/components/RecentEntriesSection';
import { EntryActionsMenuModal } from './home/components/EntryActionsMenuModal';
import {
  getDateLabelFromKey,
  getDaySummary,
  getDailyTip,
  getMonthSummary,
  getMonthlyTip,
} from './home/utils';

type Props = {
  entries: PoopEntry[];
  loadingEntries: boolean;
  entryError: string;
  deletingEntryIds: string[];
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entry: PoopEntry) => void;
};

export function OverviewScreen(props: Props) {
  const { entries, loadingEntries, entryError, deletingEntryIds, onDeleteEntry, onEditEntry } = props;
  const topInset = Platform.OS === 'ios' ? 54 : Math.max(16, (StatusBar.currentHeight ?? 0) + 8);
  const [visibleMonthStart, setVisibleMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [entryMenuId, setEntryMenuId] = useState<string | null>(null);
  const [entryMenuAnchor, setEntryMenuAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuWidth = 140;
  const screenWidth = Dimensions.get('window').width;
  const menuLeft = Math.max(12, Math.min(entryMenuAnchor.x - menuWidth + 20, screenWidth - menuWidth - 12));

  const now = useMemo(() => new Date(), []);
  const monthLabel = visibleMonthStart.toLocaleString([], { month: 'long', year: 'numeric' });
  const monthSummary = useMemo(() => getMonthSummary(entries, visibleMonthStart, now), [entries, visibleMonthStart, now]);
  const selectedDaySummary = useMemo(
    () => (selectedDateKey ? getDaySummary(entries, selectedDateKey) : null),
    [entries, selectedDateKey],
  );
  const selectedRecapTitle = useMemo(
    () => (selectedDateKey ? getDateLabelFromKey(selectedDateKey) : 'Your Month'),
    [selectedDateKey],
  );

  const monthlyTip = useMemo(
    () => getMonthlyTip(monthSummary.averageMonthBristol, monthSummary.averageMonthRating, monthSummary.monthEntries.length),
    [monthSummary.averageMonthBristol, monthSummary.averageMonthRating, monthSummary.monthEntries.length],
  );
  const recapTip = useMemo(
    () => (selectedDaySummary
      ? getDailyTip(selectedDaySummary.averageDayBristol, selectedDaySummary.averageDayRating, selectedDaySummary.dayEntries.length)
      : monthlyTip),
    [monthlyTip, selectedDaySummary],
  );

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: topInset }]}>
      <View style={styles.homeDetailsPage}>
        <MonthOverviewSection
          recapTitle={selectedRecapTitle}
          entryCount={selectedDaySummary ? selectedDaySummary.dayEntries.length : monthSummary.monthEntries.length}
          averageRating={selectedDaySummary ? selectedDaySummary.averageDayRating : monthSummary.averageMonthRating}
          thirdStatLabel={selectedDaySummary ? 'Last Log' : 'Days Logged'}
          thirdStatValue={selectedDaySummary ? (selectedDaySummary.latestEntryTimeLabel ?? '-') : monthSummary.uniqueLoggedDays}
          averageBristol={selectedDaySummary ? selectedDaySummary.averageDayBristol : monthSummary.averageMonthBristol}
          tipText={recapTip}
          monthLabel={monthLabel}
          calendarCells={monthSummary.calendarCells}
          selectedDateKey={selectedDateKey}
          selectedDateEntries={selectedDaySummary?.dayEntries ?? []}
          onPrevMonth={() => setVisibleMonthStart((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setVisibleMonthStart((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          onSelectDate={(dateKey) => setSelectedDateKey((prev) => (prev === dateKey ? null : dateKey))}
        />
      </View>

      <View style={styles.homeDetailsPage}>
        <RecentEntriesSection
          entries={entries}
          loadingEntries={loadingEntries}
          entryError={entryError}
          deletingEntryIds={deletingEntryIds}
          onOpenEntryMenu={(event: GestureResponderEvent, entryId: string) => {
            setEntryMenuAnchor({
              x: event.nativeEvent.pageX,
              y: event.nativeEvent.pageY,
            });
            setEntryMenuId((prev) => (prev === entryId ? null : entryId));
          }}
        />
      </View>

      {entries.length === 0 ? <Text style={styles.muted}>No entries yet.</Text> : null}

      <EntryActionsMenuModal
        visible={Boolean(entryMenuId)}
        menuLeft={menuLeft}
        menuTop={entryMenuAnchor.y + 8}
        menuWidth={menuWidth}
        entries={entries}
        entryMenuId={entryMenuId}
        deletingEntryIds={deletingEntryIds}
        onClose={() => setEntryMenuId(null)}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
      />
    </ScrollView>
  );
}
