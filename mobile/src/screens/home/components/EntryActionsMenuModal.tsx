import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import type { PoopEntry } from '../../../types/domain';
import { styles } from '../../styles';
import { BottomDrawer } from '../../../components/BottomDrawer';
import { getThemePalette, type ThemeMode } from '../../../theme';

type Props = {
  themeMode: ThemeMode;
  visible: boolean;
  entries: PoopEntry[];
  entryMenuId: string | null;
  deletingEntryIds: string[];
  onClose: () => void;
  onEditEntry: (entry: PoopEntry) => void;
  onDeleteEntry: (entryId: string) => void;
};

export function EntryActionsMenuModal(props: Props) {
  const {
    themeMode,
    visible,
    entries,
    entryMenuId,
    deletingEntryIds,
    onClose,
    onEditEntry,
    onDeleteEntry,
  } = props;
  const colors = getThemePalette(themeMode);

  return (
    <BottomDrawer visible={visible} onClose={onClose} height={190} maxHeight={220} themeMode={themeMode}>
      <View style={styles.entryActionDrawerContent}>
        <Text style={[styles.entryActionDrawerTitle, { color: colors.text }]}>Entry Actions</Text>
        <View style={styles.entryActionDrawerRow}>
          <TouchableOpacity
            style={[styles.entryActionDrawerButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            onPress={() => {
              const selected = entries.find((entry) => entry.id === entryMenuId);
              if (!selected) return;
              onEditEntry(selected);
              onClose();
            }}
            accessibilityLabel="Edit entry"
          >
            <Ionicons name="create-outline" size={20} color={themeMode === 'light' ? '#2d74da' : '#9ecbff'} />
            <Text style={[styles.entryActionDrawerButtonText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.entryActionDrawerButton,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              styles.entryActionDrawerButtonDanger,
              entryMenuId && deletingEntryIds.includes(entryMenuId) && styles.buttonDisabled,
            ]}
            disabled={!entryMenuId || deletingEntryIds.includes(entryMenuId)}
            onPress={() => {
              if (!entryMenuId) return;
              onDeleteEntry(entryMenuId);
              onClose();
            }}
            accessibilityLabel="Delete entry"
          >
            {entryMenuId && deletingEntryIds.includes(entryMenuId) ? (
              <ActivityIndicator size="small" color="#ff7b72" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#ffb3ad" />
            )}
            <Text style={[styles.entryActionDrawerButtonText, styles.entryActionDrawerButtonTextDanger]}>
              {entryMenuId && deletingEntryIds.includes(entryMenuId) ? 'Deleting…' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomDrawer>
  );
}
