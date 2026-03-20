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
};

export interface PoopService {
  listMine(limit?: number): Promise<PoopEntry[]>;
  createMine(input: NewPoopEntryInput): Promise<PoopEntry>;
  updateMine(
    entryId: UUID,
    input: Partial<Pick<NewPoopEntryInput, 'occurredAt' | 'bristolType' | 'rating' | 'volume' | 'note' | 'latitude' | 'longitude' | 'locationSource'>>
  ): Promise<PoopEntry>;
  deleteMine(entryId: UUID): Promise<void>;
}

export interface FriendsService {
  sendRequest(friendUserId: UUID): Promise<void>;
  acceptRequest(friendshipId: UUID): Promise<void>;
  listAccepted(): Promise<Profile[]>;
  listIncomingPending(): Promise<IncomingFriendRequest[]>;
}

export type UpsertProfileInput = {
  username: string;
  displayName: string;
};

export interface ProfileService {
  getMine(): Promise<Profile | null>;
  upsertMine(input: UpsertProfileInput): Promise<Profile>;
  setShareFeed(enabled: boolean): Promise<Profile>;
  uploadAvatar(imageUri: string, mimeType?: string, base64Data?: string): Promise<Profile>;
  findByUsername(username: string): Promise<Profile | null>;
}

export interface LeaderboardService {
  listYear(year: number): Promise<LeaderboardRow[]>;
}

export interface FeedService {
  listMineAndFriends(limit?: number): Promise<FeedItem[]>;
  listCommentsByEntryIds(entryIds: UUID[], limitPerEntry?: number): Promise<Record<UUID, FeedComment[]>>;
  listReactionsByEntryIds(entryIds: UUID[]): Promise<Record<UUID, FeedReactionSummary>>;
  addComment(entryId: UUID, body: string): Promise<FeedComment>;
  toggleReaction(entryId: UUID, reaction: FeedReactionKind): Promise<{ entryId: UUID; myReaction: FeedReactionKind | null }>;
}

export interface ChatService {
  createOrGetDirectRoom(friendUserId: UUID): Promise<UUID>;
  createGroupRoom(name: string): Promise<ChatRoom>;
  listRooms(): Promise<ChatRoom[]>;
  getMyRoleInRoom(roomId: UUID): Promise<'owner' | 'admin' | 'member' | null>;
  proposeInvite(roomId: UUID, inviteeId: UUID): Promise<ChatRoomInvite>;
  listMyApprovedInvites(): Promise<ChatRoomInvite[]>;
  joinApprovedInvite(inviteId: UUID): Promise<void>;
  approveInvite(inviteId: UUID): Promise<void>;
  rejectInvite(inviteId: UUID): Promise<void>;
  listPendingInvites(roomId: UUID): Promise<ChatRoomInvite[]>;
  listMessages(roomId: UUID, limit?: number): Promise<ChatMessage[]>;
  sendMessage(roomId: UUID, body: string): Promise<ChatMessage>;
}
