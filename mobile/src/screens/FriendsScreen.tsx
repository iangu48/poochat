import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Keyboard, Modal, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { styles } from './styles';
import { BristolTypeChip } from './home/components/EntryVisuals';
import { formatEntryTimestamp, getRatingEmoji, getRatingEmotion } from './home/utils';
import type { FeedComment, FeedItem, IncomingFriendRequest, Profile } from '../types/domain';
import type { SocialSection } from '../hooks/useAppController';

type Props = {
  socialSection: SocialSection;
  setSocialSection: (section: SocialSection) => void;
  feedItems: FeedItem[];
  profilesById: Record<string, Profile>;
  feedCommentsByEntry: Record<string, FeedComment[]>;
  feedCommentDraftByEntry: Record<string, string>;
  feedCommentSubmittingEntryId: string;
  feedError: string;
  feedLoading: boolean;
  onRefreshFeed: () => void;
  onFeedCommentDraftChange: (entryId: string, value: string) => void;
  onAddFeedComment: (entryId: string) => Promise<void>;
  friendUsername: string;
  friends: Profile[];
  incomingRequests: IncomingFriendRequest[];
  friendError: string;
  friendStatus: string;
  friendsLoading: boolean;
  sendFriendRequestLoading: boolean;
  acceptingRequestIds: string[];
  onFriendUsernameChange: (value: string) => void;
  onSendFriendRequest: () => Promise<void>;
  onRefreshFriends: () => void;
  onAcceptRequest: (friendshipId: string) => void;
};

