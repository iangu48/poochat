import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AccountScreen } from './src/screens/AccountScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { styles } from './src/screens/styles';
import { TabBar } from './src/screens/TabBar';
import { useAppController } from './src/hooks/useAppController';

export default function App() {
  const app = useAppController();

  if (!app.session) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="auto" />
        <AuthScreen
          authMethod={app.authMethod}
          setAuthMethod={app.setAuthMethod}
          authPhone={app.authPhone}
          setAuthPhone={app.setAuthPhone}
          authOtp={app.authOtp}
          setAuthOtp={app.setAuthOtp}
          authEmail={app.authEmail}
          setAuthEmail={app.setAuthEmail}
          authPassword={app.authPassword}
          setAuthPassword={app.setAuthPassword}
          authOtpCooldownSec={app.authOtpCooldownSec}
          authVerifyingOtp={app.authVerifyingOtp}
          authStatus={app.authStatus}
          authError={app.authError}
          otpInputRef={app.otpInputRef}
          onSendPhoneOtp={() => void app.handleSendPhoneOtp()}
          onVerifyPhoneOtp={() => void app.handleVerifyPhoneOtp()}
          onAuth={(mode) => void app.handleAuth(mode)}
        />
      </SafeAreaView>
    );
  }

  if (app.profileLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="auto" />
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (!app.myProfile) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="auto" />
        <OnboardingScreen
          username={app.onboardingUsername}
          displayName={app.onboardingDisplayName}
          error={app.profileError}
          onUsernameChange={app.setOnboardingUsername}
          onDisplayNameChange={app.setOnboardingDisplayName}
          onSave={() => void app.handleSaveProfile()}
          onSignOut={() => void app.handleSignOut()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
      <TabBar tab={app.tab} onTabChange={app.setTab} />

      {app.tab === 'home' && (
        <HomeScreen
          entries={app.entries}
          feedItems={app.feedItems}
          profilesById={app.profilesById}
          loadingEntries={app.loadingEntries}
          entryError={app.entryError}
          feedError={app.feedError}
          showEntryComposer={app.showEntryComposer}
          bristolType={app.bristolType}
          rating={app.rating}
          note={app.note}
          onRefreshEntries={() => void app.refreshEntries()}
          onRefreshFeed={() => void app.refreshFeed()}
          onDeleteEntry={(entryId) => void app.handleDeleteEntry(entryId)}
          onToggleComposer={() => app.setShowEntryComposer((prev) => !prev)}
          onBristolTypeChange={app.setBristolType}
          onRatingChange={app.setRating}
          onNoteChange={app.setNote}
          onAddEntry={() => void app.handleAddEntry()}
          onCloseComposer={() => app.setShowEntryComposer(false)}
        />
      )}

      {app.tab === 'social' && (
        <FriendsScreen
          socialSection={app.socialSection}
          setSocialSection={app.setSocialSection}
          feedItems={app.feedItems}
          feedError={app.feedError}
          onRefreshFeed={() => void app.refreshFeed()}
          friendUsername={app.friendUsername}
          friends={app.friends}
          incomingRequests={app.incomingRequests}
          friendError={app.friendError}
          friendStatus={app.friendStatus}
          onFriendUsernameChange={app.setFriendUsername}
          onSendFriendRequest={() => void app.handleSendFriendRequest()}
          onRefreshFriends={() => void app.refreshFriends()}
          onAcceptRequest={(friendshipId) => void app.handleAcceptRequest(friendshipId)}
          onOpenDirectChat={(friendUserId) => void app.handleOpenDirectChat(friendUserId)}
          chatRoute={app.chatRoute}
          setChatRoute={app.setChatRoute}
          activeRoomId={app.activeRoomId}
          activeRoom={app.activeRoom}
          activeRoomRole={app.activeRoomRole}
          chatRooms={app.chatRooms}
          approvalsByRoom={app.approvalsByRoom}
          approvalsRequired={app.approvalsRequired}
          approvedInvitesForMe={app.approvedInvitesForMe}
          pendingInvites={app.pendingInvites}
          inviteParticipantLabels={app.inviteParticipantLabels}
          inviteRoomLabels={app.inviteRoomLabels}
          chatRoomLabels={app.chatRoomLabels}
          chatRoomProfiles={app.chatRoomProfiles}
          chatUserLabels={app.chatUserLabels}
          profilesById={app.profilesById}
          currentUserId={app.currentUserId}
          showCreateGroup={app.showCreateGroup}
          setShowCreateGroup={app.setShowCreateGroup}
          showInviteQueue={app.showInviteQueue}
          setShowInviteQueue={app.setShowInviteQueue}
          showApprovalQueue={app.showApprovalQueue}
          setShowApprovalQueue={app.setShowApprovalQueue}
          showRoomActions={app.showRoomActions}
          setShowRoomActions={app.setShowRoomActions}
          groupName={app.groupName}
          setGroupName={app.setGroupName}
          inviteUsername={app.inviteUsername}
          setInviteUsername={app.setInviteUsername}
          messageBody={app.messageBody}
          setMessageBody={app.setMessageBody}
          chatRows={app.chatRows}
          chatStatus={app.chatStatus}
          chatError={app.chatError}
          onRefreshInbox={() => void app.handleRefreshChatInbox()}
          onCreateGroup={() => void app.handleCreateGroup()}
          onJoinApprovedInvite={(inviteId) => void app.handleJoinApprovedInvite(inviteId)}
          onApproveInvite={(inviteId) => void app.handleApproveInvite(inviteId)}
          onRejectInvite={(inviteId) => void app.handleRejectInvite(inviteId)}
          onOpenRoom={(roomId) => void app.handleOpenRoom(roomId)}
          onProposeInvite={() => void app.handleProposeInvite()}
          onRefreshMessages={() => void app.loadMessages(app.activeRoomId)}
          onSendMessage={() => void app.handleSendMessage()}
        />
      )}

      {app.tab === 'account' && (
        <AccountScreen
          email={app.session.user.email}
          profile={app.myProfile}
          error={app.profileError}
          currentYear={app.currentYear}
          previousYear={app.previousYear}
          currentYearRank={app.currentYearRank}
          previousYearRank={app.previousYearRank}
          selectedLeaderboardYear={app.selectedLeaderboardYear}
          leaderboardRows={app.accountLeaderboardRows}
          profilesById={app.profilesById}
          leaderboardError={app.accountLeaderboardError}
          leaderboardLoading={app.accountLeaderboardLoading}
          onSelectLeaderboardYear={(year) => void app.handleSelectLeaderboardYear(year)}
          onRefreshLeaderboard={() => void app.refreshAccountLeaderboard()}
          onToggleShareFeed={() => void app.handleToggleShareFeed()}
          onUploadAvatar={() => void app.handleUploadAvatar()}
          avatarUploading={app.avatarUploading}
          onSignOut={() => void app.handleSignOut()}
        />
      )}
    </SafeAreaView>
  );
}
