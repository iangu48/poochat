import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import type { PoopEntry } from '../../../types/domain';
import { styles } from '../../styles';

type Props = {
  visible: boolean;
  menuLeft: number;
  menuTop: number;
  menuWidth: number;
  entries: PoopEntry[];
  entryMenuId: string | null;
  deletingEntryIds: string[];
  onClose: () => void;
  onEditEntry: (entry: PoopEntry) => void;
  onDeleteEntry: (entryId: string) => void;
};

export function EntryActionsMenuModal(props: Props) {
  const {
    visible,
    menuLeft,
    menuTop,
    menuWidth,
    entries,
    entryMenuId,
    deletingEntryIds,
    onClose,
    onEditEntry,
    onDeleteEntry,
  } = props;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.entryMenuBackdrop} onPress={onClose}>
        <Pressable style={[styles.entryInlineMenu, { top: menuTop, left: menuLeft, width: menuWidth }]} onPress={() => {}}>
          <TouchableOpacity
            style={[styles.buttonSecondary, styles.entryInlineMenuAction]}
            onPress={() => {
              const selected = entries.find((entry) => entry.id === entryMenuId);
              if (!selected) return;
              onEditEntry(selected);
              onClose();
            }}
          >
            <View style={styles.buttonContentRow}>
              <Ionicons name="create-outline" size={14} color="#fff" />
              <Text style={styles.buttonText}>Edit</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.buttonDangerInline,
              styles.entryInlineMenuAction,
              entryMenuId && deletingEntryIds.includes(entryMenuId) && styles.buttonDisabled,
            ]}
            disabled={!entryMenuId || deletingEntryIds.includes(entryMenuId)}
            onPress={() => {
              if (!entryMenuId) return;
              onDeleteEntry(entryMenuId);
              onClose();
            }}
          >
            <View style={styles.buttonContentRow}>
              {entryMenuId && deletingEntryIds.includes(entryMenuId) ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="trash-outline" size={14} color="#fff" />
              )}
              <Text style={styles.buttonText}>{entryMenuId && deletingEntryIds.includes(entryMenuId) ? 'Deleting...' : 'Delete'}</Text>
            </View>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
