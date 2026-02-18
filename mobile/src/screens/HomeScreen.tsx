import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { FeedItem, PoopEntry } from '../types/domain';
import { styles } from './styles';

type Props = {
  entries: PoopEntry[];
  feedItems: FeedItem[];
  loadingEntries: boolean;
  entryError: string;
  feedError: string;
  showEntryComposer: boolean;
  bristolType: string;
  rating: string;
  note: string;
  onRefreshEntries: () => void;
  onRefreshFeed: () => void;
  onDeleteEntry: (entryId: string) => void;
  onToggleComposer: () => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onAddEntry: () => void;
  onCloseComposer: () => void;
};

export function HomeScreen(props: Props) {
  const {
    entries,
    feedItems,
    loadingEntries,
    entryError,
    feedError,
    showEntryComposer,
    bristolType,
    rating,
    note,
    onRefreshEntries,
    onRefreshFeed,
    onDeleteEntry,
    onToggleComposer,
    onBristolTypeChange,
    onRatingChange,
    onNoteChange,
    onAddEntry,
    onCloseComposer,
  } = props;
  const recentFeedItems = feedItems.slice(0, 5);

  return (
    <>
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.title}>Recent Entries</Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onRefreshEntries}>
          <Text style={styles.buttonText}>Refresh Entries</Text>
        </TouchableOpacity>
        {loadingEntries && <Text style={styles.muted}>Loading...</Text>}
        {!!entryError && <Text style={styles.error}>{entryError}</Text>}
        {entries.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              Type {entry.bristolType} | Rating {entry.rating}
            </Text>
            <Text style={styles.muted}>{new Date(entry.occurredAt).toLocaleString()}</Text>
            {!!entry.note && <Text style={styles.cardBody}>{entry.note}</Text>}
            <TouchableOpacity onPress={() => onDeleteEntry(entry.id)}>
              <Text style={styles.linkDanger}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
        {entries.length === 0 && <Text style={styles.muted}>No entries yet.</Text>}

        <Text style={styles.title}>Friends Feed</Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onRefreshFeed}>
          <Text style={styles.buttonText}>Refresh Feed</Text>
        </TouchableOpacity>
        {!!feedError && <Text style={styles.error}>{feedError}</Text>}
        {recentFeedItems.map((item) => (
          <View key={item.entryId} style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.displayName} (@{item.username})
            </Text>
            <Text style={styles.muted}>Occurred: {new Date(item.occurredAt).toLocaleString()}</Text>
            <Text style={styles.cardBody}>Rating: {item.rating}</Text>
          </View>
        ))}
        {recentFeedItems.length === 0 && <Text style={styles.muted}>No feed events yet.</Text>}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={onToggleComposer}>
        <Text style={styles.fabText}>{showEntryComposer ? 'x' : '+'}</Text>
      </TouchableOpacity>

      <Modal transparent visible={showEntryComposer} animationType="fade" onRequestClose={onCloseComposer}>
        <Pressable style={styles.entryModalBackdrop} onPress={onCloseComposer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={20}>
            <Pressable style={[styles.modalCard, styles.entryModalCard]} onPress={() => {}}>
              <View style={styles.entryComposer}>
                <Text style={styles.cardTitle}>Add New Entry</Text>
                <Text style={styles.label}>Bristol Type (1-7)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={bristolType}
                  onChangeText={onBristolTypeChange}
                />
                <Text style={styles.label}>Rating (1-5)</Text>
                <TextInput style={styles.input} keyboardType="number-pad" value={rating} onChangeText={onRatingChange} />
                <Text style={styles.label}>Note (optional)</Text>
                <TextInput style={styles.input} value={note} onChangeText={onNoteChange} />
                <View style={styles.row}>
                  <TouchableOpacity style={styles.button} onPress={onAddEntry}>
                    <Text style={styles.buttonText}>Save Entry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonSecondary} onPress={onCloseComposer}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}
