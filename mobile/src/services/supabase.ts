import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ChatMessage,
  ChatRoom,
  ChatRoomInvite,
  FeedItem,
  IncomingFriendRequest,
  LeaderboardRow,
  PoopEntry,
  Profile,
  UUID,
} from '../types/domain';
import type {
  ChatService,
  FeedService,
  FriendsService,
  LeaderboardService,
  NewPoopEntryInput,
  PoopService,
  ProfileService,
  UpsertProfileInput,
} from './contracts';

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  share_feed: boolean;
  avatar_url: string | null;
  avatar_tint: string | null;
};

type PoopRow = {
  id: string;
  user_id: string;
  occurred_at: string;
  bristol_type: number;
  rating: number;
  note: string | null;
};

type MessageRow = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type LeaderboardRowDb = {
  subject_id: string;
  username: string;
  display_name: string;
  year: number;
  score: number;
  avg_rating: number;
  rank: number;
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
};

type RoomMemberRow = {
  room_id: string;
};

type FeedRow = {
  entry_id: string;
  subject_id: string;
  username: string;
  display_name: string;
  occurred_at: string;
  rating: number;
  created_at: string;
};

type ChatRoomRow = {
  id: string;
  room_type: 'dm' | 'group_private';
  name: string | null;
  created_at: string;
};

type ChatRoomInviteRow = {
  id: string;
  room_id: string;
  proposer_id: string;
  invitee_id: string;
  status: 'proposed' | 'approved' | 'rejected' | 'joined' | 'expired';
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  resolved_at: string | null;
};

function asProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    shareFeed: row.share_feed ?? true,
    avatarUrl: row.avatar_url ?? null,
    avatarTint: row.avatar_tint ?? '#5b6c8a',
  };
}

function asPoopEntry(row: PoopRow): PoopEntry {
  return {
    id: row.id,
    userId: row.user_id,
    occurredAt: row.occurred_at,
    bristolType: row.bristol_type as PoopEntry['bristolType'],
    rating: row.rating as PoopEntry['rating'],
    note: row.note,
  };
}

function asChatMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function asLeaderboardRow(row: LeaderboardRowDb): LeaderboardRow {
  return {
    subjectId: row.subject_id,
    username: row.username,
    displayName: row.display_name,
    year: row.year,
    score: row.score,
    avgRating: Number(row.avg_rating ?? 0),
    rank: row.rank,
  };
}

function asFeedItem(row: FeedRow): FeedItem {
  return {
    entryId: row.entry_id,
    subjectId: row.subject_id,
    username: row.username,
    displayName: row.display_name,
    occurredAt: row.occurred_at,
    rating: row.rating as FeedItem['rating'],
    createdAt: row.created_at,
  };
}

function asChatRoom(row: ChatRoomRow): ChatRoom {
  return {
    id: row.id,
    type: row.room_type,
    name: row.name,
    createdAt: row.created_at,
  };
}

function asChatRoomInvite(row: ChatRoomInviteRow): ChatRoomInvite {
  return {
    id: row.id,
    roomId: row.room_id,
    proposerId: row.proposer_id,
    inviteeId: row.invitee_id,
    status: row.status,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    resolvedAt: row.resolved_at,
  };
}

async function requireUserId(client: SupabaseClient): Promise<UUID> {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('No authenticated user.');
  return data.user.id;
}

async function loadProfilesByIds(client: SupabaseClient, ids: UUID[]): Promise<Map<UUID, Profile>> {
  if (ids.length === 0) return new Map();
  const uniqueIds = Array.from(new Set(ids));
      const { data, error } = await client
        .from('profiles')
        .select('id,username,display_name,share_feed,avatar_url,avatar_tint')
        .in('id', uniqueIds);
  if (error) throw error;
  const map = new Map<UUID, Profile>();
  for (const row of (data ?? []) as ProfileRow[]) {
    map.set(row.id, asProfile(row));
  }
  return map;
}

