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
  volume: string;
  note: string;
  entryDate: string;
  entryTime: string;
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entry: PoopEntry) => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onVolumeChange: (value: string) => void;
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
    volume,
    note,
    entryDate,
    entryTime,
    onDeleteEntry,
    onEditEntry,
    onBristolTypeChange,
    onRatingChange,
    onVolumeChange,
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
  const [pickerMaxDate, setPickerMaxDate] = useState<Date>(new Date());
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
    return parseLocalDateTimeInputs(entryDate, entryTime) ?? new Date();
  }

  function onPickerChange(mode: 'date' | 'time') {
    return (event: DateTimePickerEvent, selectedDate?: Date) => {
      console.log(
        '[picker:overview:event]',
        JSON.stringify({
          mode,
          type: event.type,
          selectedDate: selectedDate ? selectedDate.toISOString() : null,
          selectedEpoch: selectedDate ? selectedDate.getTime() : null,
          entryDate,
          entryTime,
          draftDateTime: draftDateTime ? draftDateTime.toISOString() : null,
        }),
      );
      if (event.type === 'dismissed') return;
      const base = draftDateTime ?? getEntryDateTimeValue();
      const now = new Date();
      const todayDateKey = formatDateInput(now);
      if (mode === 'date') {
        const picked = resolvePickerDate(selectedDate);
        if (!picked) {
          console.log('[picker:overview:ignored]', JSON.stringify({ mode, reason: 'invalid-selectedDate' }));
          return;
        }
        const next = new Date(base.getTime());
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        next.setHours(base.getHours(), base.getMinutes(), 0, 0);
        if (formatDateInput(next) > todayDateKey) {
          // Keep previous value when future date is attempted.
          console.log('[picker:overview:rejected]', JSON.stringify({ mode, reason: 'future-date', next: next.toISOString() }));
          return;
        }
        console.log('[picker:overview:accepted]', JSON.stringify({ mode, next: next.toISOString() }));
        setDraftDateTime(next);
      } else {
        const timeParts = resolvePickerTime(selectedDate);
        if (!timeParts) {
          console.log('[picker:overview:ignored]', JSON.stringify({ mode, reason: 'invalid-time-selectedDate' }));
          return;
        }
        const next = new Date(base.getTime());
        next.setHours(timeParts.hours, timeParts.minutes, 0, 0);
        if (formatDateInput(next) === todayDateKey && next.getTime() > now.getTime()) {
          // Keep previous value when future time is attempted for today.
          console.log('[picker:overview:rejected]', JSON.stringify({ mode, reason: 'future-time', next: next.toISOString() }));
          return;
        }
        console.log('[picker:overview:accepted]', JSON.stringify({ mode, next: next.toISOString() }));
        setDraftDateTime(next);
      }
    };
  }

  function onSaveDateTime(): void {
    const selected = draftDateTime ?? getEntryDateTimeValue();
    const now = new Date();
    const clamped = selected.getTime() > now.getTime() ? now : selected;
    onEntryDateChange(formatDateInput(clamped));
    onEntryTimeChange(formatTimeInput(clamped));
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
        volume={volume}
        note={note}
        showDateEditor={showDateEditor}
        pickerStep={pickerStep}
        pickerMaxDate={pickerMaxDate}
        draftDateTime={draftDateTime}
        onSetDraftDateTime={setDraftDateTime}
        getEntryDateTimeValue={getEntryDateTimeValue}
        onToggleDateEditor={() => {
          setShowDateEditor((prev) => {
            const next = !prev;
            if (next) {
              setDraftDateTime(getEntryDateTimeValue());
              setPickerStep('date');
              setPickerMaxDate(new Date());
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
        onVolumeChange={onVolumeChange}
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

function resolvePickerDate(selectedDate?: Date): Date | null {
  const selected = selectedDate ?? null;
  if (selected && !Number.isNaN(selected.getTime()) && selected.getTime() > 0 && selected.getFullYear() >= 2000) {
    return selected;
  }
  return null;
}

function resolvePickerTime(
  selectedDate?: Date,
): { hours: number; minutes: number } | null {
  const selected = selectedDate ?? null;
  if (!selected || Number.isNaN(selected.getTime())) return null;
  if (selected.getTime() === 0) return null;
  // Ignore epoch-anchored synthetic values from iOS mount transitions.
  if (selected.getFullYear() < 2000) return null;
  return {
    hours: selected.getHours(),
    minutes: selected.getMinutes(),
  };
}

function parseLocalDateTimeInputs(dateInput: string, timeInput: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeInput.trim());
  if (!dateMatch || !timeMatch) return null;
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]) - 1;
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const parsed = new Date(year, month, day, hour, minute, 0, 0);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
