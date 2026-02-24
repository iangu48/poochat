import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
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
  isEditingEntry: boolean;
  entryError: string;
  feedError: string;
  showEntryComposer: boolean;
  bristolType: string;
  rating: string;
  note: string;
  entryDate: string;
  entryTime: string;
  onRefreshEntries: () => void;
  onRefreshFeed: () => void;
  onDeleteEntry: (entryId: string) => void;
  onEditEntry: (entry: PoopEntry) => void;
  onToggleComposer: () => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onEntryDateChange: (value: string) => void;
  onEntryTimeChange: (value: string) => void;
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
    isEditingEntry,
    entryError,
    feedError,
    showEntryComposer,
    bristolType,
    rating,
    note,
    entryDate,
    entryTime,
    onRefreshEntries,
    onRefreshFeed,
    onDeleteEntry,
    onEditEntry,
    onToggleComposer,
    onBristolTypeChange,
    onRatingChange,
    onNoteChange,
    onEntryDateChange,
    onEntryTimeChange,
    onAddEntry,
    onCloseComposer,
  } = props;
  const recentFeedItems = feedItems.slice(0, 5);
  const [entryMenuId, setEntryMenuId] = useState<string | null>(null);
  const [entryMenuAnchor, setEntryMenuAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [pickerStep, setPickerStep] = useState<'none' | 'date' | 'time'>('none');
  const [draftDateTime, setDraftDateTime] = useState<Date | null>(null);
  const [dateStepActionsRowY, setDateStepActionsRowY] = useState(0);
  const [entryActionsRowY, setEntryActionsRowY] = useState(0);
  const entryComposerScrollRef = useRef<ScrollView | null>(null);
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
      <ScrollView contentContainerStyle={styles.screen} onScrollBeginDrag={() => setEntryMenuId(null)}>
        <View style={styles.homeSectionHeader}>
          <Text style={styles.title}>Recent Entries</Text>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonGhost, loadingEntries && styles.buttonDisabled]}
            onPress={onRefreshEntries}
            accessibilityLabel="Refresh entries"
            disabled={loadingEntries}
          >
            {loadingEntries ? <ActivityIndicator size="small" color="#f0f6fc" /> : <Ionicons name="refresh" size={18} color="#f0f6fc" />}
          </TouchableOpacity>
        </View>
        {loadingEntries && <Text style={styles.muted}>Loading...</Text>}
        {!!entryError && <Text style={styles.error}>{entryError}</Text>}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.entryRail}
          onScrollBeginDrag={() => setEntryMenuId(null)}
        >
          {entries.map((entry) => (
            <View key={entry.id} style={[styles.entrySquareCard, getRatingCardStyle(Number(entry.rating))]}>
              <View style={styles.entrySquareTop}>
                <BristolTypeChip typeValue={Number(entry.bristolType)} />
                <TouchableOpacity
                  style={styles.entrySquareMenuButton}
                  onPress={(event) => {
                    setEntryMenuAnchor({
                      x: event.nativeEvent.pageX,
                      y: event.nativeEvent.pageY,
                    });
                    setEntryMenuId((prev) => (prev === entry.id ? null : entry.id));
                  }}
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

        <View style={styles.homeSectionHeader}>
          <Text style={styles.title}>Friends Feed</Text>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonGhost, feedLoading && styles.buttonDisabled]}
            onPress={onRefreshFeed}
            accessibilityLabel="Refresh friends feed"
            disabled={feedLoading}
          >
            {feedLoading ? <ActivityIndicator size="small" color="#f0f6fc" /> : <Ionicons name="refresh" size={18} color="#f0f6fc" />}
          </TouchableOpacity>
        </View>
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
          <KeyboardAvoidingView
            style={styles.entryKeyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 28 : 0}
          >
            <Pressable style={[styles.modalCard, styles.entryModalCard]} onPress={() => {}}>
              <ScrollView
                ref={entryComposerScrollRef}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.entryComposerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.entryComposer}>
                <Text style={styles.cardTitle}>{isEditingEntry ? 'Edit Entry' : 'Add New Entry'}</Text>
                <Text style={styles.label}>Bristol Type</Text>
                <BristolVisual typeValue={Number(bristolType)} />
                <Slider
                  minimumValue={1}
                  maximumValue={7}
                  step={1}
                  tapToSeek
                  value={Number(bristolType)}
                  onValueChange={(value) => onBristolTypeChange(String(Math.round(value)))}
                  minimumTrackTintColor="#1f6feb"
                  maximumTrackTintColor="#30363d"
                  thumbTintColor="#58a6ff"
                />
                <Text style={styles.label}>Comfort Rating</Text>
                <RatingVisual ratingValue={Number(rating)} onSelect={(value) => onRatingChange(String(value))} />
                <TouchableOpacity
                  style={styles.buttonSecondary}
                  onPress={() =>
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
                >
                    <View style={styles.buttonContentRow}>
                      <Text style={styles.buttonText}>{formatDateTimeButtonLabel(draftDateTime ?? getEntryDateTimeValue())}</Text>
                      {isCurrentMinute(draftDateTime ?? getEntryDateTimeValue()) ? <Ionicons name="create-outline" size={16} color="#fff" /> : null}
                    </View>
                </TouchableOpacity>
                {showDateEditor ? (
                  <View style={styles.dateTimePickerWrap}>
                    {pickerStep === 'date' ? (
                      <DateTimePicker
                        value={draftDateTime ?? getEntryDateTimeValue()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                        onChange={onPickerChange('date')}
                      />
                    ) : null}
                    {pickerStep === 'time' ? (
                      <DateTimePicker
                        value={draftDateTime ?? getEntryDateTimeValue()}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onPickerChange('time')}
                      />
                    ) : null}
                    <View style={styles.row} onLayout={(event) => setDateStepActionsRowY(event.nativeEvent.layout.y)}>
                      {pickerStep === 'date' ? (
                        <TouchableOpacity
                          style={styles.button}
                          onPress={() => setPickerStep('time')}
                        >
                          <View style={styles.buttonContentRow}>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                            <Text style={styles.buttonText}>Next</Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                      {pickerStep === 'time' ? (
                        <TouchableOpacity
                          style={styles.button}
                          onPress={() => {
                            const next = draftDateTime ?? getEntryDateTimeValue();
                            onEntryDateChange(formatDateInput(next));
                            onEntryTimeChange(formatTimeInput(next));
                            setShowDateEditor(false);
                            setPickerStep('none');
                            setDraftDateTime(null);
                          }}
                        >
                          <View style={styles.buttonContentRow}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.buttonText}>Save</Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ) : null}
                <Text style={styles.label}>Note (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={note}
                  onChangeText={onNoteChange}
                  placeholder="Any context?"
                  placeholderTextColor="#8b949e"
                  onFocus={() => {
                    const targetY = Math.max(0, entryActionsRowY - 120);
                    setTimeout(() => {
                      entryComposerScrollRef.current?.scrollTo({ x: 0, y: targetY, animated: true });
                    }, 120);
                    setTimeout(() => {
                      entryComposerScrollRef.current?.scrollTo({ x: 0, y: targetY, animated: true });
                    }, 260);
                  }}
                />
                <View style={styles.row} onLayout={handleEntryActionsRowLayout}>
                  <TouchableOpacity style={[styles.button, addEntryLoading && styles.buttonDisabled]} onPress={onAddEntry} disabled={addEntryLoading}>
                    <View style={styles.buttonContentRow}>
                      {addEntryLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
                      <Text style={styles.buttonText}>
                        {addEntryLoading ? 'Saving...' : isEditingEntry ? 'Save Changes' : 'Save Entry'}
                      </Text>
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
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(entryMenuId)} animationType="fade" onRequestClose={() => setEntryMenuId(null)}>
        <Pressable style={styles.entryMenuBackdrop} onPress={() => setEntryMenuId(null)}>
          <Pressable style={[styles.entryInlineMenu, { top: entryMenuAnchor.y + 6, left: menuLeft, width: menuWidth }]} onPress={() => {}}>
            <TouchableOpacity
              style={[styles.buttonSecondary, styles.entryInlineMenuAction]}
              onPress={() => {
                const selected = entries.find((entry) => entry.id === entryMenuId);
                if (!selected) return;
                onEditEntry(selected);
                setEntryMenuId(null);
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
                setEntryMenuId(null);
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
    </>
  );
}

function formatEntryTimestamp(isoValue: string): string {
  const date = new Date(isoValue);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return isToday ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : date.toLocaleDateString();
}

function BristolVisual({ typeValue }: { typeValue: number }) {
  const value = Math.max(1, Math.min(7, Math.round(typeValue)));

  if (value === 1) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolDotsRow}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={`type1-${index}`} style={[styles.bristolDot, styles.bristolDotHard, index % 2 === 0 ? styles.bristolDotSkewA : styles.bristolDotSkewB]}>
                <View style={styles.bristolDotSpecular} />
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Hard separate lumps</Text>
      </View>
    );
  }

  if (value === 2) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolLumpySausage}>
            <View style={styles.bristolTextureRow}>
              <View style={styles.bristolTextureDot} />
              <View style={styles.bristolTextureDot} />
              <View style={styles.bristolTextureDot} />
            </View>
            <View style={styles.bristolContourLine} />
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Lumpy sausage</Text>
      </View>
    );
  }

  if (value === 3) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={[styles.bristolSmoothSausage, styles.bristolCracked]}>
            <View style={styles.bristolCrackMarkA} />
            <View style={styles.bristolCrackMarkB} />
            <View style={styles.bristolCrackMarkC} />
            <View style={styles.bristolShadowBand} />
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Sausage with cracks</Text>
      </View>
    );
  }

  if (value === 4) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolSmoothSausage}>
            <View style={styles.bristolHighlight} />
            <View style={styles.bristolHighlightSoft} />
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Smooth, soft sausage (ideal)</Text>
      </View>
    );
  }

  if (value === 5) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolDotsRow}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={`type5-${index}`} style={[styles.bristolBlob, styles.bristolDotSoft, index % 2 === 0 ? styles.bristolBlobA : styles.bristolBlobB]}>
                <View style={styles.bristolDotSpecularSoft} />
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Soft blobs</Text>
      </View>
    );
  }

  if (value === 6) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolMushy}>
            <View style={styles.bristolMushyLayer} />
            <View style={styles.bristolMushyLayerSmall} />
            <View style={styles.bristolMushyGrainA} />
            <View style={styles.bristolMushyGrainB} />
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Mushy consistency</Text>
      </View>
    );
  }

  return (
    <View style={styles.bristolVisualCard}>
      <View style={styles.bristolVisualGlyphWrap}>
        <View style={styles.bristolLiquid}>
          <View style={styles.bristolWaveA} />
          <View style={styles.bristolWaveB} />
          <View style={styles.bristolWaveC} />
        </View>
      </View>
      <Text style={styles.bristolVisualText}>Mostly liquid / watery</Text>
    </View>
  );
}

