import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, GestureResponderEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { PoopEntry } from '../../../types/domain';
import { styles } from '../../styles';
import { BristolTypeChip } from './EntryVisuals';
import { formatEntryTimestamp, getRatingCardStyle, getRatingColor, getRatingEmoji, getRatingEmotion } from '../utils';

type Props = {
  entries: PoopEntry[];
  loadingEntries: boolean;
  entryError: string;
  deletingEntryIds: string[];
  onOpenEntryMenu: (event: GestureResponderEvent, entryId: string) => void;
};

export function RecentEntriesSection(props: Props) {
  const { entries, loadingEntries, entryError, deletingEntryIds, onOpenEntryMenu } = props;

  return (
    <>
      <View style={styles.homeSectionHeader}>
        <Text style={styles.title}>Recent Entries</Text>
      </View>
      {loadingEntries && <Text style={styles.muted}>Loading...</Text>}
      {!!entryError && <Text style={styles.error}>{entryError}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.entryRail}
      >
        {entries.map((entry) => (
          <View key={entry.id} style={[styles.entrySquareCard, getRatingCardStyle(Number(entry.rating))]}>
            <View style={styles.entrySquareTop}>
              <BristolTypeChip typeValue={Number(entry.bristolType)} />
              <TouchableOpacity
                style={styles.entrySquareMenuButton}
                onPress={(event) => onOpenEntryMenu(event, entry.id)}
                accessibilityLabel="Entry actions"
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="#8b949e" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.entrySquareRating, { color: getRatingColor(Number(entry.rating)) }]}> 
              {getRatingEmoji(Number(entry.rating))} {getRatingEmotion(Number(entry.rating))}
            </Text>
            <Text style={styles.entrySquareTime}>{formatEntryTimestamp(entry.occurredAt)}</Text>
            <Text style={styles.entrySquareNote} numberOfLines={3}>
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
      {entries.length === 0 && <Text style={styles.muted}>No entries yet.</Text>}
    </>
  );
}
