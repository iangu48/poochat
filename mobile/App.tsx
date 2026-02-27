import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
      <GestureHandlerRootView style={styles.root}>
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
            authSubmitting={app.authSubmitting}
            authSendingOtp={app.authSendingOtp}
            authStatus={app.authStatus}
            authError={app.authError}
            otpInputRef={app.otpInputRef}
            onSendPhoneOtp={() => void app.handleSendPhoneOtp()}
            onVerifyPhoneOtp={() => void app.handleVerifyPhoneOtp()}
            onAuth={(mode) => void app.handleAuth(mode)}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  if (app.profileLoading) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.root}>
          <StatusBar style="auto" />
          <LoadingScreen />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  if (!app.myProfile) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.root}>
          <StatusBar style="auto" />
          <OnboardingScreen
            username={app.onboardingUsername}
            displayName={app.onboardingDisplayName}
            error={app.profileError}
            profileSaving={app.profileSaving}
            signingOut={app.signingOut}
            onUsernameChange={app.setOnboardingUsername}
            onDisplayNameChange={app.setOnboardingDisplayName}
            onSave={() => void app.handleSaveProfile()}
            onSignOut={() => void app.handleSignOut()}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  const homeProps = {
    entries: app.entries,
    loadingEntries: app.loadingEntries,
    addEntryLoading: app.addEntryLoading,
    deletingEntryIds: app.deletingEntryIds,
    isEditingEntry: Boolean(app.editingEntryId),
    entryError: app.entryError,
    showEntryComposer: app.showEntryComposer,
    bristolType: app.bristolType,
    rating: app.rating,
    note: app.note,
    entryDate: app.entryDate,
    entryTime: app.entryTime,
    onRefreshEntries: () => void app.refreshEntries(),
    onDeleteEntry: (entryId: string) => void app.handleDeleteEntry(entryId),
    onEditEntry: app.handleStartEditEntry,
    onToggleComposer: app.openAddEntryComposer,
    onBristolTypeChange: app.setBristolType,
    onRatingChange: app.setRating,
    onNoteChange: app.setNote,
    onEntryDateChange: app.setEntryDate,
    onEntryTimeChange: app.setEntryTime,
    onAddEntry: () => void app.handleAddEntry(),
    onCloseComposer: app.closeEntryComposer,
  };

  const socialProps = {
    socialSection: app.socialSection,
    setSocialSection: app.setSocialSection,
    feedItems: app.feedItems,
    profilesById: app.profilesById,
    feedCommentsByEntry: app.feedCommentsByEntry,
    feedCommentDraftByEntry: app.feedCommentDraftByEntry,
    feedCommentSubmittingEntryId: app.feedCommentSubmittingEntryId,
    feedError: app.feedError,
    feedLoading: app.feedLoading,
    onRefreshFeed: () => void app.refreshFeed(),
    onFeedCommentDraftChange: app.setFeedCommentDraft,
    onAddFeedComment: (entryId: string) => app.handleAddFeedComment(entryId),
    friendUsername: app.friendUsername,
    friends: app.friends,
    incomingRequests: app.incomingRequests,
    friendError: app.friendError,
    friendStatus: app.friendStatus,
    friendsLoading: app.friendsLoading,
    sendFriendRequestLoading: app.sendFriendRequestLoading,
    acceptingRequestIds: app.acceptingRequestIds,
    onFriendUsernameChange: app.setFriendUsername,
    onSendFriendRequest: () => app.handleSendFriendRequest(),
    onRefreshFriends: () => void app.refreshFriends(),
    onAcceptRequest: (friendshipId: string) => void app.handleAcceptRequest(friendshipId),
  };

  const accountProps = {
    email: app.session.user.email,
    profile: app.myProfile,
    error: app.profileError,
    currentYear: app.currentYear,
    previousYear: app.previousYear,
    currentYearRank: app.currentYearRank,
    previousYearRank: app.previousYearRank,
    selectedLeaderboardYear: app.selectedLeaderboardYear,
    leaderboardRows: app.accountLeaderboardRows,
    profilesById: app.profilesById,
    leaderboardError: app.accountLeaderboardError,
    leaderboardLoading: app.accountLeaderboardLoading,
    onSelectLeaderboardYear: (year: number) => void app.handleSelectLeaderboardYear(year),
    onRefreshLeaderboard: () => void app.refreshAccountLeaderboard(),
    onToggleShareFeed: () => void app.handleToggleShareFeed(),
    toggleShareFeedLoading: app.toggleShareFeedLoading,
    onUploadAvatar: () => void app.handleUploadAvatar(),
    avatarUploading: app.avatarUploading,
    signingOut: app.signingOut,
    onSignOut: () => void app.handleSignOut(),
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.root}>
        <StatusBar style="auto" />
        <TabBar tab={app.tab} onTabChange={app.setTab} />

        {app.tab === 'home' && <HomeScreen {...homeProps} />}
        {app.tab === 'social' && <FriendsScreen {...socialProps} />}
        {app.tab === 'account' && <AccountScreen {...accountProps} />}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