export function FriendsScreen(props: Props) {
  const {
    socialSection,
    setSocialSection,
    feedItems,
    profilesById,
    feedCommentsByEntry,
    feedCommentDraftByEntry,
    feedCommentSubmittingEntryId,
    feedError,
    feedLoading,
    onRefreshFeed,
    onFeedCommentDraftChange,
    onAddFeedComment,
    friendUsername,
    friends,
    incomingRequests,
    friendError,
    friendStatus,
    friendsLoading,
    sendFriendRequestLoading,
    acceptingRequestIds,
    onFriendUsernameChange,
    onSendFriendRequest,
    onRefreshFriends,
    onAcceptRequest,
  } = props;

  const [showFriendActions, setShowFriendActions] = useState(false);
  const [showIncomingRequests, setShowIncomingRequests] = useState(false);
  const [selectedFeedEntryId, setSelectedFeedEntryId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const hasFriendDropdown = showFriendActions || showIncomingRequests;

  const commentInputRef = useRef<any>(null);
  const screenHeight = Dimensions.get('window').height;
  const minDrawerHeight = Math.round(screenHeight * 0.72);
  const maxDrawerHeight = Math.round(screenHeight * 0.92);
  const drawerHeight = useRef(new Animated.Value(minDrawerHeight)).current;
  const drawerHeightRef = useRef(minDrawerHeight);
  const panStartHeightRef = useRef(minDrawerHeight);
  const sortedFeed = [...feedItems].sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt));
  const selectedFeedItem = selectedFeedEntryId ? sortedFeed.find((item) => item.entryId === selectedFeedEntryId) ?? null : null;
  const selectedComments = selectedFeedEntryId ? feedCommentsByEntry[selectedFeedEntryId] ?? [] : [];

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

  async function handleSendFriendRequestPress(): Promise<void> {
    await onSendFriendRequest();
    setShowFriendActions(false);
  }

  function openCommentsSheet(entryId: string): void {
    setSelectedFeedEntryId(entryId);
    drawerHeight.setValue(minDrawerHeight);
    drawerHeightRef.current = minDrawerHeight;
  }

  function closeCommentsSheet(): void {
    setSelectedFeedEntryId(null);
  }

  async function handleSubmitComment(entryId: string): Promise<void> {
    await onAddFeedComment(entryId);
    requestAnimationFrame(() => {
      commentInputRef.current?.focus?.();
    });
  }

  function clampHeight(value: number): number {
    return Math.max(minDrawerHeight, Math.min(maxDrawerHeight, value));
  }

  function animateDrawerTo(target: number): void {
    Animated.spring(drawerHeight, {
      toValue: target,
      useNativeDriver: false,
      bounciness: 0,
      speed: 20,
    }).start(() => {
      drawerHeightRef.current = target;
    });
  }

  const drawerHandlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: () => {
        panStartHeightRef.current = drawerHeightRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const next = clampHeight(panStartHeightRef.current - gestureState.dy);
        drawerHeight.setValue(next);
      },
      onPanResponderRelease: (_, gestureState) => {
        const next = clampHeight(panStartHeightRef.current - gestureState.dy);
        drawerHeightRef.current = next;

        if (gestureState.dy > 140 && next <= minDrawerHeight + 8) {
          closeCommentsSheet();
          return;
        }

        if (gestureState.vy < -0.5) {
          animateDrawerTo(maxDrawerHeight);
          return;
        }

        if (gestureState.vy > 0.5) {
          animateDrawerTo(minDrawerHeight);
          return;
        }

        const midpoint = minDrawerHeight + (maxDrawerHeight - minDrawerHeight) / 2;
        animateDrawerTo(next >= midpoint ? maxDrawerHeight : minDrawerHeight);
      },
    }),
  ).current;

  return (
    <>
      <ScrollView contentContainerStyle={[styles.screen, styles.socialWrap]}>
        <View style={styles.socialHeader}>
        <Text style={styles.title}>Social</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentButton, socialSection === 'feed' && styles.segmentButtonActive]}
            onPress={() => setSocialSection('feed')}
          >
            <Text style={styles.segmentText}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, socialSection === 'friends' && styles.segmentButtonActive]}
            onPress={() => setSocialSection('friends')}
          >
            <Text style={styles.segmentText}>Friends</Text>
          </TouchableOpacity>
        </View>
      </View>

      {socialSection === 'feed' && (
        <>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonGhost, feedLoading && styles.buttonDisabled]}
            onPress={onRefreshFeed}
            accessibilityLabel="Refresh feed"
            disabled={feedLoading}
          >
            {feedLoading ? <ActivityIndicator size="small" color="#f0f6fc" /> : <Ionicons name="refresh" size={18} color="#f0f6fc" />}
          </TouchableOpacity>
          {!!feedError && <Text style={styles.error}>{feedError}</Text>}
          {sortedFeed.map((item) => (
            <View key={item.entryId} style={styles.card}>
              <View style={styles.feedHeaderRow}>
                <View style={styles.feedIdentityWrap}>
                  <ProfileAvatar
                    size={34}
                    avatarUrl={profilesById[item.subjectId]?.avatarUrl ?? null}
                    avatarTint={profilesById[item.subjectId]?.avatarTint ?? '#5b6c8a'}
                  />
                  <View style={styles.inlineLeft}>
                    <Text style={styles.cardTitle}>{item.displayName}</Text>
                    <Text style={styles.feedMetaTime}>{formatEntryTimestamp(item.occurredAt)}</Text>
                  </View>
                </View>
                <View style={styles.feedStatsColumn}>
                  <Text style={styles.feedMetaInline}>
                    {getRatingEmoji(item.rating)} {getRatingEmotion(item.rating)}
                  </Text>
                  <BristolTypeChip typeValue={item.bristolType} />
                </View>
              </View>
              <View style={styles.feedActionsRow}>
                <TouchableOpacity
                  style={[styles.feedActionButton, styles.iconButtonGhost]}
                  onPress={() => openCommentsSheet(item.entryId)}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#c9d1d9" />
                  <Text style={styles.feedActionText}>Add comment</Text>
                </TouchableOpacity>
                {(feedCommentsByEntry[item.entryId] ?? []).length > 0 ? (
                  <TouchableOpacity
                    style={[styles.feedActionButton, styles.iconButtonGhost]}
                    onPress={() => openCommentsSheet(item.entryId)}
                  >
                    <Ionicons name="chatbubbles-outline" size={14} color="#c9d1d9" />
                    <Text style={styles.feedActionText}>
                      Comments ({(feedCommentsByEntry[item.entryId] ?? []).length})
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
          {sortedFeed.length === 0 && <Text style={styles.muted}>No feed events yet.</Text>}
        </>
      )}

      {socialSection === 'friends' && (
        <View style={styles.chatFloatingHost}>
          <View style={styles.socialActionsRow}>
            <TouchableOpacity
              style={[styles.iconButton, styles.iconButtonPrimary, sendFriendRequestLoading && styles.buttonDisabled]}
              onPress={() => {
                setShowFriendActions((prev) => !prev);
                setShowIncomingRequests(false);
              }}
              accessibilityLabel="Friend actions"
              disabled={sendFriendRequestLoading}
            >
              {sendFriendRequestLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="person-add" size={18} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.iconButtonSecondary, friendsLoading && styles.buttonDisabled]}
              onPress={() => {
                setShowIncomingRequests((prev) => !prev);
                setShowFriendActions(false);
              }}
              accessibilityLabel="Incoming requests"
              disabled={friendsLoading}
            >
              {friendsLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="mail" size={18} color="#fff" />}
            </TouchableOpacity>
            {incomingRequests.length > 0 ? <Text style={styles.chatBadge}>{incomingRequests.length}</Text> : null}
            <TouchableOpacity
              style={[styles.iconButton, styles.iconButtonGhost, friendsLoading && styles.buttonDisabled]}
              onPress={onRefreshFriends}
              accessibilityLabel="Refresh friends"
              disabled={friendsLoading}
            >
              {friendsLoading ? <ActivityIndicator size="small" color="#f0f6fc" /> : <Ionicons name="refresh" size={18} color="#f0f6fc" />}
            </TouchableOpacity>
          </View>

          {!!friendStatus && <Text style={styles.muted}>{friendStatus}</Text>}
          {!!friendError && <Text style={styles.error}>{friendError}</Text>}

          <Text style={styles.sectionTitle}>Your Friends</Text>
          {friends.map((friend) => (
            <View key={friend.id} style={styles.card}>
              <View style={styles.inlineRow}>
                <ProfileAvatar size={34} avatarUrl={friend.avatarUrl} avatarTint={friend.avatarTint} />
                <Text style={[styles.cardTitle, styles.inlineLeft]}>
                  {friend.displayName} (@{friend.username})
                </Text>
              </View>
            </View>
          ))}
          {friends.length === 0 && <Text style={styles.muted}>No accepted friends yet.</Text>}
        </View>
      )}

      <Modal
        transparent
        visible={hasFriendDropdown}
        animationType="fade"
        onRequestClose={() => {
          setShowFriendActions(false);
          setShowIncomingRequests(false);
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            setShowFriendActions(false);
            setShowIncomingRequests(false);
          }}
        >
          <Pressable style={[styles.modalCard, styles.socialModalCard]} onPress={() => {}}>
            {showFriendActions && (
              <>
                <Text style={styles.cardTitle}>Add Friend</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  value={friendUsername}
                  onChangeText={onFriendUsernameChange}
                  placeholder="username"
                  placeholderTextColor="#8b949e"
                />
                <TouchableOpacity
                  style={[styles.button, sendFriendRequestLoading && styles.buttonDisabled]}
                  onPress={() => void handleSendFriendRequestPress()}
                  disabled={sendFriendRequestLoading}
                >
                  <View style={styles.buttonContentRow}>
                    {sendFriendRequestLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="paper-plane" size={16} color="#fff" />}
                    <Text style={styles.buttonText}>{sendFriendRequestLoading ? 'Sending...' : 'Send Request'}</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {showIncomingRequests && (
              <>
                <Text style={styles.cardTitle}>Incoming Requests</Text>
                {incomingRequests.map((request) => (
                  <View key={request.id} style={styles.dropdownItem}>
                    <View style={styles.inlineRow}>
                      <ProfileAvatar
                        size={32}
                        avatarUrl={request.from.avatarUrl}
                        avatarTint={request.from.avatarTint}
                      />
                      <Text style={[styles.cardTitle, styles.inlineLeft]}>
                        {request.from.displayName} (@{request.from.username})
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.button, acceptingRequestIds.includes(request.id) && styles.buttonDisabled]}
                      onPress={() => onAcceptRequest(request.id)}
                      disabled={acceptingRequestIds.includes(request.id)}
                    >
                      <View style={styles.buttonContentRow}>
                        {acceptingRequestIds.includes(request.id) ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
                        <Text style={styles.buttonText}>{acceptingRequestIds.includes(request.id) ? 'Accepting...' : 'Accept'}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
                {incomingRequests.length === 0 && <Text style={styles.muted}>No incoming requests.</Text>}
              </>
            )}
          </Pressable>
        </Pressable>
        </Modal>
      </ScrollView>

      <Modal
        transparent
        visible={Boolean(selectedFeedEntryId)}
        animationType="slide"
        onRequestClose={closeCommentsSheet}
      >
        <View style={styles.commentsDrawerOverlay}>
          <Pressable style={styles.commentsDrawerBackdrop} onPress={closeCommentsSheet} />
          <View style={styles.commentsDrawerWrap}>
            <Animated.View style={[styles.commentsDrawerSheet, { height: drawerHeight }]}>
              <View style={styles.commentsDrawerHandleWrap} {...drawerHandlePanResponder.panHandlers}>
                <View style={styles.commentsDrawerHandle} />
              </View>
              {selectedFeedItem ? (
                <View style={styles.commentsSheetHeader}>
                  <View style={styles.feedHeaderRow}>
                    <View style={styles.feedIdentityWrap}>
                      <ProfileAvatar
                        size={32}
                        avatarUrl={profilesById[selectedFeedItem.subjectId]?.avatarUrl ?? null}
                        avatarTint={profilesById[selectedFeedItem.subjectId]?.avatarTint ?? '#5b6c8a'}
                      />
                      <View style={styles.inlineLeft}>
                        <Text style={styles.cardTitle}>{selectedFeedItem.displayName}</Text>
                        <Text style={styles.feedMetaTime}>{formatEntryTimestamp(selectedFeedItem.occurredAt)}</Text>
                      </View>
                    </View>
                    <View style={styles.feedStatsColumn}>
                      <Text style={styles.feedMetaInline}>
                        {getRatingEmoji(selectedFeedItem.rating)} {getRatingEmotion(selectedFeedItem.rating)}
                      </Text>
                      <BristolTypeChip typeValue={selectedFeedItem.bristolType} />
                    </View>
                  </View>
                  <Text style={styles.commentsSheetSubtitle}>
                    {selectedComments.length} comment{selectedComments.length === 1 ? '' : 's'}
                  </Text>
                </View>
              ) : null}
              <FlatList<FeedComment>
                style={styles.commentsSheetList}
                contentContainerStyle={styles.commentsSheetScrollContent}
                data={selectedComments}
                keyExtractor={(comment: FeedComment) => comment.id}
                renderItem={({ item: comment }: { item: FeedComment }) => (
                  <View style={styles.feedCommentRow}>
                    <ProfileAvatar size={22} avatarUrl={comment.avatarUrl} avatarTint={comment.avatarTint} />
                    <View style={styles.feedCommentBodyWrap}>
                      <Text style={styles.feedCommentAuthor}>{comment.displayName}</Text>
                      <Text style={styles.feedCommentText}>{comment.body}</Text>
                      <Text style={styles.feedCommentTime}>{formatEntryTimestamp(comment.createdAt)}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.muted}>No comments yet.</Text>}
                ItemSeparatorComponent={() => <View style={styles.commentsSheetItemGap} />}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              />
              {selectedFeedEntryId ? (
                <View style={[styles.commentsSheetComposerRow, { marginBottom: keyboardOffset }]}>
                  <TextInput
                    ref={commentInputRef}
                    style={[styles.input, styles.feedCommentInput]}
                    value={feedCommentDraftByEntry[selectedFeedEntryId] ?? ''}
                    onChangeText={(value) => onFeedCommentDraftChange(selectedFeedEntryId, value)}
                    placeholder="Write a comment"
                    placeholderTextColor="#8b949e"
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={[styles.iconButton, styles.iconButtonSecondary, styles.inlineAction, feedCommentSubmittingEntryId === selectedFeedEntryId && styles.buttonDisabled]}
                    onPress={() => void handleSubmitComment(selectedFeedEntryId)}
                    disabled={feedCommentSubmittingEntryId === selectedFeedEntryId}
                    accessibilityLabel="Send comment"
                  >
                    {feedCommentSubmittingEntryId === selectedFeedEntryId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={15} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </Animated.View>
          </View>
        </View>
      </Modal>
    </>
  );
}
