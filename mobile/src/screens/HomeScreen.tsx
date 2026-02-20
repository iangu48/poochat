import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatar } from '../components/ProfileAvatar';
import type { FeedItem, PoopEntry, Profile } from '../types/domain';
import { styles } from './styles';

type Props = {
  entries: PoopEntry[];
  feedItems: FeedItem[];
  profilesById: Record<string, Profile>;
  loadingEntries: boolean;
  feedLoading: boolean;
  addEntryLoading: boolean;
  deletingEntryIds: string[];
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
    profilesById,
    loadingEntries,
    feedLoading,
    addEntryLoading,
    deletingEntryIds,
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
        <TouchableOpacity
          style={[styles.iconButton, styles.iconButtonGhost, loadingEntries && styles.buttonDisabled]}
          onPress={onRefreshEntries}
          accessibilityLabel="Refresh entries"
          disabled={loadingEntries}
        >
          {loadingEntries ? <ActivityIndicator size="small" color="#f0f6fc" /> : <Ionicons name="refresh" size={18} color="#f0f6fc" />}
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
            <TouchableOpacity onPress={() => onDeleteEntry(entry.id)} disabled={deletingEntryIds.includes(entry.id)}>
              <View style={styles.buttonContentRow}>
                {deletingEntryIds.includes(entry.id) ? <ActivityIndicator size="small" color="#ff7b72" /> : null}
                <Text style={styles.linkDanger}>{deletingEntryIds.includes(entry.id) ? 'Deleting...' : 'Delete'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
        {entries.length === 0 && <Text style={styles.muted}>No entries yet.</Text>}

        <Text style={styles.title}>Friends Feed</Text>
        <TouchableOpacity
          style={[styles.iconButton, styles.iconButtonGhost, feedLoading && styles.buttonDisabled]}
          onPress={onRefreshFeed}
          accessibilityLabel="Refresh friends feed"
          disabled={feedLoading}
        >
          {feedLoading ? <ActivityIndicator size="small" color="#f0f6fc" /> : <Ionicons name="refresh" size={18} color="#f0f6fc" />}
        </TouchableOpacity>
        {!!feedError && <Text style={styles.error}>{feedError}</Text>}
        {recentFeedItems.map((item) => (
          <View key={item.entryId} style={styles.card}>
            <View style={styles.inlineRow}>
              <ProfileAvatar
                size={34}
                avatarUrl={profilesById[item.subjectId]?.avatarUrl ?? null}
                avatarTint={profilesById[item.subjectId]?.avatarTint ?? '#5b6c8a'}
              />
              <Text style={[styles.cardTitle, styles.inlineLeft]}>
                {item.displayName} (@{item.username})
              </Text>
            </View>
            <Text style={styles.muted}>Occurred: {new Date(item.occurredAt).toLocaleString()}</Text>
            <Text style={styles.cardBody}>Rating: {item.rating}</Text>
          </View>
        ))}
        {recentFeedItems.length === 0 && <Text style={styles.muted}>No feed events yet.</Text>}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, addEntryLoading && styles.buttonDisabled]} onPress={onToggleComposer} disabled={addEntryLoading}>
        {addEntryLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={showEntryComposer ? 'close' : 'add'} size={28} color="#ffffff" />}
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
                  <TouchableOpacity style={[styles.button, addEntryLoading && styles.buttonDisabled]} onPress={onAddEntry} disabled={addEntryLoading}>
                    <View style={styles.buttonContentRow}>
                      {addEntryLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
                      <Text style={styles.buttonText}>{addEntryLoading ? 'Saving...' : 'Save Entry'}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.buttonSecondary, addEntryLoading && styles.buttonDisabled]} onPress={onCloseComposer} disabled={addEntryLoading}>
                    <View style={styles.buttonContentRow}>
                      <Ionicons name="close" size={16} color="#fff" />
                      <Text style={styles.buttonText}>Cancel</Text>
                    </View>
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