function BristolTypeChip({ typeValue }: { typeValue: number }) {
  const value = Math.max(1, Math.min(7, Math.round(typeValue)));

  if (value === 1) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypeDotsRow}>
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
        </View>
      </View>
    );
  }

  if (value === 2) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypePillLumpy}>
          <View style={styles.entryTypeNotchA} />
          <View style={styles.entryTypeNotchB} />
        </View>
      </View>
    );
  }

  if (value === 3) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypePillCracked}>
          <View style={styles.entryTypeCrackA} />
          <View style={styles.entryTypeCrackB} />
        </View>
      </View>
    );
  }

  if (value === 4) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypePillSmooth}>
          <View style={styles.entryTypeHighlight} />
        </View>
      </View>
    );
  }

  if (value === 5) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypeDotsRow}>
          <View style={[styles.entryTypeDot, styles.entryTypeDotSoft]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotSoft]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotSoft]} />
        </View>
      </View>
    );
  }

  if (value === 6) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypeMushy}>
          <View style={styles.entryTypeMushyLayer} />
          <View style={styles.entryTypeMushyLayerSmall} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.entryTypeChip}>
      <View style={styles.entryTypeLiquid}>
        <View style={styles.entryTypeWaveA} />
        <View style={styles.entryTypeWaveB} />
      </View>
    </View>
  );
}

