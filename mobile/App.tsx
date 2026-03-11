import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AccountScreen } from './src/screens/AccountScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { styles } from './src/screens/styles';
import { TabBar } from './src/screens/TabBar';
import { useAppController } from './src/hooks/useAppController';

export default function App() {
  const app = useAppController();

  if (!app.session) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.root}>
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
        </View>
      </GestureHandlerRootView>
    );
  }

  if (app.profileLoading) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.root}>
          <StatusBar style="auto" />
          <LoadingScreen />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!app.myProfile) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.root}>
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
        </View>
      </GestureHandlerRootView>
    );
  }

  const homeProps = {
    currentUserId: app.currentUserId,
    entries: app.entries,
    feedItems: app.feedItems,
    profilesById: app.profilesById,
    feedCommentsByEntry: app.feedCommentsByEntry,
    feedCommentDraftByEntry: app.feedCommentDraftByEntry,
    feedCommentSubmittingEntryId: app.feedCommentSubmittingEntryId,
    feedLoading: app.feedLoading,
    feedError: app.feedError,
    loadingEntries: app.loadingEntries,
    addEntryLoading: app.addEntryLoading,
    updatingEntryLocationIds: app.updatingEntryLocationIds,
    isEditingEntry: Boolean(app.editingEntryId),
    entryError: app.entryError,
    showEntryComposer: app.showEntryComposer,
    bristolType: app.bristolType,
    rating: app.rating,
    note: app.note,
    entryDate: app.entryDate,
    entryTime: app.entryTime,
    onUpdateEntryLocation: (entryId: string, latitude: number, longitude: number) =>
      void app.handleUpdateEntryLocation(entryId, latitude, longitude),
    onToggleComposer: app.openAddEntryComposer,
    onBristolTypeChange: app.setBristolType,
    onRatingChange: app.setRating,
    onNoteChange: app.setNote,
    onEntryDateChange: app.setEntryDate,
    onEntryTimeChange: app.setEntryTime,
    onAddEntry: () => void app.handleAddEntry(),
    onComposerLocationChange: (latitude: number, longitude: number, source?: 'gps' | 'manual') =>
      app.handleSetEntryComposerLocation(latitude, longitude, source),
    onCloseComposer: app.closeEntryComposer,
    onFeedCommentDraftChange: app.setFeedCommentDraft,
    onAddFeedComment: (entryId: string) => app.handleAddFeedComment(entryId),
    friendUsername: app.friendUsername,
    friends: app.friends,
    incomingRequests: app.incomingRequests,
    friendError: app.friendError,
    friendStatus: app.friendStatus,
    sendFriendRequestLoading: app.sendFriendRequestLoading,
    acceptingRequestIds: app.acceptingRequestIds,
    onFriendUsernameChange: app.setFriendUsername,
    onSendFriendRequest: () => app.handleSendFriendRequest(),
    onAcceptRequest: (friendshipId: string) => void app.handleAcceptRequest(friendshipId),
  };

  const overviewProps = {
    entries: app.entries,
    loadingEntries: app.loadingEntries,
    entryError: app.entryError,
    deletingEntryIds: app.deletingEntryIds,
    onDeleteEntry: (entryId: string) => void app.handleDeleteEntry(entryId),
    onEditEntry: app.handleStartEditEntry,
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
      <BottomSheetModalProvider>
        <View style={styles.root}>
          <StatusBar style="auto" />
          <View style={styles.contentWithTabIsland}>
            <View
              style={[
                styles.root,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: app.tab === 'overview' ? 1 : 0,
                },
              ]}
              pointerEvents={app.tab === 'overview' ? 'auto' : 'none'}
            >
              <OverviewScreen {...overviewProps} />
            </View>
            <View
              style={[
                styles.root,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: app.tab === 'home' ? 1 : 0,
                },
              ]}
              pointerEvents={app.tab === 'home' ? 'auto' : 'none'}
            >
              <HomeScreen {...homeProps} />
            </View>
            <View
              style={[
                styles.root,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: app.tab === 'account' ? 1 : 0,
                },
              ]}
              pointerEvents={app.tab === 'account' ? 'auto' : 'none'}
            >
              <AccountScreen {...accountProps} />
            </View>
          </View>
          <TabBar tab={app.tab} onTabChange={app.setTab} />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
