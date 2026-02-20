import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatar } from '../components/ProfileAvatar';
import type { ChatMessage, ChatRoom, ChatRoomInvite, Profile } from '../types/domain';
import { styles } from './styles';

export type ChatRoute = 'inbox' | 'room';

type Props = {
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
  profilesById: Record<string, Profile>;
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

export function ChatScreen(props: Props) {
  const {
    chatRoute,
    setChatRoute,
    activeRoomId,
    activeRoom,
    activeRoomRole,
    chatRooms,
    approvalsByRoom,
    approvalsRequired,
    approvedInvitesForMe,
    pendingInvites,
    inviteParticipantLabels,
    inviteRoomLabels,
    chatRoomLabels,
    chatRoomProfiles,
    chatUserLabels,
    profilesById,
    currentUserId,
    showCreateGroup,
    setShowCreateGroup,
    showInviteQueue,
    setShowInviteQueue,
    showApprovalQueue,
    setShowApprovalQueue,
    showRoomActions,
    setShowRoomActions,
    groupName,
    setGroupName,
    inviteUsername,
    setInviteUsername,
    messageBody,
    setMessageBody,
    chatRows,
    chatStatus,
    chatError,
    onRefreshInbox,
    onCreateGroup,
    onJoinApprovedInvite,
    onApproveInvite,
    onRejectInvite,
    onOpenRoom,
    onProposeInvite,
    onRefreshMessages,
    onSendMessage,
  } = props;

  const hasInboxDropdown = showCreateGroup || showInviteQueue || showApprovalQueue;
  const messageGroups = groupSequentialMessages(chatRows);

  return (
    <ScrollView contentContainerStyle={[styles.screen, styles.chatScreenWrap]}>

      {chatRoute === 'inbox' && (
        <>
          <View style={styles.chatFloatingHost}>
            <Text style={styles.title}>Chats</Text>
            <View style={styles.chatInboxActions}>
              <TouchableOpacity
                style={[styles.iconButton, styles.iconButtonPrimary]}
                onPress={() => {
                  setShowCreateGroup((prev) => !prev);
                  setShowInviteQueue(false);
                  setShowApprovalQueue(false);
                }}
                accessibilityLabel="New group"
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.iconButtonSecondary]}
                onPress={() => {
                  setShowInviteQueue((prev) => !prev);
                  setShowCreateGroup(false);
                  setShowApprovalQueue(false);
                }}
                accessibilityLabel="My invites"
              >
                <Ionicons name="mail" size={18} color="#fff" />
              </TouchableOpacity>
              {approvedInvitesForMe.length > 0 ? <Text style={styles.chatBadge}>{approvedInvitesForMe.length}</Text> : null}
              <TouchableOpacity
                style={[styles.iconButton, styles.iconButtonSecondary]}
                onPress={() => {
                  setShowApprovalQueue((prev) => !prev);
                  setShowCreateGroup(false);
                  setShowInviteQueue(false);
                }}
                accessibilityLabel="Approvals"
              >
                <Ionicons name="checkmark-done" size={20} color="#fff" />
              </TouchableOpacity>
              {approvalsRequired.length > 0 ? <Text style={styles.chatBadge}>{approvalsRequired.length}</Text> : null}
              <TouchableOpacity style={[styles.iconButton, styles.iconButtonGhost]} onPress={onRefreshInbox} accessibilityLabel="Refresh inbox">
                <Ionicons name="refresh" size={18} color="#f0f6fc" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Your Chat List</Text>
          {chatRooms.map((room) => (
            <TouchableOpacity key={room.id} style={styles.chatListItem} onPress={() => onOpenRoom(room.id)}>
              <View style={styles.chatListItemHeader}>
                <View style={styles.inlineRow}>
                  {room.type === 'dm' ? (
                    <ProfileAvatar
                      size={32}
                      avatarUrl={chatRoomProfiles[room.id]?.avatarUrl ?? null}
                      avatarTint={chatRoomProfiles[room.id]?.avatarTint ?? '#5b6c8a'}
                    />
                  ) : null}
                  <Text style={[styles.cardTitle, styles.inlineLeft]}>{getRoomDisplayName(room, chatRoomLabels)}</Text>
                </View>
                {approvalsByRoom[room.id] ? <Text style={styles.chatBadge}>{approvalsByRoom[room.id]} pending</Text> : null}
              </View>
              <Text style={styles.muted}>{room.type === 'dm' ? 'Direct chat' : 'Group chat'}</Text>
              <Text style={styles.muted}>{new Date(room.createdAt).toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
          {chatRooms.length === 0 && <Text style={styles.muted}>No chats yet.</Text>}
        </>
      )}

      {chatRoute === 'room' && (
        <>
          <View style={styles.chatFloatingHost}>
            <View style={styles.chatRoomHeader}>
              <TouchableOpacity
                style={[styles.iconButton, styles.iconButtonGhost]}
                onPress={() => {
                  setChatRoute('inbox');
                  setShowRoomActions(false);
                }}
                accessibilityLabel="Back to chats"
              >
                <Ionicons name="arrow-back" size={18} color="#f0f6fc" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.iconButtonGhost]}
                onPress={() => setShowRoomActions((prev) => !prev)}
                accessibilityLabel="Room actions"
              >
                <Ionicons name={showRoomActions ? 'close' : 'ellipsis-horizontal'} size={18} color="#f0f6fc" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.iconButtonGhost]}
                onPress={onRefreshMessages}
                accessibilityLabel="Refresh messages"
              >
                <Ionicons name="refresh" size={18} color="#f0f6fc" />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>{activeRoom ? getRoomDisplayName(activeRoom, chatRoomLabels) : 'Room'}</Text>
            <Text style={styles.muted}>Your role: {activeRoomRole ?? 'none'}</Text>

          </View>

          <View style={styles.messageComposerRow}>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={messageBody}
              onChangeText={setMessageBody}
              placeholder="Type a message..."
              placeholderTextColor="#8b949e"
            />
            <TouchableOpacity
              style={[styles.iconButton, styles.iconButtonPrimary, styles.inlineAction]}
              onPress={onSendMessage}
              accessibilityLabel="Send message"
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {!!chatStatus && <Text style={styles.muted}>{chatStatus}</Text>}
          {!!chatError && <Text style={styles.error}>{chatError}</Text>}
          {messageGroups.map((group) => (
            <View key={group.id} style={styles.card}>
              <View style={styles.inlineRow}>
                <ProfileAvatar
                  size={30}
                  avatarUrl={profilesById[group.senderId]?.avatarUrl ?? null}
                  avatarTint={profilesById[group.senderId]?.avatarTint ?? '#5b6c8a'}
                />
                <Text style={[styles.cardTitle, styles.inlineLeft]}>
                  {group.senderId === currentUserId ? 'You' : chatUserLabels[group.senderId] ?? 'Member'}
                </Text>
              </View>
              {group.rows.map((row, index) => (
                <Text
                  key={row.id}
                  style={[
                    styles.chatGroupMessage,
                    index === group.rows.length - 1 ? styles.chatGroupMessageLast : null,
                  ]}
                >
                  {row.body}
                </Text>
              ))}
              <Text style={styles.muted}>{new Date(group.rows[0].createdAt).toLocaleString()}</Text>
            </View>
          ))}
          {chatRows.length === 0 && <Text style={styles.muted}>No messages yet in this room.</Text>}
        </>
      )}

      <Modal
        transparent
        visible={hasInboxDropdown}
        animationType="fade"
        onRequestClose={() => {
          setShowCreateGroup(false);
          setShowInviteQueue(false);
          setShowApprovalQueue(false);
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            setShowCreateGroup(false);
            setShowInviteQueue(false);
            setShowApprovalQueue(false);
          }}
        >
          <Pressable style={[styles.modalCard, styles.chatModalCard]} onPress={() => {}}>
            {showCreateGroup && (
              <>
                <Text style={styles.cardTitle}>Create Invite-Only Group</Text>
                <TextInput
                  style={styles.input}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Group name"
                  placeholderTextColor="#8b949e"
                />
                <TouchableOpacity style={styles.button} onPress={onCreateGroup}>
                  <View style={styles.buttonContentRow}>
                    <Ionicons name="add-circle" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Create Group</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {showInviteQueue && (
              <>
                <Text style={styles.cardTitle}>Invites Waiting On You</Text>
                {approvedInvitesForMe.map((invite) => (
                  <View key={invite.id} style={styles.dropdownItem}>
                    <Text style={styles.cardTitle}>Room: {inviteRoomLabels[invite.roomId] ?? 'Direct Chat'}</Text>
                    <View style={styles.inlineRow}>
                      <ProfileAvatar
                        size={28}
                        avatarUrl={profilesById[invite.proposerId]?.avatarUrl ?? null}
                        avatarTint={profilesById[invite.proposerId]?.avatarTint ?? '#5b6c8a'}
                      />
                      <Text style={[styles.muted, styles.inlineLeft]}>
                        Proposer: {inviteParticipantLabels[invite.proposerId] ?? 'Member'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={() => onJoinApprovedInvite(invite.id)}>
                      <View style={styles.buttonContentRow}>
                        <Ionicons name="enter" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Join Room</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
                {approvedInvitesForMe.length === 0 && <Text style={styles.muted}>No invites ready to join.</Text>}
              </>
            )}

            {showApprovalQueue && (
              <>
                <Text style={styles.cardTitle}>Approvals Required</Text>
                {approvalsRequired.map((invite) => (
                  <View key={invite.id} style={styles.dropdownItem}>
                    <Text style={styles.cardTitle}>Room: {inviteRoomLabels[invite.roomId] ?? 'Direct Chat'}</Text>
                    <View style={styles.inlineRow}>
                      <ProfileAvatar
                        size={28}
                        avatarUrl={profilesById[invite.inviteeId]?.avatarUrl ?? null}
                        avatarTint={profilesById[invite.inviteeId]?.avatarTint ?? '#5b6c8a'}
                      />
                      <Text style={[styles.muted, styles.inlineLeft]}>
                        Invitee: {inviteParticipantLabels[invite.inviteeId] ?? 'Member'}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <TouchableOpacity style={styles.button} onPress={() => onApproveInvite(invite.id)}>
                        <View style={styles.buttonContentRow}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.buttonText}>Approve</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.buttonDangerInline} onPress={() => onRejectInvite(invite.id)}>
                        <View style={styles.buttonContentRow}>
                          <Ionicons name="close" size={16} color="#fff" />
                          <Text style={styles.buttonText}>Reject</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {approvalsRequired.length === 0 && <Text style={styles.muted}>No approvals needed.</Text>}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={chatRoute === 'room' && showRoomActions}
        animationType="fade"
        onRequestClose={() => setShowRoomActions(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowRoomActions(false)}>
          <Pressable style={[styles.modalCard, styles.chatModalCard]} onPress={() => {}}>
            <Text style={styles.cardTitle}>Invite / Manage Group</Text>
            <Text style={styles.label}>Propose Invite By Username</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={inviteUsername}
              onChangeText={setInviteUsername}
              placeholder="username"
              placeholderTextColor="#8b949e"
            />
            <TouchableOpacity style={styles.button} onPress={onProposeInvite}>
              <View style={styles.buttonContentRow}>
                <Ionicons name="person-add" size={16} color="#fff" />
                <Text style={styles.buttonText}>Propose Invite</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Pending Invites (This Room)</Text>
            {pendingInvites.map((invite) => (
              <View key={invite.id} style={styles.dropdownItem}>
                <View style={styles.inlineRow}>
                  <ProfileAvatar
                    size={28}
                    avatarUrl={profilesById[invite.inviteeId]?.avatarUrl ?? null}
                    avatarTint={profilesById[invite.inviteeId]?.avatarTint ?? '#5b6c8a'}
                  />
                  <Text style={[styles.cardTitle, styles.inlineLeft]}>
                    Invitee: {inviteParticipantLabels[invite.inviteeId] ?? 'Member'}
                  </Text>
                </View>
                <View style={styles.inlineRow}>
                  <ProfileAvatar
                    size={28}
                    avatarUrl={profilesById[invite.proposerId]?.avatarUrl ?? null}
                    avatarTint={profilesById[invite.proposerId]?.avatarTint ?? '#5b6c8a'}
                  />
                  <Text style={[styles.muted, styles.inlineLeft]}>
                    Proposed by: {inviteParticipantLabels[invite.proposerId] ?? 'Member'}
                  </Text>
                </View>
                {(activeRoomRole === 'owner' || activeRoomRole === 'admin') && (
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.button} onPress={() => onApproveInvite(invite.id)}>
                      <View style={styles.buttonContentRow}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Approve</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonDangerInline} onPress={() => onRejectInvite(invite.id)}>
                      <View style={styles.buttonContentRow}>
                        <Ionicons name="close" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Reject</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            {pendingInvites.length === 0 && <Text style={styles.muted}>No pending invites in this room.</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function getRoomDisplayName(room: ChatRoom, labels: Record<string, string>): string {
  const roomLabel = labels[room.id];
  if (roomLabel?.trim()) return roomLabel.trim();
  if (room.name?.trim()) return room.name.trim();
  return room.type === 'dm' ? 'Direct Chat' : 'Untitled Group';
}

type MessageGroup = {
  id: string;
  senderId: string;
  rows: ChatMessage[];
};

function groupSequentialMessages(rows: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.senderId === row.senderId) {
      last.rows.push(row);
      continue;
    }
    groups.push({ id: row.id, senderId: row.senderId, rows: [row] });
  }
  return groups;
}
