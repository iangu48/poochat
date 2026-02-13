import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as TextInputHandle } from 'react-native';
import type { RealtimePostgresInsertPayload, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  createSupabaseChatService,
  createSupabaseFeedService,
  createSupabaseFriendsService,
  createSupabaseLeaderboardService,
  createSupabasePoopService,
  createSupabaseProfileService,
} from '../services/supabase';
import type {
  ChatMessage,
  ChatRoom,
  ChatRoomInvite,
  FeedItem,
  IncomingFriendRequest,
  LeaderboardRow,
  PoopEntry,
  Profile,
} from '../types/domain';
import type { Tab } from '../screens/TabBar';
import type { ChatRoute } from '../screens/ChatScreen';

type AuthMethod = 'phone' | 'email';

export function useAppController() {
  const [session, setSession] = useState<Session | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [authOtpCooldownSec, setAuthOtpCooldownSec] = useState(0);
  const [authVerifyingOtp, setAuthVerifyingOtp] = useState(false);
  const [lastAutoSubmittedOtp, setLastAutoSubmittedOtp] = useState('');
  const otpInputRef = useRef<TextInputHandle | null>(null);

  const profileService = useMemo(() => createSupabaseProfileService(supabase), []);
  const poopService = useMemo(() => createSupabasePoopService(supabase), []);
  const feedService = useMemo(() => createSupabaseFeedService(supabase), []);
  const friendsService = useMemo(() => createSupabaseFriendsService(supabase), []);
  const leaderboardService = useMemo(() => createSupabaseLeaderboardService(supabase), []);
  const chatService = useMemo(() => createSupabaseChatService(supabase), []);

  const [tab, setTab] = useState<Tab>('home');

  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [onboardingUsername, setOnboardingUsername] = useState('');
  const [onboardingDisplayName, setOnboardingDisplayName] = useState('');

  const [entries, setEntries] = useState<PoopEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [bristolType, setBristolType] = useState('4');
  const [rating, setRating] = useState('3');
  const [note, setNote] = useState('');
  const [showEntryComposer, setShowEntryComposer] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedError, setFeedError] = useState('');

  const [friendUsername, setFriendUsername] = useState('');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingFriendRequest[]>([]);
  const [friendError, setFriendError] = useState('');
  const [friendStatus, setFriendStatus] = useState('');

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [leaderboardError, setLeaderboardError] = useState('');

  const [activeRoomId, setActiveRoomId] = useState('');
  const [chatRoute, setChatRoute] = useState<ChatRoute>('inbox');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomRole, setActiveRoomRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [approvalsRequired, setApprovalsRequired] = useState<ChatRoomInvite[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteQueue, setShowInviteQueue] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [showRoomActions, setShowRoomActions] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [pendingInvites, setPendingInvites] = useState<ChatRoomInvite[]>([]);
  const [approvedInvitesForMe, setApprovedInvitesForMe] = useState<ChatRoomInvite[]>([]);
  const [inviteParticipantLabels, setInviteParticipantLabels] = useState<Record<string, string>>({});
  const [inviteRoomLabels, setInviteRoomLabels] = useState<Record<string, string>>({});
  const [messageBody, setMessageBody] = useState('');
  const [chatRows, setChatRows] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState('');
  const [chatStatus, setChatStatus] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authOtpCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setAuthOtpCooldownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [authOtpCooldownSec]);

  useEffect(() => {
    if (authMethod !== 'phone') return;
    const token = authOtp.replace(/\D/g, '');
    if (token !== authOtp) {
      setAuthOtp(token);
      return;
    }
    if (token.length === 6 && token !== lastAutoSubmittedOtp && !authVerifyingOtp) {
      setLastAutoSubmittedOtp(token);
      void handleVerifyPhoneOtp(token);
    }
  }, [authMethod, authOtp, authVerifyingOtp, lastAutoSubmittedOtp]);

  useEffect(() => {
    if (!session) {
      setMyProfile(null);
      setEntries([]);
      setFeedItems([]);
      setFriends([]);
      setIncomingRequests([]);
      setActiveRoomId('');
      setChatRoute('inbox');
      setActiveRoomRole(null);
      setChatRooms([]);
      setPendingInvites([]);
      setApprovedInvitesForMe([]);
      setApprovalsRequired([]);
      return;
    }
    void bootstrapAuthedState();
  }, [session]);

  useEffect(() => {
    if (!session || !activeRoomId) return;
    const channel = supabase
      .channel(`chat-room-${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload: RealtimePostgresInsertPayload<{
          id: string;
          room_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        }>) => {
          const incoming = asRealtimeMessage(payload);
          if (!incoming) return;
          setChatRows((prev) => mergeMessages(prev, incoming));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeRoomId, session]);

  useEffect(() => {
    if (!session || !activeRoomId) return;
    const channel = supabase
      .channel(`chat-room-invites-${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_room_invites',
          filter: `room_id=eq.${activeRoomId}`,
        },
        () => {
          void refreshPendingInvites(activeRoomId);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeRoomId, session]);

  async function bootstrapAuthedState(): Promise<void> {
    setProfileLoading(true);
    setProfileError('');
    try {
      const profile = await profileService.getMine();
      setMyProfile(profile);
      if (profile) {
        await Promise.all([refreshEntries(), refreshFeed(), refreshFriends(), refreshMyApprovedInvites()]);
        const rooms = await refreshRooms();
        await refreshApprovalsRequired(rooms);
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to load profile state.');
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshEntries(): Promise<void> {
    setLoadingEntries(true);
    setEntryError('');
    try {
      const list = await poopService.listMine(30);
      setEntries(list);
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to load entries.');
    } finally {
      setLoadingEntries(false);
    }
  }

  async function refreshFeed(): Promise<void> {
    setFeedError('');
    try {
      const items = await feedService.listMineAndFriends(60);
      setFeedItems(items);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Failed to load feed.');
    }
  }

  async function refreshFriends(): Promise<void> {
    setFriendError('');
    try {
      const [accepted, incoming] = await Promise.all([
        friendsService.listAccepted(),
        friendsService.listIncomingPending(),
      ]);
      setFriends(accepted);
      setIncomingRequests(incoming);
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : 'Failed to load friends.');
    }
  }

  async function refreshRooms(): Promise<ChatRoom[]> {
    setChatError('');
    try {
      const rooms = await chatService.listRooms();
      setChatRooms(rooms);
      return rooms;
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load rooms.');
      return [];
    }
  }

  async function refreshApprovalsRequired(rooms: ChatRoom[] = chatRooms): Promise<void> {
    if (rooms.length === 0) {
      setApprovalsRequired([]);
      return;
    }
    setChatError('');
    try {
      const nested = await Promise.all(
        rooms.map(async (room) => {
          const role = await chatService.getMyRoleInRoom(room.id);
          if (role !== 'owner' && role !== 'admin') return [] as ChatRoomInvite[];
          return chatService.listPendingInvites(room.id);
        })
      );
      const all = nested.flat();
      setApprovalsRequired(all);
      await Promise.all([hydrateInviteParticipantLabels(all), hydrateInviteRoomLabels(all)]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load approval queue.');
    }
  }

  async function refreshPendingInvites(roomId: string): Promise<void> {
    if (!roomId.trim()) {
      setPendingInvites([]);
      return;
    }
    setChatError('');
    try {
      const invites = await chatService.listPendingInvites(roomId);
      setPendingInvites(invites);
      await Promise.all([hydrateInviteParticipantLabels(invites), hydrateInviteRoomLabels(invites)]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load pending invites.');
    }
  }

  async function refreshActiveRoomRole(roomId: string): Promise<void> {
    if (!roomId.trim()) {
      setActiveRoomRole(null);
      return;
    }
    setChatError('');
    try {
      const role = await chatService.getMyRoleInRoom(roomId);
      setActiveRoomRole(role);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load room role.');
    }
  }

  async function refreshMyApprovedInvites(): Promise<void> {
    setChatError('');
    try {
      const invites = await chatService.listMyApprovedInvites();
      setApprovedInvitesForMe(invites);
      await Promise.all([hydrateInviteParticipantLabels(invites), hydrateInviteRoomLabels(invites)]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load approved invites.');
    }
  }

  async function hydrateInviteParticipantLabels(invites: ChatRoomInvite[]): Promise<void> {
    const ids = Array.from(
      new Set(
        invites
          .flatMap((invite) => [invite.proposerId, invite.inviteeId])
          .filter((id) => Boolean(id))
      )
    );
    if (ids.length === 0) return;

    const { data, error } = await supabase.from('profiles').select('id,username,display_name').in('id', ids);
    if (error) throw error;

    const next: Record<string, string> = {};
    for (const row of data ?? []) {
      next[row.id as string] = `${String(row.display_name)} (@${String(row.username)})`;
    }
    setInviteParticipantLabels((prev) => ({ ...prev, ...next }));
  }

  async function hydrateInviteRoomLabels(invites: ChatRoomInvite[]): Promise<void> {
    const roomIds = Array.from(new Set(invites.map((invite) => invite.roomId).filter((id) => Boolean(id))));
    if (roomIds.length === 0) return;

    const { data, error } = await supabase.from('chat_rooms').select('id,name,room_type').in('id', roomIds);
    if (error) throw error;

    const next: Record<string, string> = {};
    for (const row of data ?? []) {
      const fallback = row.room_type === 'dm' ? 'Direct Room' : 'Untitled Group';
      next[row.id as string] = row.name ? String(row.name) : fallback;
    }
    setInviteRoomLabels((prev) => ({ ...prev, ...next }));
  }

  async function handleAuth(mode: 'sign-in' | 'sign-up'): Promise<void> {
    setAuthError('');
    setAuthStatus('');
    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        setAuthStatus('Check your email for confirmation if required.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    }
  }

  async function handleSendPhoneOtp(): Promise<void> {
    setAuthError('');
    setAuthStatus('');
    if (authOtpCooldownSec > 0) {
      setAuthError(`Please wait ${authOtpCooldownSec}s before requesting another code.`);
      return;
    }
    try {
      const normalizedPhone = normalizePhone(authPhone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setAuthStatus(`SMS code sent to ${normalizedPhone}.`);
      setAuthOtpCooldownSec(30);
      setAuthOtp('');
      setLastAutoSubmittedOtp('');
      otpInputRef.current?.focus();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to send SMS code.');
    }
  }

  async function handleVerifyPhoneOtp(tokenOverride?: string): Promise<void> {
    setAuthError('');
    setAuthStatus('');
    setAuthVerifyingOtp(true);
    try {
      const normalizedPhone = normalizePhone(authPhone);
      const token = (tokenOverride ?? authOtp).trim();
      if (!token) throw new Error('Enter the SMS code.');
      const { error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      setAuthStatus('Phone verification successful.');
      setAuthOtp('');
      setLastAutoSubmittedOtp('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to verify SMS code.');
    } finally {
      setAuthVerifyingOtp(false);
    }
  }

  async function handleSaveProfile(): Promise<void> {
    setProfileError('');
    try {
      const profile = await profileService.upsertMine({
        username: onboardingUsername,
        displayName: onboardingDisplayName,
      });
      setMyProfile(profile);
      await Promise.all([refreshEntries(), refreshFriends(), refreshFeed()]);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to save profile.');
    }
  }

  async function handleAddEntry(): Promise<void> {
    setEntryError('');
    try {
      const typeValue = clampInt(Number(bristolType), 1, 7);
      const ratingValue = clampInt(Number(rating), 1, 5);
      await poopService.createMine({
        occurredAt: new Date().toISOString(),
        bristolType: typeValue as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        rating: ratingValue as 1 | 2 | 3 | 4 | 5,
        note: note.trim() || undefined,
      });
      setNote('');
      setShowEntryComposer(false);
      await Promise.all([refreshEntries(), refreshFeed()]);
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to add entry.');
    }
  }

  async function handleDeleteEntry(entryId: string): Promise<void> {
    setEntryError('');
    try {
      await poopService.deleteMine(entryId);
      await refreshEntries();
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : 'Failed to delete entry.');
    }
  }

  async function handleSendFriendRequest(): Promise<void> {
    setFriendError('');
    setFriendStatus('');
    try {
      const profile = await profileService.findByUsername(friendUsername);
      if (!profile) {
        setFriendError('No user found with that username.');
        return;
      }
      await friendsService.sendRequest(profile.id);
      setFriendUsername('');
      setFriendStatus(`Request sent to @${profile.username}.`);
      await refreshFriends();
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : 'Failed to send request.');
    }
  }

  async function handleAcceptRequest(friendshipId: string): Promise<void> {
    setFriendError('');
    setFriendStatus('');
    try {
      await friendsService.acceptRequest(friendshipId);
      setFriendStatus('Friend request accepted.');
      await refreshFriends();
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : 'Failed to accept request.');
    }
  }

  async function handleOpenDirectChat(friendUserId: string): Promise<void> {
    setChatError('');
    setChatStatus('');
    try {
      const roomId = await chatService.createOrGetDirectRoom(friendUserId);
      setActiveRoomId(roomId);
      setChatRoute('room');
      setTab('chat');
      const rooms = await refreshRooms();
      await Promise.all([loadMessages(roomId), refreshPendingInvites(roomId), refreshActiveRoomRole(roomId)]);
      await refreshApprovalsRequired(rooms);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to open chat.');
    }
  }

  async function handleCreateGroup(): Promise<void> {
    setChatError('');
    setChatStatus('');
    try {
      const room = await chatService.createGroupRoom(groupName);
      setGroupName('');
      setActiveRoomId(room.id);
      setChatRoute('room');
      setShowCreateGroup(false);
      setChatStatus(`Created group "${room.name ?? 'Untitled'}".`);
      const rooms = await refreshRooms();
      await Promise.all([loadMessages(room.id), refreshPendingInvites(room.id), refreshActiveRoomRole(room.id)]);
      await refreshApprovalsRequired(rooms);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to create group.');
    }
  }

  async function handleOpenRoom(roomId: string): Promise<void> {
    setChatError('');
    setChatStatus('');
    try {
      setActiveRoomId(roomId);
      setChatRoute('room');
      await Promise.all([loadMessages(roomId), refreshPendingInvites(roomId), refreshActiveRoomRole(roomId)]);
      setChatStatus('Room opened.');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to open room.');
    }
  }

  async function handleProposeInvite(): Promise<void> {
    if (!activeRoomId.trim()) {
      setChatError('Open a room first.');
      return;
    }
    setChatError('');
    setChatStatus('');
    try {
      const profile = await profileService.findByUsername(inviteUsername);
      if (!profile) {
        setChatError('No user found with that username.');
        return;
      }
      await chatService.proposeInvite(activeRoomId, profile.id);
      setInviteUsername('');
      setChatStatus(`Invite proposed for @${profile.username}.`);
      await refreshPendingInvites(activeRoomId);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to propose invite.');
    }
  }

  async function handleApproveInvite(inviteId: string): Promise<void> {
    setChatError('');
    setChatStatus('');
    try {
      await chatService.approveInvite(inviteId);
      setChatStatus('Invite approved.');
      const rooms = await refreshRooms();
      await Promise.all([refreshPendingInvites(activeRoomId), refreshMyApprovedInvites()]);
      await refreshApprovalsRequired(rooms);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to approve invite.');
    }
  }

  async function handleRejectInvite(inviteId: string): Promise<void> {
    setChatError('');
    setChatStatus('');
    try {
      await chatService.rejectInvite(inviteId);
      setChatStatus('Invite rejected.');
      await refreshPendingInvites(activeRoomId);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to reject invite.');
    }
  }

  async function handleJoinApprovedInvite(inviteId: string): Promise<void> {
    setChatError('');
    setChatStatus('');
    try {
      const invite = approvedInvitesForMe.find((item) => item.id === inviteId);
      await chatService.joinApprovedInvite(inviteId);
      setChatStatus('Joined group invite.');
      const rooms = await refreshRooms();
      await Promise.all([refreshMyApprovedInvites()]);
      await refreshApprovalsRequired(rooms);
      if (invite) {
        setActiveRoomId(invite.roomId);
        setChatRoute('room');
        await Promise.all([
          loadMessages(invite.roomId),
          refreshPendingInvites(invite.roomId),
          refreshActiveRoomRole(invite.roomId),
        ]);
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to join invite.');
    }
  }

  async function handleLoadLeaderboard(): Promise<void> {
    setLeaderboardError('');
    try {
      const rows = await leaderboardService.listYear(Number(year));
      setLeaderboardRows(rows);
    } catch (error) {
      setLeaderboardError(error instanceof Error ? error.message : 'Failed to load leaderboard.');
    }
  }

  async function loadMessages(roomId: string): Promise<void> {
    if (!roomId.trim()) {
      setChatRows([]);
      return;
    }
    setChatError('');
    try {
      const rows = await chatService.listMessages(roomId.trim(), 100);
      setChatRows(rows);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to load messages.');
    }
  }

  async function handleSendMessage(): Promise<void> {
    if (!activeRoomId.trim()) {
      setChatError('Open chat from Friends tab first.');
      return;
    }
    if (!messageBody.trim()) return;
    setChatError('');
    try {
      const sent = await chatService.sendMessage(activeRoomId.trim(), messageBody.trim());
      setChatRows((prev) => mergeMessages(prev, sent));
      setMessageBody('');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Failed to send message.');
    }
  }

  async function handleSignOut(): Promise<void> {
    await supabase.auth.signOut();
    setTab('home');
  }

  async function handleToggleShareFeed(): Promise<void> {
    if (!myProfile) return;
    setProfileError('');
    try {
      const updated = await profileService.setShareFeed(!myProfile.shareFeed);
      setMyProfile(updated);
      await refreshFeed();
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update feed visibility.');
    }
  }

  async function handleRefreshChatInbox(): Promise<void> {
    const rooms = await refreshRooms();
    await Promise.all([refreshMyApprovedInvites(), refreshApprovalsRequired(rooms)]);
  }

  const activeRoom = chatRooms.find((room) => room.id === activeRoomId) ?? null;
  const approvalsByRoom = approvalsRequired.reduce<Record<string, number>>((acc, invite) => {
    acc[invite.roomId] = (acc[invite.roomId] ?? 0) + 1;
    return acc;
  }, {});

  return {
    session,
    tab,
    setTab,
    authMethod,
    setAuthMethod,
    authEmail,
    setAuthEmail,
    authPhone,
    setAuthPhone,
    authOtp,
    setAuthOtp,
    authPassword,
    setAuthPassword,
    authError,
    authStatus,
    authOtpCooldownSec,
    authVerifyingOtp,
    otpInputRef,
    handleAuth,
    handleSendPhoneOtp,
    handleVerifyPhoneOtp,
    myProfile,
    profileLoading,
    profileError,
    onboardingUsername,
    setOnboardingUsername,
    onboardingDisplayName,
    setOnboardingDisplayName,
    handleSaveProfile,
    handleSignOut,
    handleToggleShareFeed,
    entries,
    loadingEntries,
    entryError,
    bristolType,
    setBristolType,
    rating,
    setRating,
    note,
    setNote,
    showEntryComposer,
    setShowEntryComposer,
    feedItems,
    feedError,
    refreshEntries,
    refreshFeed,
    handleDeleteEntry,
    handleAddEntry,
    friendUsername,
    setFriendUsername,
    friends,
    incomingRequests,
    friendError,
    friendStatus,
    handleSendFriendRequest,
    refreshFriends,
    handleAcceptRequest,
    handleOpenDirectChat,
    year,
    setYear,
    leaderboardRows,
    leaderboardError,
    handleLoadLeaderboard,
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
    handleRefreshChatInbox,
    handleCreateGroup,
    handleJoinApprovedInvite,
    handleApproveInvite,
    handleRejectInvite,
    handleOpenRoom,
    handleProposeInvite,
    loadMessages,
    handleSendMessage,
  };
}

function clampInt(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function asRealtimeMessage(
  payload: RealtimePostgresInsertPayload<{
    id: string;
    room_id: string;
    sender_id: string;
    body: string;
    created_at: string;
  }>
): ChatMessage | null {
  const row = payload.new;
  if (!row?.id || !row.room_id || !row.sender_id || !row.body || !row.created_at) return null;
  return {
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mergeMessages(existing: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (existing.some((message) => message.id === incoming.id)) return existing;
  return [incoming, ...existing];
}

function normalizePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Phone number is required.');

  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    if (!/^\+\d{10,15}$/.test(digits)) throw new Error('Use phone format like +15551234567.');
    return digits;
  }

  const usDigits = digits.replace(/\D/g, '');
  if (/^\d{10}$/.test(usDigits)) return `+1${usDigits}`;
  if (/^\d{11,15}$/.test(usDigits)) return `+${usDigits}`;
  throw new Error('Use phone format like +15551234567.');
}
