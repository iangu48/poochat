import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles';
import { getRatingDayStyle, getRatingEmoji, type CalendarCell } from '../utils';

type Props = {
  monthEntriesCount: number;
  averageMonthRating: number | null;
  uniqueLoggedDays: number;
  averageMonthBristol: number | null;
  monthlyTip: string;
  monthLabel: string;
  calendarCells: CalendarCell[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function MonthOverviewSection(props: Props) {
  const {
    monthEntriesCount,
    averageMonthRating,
    uniqueLoggedDays,
    averageMonthBristol,
    monthlyTip,
    monthLabel,
    calendarCells,
    onPrevMonth,
    onNextMonth,
  } = props;

  return (
    <>
      <View style={styles.homeSectionHeader}>
        <Text style={styles.title}>This Month</Text>
      </View>
      <View style={styles.monthStatsRow}>
        <View style={styles.monthStatCard}>
          <Text style={styles.monthStatValue}>{monthEntriesCount}</Text>
          <Text style={styles.monthStatLabel}>Entries</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={styles.monthStatValue}>
            {averageMonthRating == null ? '-' : `${getRatingEmoji(Math.round(averageMonthRating))} ${averageMonthRating.toFixed(1)}`}
          </Text>
          <Text style={styles.monthStatLabel}>Avg Comfort</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={styles.monthStatValue}>{uniqueLoggedDays}</Text>
          <Text style={styles.monthStatLabel}>Days Logged</Text>
        </View>
        <View style={styles.monthStatCard}>
          <Text style={styles.monthStatValue}>{averageMonthBristol == null ? '-' : averageMonthBristol.toFixed(1)}</Text>
          <Text style={styles.monthStatLabel}>Avg Bristol</Text>
        </View>
      </View>
      <View style={styles.monthTipCard}>
        <Text style={styles.monthTipTitle}>Tip</Text>
        <Text style={styles.monthTipText}>{monthlyTip}</Text>
      </View>

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
            <View
              key={`calendar-cell-${index}`}
              style={[
                styles.calendarCell,
                cell.inCurrentMonth && cell.rating != null ? getRatingDayStyle(cell.rating) : null,
                !cell.inCurrentMonth ? styles.calendarCellOutside : null,
                cell.inCurrentMonth && cell.isToday ? styles.calendarCellToday : null,
              ]}
            >
              <Text style={[styles.calendarCellText, !cell.inCurrentMonth ? styles.calendarCellTextOutside : null]}>{cell.day}</Text>
            </View>
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
