import { useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StatusBar, Text, View } from 'react-native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { PoopEntry } from '../types/domain';
import { styles } from './styles';
import { getThemePalette, type ThemeMode } from '../theme';
import { MonthOverviewSection } from './home/components/MonthOverviewSection';
import { RecentEntriesSection } from './home/components/RecentEntriesSection';
import { EntryActionsMenuModal } from './home/components/EntryActionsMenuModal';
import { EntryComposerModal } from './home/components/EntryComposerModal';
import {
  formatDateInput,
  formatTimeInput,
  getDateLabelFromKey,
  getDaySummary,
  getDailyTip,
  getMonthSummary,
  getMonthlyTip,
} from './home/utils';

type Props = {
  themeMode: ThemeMode;
  entries: PoopEntry[];
  loadingEntries: boolean;
  entryError: string;
  deletingEntryIds: string[];
  addEntryLoading: boolean;
  isEditingEntry: boolean;
  showEntryComposer: boolean;
  bristolType: string;
  rating: string;
  note: string;
  entryDate: string;
  entryTime: string;
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entry: PoopEntry) => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onEntryDateChange: (value: string) => void;
  onEntryTimeChange: (value: string) => void;
  onAddEntry: () => void;
  onCloseComposer: () => void;
};

export function OverviewScreen(props: Props) {
  const {
    themeMode,
    entries,
    loadingEntries,
    entryError,
    deletingEntryIds,
    addEntryLoading,
    isEditingEntry,
    showEntryComposer,
    bristolType,
    rating,
    note,
    entryDate,
    entryTime,
    onDeleteEntry,
    onEditEntry,
    onBristolTypeChange,
    onRatingChange,
    onNoteChange,
    onEntryDateChange,
    onEntryTimeChange,
    onAddEntry,
    onCloseComposer,
  } = props;
  const colors = getThemePalette(themeMode);
  const topInset = Platform.OS === 'ios' ? 54 : Math.max(16, (StatusBar.currentHeight ?? 0) + 8);
  const [visibleMonthStart, setVisibleMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [entryMenuId, setEntryMenuId] = useState<string | null>(null);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [pickerStep, setPickerStep] = useState<'none' | 'date' | 'time'>('none');
  const [draftDateTime, setDraftDateTime] = useState<Date | null>(null);
  const entryComposerScrollRef = useRef<ScrollView | null>(null);

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

  function getEntryDateTimeValue(): Date {
    const parsed = new Date(`${entryDate.trim()}T${entryTime.trim()}:00`);
    if (Number.isNaN(parsed.getTime())) return new Date();
    return parsed;
  }

  function onPickerChange(mode: 'date' | 'time') {
    return (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === 'dismissed') return;
      const base = draftDateTime ?? getEntryDateTimeValue();
      if (!selectedDate) return;
      if (mode === 'date') {
        const next = new Date(base);
        next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setDraftDateTime(next);
      } else {
        const next = new Date(base);
        next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setDraftDateTime(next);
      }
    };
  }

  function onSaveDateTime(): void {
    const selected = draftDateTime ?? getEntryDateTimeValue();
    onEntryDateChange(formatDateInput(selected));
    onEntryTimeChange(formatTimeInput(selected));
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.screen, { paddingTop: topInset, backgroundColor: colors.background }]}
      >
        <View style={styles.homeDetailsPage}>
          <MonthOverviewSection
            themeMode={themeMode}
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
            themeMode={themeMode}
            entries={entries}
            loadingEntries={loadingEntries}
            entryError={entryError}
            deletingEntryIds={deletingEntryIds}
            selectedEntryId={entryMenuId}
            onOpenEntryMenu={(entryId: string) => setEntryMenuId((prev) => (prev === entryId ? null : entryId))}
          />
        </View>

        {entries.length === 0 ? <Text style={[styles.muted, { color: colors.mutedText }]}>No entries yet.</Text> : null}
        <View style={styles.scrollBottomSpacer} />
      </ScrollView>

      <EntryActionsMenuModal
        themeMode={themeMode}
        visible={Boolean(entryMenuId)}
        entries={entries}
        entryMenuId={entryMenuId}
        deletingEntryIds={deletingEntryIds}
        onClose={() => setEntryMenuId(null)}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
      />

      <EntryComposerModal
        themeMode={themeMode}
        visible={showEntryComposer}
        addEntryLoading={addEntryLoading}
        isEditingEntry={isEditingEntry}
        bristolType={bristolType}
        rating={rating}
        note={note}
        showDateEditor={showDateEditor}
        pickerStep={pickerStep}
        draftDateTime={draftDateTime}
        getEntryDateTimeValue={getEntryDateTimeValue}
        onToggleDateEditor={() => {
          setShowDateEditor((prev) => {
            const next = !prev;
            if (next) {
              setDraftDateTime(getEntryDateTimeValue());
              setPickerStep('date');
            } else {
              setPickerStep('none');
              setDraftDateTime(null);
            }
            return next;
          });
        }}
        onPickerChange={onPickerChange}
        onGoToTimeStep={() => setPickerStep('time')}
        onSaveDateTime={onSaveDateTime}
        onBristolTypeChange={onBristolTypeChange}
        onRatingChange={onRatingChange}
        onNoteChange={onNoteChange}
        onNoteFocus={() => {}}
        onDateStepActionsLayout={() => {}}
        onEntryActionsRowLayout={() => {}}
        onAddEntry={onAddEntry}
        onClose={onCloseComposer}
        scrollRef={entryComposerScrollRef}
        closeOnOutsideTap
        bottomOffset={110}
      />
    </View>
  );
}
