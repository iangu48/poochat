import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { PoopEntry } from '../../../types/domain';
import { styles } from '../../styles';
import { BristolTypeChip } from './EntryVisuals';
import { formatEntryTimestamp, getRatingColor, getRatingDayStyle, getRatingEmoji, getRatingEmotion, type CalendarCell } from '../utils';

type Props = {
  recapTitle: string;
  entryCount: number;
  averageRating: number | null;
  thirdStatLabel: string;
  thirdStatValue: string | number;
  averageBristol: number | null;
  tipText: string;
  monthLabel: string;
  calendarCells: CalendarCell[];
  selectedDateKey: string | null;
  selectedDateEntries: PoopEntry[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string) => void;
};

export function MonthOverviewSection(props: Props) {
  const {
    recapTitle,
    entryCount,
    averageRating,
    thirdStatLabel,
    thirdStatValue,
    averageBristol,
    tipText,
    monthLabel,
    calendarCells,
    selectedDateKey,
    selectedDateEntries,
    onPrevMonth,
    onNextMonth,
    onSelectDate,
  } = props;
  const hasSelection = Boolean(selectedDateKey) && selectedDateEntries.length > 0;
  const [showSelectedEntries, setShowSelectedEntries] = useState(hasSelection);
  const selectedEntriesAnimation = useRef(new Animated.Value(hasSelection ? 1 : 0)).current;

  useEffect(() => {
    if (hasSelection) {
      setShowSelectedEntries(true);
      Animated.timing(selectedEntriesAnimation, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(selectedEntriesAnimation, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowSelectedEntries(false);
    });
  }, [hasSelection, selectedEntriesAnimation]);

  return (
    <>
      <View style={styles.homeSectionHeader}>
        <Text style={styles.title}>{recapTitle}</Text>
      </View>
      <View style={styles.monthStatsRow}>
        <View style={styles.monthStatCard}>
          <Text style={styles.monthStatValue}>{entryCount}</Text>
          <Text style={styles.monthStatLabel}>Entries</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={styles.monthStatValue}>
            {averageRating == null ? '-' : `${getRatingEmoji(Math.round(averageRating))} ${averageRating.toFixed(1)}`}
          </Text>
          <Text style={styles.monthStatLabel}>Avg Comfort</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={styles.monthStatValue}>{thirdStatValue}</Text>
          <Text style={styles.monthStatLabel}>{thirdStatLabel}</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={styles.monthStatValue}>{averageBristol == null ? '-' : averageBristol.toFixed(1)}</Text>
          <Text style={styles.monthStatLabel}>Avg Bristol</Text>
        </View>
      </View>
      <View style={styles.monthTipCard}>
        <Text style={styles.monthTipTitle}>Tip</Text>
        <Text style={styles.monthTipText}>{tipText}</Text>
      </View>
      {showSelectedEntries ? (
        <Animated.View
          style={{
            opacity: selectedEntriesAnimation,
            transform: [
              {
                translateY: selectedEntriesAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
          }}
          pointerEvents={hasSelection ? 'auto' : 'none'}
        >
          <View style={styles.selectedDayEntriesCard}>
          <Text style={styles.selectedDayEntriesTitle}>Entries on this date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedDayEntriesRail}>
            {selectedDateEntries.map((entry) => (
              <View key={`selected-day-entry-${entry.id}`} style={styles.selectedDayEntryItem}>
                <View style={styles.selectedDayEntryTop}>
                  <BristolTypeChip typeValue={Number(entry.bristolType)} />
                  <Text style={styles.selectedDayEntryTime}>{formatEntryTimestamp(entry.occurredAt)}</Text>
                </View>
                <Text style={[styles.selectedDayEntryRating, { color: getRatingColor(Number(entry.rating)) }]}>
                  {getRatingEmoji(Number(entry.rating))} {getRatingEmotion(Number(entry.rating))}
                </Text>
                <Text style={styles.selectedDayEntryNote} numberOfLines={2}>
                  {entry.note?.trim() || 'No note'}
                </Text>
              </View>
            ))}
          </ScrollView>
          </View>
        </Animated.View>
      ) : null}

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonGhost, styles.calendarMonthButton]}
            onPress={onPrevMonth}
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={18} color="#f0f6fc" />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{monthLabel}</Text>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonGhost, styles.calendarMonthButton]}
            onPress={onNextMonth}
            accessibilityLabel="Next month"
          >
            <Ionicons name="chevron-forward" size={18} color="#f0f6fc" />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWeekRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
            <Text key={`weekday-${label}-${index}`} style={styles.calendarWeekday}>
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarCells.map((cell, index) => (
            <TouchableOpacity
              key={`calendar-cell-${index}`}
              onPress={() => onSelectDate(cell.dateKey)}
              style={[
                styles.calendarCell,
                cell.inCurrentMonth && cell.rating != null ? getRatingDayStyle(cell.rating) : null,
                !cell.inCurrentMonth ? styles.calendarCellOutside : null,
                cell.inCurrentMonth && cell.isToday ? styles.calendarCellToday : null,
                selectedDateKey === cell.dateKey ? styles.calendarCellSelected : null,
              ]}
            >
              {cell.entryCount >= 2 ? (
                <View style={[styles.calendarEntryMarkerRow, !cell.inCurrentMonth ? styles.calendarEntryDotOutside : null]}>
                  {Array.from({ length: Math.min(3, cell.entryCount) }).map((_, dotIndex) => (
                    <View key={`dot-${index}-${dotIndex}`} style={styles.calendarEntryDot} />
                  ))}
                  {cell.entryCount > 3 ? <Text style={styles.calendarEntryPlus}>+</Text> : null}
                </View>
              ) : null}
              <Text
                style={[
                  styles.calendarCellText,
                  !cell.inCurrentMonth ? styles.calendarCellTextOutside : null,
                  cell.inCurrentMonth && cell.isToday ? styles.calendarCellTextToday : null,
                ]}
              >
                {cell.day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.calendarLegendRow}>
          {[1, 2, 3, 4, 5].map((level) => (
            <View key={`legend-${level}`} style={styles.calendarLegendItem}>
              <View style={[styles.calendarLegendSwatch, getRatingDayStyle(level)]} />
              <Text style={styles.calendarLegendText}>{level}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}
