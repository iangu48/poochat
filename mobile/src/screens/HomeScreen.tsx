import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, LayoutChangeEvent, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { PoopEntry } from '../types/domain';
import { styles } from './styles';
import { MonthOverviewSection } from './home/components/MonthOverviewSection';
import { RecentEntriesSection } from './home/components/RecentEntriesSection';
import { HomeMapSection } from './home/components/HomeMapSection';
import { EntryComposerModal } from './home/components/EntryComposerModal';
import { EntryActionsMenuModal } from './home/components/EntryActionsMenuModal';
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
  entries: PoopEntry[];
  loadingEntries: boolean;
  addEntryLoading: boolean;
  updatingEntryLocationIds: string[];
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
  onUpdateEntryLocation: (entryId: string, latitude: number, longitude: number) => void;
  onEditEntry: (entry: PoopEntry) => void;
  onToggleComposer: () => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onEntryDateChange: (value: string) => void;
  onEntryTimeChange: (value: string) => void;
  onAddEntry: () => void;
  onComposerLocationChange: (latitude: number, longitude: number, source?: 'gps' | 'manual') => void;
  onCloseComposer: () => void;
};

export function HomeScreen(props: Props) {
  const {
    entries,
    loadingEntries,
    addEntryLoading,
    updatingEntryLocationIds,
    deletingEntryIds,
    isEditingEntry,
    entryError,
    showEntryComposer,
    bristolType,
    rating,
    note,
    entryDate,
    entryTime,
    onDeleteEntry,
    onUpdateEntryLocation,
    onEditEntry,
    onToggleComposer,
    onBristolTypeChange,
    onRatingChange,
    onNoteChange,
    onEntryDateChange,
    onEntryTimeChange,
    onAddEntry,
    onComposerLocationChange,
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
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const selectedDaySummary = useMemo(
    () => (selectedDateKey ? getDaySummary(entries, selectedDateKey) : null),
    [entries, selectedDateKey],
  );
  const selectedRecapTitle = useMemo(
    () => (selectedDateKey ? getDateLabelFromKey(selectedDateKey) : 'Your Month'),
    [selectedDateKey],
  );
  const recapTip = useMemo(
    () => (selectedDaySummary
      ? getDailyTip(selectedDaySummary.averageDayBristol, selectedDaySummary.averageDayRating, selectedDaySummary.dayEntries.length)
      : monthlyTip),
    [monthlyTip, selectedDaySummary],
  );

  const [entryMenuId, setEntryMenuId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [entryMenuAnchor, setEntryMenuAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [pickerStep, setPickerStep] = useState<'none' | 'date' | 'time'>('none');
  const [draftDateTime, setDraftDateTime] = useState<Date | null>(null);
  const [dateStepActionsRowY, setDateStepActionsRowY] = useState(0);
  const [entryActionsRowY, setEntryActionsRowY] = useState(0);
  const entryComposerScrollRef = useRef<ScrollView | null>(null);
  const homeDetailsPagerRef = useRef<PagerView | null>(null);
  const [homeDetailsPage, setHomeDetailsPage] = useState(0);

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
      <View style={styles.homeMapScreen}>
        {loadingEntries ? (
          <View style={styles.homeMapLoadingOverlay}>
            <ActivityIndicator size="small" color="#f0f6fc" />
          </View>
        ) : null}
        <HomeMapSection
          entries={entries}
          addEntryLoading={addEntryLoading}
          updatingEntryLocationIds={updatingEntryLocationIds}
          fullScreen
          showComposer={showEntryComposer}
          onOpenComposer={onToggleComposer}
          onCloseComposer={onCloseComposer}
          onOpenDetails={() => setShowDetails(true)}
          onUpdateEntryLocation={onUpdateEntryLocation}
          onComposerLocationChange={onComposerLocationChange}
        />
        {!!entryError ? <Text style={styles.error}>{entryError}</Text> : null}
      </View>

      <Modal visible={showDetails} transparent animationType="fade" onRequestClose={() => setShowDetails(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropTapArea} onPress={() => setShowDetails(false)} />
          <View style={[styles.modalCard, styles.homeDetailsModalCard]}>
            <View style={styles.homeDetailsHeader}>
              <View style={styles.homeDetailsTabRow}>
                <TouchableOpacity
                  style={[styles.homeDetailsTabButton, homeDetailsPage === 0 ? styles.homeDetailsTabButtonActive : null]}
                  onPress={() => {
                    setHomeDetailsPage(0);
                    homeDetailsPagerRef.current?.setPage(0);
                  }}
                >
                  <Text style={[styles.homeDetailsTabText, homeDetailsPage === 0 ? styles.homeDetailsTabTextActive : null]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.homeDetailsTabButton, homeDetailsPage === 1 ? styles.homeDetailsTabButtonActive : null]}
                  onPress={() => {
                    setHomeDetailsPage(1);
                    homeDetailsPagerRef.current?.setPage(1);
                  }}
                >
                  <Text style={[styles.homeDetailsTabText, homeDetailsPage === 1 ? styles.homeDetailsTabTextActive : null]}>Recent</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.iconButton, styles.iconButtonGhost]} onPress={() => setShowDetails(false)} accessibilityLabel="Close details">
                <Ionicons name="close" size={18} color="#f0f6fc" />
              </TouchableOpacity>
            </View>
            <PagerView
              ref={homeDetailsPagerRef}
              style={styles.homeDetailsPager}
              initialPage={0}
              scrollEnabled={false}
              onPageSelected={(event: any) => setHomeDetailsPage(event.nativeEvent.position)}
            >
              <View key="overview" style={styles.homeDetailsPage}>
                <ScrollView
                  style={styles.homeDetailsScroll}
                  contentContainerStyle={styles.homeDetailsScrollContent}
                  onScrollBeginDrag={() => setEntryMenuId(null)}
                  keyboardShouldPersistTaps="handled"
                >
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
                </ScrollView>
              </View>

              <View key="recent" style={styles.homeDetailsPage}>
                <ScrollView
                  style={styles.homeDetailsScroll}
                  contentContainerStyle={styles.homeDetailsScrollContent}
                  onScrollBeginDrag={() => setEntryMenuId(null)}
                  keyboardShouldPersistTaps="handled"
                >
                  <RecentEntriesSection
                    entries={entries}
                    loadingEntries={loadingEntries}
                    entryError={entryError}
                    deletingEntryIds={deletingEntryIds}
                    onOpenEntryMenu={(event, entryId) => {
                      setEntryMenuAnchor({
                        x: event.nativeEvent.pageX,
                        y: event.nativeEvent.pageY,
                      });
                      setEntryMenuId((prev) => (prev === entryId ? null : entryId));
                    }}
                  />
                </ScrollView>
              </View>
            </PagerView>
            <View style={styles.homeDetailsDotsRow}>
              <View style={[styles.homeDetailsDot, homeDetailsPage === 0 ? styles.homeDetailsDotActive : null]} />
              <View style={[styles.homeDetailsDot, homeDetailsPage === 1 ? styles.homeDetailsDotActive : null]} />
            </View>
          </View>
        </View>
      </Modal>

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