function RatingVisual({ ratingValue, onSelect }: { ratingValue: number; onSelect: (value: number) => void }) {
  const value = Math.max(1, Math.min(5, Math.round(ratingValue)));
  const levels = [1, 2, 3, 4, 5];
  return (
    <View style={styles.ratingVisualCard}>
      <Text style={styles.ratingVisualTitle}>Emotion by Rating</Text>
      <View style={styles.ratingPillRow}>
        {levels.map((level) => (
          (() => {
            const selected = level === value;
            const pillColors = getRatingPillColors(level, selected);
            return (
          <TouchableOpacity
            key={`rating-pill-${level}`}
            style={[
              styles.ratingPill,
              {
                backgroundColor: pillColors.backgroundColor,
                borderColor: pillColors.borderColor,
              },
              selected ? styles.ratingPillActive : null,
            ]}
            onPress={() => onSelect(level)}
          >
            <Text style={[styles.ratingPillEmoji, { color: pillColors.levelColor }]}>{getRatingEmoji(level)}</Text>
            <Text style={[styles.ratingPillLabel, { color: pillColors.labelColor }]}>{getRatingEmotion(level)}</Text>
          </TouchableOpacity>
            );
          })()
        ))}
      </View>
    </View>
  );
}

function getRatingEmotion(value: number): string {
  switch (Math.round(value)) {
    case 1:
      return 'Frustrated';
    case 2:
      return 'Uncomfortable';
    case 3:
      return 'Neutral';
    case 4:
      return 'Content';
    case 5:
      return 'Great';
    default:
      return 'Unknown';
  }
}

