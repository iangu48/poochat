import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import type {
  FeedComment,
  FeedItem,
  FeedReactionKind,
  FeedReactionSummary,
  FeedReactionOption,
  IncomingFriendRequest,
  PoopEntry,
  Profile,
} from '../types/domain';
import { FEED_REACTION_OPTIONS } from '../types/domain';
import { styles } from './styles';
import { getThemePalette, type ThemeMode } from '../theme';
import { HomeMapSection } from './home/components/HomeMapSection';
import { EntryComposerModal } from './home/components/EntryComposerModal';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { BristolTypeChip } from './home/components/EntryVisuals';
import { formatDateInput, formatEntryTimestamp, formatTimeInput, getRatingEmoji, getRatingEmotion, getVolumeEmoji, getVolumeLabel } from './home/utils';

type Props = {
  themeMode: ThemeMode;
  currentUserId: string;
  entries: PoopEntry[];
  deletingEntryIds: string[];
  feedItems: FeedItem[];
  profilesById: Record<string, Profile>;
  feedCommentsByEntry: Record<string, FeedComment[]>;
  feedReactionsByEntry: Record<string, FeedReactionSummary>;
  feedCommentDraftByEntry: Record<string, string>;
  feedCommentSubmittingEntryId: string;
  feedReactionSubmittingEntryId: string;
  feedLoading: boolean;
  feedError: string;
  addEntryLoading: boolean;
  updatingEntryLocationIds: string[];
  isEditingEntry: boolean;
  entryError: string;
  showEntryComposer: boolean;
  bristolType: string;
  rating: string;
  volume: string;
  note: string;
  entryDate: string;
  entryTime: string;
  friendUsername: string;
  friends: Profile[];
  incomingRequests: IncomingFriendRequest[];
  friendError: string;
  friendStatus: string;
  sendFriendRequestLoading: boolean;
  acceptingRequestIds: string[];
  onUpdateEntryLocation: (entryId: string, latitude: number, longitude: number) => void;
  onToggleComposer: () => void;
  onBristolTypeChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onVolumeChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onEntryDateChange: (value: string) => void;
  onEntryTimeChange: (value: string) => void;
  onAddEntry: () => void;
  onComposerLocationChange: (latitude: number, longitude: number, source?: 'gps' | 'manual') => void;
  onCloseComposer: () => void;
  onEditEntry: (entry: PoopEntry) => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onFeedCommentDraftChange: (entryId: string, value: string) => void;
  onAddFeedComment: (entryId: string) => Promise<void>;
  onToggleFeedReaction: (entryId: string, reaction: FeedReactionKind) => Promise<void>;
  onFriendUsernameChange: (value: string) => void;
  onSendFriendRequest: () => Promise<void>;
  onAcceptRequest: (friendshipId: string) => void;
};

