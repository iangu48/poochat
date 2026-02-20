import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ChatScreen, type ChatRoute } from './ChatScreen';
import { styles } from './styles';
import type { FeedItem, IncomingFriendRequest, Profile, ChatMessage, ChatRoom, ChatRoomInvite } from '../types/domain';
import type { SocialSection } from '../hooks/useAppController';

type Props = {
  socialSection: SocialSection;
  setSocialSection: (section: SocialSection) => void;
  feedItems: FeedItem[];
  profilesById: Record<string, Profile>;
  feedError: string;
  feedLoading: boolean;
  onRefreshFeed: () => void;
  friendUsername: string;
  friends: Profile[];
  incomingRequests: IncomingFriendRequest[];
  friendError: string;
  friendStatus: string;
  friendsLoading: boolean;
  sendFriendRequestLoading: boolean;
  acceptingRequestIds: string[];
  openDirectChatLoading: boolean;
  onFriendUsernameChange: (value: string) => void;
  onSendFriendRequest: () => Promise<void>;
  onRefreshFriends: () => void;
  onAcceptRequest: (friendshipId: string) => void;
  onOpenDirectChat: (friendUserId: string) => void;
  chatRoute: ChatRoute;
  setChatRoute: (route: ChatRoute) => void;
  activeRoomId: string;
  activeRoom: ChatRoom | null;
  activeRoomRole: 'owner' | 'admin' | 'member' | null;
  chatRooms: ChatRoom[];
  approvalsByRoom: Record<string, number>;
  approvalsRequired: ChatRoomInvite[];
  approvedInvitesForMe: ChatRoomInvite[];
  pendingInvites: ChatRoomInvite[];
  inviteParticipantLabels: Record<string, string>;
  inviteRoomLabels: Record<string, string>;
  chatRoomLabels: Record<string, string>;
  chatRoomProfiles: Record<string, Profile>;
  chatUserLabels: Record<string, string>;
  currentUserId: string;
  showCreateGroup: boolean;
  setShowCreateGroup: (next: boolean | ((prev: boolean) => boolean)) => void;
  showInviteQueue: boolean;
  setShowInviteQueue: (next: boolean | ((prev: boolean) => boolean)) => void;
  showApprovalQueue: boolean;
  setShowApprovalQueue: (next: boolean | ((prev: boolean) => boolean)) => void;
  showRoomActions: boolean;
  setShowRoomActions: (next: boolean | ((prev: boolean) => boolean)) => void;
  groupName: string;
  setGroupName: (value: string) => void;
  inviteUsername: string;
  setInviteUsername: (value: string) => void;
  messageBody: string;
  setMessageBody: (value: string) => void;
  chatRows: ChatMessage[];
  chatStatus: string;
  chatError: string;
  chatRefreshInboxLoading: boolean;
  chatCreateGroupLoading: boolean;
  chatJoinInviteIdsLoading: string[];
  chatApproveInviteIdsLoading: string[];
  chatRejectInviteIdsLoading: string[];
  chatOpenRoomLoadingId: string;
  chatProposeInviteLoading: boolean;
  chatRefreshMessagesLoading: boolean;
  chatSendMessageLoading: boolean;
  onRefreshInbox: () => void;
  onCreateGroup: () => void;
  onJoinApprovedInvite: (inviteId: string) => void;
  onApproveInvite: (inviteId: string) => void;
  onRejectInvite: (inviteId: string) => void;
  onOpenRoom: (roomId: string) => void;
  onProposeInvite: () => void;
  onRefreshMessages: () => void;
  onSendMessage: () => void;
};

export function FriendsScreen(props: Props) {
  const {
    socialSection,
    setSocialSection,
    feedItems,
    profilesById,
    feedError,
    feedLoading,
    onRefreshFeed,
    friendUsername,
    friends,
    incomingRequests,
    friendError,
    friendStatus,
    friendsLoading,
    sendFriendRequestLoading,
    acceptingRequestIds,
    openDirectChatLoading,
    onFriendUsernameChange,
    onSendFriendRequest,
    onRefreshFriends,
    onAcceptRequest,
    onOpenDirectChat,
    ...chatProps
  } = props;

  const [showFriendActions, setShowFriendActions] = useState(false);
  const [showIncomingRequests, setShowIncomingRequests] = useState(false);
  const hasFriendDropdown = showFriendActions || showIncomingRequests;

  const sortedFeed = [...feedItems].sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt));

  async function handleSendFriendRequestPress(): Promise<void> {
    await onSendFriendRequest();
    setShowFriendActions(false);
  }

  return (
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
          <TouchableOpacity
            style={[styles.segmentButton, socialSection === 'chat' && styles.segmentButtonActive]}
            onPress={() => setSocialSection('chat')}
          >
            <Text style={styles.segmentText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {socialSection === 'chat' && <ChatScreen {...chatProps} profilesById={profilesById} />}

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
              <Text style={styles.muted}>{new Date(item.occurredAt).toLocaleString()}</Text>
              <Text style={styles.cardBody}>Rating: {item.rating}</Text>
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
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    styles.iconButtonSecondary,
                    styles.inlineAction,
                    openDirectChatLoading && styles.buttonDisabled,
                  ]}
                  onPress={() => onOpenDirectChat(friend.id)}
                  disabled={openDirectChatLoading}
                  accessibilityLabel={`Open chat with ${friend.displayName}`}
                >
                  {openDirectChatLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />}
                </TouchableOpacity>
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
  );
}