function getRatingEmoji(value: number): string {
  switch (Math.round(value)) {
    case 1:
      return '😣';
    case 2:
      return '😕';
    case 3:
      return '😐';
    case 4:
      return '🙂';
    case 5:
      return '😄';
    default:
      return '❔';
  }
}

function formatDateInput(value: Date): string {
  if (Number.isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeInput(value: Date): string {
  if (Number.isNaN(value.getTime())) return '';
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateTimeButtonLabel(value: Date): string {
  if (Number.isNaN(value.getTime())) return 'Set date & time';
  if (isCurrentMinute(value)) return 'Now';
  return value.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isCurrentMinute(value: Date): boolean {
  if (Number.isNaN(value.getTime())) return false;
  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate() &&
    value.getHours() === now.getHours() &&
    value.getMinutes() === now.getMinutes()
  );
}

function getRatingColor(value: number): string {
  switch (Math.round(value)) {
    case 1:
      return '#ff7b72';
    case 2:
      return '#ffa657';
    case 3:
      return '#f2cc60';
    case 4:
      return '#7ee787';
    case 5:
      return '#3fb950';
    default:
      return '#f0f6fc';
  }
}

function getRatingCardStyle(value: number): { backgroundColor: string; borderColor: string } {
  switch (Math.round(value)) {
    case 1:
      return { backgroundColor: '#331818', borderColor: '#ff7b72' };
    case 2:
      return { backgroundColor: '#352114', borderColor: '#ffa657' };
    case 3:
      return { backgroundColor: '#332b12', borderColor: '#f2cc60' };
    case 4:
      return { backgroundColor: '#162a1c', borderColor: '#7ee787' };
    case 5:
      return { backgroundColor: '#122919', borderColor: '#3fb950' };
    default:
      return { backgroundColor: '#161b22', borderColor: '#30363d' };
  }
}

function getRatingPillColors(value: number, selected: boolean): {
  backgroundColor: string;
  borderColor: string;
  levelColor: string;
  labelColor: string;
} {
  switch (Math.round(value)) {
    case 1:
      return selected
        ? { backgroundColor: '#5a2424', borderColor: '#ff7b72', levelColor: '#ffd5d0', labelColor: '#ffd5d0' }
        : { backgroundColor: '#2c1515', borderColor: '#8e3c38', levelColor: '#ffb3ac', labelColor: '#d58d87' };
    case 2:
      return selected
        ? { backgroundColor: '#5c3215', borderColor: '#ffa657', levelColor: '#ffe0c2', labelColor: '#ffe0c2' }
        : { backgroundColor: '#2f1f14', borderColor: '#8f5c34', levelColor: '#ffc58e', labelColor: '#d7a06f' };
    case 3:
      return selected
        ? { backgroundColor: '#584818', borderColor: '#f2cc60', levelColor: '#fff0be', labelColor: '#fff0be' }
        : { backgroundColor: '#2d2714', borderColor: '#8f7b36', levelColor: '#efd78f', labelColor: '#cbb97d' };
    case 4:
      return selected
        ? { backgroundColor: '#1f4c2b', borderColor: '#7ee787', levelColor: '#dcffe1', labelColor: '#dcffe1' }
        : { backgroundColor: '#152a1b', borderColor: '#3d7b46', levelColor: '#a4e6ad', labelColor: '#86c68f' };
    case 5:
      return selected
        ? { backgroundColor: '#1b4a25', borderColor: '#3fb950', levelColor: '#d3f9d9', labelColor: '#d3f9d9' }
        : { backgroundColor: '#13261a', borderColor: '#2f7f3c', levelColor: '#92dd9f', labelColor: '#79ba85' };
    default:
      return selected
        ? { backgroundColor: '#1f2d3f', borderColor: '#58a6ff', levelColor: '#f0f6fc', labelColor: '#f0f6fc' }
        : { backgroundColor: '#0f141b', borderColor: '#30363d', levelColor: '#f0f6fc', labelColor: '#8b949e' };
  }
}
