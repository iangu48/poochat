import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { PoopEntry } from '../../../types/domain';
import { styles } from '../../styles';
import { getThemePalette, type ThemeMode } from '../../../theme';
import { BristolTypeChip } from './EntryVisuals';
import { formatEntryTimestamp, getRatingCardStyle, getRatingColor, getRatingEmoji, getRatingEmotion, getVolumeEmoji, getVolumeShortLabel } from '../utils';

type Props = {
  themeMode: ThemeMode;
  entries: PoopEntry[];
  loadingEntries: boolean;
  entryError: string;
  deletingEntryIds: string[];
  selectedEntryId?: string | null;
  onOpenEntryMenu: (entryId: string) => void;
};

export function RecentEntriesSection(props: Props) {
  const { themeMode, entries, loadingEntries, entryError, deletingEntryIds, selectedEntryId = null, onOpenEntryMenu } = props;
  const colors = getThemePalette(themeMode);

  return (
    <>
      <View style={styles.homeSectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Entries</Text>
      </View>
      {loadingEntries && <Text style={[styles.muted, { color: colors.mutedText }]}>Loading...</Text>}
      {!!entryError && <Text style={styles.error}>{entryError}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.entryRail}
      >
        {entries.map((entry) => (
          <View
            key={entry.id}
            style={[
              styles.entrySquareCard,
              getRatingCardStyle(Number(entry.rating), themeMode),
              selectedEntryId === entry.id ? styles.entrySquareCardSelected : null,
            ]}
          >
            <View style={styles.entrySquareTop}>
              <BristolTypeChip typeValue={Number(entry.bristolType)} themeMode={themeMode} />
              <TouchableOpacity
                style={styles.entrySquareMenuButton}
                onPress={() => onOpenEntryMenu(entry.id)}
                accessibilityLabel="Entry actions"
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.entrySquareRating, { color: getRatingColor(Number(entry.rating), themeMode) }]}> 
              {getRatingEmoji(Number(entry.rating))} {getRatingEmotion(Number(entry.rating))}
            </Text>
            <Text style={[styles.entrySquareMeta, { color: colors.text }]}>
              {getVolumeEmoji(Number(entry.volume))} {getVolumeShortLabel(Number(entry.volume))}
            </Text>
            <Text style={[styles.entrySquareTime, { color: colors.mutedText }]}>{formatEntryTimestamp(entry.occurredAt)}</Text>
            <Text style={[styles.entrySquareNote, { color: colors.mutedText }]} numberOfLines={3}>
              {entry.note?.trim() || 'No note'}
            </Text>
            {deletingEntryIds.includes(entry.id) ? (
              <View style={styles.buttonContentRow}>
                <ActivityIndicator size="small" color="#ff7b72" />
                <Text style={styles.linkDanger}>Deleting...</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      {entries.length === 0 && <Text style={[styles.muted, { color: colors.mutedText }]}>No entries yet.</Text>}
    </>
  );
}
