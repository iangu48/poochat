export type UUID = string;

export type Profile = {
  id: UUID;
  username: string;
  displayName: string;
  shareFeed: boolean;
  avatarUrl: string | null;
  avatarTint: string;
};

export type TriggerTag = {
  id: UUID;
  key: string | null;
  label: string;
  normalizedLabel: string;
  category: string;
  isSystem: boolean;
  createdBy: UUID | null;
  canonicalTagId: UUID | null;
  active: boolean;
  sortOrder: number;
};

export type PoopEntry = {
  id: UUID;
  userId: UUID;
  occurredAt: string;
  bristolType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  rating: 1 | 2 | 3 | 4 | 5;
  volume: 0 | 1 | 2 | 3 | 4;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  locationSource: 'gps' | 'manual' | null;
  triggerTags: TriggerTag[];
};

export type LeaderboardRow = {
  subjectId: UUID;
  username: string;
  displayName: string;
  year: number;
  score: number;
  avgRating: number;
  rank: number;
};

export type ChatMessage = {
  id: UUID;
  roomId: UUID;
  senderId: UUID;
  body: string;
  createdAt: string;
};

export type FeedItem = {
  entryId: UUID;
  subjectId: UUID;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarTint: string;
  occurredAt: string;
  bristolType: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  rating: 1 | 2 | 3 | 4 | 5;
  volume: 0 | 1 | 2 | 3 | 4;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export type VolumeOption = {
  value: 0 | 1 | 2 | 3 | 4;
  emoji: string;
  label: string;
  shortLabel: string;
};

export const POOP_VOLUME_OPTIONS: VolumeOption[] = [
  { value: 0, emoji: '💨', label: 'Just gas', shortLabel: 'Gas' },
  { value: 1, emoji: '🫐', label: 'Tiny, blueberry-sized', shortLabel: 'Blueberry' },
  { value: 2, emoji: '🥝', label: 'Small, kiwi-sized', shortLabel: 'Kiwi' },
  { value: 3, emoji: '🥔', label: 'Medium, potato-sized', shortLabel: 'Potato' },
  { value: 4, emoji: '🍈', label: 'Massive, melon-sized', shortLabel: 'Melon' },
];

export type FeedComment = {
  id: UUID;
  entryId: UUID;
  userId: UUID;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarTint: string;
  body: string;
  createdAt: string;
};

export type FeedReactionKind = string;

export type FeedReactionOption = {
  key: FeedReactionKind;
  emoji: string;
  label: string;
};

export const FEED_REACTION_OPTIONS: FeedReactionOption[] = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'laugh', emoji: '😂', label: 'Laugh' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'poop', emoji: '💩', label: 'Poop' },
];

export type FeedReactionSummary = {
  entryId: UUID;
  myReaction: FeedReactionKind | null;
  counts: Record<string, number>;
  total: number;
};

export type ChatRoom = {
  id: UUID;
  type: 'dm' | 'group_private';
  name: string | null;
  createdAt: string;
};

export type ChatRoomInvite = {
  id: UUID;
  roomId: UUID;
  proposerId: UUID;
  inviteeId: UUID;
  status: 'proposed' | 'approved' | 'rejected' | 'joined' | 'expired';
  approvedBy: UUID | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  resolvedAt: string | null;
};

export type IncomingFriendRequest = {
  id: UUID;
  from: Profile;
};
