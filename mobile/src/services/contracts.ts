import type {
  ChatMessage,
  ChatRoom,
  ChatRoomInvite,
  FeedItem,
  FeedComment,
  FeedReactionKind,
  FeedReactionSummary,
  IncomingFriendRequest,
  LeaderboardRow,
  PoopEntry,
  Profile,
  TriggerTag,
  UUID,
} from '../types/domain';

export type NewPoopEntryInput = {
  occurredAt: string;
  bristolType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  rating: 1 | 2 | 3 | 4 | 5;
  volume: 0 | 1 | 2 | 3 | 4;
  note?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: 'gps' | 'manual';
  triggerTagIds?: UUID[];
};

export interface PoopService {
  listMine(limit?: number, userId?: UUID): Promise<PoopEntry[]>;
  createMine(input: NewPoopEntryInput, userId?: UUID): Promise<PoopEntry>;
  updateMine(
    entryId: UUID,
    input: Partial<Pick<NewPoopEntryInput, 'occurredAt' | 'bristolType' | 'rating' | 'volume' | 'note' | 'latitude' | 'longitude' | 'locationSource' | 'triggerTagIds'>>,
    userId?: UUID
  ): Promise<PoopEntry>;
  deleteMine(entryId: UUID, userId?: UUID): Promise<void>;
}

export interface TriggerTagService {
  listAvailable(userId?: UUID): Promise<TriggerTag[]>;
}

export interface FriendsService {
  sendRequest(friendUserId: UUID, userId?: UUID): Promise<void>;
  acceptRequest(friendshipId: UUID): Promise<void>;
  listAccepted(userId?: UUID): Promise<Profile[]>;
  listIncomingPending(userId?: UUID): Promise<IncomingFriendRequest[]>;
}

export type UpsertProfileInput = {
  username: string;
  displayName: string;
};

export interface ProfileService {
  getMine(userId?: UUID): Promise<Profile | null>;
  upsertMine(input: UpsertProfileInput, userId?: UUID): Promise<Profile>;
  setShareFeed(enabled: boolean, userId?: UUID): Promise<Profile>;
  uploadAvatar(imageUri: string, mimeType?: string, base64Data?: string, userId?: UUID): Promise<Profile>;
  findByUsername(username: string): Promise<Profile | null>;
}

export interface LeaderboardService {
  listYear(year: number, userId?: UUID): Promise<LeaderboardRow[]>;
}

export interface FeedService {
  listMineAndFriends(limit?: number): Promise<FeedItem[]>;
  listCommentsByEntryIds(entryIds: UUID[], limitPerEntry?: number): Promise<Record<UUID, FeedComment[]>>;
  listReactionsByEntryIds(entryIds: UUID[], userId?: UUID): Promise<Record<UUID, FeedReactionSummary>>;
  addComment(entryId: UUID, body: string, userId?: UUID): Promise<FeedComment>;
  toggleReaction(entryId: UUID, reaction: FeedReactionKind, userId?: UUID): Promise<{ entryId: UUID; myReaction: FeedReactionKind | null }>;
}

export interface ChatService {
  createOrGetDirectRoom(friendUserId: UUID, userId?: UUID): Promise<UUID>;
  createGroupRoom(name: string, userId?: UUID): Promise<ChatRoom>;
  listRooms(userId?: UUID): Promise<ChatRoom[]>;
  getMyRoleInRoom(roomId: UUID, userId?: UUID): Promise<'owner' | 'admin' | 'member' | null>;
  proposeInvite(roomId: UUID, inviteeId: UUID, userId?: UUID): Promise<ChatRoomInvite>;
  listMyApprovedInvites(userId?: UUID): Promise<ChatRoomInvite[]>;
  joinApprovedInvite(inviteId: UUID, userId?: UUID): Promise<void>;
  approveInvite(inviteId: UUID, userId?: UUID): Promise<void>;
  rejectInvite(inviteId: UUID): Promise<void>;
  listPendingInvites(roomId: UUID): Promise<ChatRoomInvite[]>;
  listMessages(roomId: UUID, limit?: number): Promise<ChatMessage[]>;
  sendMessage(roomId: UUID, body: string, userId?: UUID): Promise<ChatMessage>;
}
