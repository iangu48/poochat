import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ChatMessage, ChatRoom, ChatRoomInvite } from '../types/domain';
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

  return (
    <ScrollView contentContainerStyle={[styles.screen, styles.chatScreenWrap]}>
      {(hasInboxDropdown || (chatRoute === 'room' && showRoomActions)) && (
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => {
            setShowCreateGroup(false);
            setShowInviteQueue(false);
            setShowApprovalQueue(false);
            setShowRoomActions(false);
          }}
        />
      )}

      {chatRoute === 'inbox' && (
        <>
          <View style={styles.chatFloatingHost}>
            <Text style={styles.title}>Chats</Text>
            <View style={styles.chatInboxActions}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setShowCreateGroup((prev) => !prev);
                  setShowInviteQueue(false);
                  setShowApprovalQueue(false);
                }}
              >
                <Text style={styles.buttonText}>New Group</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => {
                  setShowInviteQueue((prev) => !prev);
                  setShowCreateGroup(false);
                  setShowApprovalQueue(false);
                }}
              >
                <Text style={styles.buttonText}>My Invites ({approvedInvitesForMe.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => {
                  setShowApprovalQueue((prev) => !prev);
                  setShowCreateGroup(false);
                  setShowInviteQueue(false);
                }}
              >
                <Text style={styles.buttonText}>Approvals ({approvalsRequired.length})</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.buttonSecondary} onPress={onRefreshInbox}>
              <Text style={styles.buttonText}>Refresh Inbox</Text>
            </TouchableOpacity>

            {hasInboxDropdown && (
              <View style={[styles.floatingDropdown, styles.floatingDropdownInbox]}>
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
                      <Text style={styles.buttonText}>Create Group</Text>
                    </TouchableOpacity>
                  </>
                )}

                {showInviteQueue && (
                  <>
                    <Text style={styles.cardTitle}>Invites Waiting On You</Text>
                    {approvedInvitesForMe.map((invite) => (
                      <View key={invite.id} style={styles.dropdownItem}>
                        <Text style={styles.cardTitle}>Room: {inviteRoomLabels[invite.roomId] ?? invite.roomId.slice(0, 8)}</Text>
                        <Text style={styles.muted}>Proposer: {inviteParticipantLabels[invite.proposerId] ?? invite.proposerId}</Text>
                        <TouchableOpacity style={styles.button} onPress={() => onJoinApprovedInvite(invite.id)}>
                          <Text style={styles.buttonText}>Join Room</Text>
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
                        <Text style={styles.cardTitle}>Room: {inviteRoomLabels[invite.roomId] ?? invite.roomId.slice(0, 8)}</Text>
                        <Text style={styles.muted}>Invitee: {inviteParticipantLabels[invite.inviteeId] ?? invite.inviteeId}</Text>
                        <View style={styles.row}>
                          <TouchableOpacity style={styles.button} onPress={() => onApproveInvite(invite.id)}>
                            <Text style={styles.buttonText}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.buttonDangerInline} onPress={() => onRejectInvite(invite.id)}>
                            <Text style={styles.buttonText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    {approvalsRequired.length === 0 && <Text style={styles.muted}>No approvals needed.</Text>}
                  </>
                )}
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Your Chat List</Text>
          {chatRooms.map((room) => (
            <TouchableOpacity key={room.id} style={styles.chatListItem} onPress={() => onOpenRoom(room.id)}>
              <View style={styles.chatListItemHeader}>
                <Text style={styles.cardTitle}>{getRoomDisplayName(room)}</Text>
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
                style={styles.buttonSecondary}
                onPress={() => {
                  setChatRoute('inbox');
                  setShowRoomActions(false);
                }}
              >
                <Text style={styles.buttonText}>Back To Chats</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => setShowRoomActions((prev) => !prev)}>
                <Text style={styles.buttonText}>{showRoomActions ? 'Hide Actions' : 'Room Actions'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>{activeRoom ? getRoomDisplayName(activeRoom) : 'Room'}</Text>
            <Text style={styles.muted}>Room: {activeRoomId || 'No room selected'}</Text>
            <Text style={styles.muted}>Your role: {activeRoomRole ?? 'none'}</Text>

            {showRoomActions && (
              <View style={[styles.floatingDropdown, styles.floatingDropdownRoom]}>
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
                  <Text style={styles.buttonText}>Propose Invite</Text>
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>Pending Invites (This Room)</Text>
                {pendingInvites.map((invite) => (
                  <View key={invite.id} style={styles.dropdownItem}>
                    <Text style={styles.cardTitle}>Invitee: {inviteParticipantLabels[invite.inviteeId] ?? invite.inviteeId}</Text>
                    <Text style={styles.muted}>Proposed by: {inviteParticipantLabels[invite.proposerId] ?? invite.proposerId}</Text>
                    {(activeRoomRole === 'owner' || activeRoomRole === 'admin') && (
                      <View style={styles.row}>
                        <TouchableOpacity style={styles.button} onPress={() => onApproveInvite(invite.id)}>
                          <Text style={styles.buttonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonDangerInline} onPress={() => onRejectInvite(invite.id)}>
                          <Text style={styles.buttonText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
                {pendingInvites.length === 0 && <Text style={styles.muted}>No pending invites in this room.</Text>}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.buttonSecondary} onPress={onRefreshMessages}>
            <Text style={styles.buttonText}>Refresh Messages</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={messageBody}
            onChangeText={setMessageBody}
            placeholder="Type a message..."
            placeholderTextColor="#8b949e"
          />
          <TouchableOpacity style={styles.button} onPress={onSendMessage}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>

          {!!chatStatus && <Text style={styles.muted}>{chatStatus}</Text>}
          {!!chatError && <Text style={styles.error}>{chatError}</Text>}
          {chatRows.map((row) => (
            <View key={row.id} style={styles.card}>
              <Text style={styles.cardTitle}>{row.senderId}</Text>
              <Text style={styles.cardBody}>{row.body}</Text>
              <Text style={styles.muted}>{new Date(row.createdAt).toLocaleString()}</Text>
            </View>
          ))}
          {chatRows.length === 0 && <Text style={styles.muted}>No messages yet in this room.</Text>}
        </>
      )}
    </ScrollView>
  );
}

function getRoomDisplayName(room: ChatRoom): string {
  if (room.name?.trim()) return room.name.trim();
  return room.type === 'dm' ? 'Direct Room' : 'Untitled Group';
}
