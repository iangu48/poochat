import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChatScreen, type ChatRoute } from './ChatScreen';
import { styles } from './styles';
import type { FeedItem, IncomingFriendRequest, Profile, ChatMessage, ChatRoom, ChatRoomInvite } from '../types/domain';
import type { SocialSection } from '../hooks/useAppController';

type Props = {
  socialSection: SocialSection;
  setSocialSection: (section: SocialSection) => void;
  feedItems: FeedItem[];
  feedError: string;
  onRefreshFeed: () => void;
  friendUsername: string;
  friends: Profile[];
  incomingRequests: IncomingFriendRequest[];
  friendError: string;
  friendStatus: string;
  onFriendUsernameChange: (value: string) => void;
  onSendFriendRequest: () => void;
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
    feedError,
    onRefreshFeed,
    friendUsername,
    friends,
    incomingRequests,
    friendError,
    friendStatus,
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

      {socialSection === 'chat' && <ChatScreen {...chatProps} />}

      {socialSection === 'feed' && (
        <>
          <TouchableOpacity style={styles.buttonSecondary} onPress={onRefreshFeed}>
            <Text style={styles.buttonText}>Refresh Feed</Text>
          </TouchableOpacity>
          {!!feedError && <Text style={styles.error}>{feedError}</Text>}
          {sortedFeed.map((item) => (
            <View key={item.entryId} style={styles.card}>
              <Text style={styles.cardTitle}>
                {item.displayName} (@{item.username})
              </Text>
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
              style={styles.button}
              onPress={() => {
                setShowFriendActions((prev) => !prev);
                setShowIncomingRequests(false);
              }}
            >
              <Text style={styles.buttonText}>Actions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => {
                setShowIncomingRequests((prev) => !prev);
                setShowFriendActions(false);
              }}
            >
              <Text style={styles.buttonText}>Requests ({incomingRequests.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={onRefreshFriends}>
              <Text style={styles.buttonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {!!friendStatus && <Text style={styles.muted}>{friendStatus}</Text>}
          {!!friendError && <Text style={styles.error}>{friendError}</Text>}

          <Text style={styles.sectionTitle}>Your Friends</Text>
          {friends.map((friend) => (
            <View key={friend.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {friend.displayName} (@{friend.username})
              </Text>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => onOpenDirectChat(friend.id)}>
                <Text style={styles.buttonText}>Open Chat</Text>
              </TouchableOpacity>
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
                <TouchableOpacity style={styles.button} onPress={onSendFriendRequest}>
                  <Text style={styles.buttonText}>Send Request</Text>
                </TouchableOpacity>
              </>
            )}

            {showIncomingRequests && (
              <>
                <Text style={styles.cardTitle}>Incoming Requests</Text>
                {incomingRequests.map((request) => (
                  <View key={request.id} style={styles.dropdownItem}>
                    <Text style={styles.cardTitle}>
                      {request.from.displayName} (@{request.from.username})
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={() => onAcceptRequest(request.id)}>
                      <Text style={styles.buttonText}>Accept</Text>
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