export function HomeScreen(props: Props) {
  const {
    themeMode,
    currentUserId,
    entries,
    deletingEntryIds,
    feedItems,
    profilesById,
    feedCommentsByEntry,
    feedReactionsByEntry,
    feedCommentDraftByEntry,
    feedCommentSubmittingEntryId,
    feedReactionSubmittingEntryId,
    feedLoading,
    feedError,
    addEntryLoading,
    updatingEntryLocationIds,
    isEditingEntry,
    entryError,
    showEntryComposer,
    bristolType,
    rating,
    volume,
    note,
    entryDate,
    entryTime,
    friendUsername,
    friends,
    incomingRequests,
    friendError,
    friendStatus,
    sendFriendRequestLoading,
    acceptingRequestIds,
    onUpdateEntryLocation,
    onToggleComposer,
    onBristolTypeChange,
    onRatingChange,
    onVolumeChange,
    onNoteChange,
    onEntryDateChange,
    onEntryTimeChange,
    onAddEntry,
    onComposerLocationChange,
    onCloseComposer,
    onEditEntry,
    onDeleteEntry,
    onFeedCommentDraftChange,
    onAddFeedComment,
    onToggleFeedReaction,
    onFriendUsernameChange,
    onSendFriendRequest,
    onAcceptRequest,
  } = props;
  const colors = getThemePalette(themeMode);

  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [selectedFeedEntryId, setSelectedFeedEntryId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const commentInputRef = useRef<TextInput | null>(null);
  const entryComposerScrollRef = useRef<ScrollView | null>(null);

  const [showDateEditor, setShowDateEditor] = useState(false);
  const [pickerStep, setPickerStep] = useState<'none' | 'date' | 'time'>('none');
  const [draftDateTime, setDraftDateTime] = useState<Date | null>(null);
  const [pickerMaxDate, setPickerMaxDate] = useState<Date>(new Date());

  const todayKey = formatDateInput(new Date());
  const todayFeedItems = useMemo(
    () => feedItems.filter((item) => formatDateInput(new Date(item.occurredAt)) === todayKey),
    [feedItems, todayKey],
  );

  const todayMapEntries = useMemo<PoopEntry[]>(
    () => todayFeedItems.map((item) => ({
      id: item.entryId,
      userId: item.subjectId,
      occurredAt: item.occurredAt,
      bristolType: item.bristolType,
      rating: item.rating,
      volume: item.volume,
      note: null,
      latitude: item.latitude,
      longitude: item.longitude,
      locationSource: 'manual',
    })),
    [todayFeedItems],
  );

  const selectedFeedItem = useMemo(
    () => (selectedFeedEntryId ? todayFeedItems.find((item) => item.entryId === selectedFeedEntryId) ?? null : null),
    [selectedFeedEntryId, todayFeedItems],
  );
  const selectedComments = selectedFeedEntryId ? (feedCommentsByEntry[selectedFeedEntryId] ?? []) : [];
  const selectedReactionSummary = selectedFeedEntryId ? feedReactionsByEntry[selectedFeedEntryId] : undefined;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (event) => {
      const next = Math.max(0, event.endCoordinates?.height ?? 0);
      setKeyboardOffset(next);
    });
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardOffset(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  function getEntryDateTimeValue(): Date {
    return parseLocalDateTimeInputs(entryDate, entryTime) ?? new Date();
  }

  function onPickerChange(mode: 'date' | 'time') {
    return (event: DateTimePickerEvent, selectedDate?: Date) => {
      console.log(
        '[picker:home:event]',
        JSON.stringify({
          mode,
          type: event.type,
          selectedDate: selectedDate ? selectedDate.toISOString() : null,
          selectedEpoch: selectedDate ? selectedDate.getTime() : null,
          entryDate,
          entryTime,
          draftDateTime: draftDateTime ? draftDateTime.toISOString() : null,
        }),
      );
      if (event.type === 'dismissed') return;
      const base = draftDateTime ?? getEntryDateTimeValue();
      const now = new Date();
      const todayDateKey = formatDateInput(now);
      if (mode === 'date') {
        const picked = resolvePickerDate(selectedDate);
        if (!picked) {
          console.log('[picker:home:ignored]', JSON.stringify({ mode, reason: 'invalid-selectedDate' }));
          return;
        }
        const next = new Date(base.getTime());
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        next.setHours(base.getHours(), base.getMinutes(), 0, 0);
        if (formatDateInput(next) > todayDateKey) {
          // Keep previous value when future date is attempted.
          console.log('[picker:home:rejected]', JSON.stringify({ mode, reason: 'future-date', next: next.toISOString() }));
          return;
        }
        console.log('[picker:home:accepted]', JSON.stringify({ mode, next: next.toISOString() }));
        setDraftDateTime(next);
      } else {
        const timeParts = resolvePickerTime(selectedDate);
        if (!timeParts) {
          console.log('[picker:home:ignored]', JSON.stringify({ mode, reason: 'invalid-time-selectedDate' }));
          return;
        }
        const next = new Date(base.getTime());
        next.setHours(timeParts.hours, timeParts.minutes, 0, 0);
        if (formatDateInput(next) === todayDateKey && next.getTime() > now.getTime()) {
          // Keep previous value when future time is attempted for today.
          console.log('[picker:home:rejected]', JSON.stringify({ mode, reason: 'future-time', next: next.toISOString() }));
          return;
        }
        console.log('[picker:home:accepted]', JSON.stringify({ mode, next: next.toISOString() }));
        setDraftDateTime(next);
      }
    };
  }

  function onSaveDateTime(): void {
    const selected = draftDateTime ?? getEntryDateTimeValue();
    const now = new Date();
    const clamped = selected.getTime() > now.getTime() ? now : selected;
    onEntryDateChange(formatDateInput(clamped));
    onEntryTimeChange(formatTimeInput(clamped));
  }

  async function handleSendFriendRequestPress(): Promise<void> {
    await onSendFriendRequest();
  }

  async function handleSubmitComment(entryId: string): Promise<void> {
    await onAddFeedComment(entryId);
    requestAnimationFrame(() => {
      commentInputRef.current?.focus?.();
    });
  }

  const selectedIsMine = Boolean(selectedFeedItem && selectedFeedItem.subjectId === currentUserId);
  const selectedEntryDeleting = Boolean(selectedFeedItem && deletingEntryIds.includes(selectedFeedItem.entryId));
  const reactionBusy = Boolean(selectedFeedItem && feedReactionSubmittingEntryId === selectedFeedItem.entryId);
  const reactionOptions = useMemo<FeedReactionOption[]>(() => {
    const base = [...FEED_REACTION_OPTIONS];
    const seen = new Set(base.map((item) => item.key));
    const dynamicKeys = Object.keys(selectedReactionSummary?.counts ?? {});
    for (const key of dynamicKeys) {
      if (seen.has(key)) continue;
      base.push({ key, emoji: '✨', label: key });
      seen.add(key);
    }
    return base;
  }, [selectedReactionSummary]);

  return (
    <>
      <View style={styles.homeMapScreen}>
        {feedLoading ? (
          <View style={styles.homeMapLoadingOverlay}>
            <ActivityIndicator size="small" color="#f0f6fc" />
          </View>
        ) : null}

        <HomeMapSection
          themeMode={themeMode}
          entries={todayMapEntries}
          currentUserId={currentUserId}
          profilesById={profilesById}
          selectedEntryId={selectedFeedEntryId}
          addEntryLoading={addEntryLoading}
          updatingEntryLocationIds={updatingEntryLocationIds}
          fullScreen
          showComposer={showEntryComposer}
          onOpenComposer={onToggleComposer}
          onCloseComposer={onCloseComposer}
          onOpenFriends={() => setShowFriendsModal(true)}
          onPressEntryMarker={(entryId) => setSelectedFeedEntryId(entryId)}
          onUpdateEntryLocation={onUpdateEntryLocation}
          onComposerLocationChange={onComposerLocationChange}
        />

        {!!entryError ? <Text style={styles.error}>{entryError}</Text> : null}
        {!!feedError ? <Text style={styles.error}>{feedError}</Text> : null}
      </View>

      <Modal transparent visible={showFriendsModal} animationType="fade" onRequestClose={() => setShowFriendsModal(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowFriendsModal(false)}>
          <Pressable style={[styles.modalCard, styles.socialModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Friends</Text>
            <View style={styles.feedCommentComposerRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.feedCommentInput,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                ]}
                value={friendUsername}
                onChangeText={onFriendUsernameChange}
                placeholder="username"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  styles.iconButtonSecondary,
                  sendFriendRequestLoading || !friendUsername.trim() ? styles.buttonDisabled : null,
                ]}
                onPress={() => void handleSendFriendRequestPress()}
                disabled={sendFriendRequestLoading || !friendUsername.trim()}
                accessibilityLabel="Send friend request"
              >
                {sendFriendRequestLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="person-add" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {incomingRequests.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Incoming Requests</Text>
                <ScrollView style={{ maxHeight: 220 }}>
                  {incomingRequests.map((request) => {
                    const isAccepting = acceptingRequestIds.includes(request.id);
                    return (
                      <View key={request.id} style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                        <View style={styles.inlineRow}>
                          <ProfileAvatar
                            size={28}
                            avatarUrl={request.from.avatarUrl}
                            avatarTint={request.from.avatarTint}
                          />
                          <Text style={[styles.cardTitle, styles.inlineLeft, { color: colors.text }]}>
                            {request.from.displayName} (@{request.from.username})
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.buttonSecondary,
                            { backgroundColor: colors.primary, borderColor: colors.primaryBorder, borderWidth: 1 },
                            isAccepting && styles.buttonDisabled,
                          ]}
                          onPress={() => onAcceptRequest(request.id)}
                          disabled={isAccepting}
                        >
                          {isAccepting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Accept</Text>}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Friends</Text>
            <ScrollView style={{ maxHeight: 180 }}>
              {friends.map((friend) => (
                <View key={friend.id} style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <View style={styles.inlineRow}>
                    <ProfileAvatar size={28} avatarUrl={friend.avatarUrl} avatarTint={friend.avatarTint} />
                    <Text style={[styles.cardTitle, styles.inlineLeft, { color: colors.text }]}>
                      {friend.displayName} (@{friend.username})
                    </Text>
                  </View>
                </View>
              ))}
              {friends.length === 0 ? <Text style={[styles.muted, { color: colors.mutedText }]}>No accepted friends yet.</Text> : null}
            </ScrollView>

            {!!friendStatus ? <Text style={[styles.muted, { color: colors.mutedText }]}>{friendStatus}</Text> : null}
            {!!friendError ? <Text style={styles.error}>{friendError}</Text> : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(selectedFeedItem)} animationType="fade" onRequestClose={() => setSelectedFeedEntryId(null)}>
        <View style={styles.commentsDrawerOverlay}>
          <Pressable style={styles.commentsDrawerBackdrop} onPress={() => setSelectedFeedEntryId(null)} />
          <KeyboardAvoidingView
            style={styles.commentsDrawerWrap}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            pointerEvents="box-none"
          >
          <Pressable
            style={[
              styles.commentsDrawerSheet,
              {
                height: '72%',
                marginBottom: Platform.OS === 'ios' ? 0 : keyboardOffset,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {}}
          >
              {selectedFeedItem ? (
                <>
                  <View style={styles.commentsDrawerHandleWrap}>
                    <View style={[styles.commentsDrawerHandle, { backgroundColor: colors.mutedText }]} />
                  </View>
                  <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <View style={styles.feedHeaderRow}>
                      <View style={styles.feedIdentityWrap}>
                        <ProfileAvatar
                          size={34}
                          avatarUrl={profilesById[selectedFeedItem.subjectId]?.avatarUrl ?? null}
                          avatarTint={profilesById[selectedFeedItem.subjectId]?.avatarTint ?? '#5b6c8a'}
                        />
                        <View style={styles.inlineLeft}>
                          <Text style={[styles.cardTitle, { color: colors.text }]}>{selectedFeedItem.displayName}</Text>
                          <Text style={[styles.feedMetaTime, { color: colors.mutedText }]}>{formatEntryTimestamp(selectedFeedItem.occurredAt)}</Text>
                        </View>
                      </View>
                      <View style={styles.feedStatsColumn}>
                        <Text style={styles.feedMetaInline}>
                          {getRatingEmoji(selectedFeedItem.rating)} {getRatingEmotion(selectedFeedItem.rating)}
                        </Text>
                        <Text style={[styles.feedMetaInline, { color: colors.text }]}>
                          {getVolumeEmoji(selectedFeedItem.volume)} {getVolumeLabel(selectedFeedItem.volume)}
                        </Text>
                        <BristolTypeChip typeValue={selectedFeedItem.bristolType} themeMode={themeMode} />
                      </View>
                    </View>
                    <Text style={[styles.muted, { color: colors.mutedText }]}>
                      {selectedComments.length} comment{selectedComments.length === 1 ? '' : 's'}
                    </Text>
                    <View style={styles.feedReactionsRow}>
                      {reactionOptions.map((option) => {
                        const kind = option.key;
                        const count = selectedReactionSummary?.counts[kind] ?? 0;
                        const isSelected = selectedReactionSummary?.myReaction === kind;
                        return (
                          <TouchableOpacity
                            key={`reaction-${kind}`}
                            style={[
                              styles.feedReactionChip,
                              {
                                backgroundColor: isSelected ? colors.primary : colors.surface,
                                borderColor: isSelected ? colors.primaryBorder : colors.border,
                              },
                              reactionBusy ? styles.buttonDisabled : null,
                            ]}
                            onPress={() => {
                              if (!selectedFeedItem || reactionBusy) return;
                              void onToggleFeedReaction(selectedFeedItem.entryId, kind);
                            }}
                            disabled={reactionBusy}
                          >
                            <Text style={styles.feedReactionEmoji}>{option.emoji}</Text>
                            {count > 0 ? (
                              <Text style={[styles.feedReactionCount, { color: isSelected ? '#fff' : colors.mutedText }]}>
                                {count}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {selectedIsMine ? (
                      <View style={styles.feedActionsRow}>
                        <TouchableOpacity
                          style={[styles.feedActionButton, styles.iconButtonGhost, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => {
                            if (!selectedFeedItem) return;
                            const source = entries.find((entry) => entry.id === selectedFeedItem.entryId)
                              ?? todayMapEntries.find((entry) => entry.id === selectedFeedItem.entryId);
                            if (!source) return;
                            setSelectedFeedEntryId(null);
                            onEditEntry(source);
                          }}
                          accessibilityLabel="Edit entry"
                        >
                          <Ionicons name="create-outline" size={14} color={colors.text} />
                          <Text style={[styles.feedActionText, { color: colors.text }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.feedActionButton,
                            styles.iconButtonGhost,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            selectedEntryDeleting ? styles.buttonDisabled : null,
                          ]}
                          onPress={() => {
                            if (!selectedFeedItem || selectedEntryDeleting) return;
                            void onDeleteEntry(selectedFeedItem.entryId);
                          }}
                          disabled={selectedEntryDeleting}
                          accessibilityLabel="Delete entry"
                        >
                          {selectedEntryDeleting ? (
                            <ActivityIndicator size="small" color="#ff7b72" />
                          ) : (
                            <Ionicons name="trash-outline" size={14} color="#ff7b72" />
                          )}
                          <Text style={[styles.feedActionText, { color: '#ff7b72' }]}>
                            {selectedEntryDeleting ? 'Deleting...' : 'Delete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>

                  <ScrollView
                    style={styles.commentsSheetList}
                    contentContainerStyle={styles.commentsSheetScrollContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {selectedComments.map((comment) => (
                      <View key={comment.id} style={styles.feedCommentRow}>
                        <ProfileAvatar size={24} avatarUrl={comment.avatarUrl} avatarTint={comment.avatarTint} />
                        <View style={styles.feedCommentBodyWrap}>
                          <Text style={[styles.feedCommentAuthor, { color: colors.text }]}>{comment.displayName}</Text>
                          <Text style={[styles.feedCommentText, { color: colors.text }]}>{comment.body}</Text>
                          <Text style={[styles.feedCommentTime, { color: colors.mutedText }]}>{formatEntryTimestamp(comment.createdAt)}</Text>
                        </View>
                      </View>
                    ))}
                    {selectedComments.length === 0 ? <Text style={[styles.muted, { color: colors.mutedText }]}>No comments yet.</Text> : null}
                  </ScrollView>

                  <View
                    style={[
                      styles.commentsSheetComposerRow,
                      {
                        marginBottom: Platform.OS === 'ios' ? 6 : 0,
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                      },
                    ]}
                  >
                    <TextInput
                      ref={commentInputRef}
                      style={[
                        styles.input,
                        styles.feedCommentInput,
                        {
                          backgroundColor: themeMode === 'light' ? '#ffffff' : colors.inputBackground,
                          color: colors.text,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                      ]}
                      placeholder="Write a comment"
                      placeholderTextColor={colors.mutedText}
                      value={feedCommentDraftByEntry[selectedFeedItem.entryId] ?? ''}
                      onChangeText={(value) => onFeedCommentDraftChange(selectedFeedItem.entryId, value)}
                    />
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        styles.iconButtonPrimary,
                        { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
                        (feedCommentSubmittingEntryId === selectedFeedItem.entryId || !(feedCommentDraftByEntry[selectedFeedItem.entryId] ?? '').trim()) && styles.buttonDisabled,
                      ]}
                      onPress={() => void handleSubmitComment(selectedFeedItem.entryId)}
                      disabled={feedCommentSubmittingEntryId === selectedFeedItem.entryId || !(feedCommentDraftByEntry[selectedFeedItem.entryId] ?? '').trim()}
                    >
                      {feedCommentSubmittingEntryId === selectedFeedItem.entryId ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>➤</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <EntryComposerModal
        themeMode={themeMode}
        visible={showEntryComposer}
        addEntryLoading={addEntryLoading}
        isEditingEntry={isEditingEntry}
        bristolType={bristolType}
        rating={rating}
        volume={volume}
        note={note}
        showDateEditor={showDateEditor}
        pickerStep={pickerStep}
        pickerMaxDate={pickerMaxDate}
        draftDateTime={draftDateTime}
        onSetDraftDateTime={setDraftDateTime}
        getEntryDateTimeValue={getEntryDateTimeValue}
        onToggleDateEditor={() => {
          setShowDateEditor((prev) => {
            const next = !prev;
            if (next) {
              setPickerMaxDate(new Date());
              setDraftDateTime(getEntryDateTimeValue());
              setPickerStep('date');
            } else {
              setPickerStep('none');
              setDraftDateTime(null);
            }
            return next;
          });
        }}
        onPickerChange={onPickerChange}
        onGoToTimeStep={() => setPickerStep('time')}
        onSaveDateTime={onSaveDateTime}
        onBristolTypeChange={onBristolTypeChange}
        onRatingChange={onRatingChange}
        onVolumeChange={onVolumeChange}
        onNoteChange={onNoteChange}
        onNoteFocus={() => {}}
        onDateStepActionsLayout={() => {}}
        onEntryActionsRowLayout={() => {}}
        onAddEntry={onAddEntry}
        onClose={onCloseComposer}
        scrollRef={entryComposerScrollRef}
      />
    </>
  );
}

function resolvePickerDate(selectedDate?: Date): Date | null {
  const selected = selectedDate ?? null;
  if (selected && !Number.isNaN(selected.getTime()) && selected.getTime() > 0 && selected.getFullYear() >= 2000) {
    return selected;
  }
  return null;
}

function resolvePickerTime(
  selectedDate?: Date,
): { hours: number; minutes: number } | null {
  const selected = selectedDate ?? null;
  if (!selected || Number.isNaN(selected.getTime())) return null;
  if (selected.getTime() === 0) return null;
  // Ignore epoch-anchored synthetic values from iOS mount transitions.
  if (selected.getFullYear() < 2000) return null;
  return {
    hours: selected.getHours(),
    minutes: selected.getMinutes(),
  };
}

function parseLocalDateTimeInputs(dateInput: string, timeInput: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeInput.trim());
  if (!dateMatch || !timeMatch) return null;
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]) - 1;
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const parsed = new Date(year, month, day, hour, minute, 0, 0);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
