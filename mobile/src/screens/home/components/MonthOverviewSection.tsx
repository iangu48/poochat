import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { PoopEntry } from '../../../types/domain';
import { styles } from '../../styles';
import { getThemePalette, type ThemeMode } from '../../../theme';
import { BristolTypeChip } from './EntryVisuals';
import { formatEntryTimestamp, getRatingColor, getRatingDayStyle, getRatingEmoji, getRatingEmotion, type CalendarCell } from '../utils';

type Props = {
  themeMode: ThemeMode;
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
    themeMode,
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
  const colors = getThemePalette(themeMode);
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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{recapTitle}</Text>
      </View>
      <View style={styles.monthStatsRow}>
        <View style={[styles.monthStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.monthStatValue, { color: colors.text }]}>{entryCount}</Text>
          <Text style={[styles.monthStatLabel, { color: colors.mutedText }]}>Entries</Text>
        </View>
        <View style={[styles.monthStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.monthStatValue, { color: colors.text }]}>
            {averageRating == null ? '-' : `${getRatingEmoji(Math.round(averageRating))} ${averageRating.toFixed(1)}`}
          </Text>
          <Text style={[styles.monthStatLabel, { color: colors.mutedText }]}>Avg Comfort</Text>
        </View>
        <View style={[styles.monthStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.monthStatValue, { color: colors.text }]}>{thirdStatValue}</Text>
          <Text style={[styles.monthStatLabel, { color: colors.mutedText }]}>{thirdStatLabel}</Text>
        </View>
        <View style={[styles.monthStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.monthStatValue, { color: colors.text }]}>{averageBristol == null ? '-' : averageBristol.toFixed(1)}</Text>
          <Text style={[styles.monthStatLabel, { color: colors.mutedText }]}>Avg Bristol</Text>
        </View>
      </View>
      <View style={[styles.monthTipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.monthTipTitle, { color: colors.text }]}>Tip</Text>
        <Text style={[styles.monthTipText, { color: colors.mutedText }]}>{tipText}</Text>
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
          <View style={[styles.selectedDayEntriesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.selectedDayEntriesTitle, { color: colors.text }]}>Entries on this date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedDayEntriesRail}>
            {selectedDateEntries.map((entry) => (
              <View key={`selected-day-entry-${entry.id}`} style={[styles.selectedDayEntryItem, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={styles.selectedDayEntryTop}>
                  <BristolTypeChip typeValue={Number(entry.bristolType)} themeMode={themeMode} />
                  <Text style={[styles.selectedDayEntryTime, { color: colors.mutedText }]}>{formatEntryTimestamp(entry.occurredAt)}</Text>
                </View>
                <Text style={[styles.selectedDayEntryRating, { color: getRatingColor(Number(entry.rating), themeMode) }]}>
                  {getRatingEmoji(Number(entry.rating))} {getRatingEmotion(Number(entry.rating))}
                </Text>
                <Text style={[styles.selectedDayEntryNote, { color: colors.mutedText }]} numberOfLines={2}>
                  {entry.note?.trim() || 'No note'}
                </Text>
              </View>
            ))}
          </ScrollView>
          </View>
        </Animated.View>
      ) : null}

      <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.iconButtonGhost,
              styles.calendarMonthButton,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
            onPress={onPrevMonth}
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.calendarTitle, { color: colors.text }]}>{monthLabel}</Text>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.iconButtonGhost,
              styles.calendarMonthButton,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
            onPress={onNextMonth}
            accessibilityLabel="Next month"
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWeekRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
            <Text key={`weekday-${label}-${index}`} style={[styles.calendarWeekday, { color: colors.mutedText }]}>
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
                {
                  backgroundColor: themeMode === 'light' ? '#ffffff' : '#161b22',
                  borderColor: colors.border,
                },
                cell.inCurrentMonth && cell.rating != null ? getRatingDayStyle(cell.rating, themeMode) : null,
                !cell.inCurrentMonth
                  ? [
                      styles.calendarCellOutside,
                      {
                        borderColor: themeMode === 'light' ? '#d7dee8' : '#1f2937',
                        backgroundColor: themeMode === 'light' ? '#f4f7fb' : '#0f141b',
                        opacity: themeMode === 'light' ? 1 : 0.7,
                      },
                    ]
                  : null,
                cell.inCurrentMonth && cell.isToday ? styles.calendarCellToday : null,
                cell.inCurrentMonth && cell.isToday
                  ? {
                      backgroundColor:
                        themeMode === 'light'
                          ? (cell.rating == null ? '#e8f1ff' : undefined)
                          : (cell.rating == null ? 'rgba(88, 166, 255, 0.20)' : undefined),
                      borderColor: themeMode === 'light' ? '#2d74da' : '#58a6ff',
                    }
                  : null,
                selectedDateKey === cell.dateKey
                  ? [
                      styles.calendarCellSelected,
                      { borderColor: themeMode === 'light' ? '#2d74da' : '#f0f6fc' },
                    ]
                  : null,
              ]}
            >
              {cell.entryCount >= 2 ? (
                <View style={[styles.calendarEntryMarkerRow, !cell.inCurrentMonth ? styles.calendarEntryDotOutside : null]}>
                  {Array.from({ length: Math.min(3, cell.entryCount) }).map((_, dotIndex) => (
                    <View
                      key={`dot-${index}-${dotIndex}`}
                      style={[
                        styles.calendarEntryDot,
                        { backgroundColor: themeMode === 'light' ? '#7a8698' : '#c9d1d9' },
                      ]}
                    />
                  ))}
                  {cell.entryCount > 3 ? <Text style={[styles.calendarEntryPlus, { color: themeMode === 'light' ? '#6f7c8f' : '#c9d1d9' }]}>+</Text> : null}
                </View>
              ) : null}
              <Text
                style={[
                  styles.calendarCellText,
                  { color: colors.text },
                  !cell.inCurrentMonth ? [styles.calendarCellTextOutside, { color: colors.mutedText }] : null,
                  cell.inCurrentMonth && cell.isToday
                    ? [
                        styles.calendarCellTextToday,
                        {
                          color:
                            themeMode === 'light'
                              ? '#184f9f'
                              : (cell.rating == null ? '#eaf4ff' : '#ffffff'),
                        },
                      ]
                    : null,
                  selectedDateKey === cell.dateKey && themeMode === 'light' ? { color: '#1a4f9f' } : null,
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
              <View style={[styles.calendarLegendSwatch, getRatingDayStyle(level, themeMode)]} />
              <Text style={[styles.calendarLegendText, { color: colors.mutedText }]}>{level}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}
