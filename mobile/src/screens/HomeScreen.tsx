import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, LayoutChangeEvent, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { PoopEntry } from '../types/domain';
import { styles } from './styles';
import { MonthOverviewSection } from './home/components/MonthOverviewSection';
import { RecentEntriesSection } from './home/components/RecentEntriesSection';
import { EntryComposerModal } from './home/components/EntryComposerModal';
import { EntryActionsMenuModal } from './home/components/EntryActionsMenuModal';
import { formatDateInput, formatTimeInput, getMonthSummary, getMonthlyTip } from './home/utils';

type Props = {
  entries: PoopEntry[];
  loadingEntries: boolean;
  addEntryLoading: boolean;
  deletingEntryIds: string[];
  isEditingEntry: boolean;
  entryError: string;
  showEntryComposer: boolean;
  bristolType: string;
  rating: string;
  note: string;
  entryDate: string;
  entryTime: string;
  onRefreshEntries: () => void;
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entry: PoopEntry) => void;
  onToggleComposer: () => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onEntryDateChange: (value: string) => void;
  onEntryTimeChange: (value: string) => void;
  onAddEntry: () => void;
  onCloseComposer: () => void;
};

export function HomeScreen(props: Props) {
  const {
    entries,
    loadingEntries,
    addEntryLoading,
    deletingEntryIds,
    isEditingEntry,
    entryError,
    showEntryComposer,
    bristolType,
    rating,
    note,
    entryDate,
    entryTime,
    onRefreshEntries,
    onDeleteEntry,
    onEditEntry,
    onToggleComposer,
    onBristolTypeChange,
    onRatingChange,
    onNoteChange,
    onEntryDateChange,
    onEntryTimeChange,
    onAddEntry,
    onCloseComposer,
  } = props;

  const [visibleMonthStart, setVisibleMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const now = useMemo(() => new Date(), []);
  const monthLabel = visibleMonthStart.toLocaleString([], { month: 'long', year: 'numeric' });
  const monthSummary = useMemo(() => getMonthSummary(entries, visibleMonthStart, now), [entries, visibleMonthStart, now]);
  const monthlyTip = useMemo(
    () => getMonthlyTip(monthSummary.averageMonthBristol, monthSummary.averageMonthRating, monthSummary.monthEntries.length),
    [monthSummary.averageMonthBristol, monthSummary.averageMonthRating, monthSummary.monthEntries.length],
  );

  const [entryMenuId, setEntryMenuId] = useState<string | null>(null);
  const [entryMenuAnchor, setEntryMenuAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [pickerStep, setPickerStep] = useState<'none' | 'date' | 'time'>('none');
  const [draftDateTime, setDraftDateTime] = useState<Date | null>(null);
  const [dateStepActionsRowY, setDateStepActionsRowY] = useState(0);
  const [entryActionsRowY, setEntryActionsRowY] = useState(0);
  const entryComposerScrollRef = useRef<ScrollView | null>(null);

  const menuWidth = 140;
  const screenWidth = Dimensions.get('window').width;
  const menuLeft = Math.max(12, Math.min(entryMenuAnchor.x - menuWidth + 20, screenWidth - menuWidth - 12));

  function scrollComposerToBottom(): void {
    const scrollRef = entryComposerScrollRef.current;
    if (!scrollRef) return;
    scrollRef.scrollToEnd({ animated: true });
    scrollRef.scrollTo({ x: 0, y: 100000, animated: true });
  }

  function scrollToDateStepActions(): void {
    const scrollRef = entryComposerScrollRef.current;
    if (!scrollRef) return;
    if (dateStepActionsRowY <= 0) {
      scrollComposerToBottom();
      return;
    }
    const targetY = Math.max(0, dateStepActionsRowY - 120);
    scrollRef.scrollTo({ x: 0, y: targetY, animated: true });
  }

  function handleEntryActionsRowLayout(event: LayoutChangeEvent): void {
    setEntryActionsRowY(event.nativeEvent.layout.y);
  }

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

  useEffect(() => {
    if (!showDateEditor || pickerStep === 'none') return;
    const timerA = setTimeout(scrollToDateStepActions, 70);
    const timerB = setTimeout(scrollToDateStepActions, 220);
    return () => {
      clearTimeout(timerA);
      clearTimeout(timerB);
    };
  }, [showDateEditor, pickerStep, dateStepActionsRowY]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.screen} onScrollBeginDrag={() => setEntryMenuId(null)}>
        <MonthOverviewSection
          monthEntriesCount={monthSummary.monthEntries.length}
          averageMonthRating={monthSummary.averageMonthRating}
          uniqueLoggedDays={monthSummary.uniqueLoggedDays}
          averageMonthBristol={monthSummary.averageMonthBristol}
          monthlyTip={monthlyTip}
          monthLabel={monthLabel}
          calendarCells={monthSummary.calendarCells}
          onPrevMonth={() => setVisibleMonthStart((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setVisibleMonthStart((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        />

        <RecentEntriesSection
          entries={entries}
          loadingEntries={loadingEntries}
          entryError={entryError}
          deletingEntryIds={deletingEntryIds}
          onRefreshEntries={onRefreshEntries}
          onOpenEntryMenu={(event, entryId) => {
            setEntryMenuAnchor({
              x: event.nativeEvent.pageX,
              y: event.nativeEvent.pageY,
            });
            setEntryMenuId((prev) => (prev === entryId ? null : entryId));
          }}
        />
      </ScrollView>

      <TouchableOpacity style={[styles.fab, addEntryLoading && styles.buttonDisabled]} onPress={onToggleComposer} disabled={addEntryLoading}>
        {addEntryLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={showEntryComposer ? 'close' : 'add'} size={28} color="#ffffff" />}
      </TouchableOpacity>

      <EntryComposerModal
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
        onToggleDateEditor={() =>
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
          })
        }
        onPickerChange={onPickerChange}
        onGoToTimeStep={() => setPickerStep('time')}
        onSaveDateTime={() => {
          const next = draftDateTime ?? getEntryDateTimeValue();
          onEntryDateChange(formatDateInput(next));
          onEntryTimeChange(formatTimeInput(next));
          setShowDateEditor(false);
          setPickerStep('none');
          setDraftDateTime(null);
        }}
        onBristolTypeChange={onBristolTypeChange}
        onRatingChange={onRatingChange}
        onNoteChange={onNoteChange}
        onNoteFocus={() => {
          const targetY = Math.max(0, entryActionsRowY - 120);
          setTimeout(() => {
            entryComposerScrollRef.current?.scrollTo({ x: 0, y: targetY, animated: true });
          }, 120);
          setTimeout(() => {
            entryComposerScrollRef.current?.scrollTo({ x: 0, y: targetY, animated: true });
          }, 260);
        }}
        onDateStepActionsLayout={(event) => setDateStepActionsRowY(event.nativeEvent.layout.y)}
        onEntryActionsRowLayout={handleEntryActionsRowLayout}
        onAddEntry={onAddEntry}
        onClose={onCloseComposer}
        scrollRef={entryComposerScrollRef}
      />

      <EntryActionsMenuModal
        visible={Boolean(entryMenuId)}
        menuTop={entryMenuAnchor.y + 6}
        menuLeft={menuLeft}
        menuWidth={menuWidth}
        entries={entries}
        entryMenuId={entryMenuId}
        deletingEntryIds={deletingEntryIds}
        onClose={() => setEntryMenuId(null)}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
      />
    </>
  );
}