async function requireAcceptedFriendship(client: SupabaseClient, me: UUID, friend: UUID): Promise<void> {
  const { data, error } = await client
    .from('friendships')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(requester_id.eq.${me},addressee_id.eq.${friend}),and(requester_id.eq.${friend},addressee_id.eq.${me})`)
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('You can only open chat with accepted friends.');
  }
}

function normalizeImageExtension(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  return 'jpg';
}

export function createSupabaseProfileService(client: SupabaseClient): ProfileService {
  return {
    async getMine(): Promise<Profile | null> {
      const me = await requireUserId(client);
      const { data, error } = await client
        .from('profiles')
        .select('id,username,display_name,share_feed,avatar_url,avatar_tint')
        .eq('id', me)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return asProfile(data as ProfileRow);
    },

    async upsertMine(input: UpsertProfileInput): Promise<Profile> {
      const me = await requireUserId(client);
      const username = input.username.trim().toLowerCase();
      const displayName = input.displayName.trim();
      const { data, error } = await client
        .from('profiles')
        .upsert(
          {
            id: me,
            username,
            display_name: displayName,
          },
          { onConflict: 'id' }
        )
        .select('id,username,display_name,share_feed,avatar_url,avatar_tint')
        .single();
      if (error) throw error;
      return asProfile(data as ProfileRow);
    },

    async setShareFeed(enabled: boolean): Promise<Profile> {
      const me = await requireUserId(client);
      const { data, error } = await client
        .from('profiles')
        .update({ share_feed: enabled })
        .eq('id', me)
        .select('id,username,display_name,share_feed,avatar_url,avatar_tint')
        .single();
      if (error) throw error;
      return asProfile(data as ProfileRow);
    },

    async uploadAvatar(imageUri: string, mimeType = 'image/jpeg'): Promise<Profile> {
      const me = await requireUserId(client);
      if (!imageUri.trim()) throw new Error('Image URI is required.');
      const extension = normalizeImageExtension(mimeType);
      const filePath = `${me}/avatar-${Date.now()}.${extension}`;

      const response = await fetch(imageUri);
      if (!response.ok) throw new Error('Failed to read selected image.');
      const blob = await response.blob();

      const { error: uploadError } = await client.storage.from('avatars').upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = client.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = publicData.publicUrl;

      const { data, error } = await client
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', me)
        .select('id,username,display_name,share_feed,avatar_url,avatar_tint')
        .single();
      if (error) throw error;
      return asProfile(data as ProfileRow);
    },

    async findByUsername(username: string): Promise<Profile | null> {
      const normalized = username.trim().toLowerCase();
      if (!normalized) return null;
      const { data, error } = await client
        .from('profiles')
        .select('id,username,display_name,share_feed,avatar_url,avatar_tint')
        .eq('username', normalized)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return asProfile(data as ProfileRow);
    },
  };
}

export function createSupabasePoopService(client: SupabaseClient): PoopService {
  return {
    async listMine(limit = 50): Promise<PoopEntry[]> {
      const userId = await requireUserId(client);
      const { data, error } = await client
        .from('poop_entries')
        .select('id,user_id,occurred_at,bristol_type,rating,note')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((row) => asPoopEntry(row as PoopRow));
    },

    async createMine(input: NewPoopEntryInput): Promise<PoopEntry> {
      const userId = await requireUserId(client);
      const { data, error } = await client
        .from('poop_entries')
        .insert({
          user_id: userId,
          occurred_at: input.occurredAt,
          bristol_type: input.bristolType,
          rating: input.rating,
          note: input.note ?? null,
        })
        .select('id,user_id,occurred_at,bristol_type,rating,note')
        .single();
      if (error) throw error;
      return asPoopEntry(data as PoopRow);
    },

    async deleteMine(entryId: UUID): Promise<void> {
      const userId = await requireUserId(client);
      const { error } = await client.from('poop_entries').delete().eq('id', entryId).eq('user_id', userId);
      if (error) throw error;
    },
  };
}

export function createSupabaseFeedService(client: SupabaseClient): FeedService {
  return {
    async listMineAndFriends(limit = 100): Promise<FeedItem[]> {
      const { data, error } = await client
        .from('friend_feed_events')
        .select('entry_id,subject_id,username,display_name,occurred_at,rating,created_at')
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((row) => asFeedItem(row as FeedRow));
    },
  };
}

export function createSupabaseFriendsService(client: SupabaseClient): FriendsService {
  return {
    async sendRequest(friendUserId: UUID): Promise<void> {
      const me = await requireUserId(client);
      if (friendUserId === me) throw new Error('Cannot friend yourself.');
      const { error } = await client.from('friendships').insert({
        requester_id: me,
        addressee_id: friendUserId,
        status: 'pending',
      });
      if (error) throw error;
    },

    async acceptRequest(friendshipId: UUID): Promise<void> {
      const { error } = await client.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
      if (error) throw error;
    },

    async listAccepted(): Promise<Profile[]> {
      const me = await requireUserId(client);
      const { data, error } = await client
        .from('friendships')
        .select('id,requester_id,addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
      if (error) throw error;
      const friendIds = ((data as FriendshipRow[]) ?? []).map((row) =>
        row.requester_id === me ? row.addressee_id : row.requester_id
      );
      const profileMap = await loadProfilesByIds(client, friendIds);
      return friendIds.map((id) => profileMap.get(id)).filter((item): item is Profile => Boolean(item));
    },

    async listIncomingPending(): Promise<IncomingFriendRequest[]> {
      const me = await requireUserId(client);
      const { data, error } = await client
        .from('friendships')
        .select('id,requester_id,addressee_id')
        .eq('status', 'pending')
        .eq('addressee_id', me);
      if (error) throw error;
      const rows = (data ?? []) as FriendshipRow[];
      const requesterIds = rows.map((row) => row.requester_id);
      const profileMap = await loadProfilesByIds(client, requesterIds);
      return rows
        .map((row) => {
          const profile = profileMap.get(row.requester_id);
          if (!profile) return null;
          return { id: row.id, from: profile };
        })
        .filter((item): item is IncomingFriendRequest => Boolean(item));
    },
  };
}

export function createSupabaseLeaderboardService(client: SupabaseClient): LeaderboardService {
  return {
    async listYear(year: number): Promise<LeaderboardRow[]> {
      const viewerId = await requireUserId(client);
      const { data, error } = await client
        .from('yearly_friend_leaderboard')
        .select('subject_id,username,display_name,year,score,avg_rating,rank')
        .eq('viewer_id', viewerId)
        .eq('year', year)
        .order('rank', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => asLeaderboardRow(row as LeaderboardRowDb));
    },
  };
}

export function createSupabaseChatService(client: SupabaseClient): ChatService {
  return {
    async createOrGetDirectRoom(friendUserId: UUID): Promise<UUID> {
      const me = await requireUserId(client);
      if (friendUserId === me) throw new Error('Cannot open direct chat with yourself.');

      await requireAcceptedFriendship(client, me, friendUserId);

      const { data: myRows, error: myRowsError } = await client
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', me);
      if (myRowsError) throw myRowsError;

      const myRoomIds = ((myRows ?? []) as RoomMemberRow[]).map((row) => row.room_id);
      if (myRoomIds.length > 0) {
        const { data: friendRows, error: friendRowsError } = await client
          .from('chat_room_members')
          .select('room_id')
          .eq('user_id', friendUserId)
          .in('room_id', myRoomIds);
        if (friendRowsError) throw friendRowsError;

        const sharedRoomIds = ((friendRows ?? []) as RoomMemberRow[]).map((row) => row.room_id);
        if (sharedRoomIds.length > 0) {
          const { data: roomData, error: roomError } = await client
            .from('chat_rooms')
            .select('id')
            .eq('is_direct', true)
            .in('id', sharedRoomIds)
            .limit(1)
            .maybeSingle();
          if (roomError) throw roomError;
          if (roomData?.id) return roomData.id;
        }
      }

      const { data: roomInsert, error: roomInsertError } = await client
        .from('chat_rooms')
        .insert({ is_direct: true, room_type: 'dm' })
        .select('id,created_at,room_type,name')
        .single();
      if (roomInsertError) throw roomInsertError;

      const roomId = roomInsert.id as UUID;
      const { error: ownerInsertError } = await client
        .from('chat_room_members')
        .insert({ room_id: roomId, user_id: me, role: 'owner' });
      if (ownerInsertError) throw ownerInsertError;

      const { error: friendInsertError } = await client
        .from('chat_room_members')
        .insert({ room_id: roomId, user_id: friendUserId, role: 'member' });
      if (friendInsertError) throw friendInsertError;

      return roomId;
    },

    async createGroupRoom(name: string): Promise<ChatRoom> {
      const me = await requireUserId(client);
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Group name is required.');

      const { data: roomInsert, error: roomInsertError } = await client
        .from('chat_rooms')
        .insert({ is_direct: false, room_type: 'group_private', name: trimmed })
        .select('id,room_type,name,created_at')
        .single();
      if (roomInsertError) throw roomInsertError;

      const room = roomInsert as ChatRoomRow;
      const { error: ownerInsertError } = await client
        .from('chat_room_members')
        .insert({ room_id: room.id, user_id: me, role: 'owner' });
      if (ownerInsertError) throw ownerInsertError;

      return asChatRoom(room);
    },

    async listRooms(): Promise<ChatRoom[]> {
      const me = await requireUserId(client);
      const { data: membershipRows, error: membershipError } = await client
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', me);
      if (membershipError) throw membershipError;

      const roomIds = ((membershipRows ?? []) as RoomMemberRow[]).map((row) => row.room_id);
      if (roomIds.length === 0) return [];

      const { data: roomRows, error: roomError } = await client
        .from('chat_rooms')
        .select('id,room_type,name,created_at')
        .in('id', roomIds)
        .order('created_at', { ascending: false });
      if (roomError) throw roomError;
      return (roomRows ?? []).map((row) => asChatRoom(row as ChatRoomRow));
    },

    async getMyRoleInRoom(roomId: UUID): Promise<'owner' | 'admin' | 'member' | null> {
      const me = await requireUserId(client);
      const { data, error } = await client
        .from('chat_room_members')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', me)
        .maybeSingle();
      if (error) throw error;
      if (!data?.role) return null;
      return data.role as 'owner' | 'admin' | 'member';
    },

    async proposeInvite(roomId: UUID, inviteeId: UUID): Promise<ChatRoomInvite> {
      const me = await requireUserId(client);
      const { data, error } = await client
        .from('chat_room_invites')
        .insert({
          room_id: roomId,
          proposer_id: me,
          invitee_id: inviteeId,
          status: 'proposed',
        })
        .select('id,room_id,proposer_id,invitee_id,status,approved_by,created_at,updated_at,approved_at,resolved_at')
        .single();
      if (error) throw error;
      return asChatRoomInvite(data as ChatRoomInviteRow);
    },

    async listMyApprovedInvites(): Promise<ChatRoomInvite[]> {
      const me = await requireUserId(client);
      const { data, error } = await client
        .from('chat_room_invites')
        .select('id,room_id,proposer_id,invitee_id,status,approved_by,created_at,updated_at,approved_at,resolved_at')
        .eq('invitee_id', me)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => asChatRoomInvite(row as ChatRoomInviteRow));
    },

    async joinApprovedInvite(inviteId: UUID): Promise<void> {
      const me = await requireUserId(client);
      const { data: inviteRow, error: inviteError } = await client
        .from('chat_room_invites')
        .select('id,room_id,proposer_id,invitee_id,status,approved_by,created_at,updated_at,approved_at,resolved_at')
        .eq('id', inviteId)
        .maybeSingle();
      if (inviteError) throw inviteError;
      if (!inviteRow) throw new Error('Invite not found.');

      const invite = inviteRow as ChatRoomInviteRow;
      if (invite.invitee_id !== me) throw new Error('Only invitee can join this invite.');
      if (invite.status !== 'approved') throw new Error('Invite must be approved before joining.');

      const { error: memberInsertError } = await client.from('chat_room_members').insert({
        room_id: invite.room_id,
        user_id: me,
        role: 'member',
      });
      if (memberInsertError) throw memberInsertError;

      const { error: inviteUpdateError } = await client
        .from('chat_room_invites')
        .update({ status: 'joined', resolved_at: new Date().toISOString() })
        .eq('id', inviteId);
      if (inviteUpdateError) throw inviteUpdateError;
    },

    async approveInvite(inviteId: UUID): Promise<void> {
      const me = await requireUserId(client);
      const { data: inviteRow, error: inviteFetchError } = await client
        .from('chat_room_invites')
        .select('id,room_id,proposer_id,invitee_id,status,approved_by,created_at,updated_at,approved_at,resolved_at')
        .eq('id', inviteId)
        .maybeSingle();
      if (inviteFetchError) throw inviteFetchError;
      if (!inviteRow) throw new Error('Invite not found.');

      const invite = inviteRow as ChatRoomInviteRow;
      if (invite.status !== 'proposed') throw new Error('Only proposed invites can be approved.');

      const { error: approveError } = await client
        .from('chat_room_invites')
        .update({
          status: 'approved',
          approved_by: me,
          approved_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
        })
        .eq('id', inviteId);
      if (approveError) throw approveError;
    },

    async rejectInvite(inviteId: UUID): Promise<void> {
      const { error } = await client
        .from('chat_room_invites')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', inviteId);
      if (error) throw error;
    },

    async listPendingInvites(roomId: UUID): Promise<ChatRoomInvite[]> {
      const { data, error } = await client
        .from('chat_room_invites')
        .select('id,room_id,proposer_id,invitee_id,status,approved_by,created_at,updated_at,approved_at,resolved_at')
        .eq('room_id', roomId)
        .eq('status', 'proposed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => asChatRoomInvite(row as ChatRoomInviteRow));
    },

    async listMessages(roomId: UUID, limit = 100): Promise<ChatMessage[]> {
      const { data, error } = await client
        .from('chat_messages')
        .select('id,room_id,sender_id,body,created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((row) => asChatMessage(row as MessageRow));
    },

    async sendMessage(roomId: UUID, body: string): Promise<ChatMessage> {
      const senderId = await requireUserId(client);
      const { data, error } = await client
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: senderId,
          body,
        })
        .select('id,room_id,sender_id,body,created_at')
        .single();
      if (error) throw error;
      return asChatMessage(data as MessageRow);
    },
  };
}
