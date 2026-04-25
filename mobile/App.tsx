import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccountScreen } from './src/screens/AccountScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { styles } from './src/screens/styles';
import { TabBar } from './src/screens/TabBar';
import { useAppController } from './src/hooks/useAppController';
import type { FeedReactionKind } from './src/types/domain';

export default function App() {
  const app = useAppController();
  const isLightMode = app.themeMode === 'light';
  const appRootStyle = [styles.root, isLightMode ? styles.rootLight : null];
  const appContentStyle = [styles.contentWithTabIsland, isLightMode ? styles.contentWithTabIslandLight : null];
  const statusBarStyle = isLightMode ? 'dark' : 'light';

  if (!app.session) {
    return (
      <GestureHandlerRootView style={appRootStyle}>
        <View style={appRootStyle}>
          <StatusBar style={statusBarStyle} />
          <AuthScreen
            themeMode={app.themeMode}
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
      <GestureHandlerRootView style={appRootStyle}>
        <View style={appRootStyle}>
          <StatusBar style={statusBarStyle} />
          <LoadingScreen themeMode={app.themeMode} />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!app.myProfile) {
    return (
      <GestureHandlerRootView style={appRootStyle}>
        <View style={appRootStyle}>
          <StatusBar style={statusBarStyle} />
          <OnboardingScreen
            themeMode={app.themeMode}
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
    themeMode: app.themeMode,
    currentUserId: app.currentUserId,
    deletingEntryIds: app.deletingEntryIds,
    entries: app.entries,
    feedItems: app.feedItems,
    profilesById: app.profilesById,
    feedCommentsByEntry: app.feedCommentsByEntry,
    feedReactionsByEntry: app.feedReactionsByEntry,
    feedCommentDraftByEntry: app.feedCommentDraftByEntry,
    feedCommentSubmittingEntryId: app.feedCommentSubmittingEntryId,
    feedReactionSubmittingEntryId: app.feedReactionSubmittingEntryId,
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
    volume: app.volume,
    note: app.note,
    availableTriggerTags: app.availableTriggerTags,
    selectedTriggerTagIds: app.selectedTriggerTagIds,
    entryDate: app.entryDate,
    entryTime: app.entryTime,
    onUpdateEntryLocation: (entryId: string, latitude: number, longitude: number) =>
      void app.handleUpdateEntryLocation(entryId, latitude, longitude),
    onToggleComposer: app.openAddEntryComposer,
    onBristolTypeChange: app.setBristolType,
    onRatingChange: app.setRating,
    onVolumeChange: app.setVolume,
    onNoteChange: app.setNote,
    onSelectedTriggerTagIdsChange: app.setSelectedTriggerTagIds,
    onEntryDateChange: app.setEntryDate,
    onEntryTimeChange: app.setEntryTime,
    onAddEntry: () => void app.handleAddEntry(),
    onComposerLocationChange: (latitude: number, longitude: number, source?: 'gps' | 'manual') =>
      app.handleSetEntryComposerLocation(latitude, longitude, source),
    onCloseComposer: app.closeEntryComposer,
    onEditEntry: app.handleStartEditEntry,
    onDeleteEntry: (entryId: string) => app.handleDeleteEntry(entryId),
    onFeedCommentDraftChange: app.setFeedCommentDraft,
    onAddFeedComment: (entryId: string) => app.handleAddFeedComment(entryId),
    onToggleFeedReaction: (entryId: string, reaction: FeedReactionKind) => app.handleToggleFeedReaction(entryId, reaction),
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
    themeMode: app.themeMode,
    entries: app.entries,
    loadingEntries: app.loadingEntries,
    entryError: app.entryError,
    deletingEntryIds: app.deletingEntryIds,
    addEntryLoading: app.addEntryLoading,
    isEditingEntry: Boolean(app.editingEntryId),
    showEntryComposer: app.showEntryComposer,
    bristolType: app.bristolType,
    rating: app.rating,
    volume: app.volume,
    note: app.note,
    availableTriggerTags: app.availableTriggerTags,
    selectedTriggerTagIds: app.selectedTriggerTagIds,
    entryDate: app.entryDate,
    entryTime: app.entryTime,
    onDeleteEntry: (entryId: string) => void app.handleDeleteEntry(entryId),
    onEditEntry: app.handleStartEditEntry,
    onBristolTypeChange: app.setBristolType,
    onRatingChange: app.setRating,
    onVolumeChange: app.setVolume,
    onNoteChange: app.setNote,
    onSelectedTriggerTagIdsChange: app.setSelectedTriggerTagIds,
    onEntryDateChange: app.setEntryDate,
    onEntryTimeChange: app.setEntryTime,
    onAddEntry: () => void app.handleAddEntry(),
    onCloseComposer: app.closeEntryComposer,
    onRefreshEntries: () => void app.refreshEntries({ minDurationMs: 700 }),
  };

  const accountProps = {
    email: app.session.user.email,
    profile: app.myProfile,
    themeMode: app.themeMode,
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
    onRefreshLeaderboard: () => void app.refreshAccountLeaderboard({ minDurationMs: 700 }),
    onToggleShareFeed: () => void app.handleToggleShareFeed(),
    toggleShareFeedLoading: app.toggleShareFeedLoading,
    onUploadAvatar: () => void app.handleUploadAvatar(),
    avatarUploading: app.avatarUploading,
    signingOut: app.signingOut,
    onToggleThemeMode: () => void app.handleToggleThemeMode(),
    onSignOut: () => void app.handleSignOut(),
  };

  const insightsProps = {
    themeMode: app.themeMode,
    entries: app.entries,
    loadingEntries: app.loadingEntries,
    entryError: app.entryError,
    onRefreshInsights: () => void app.refreshEntries({ minDurationMs: 700 }),
  };

  return (
    <GestureHandlerRootView style={appRootStyle}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <View style={appRootStyle}>
            <StatusBar style={statusBarStyle} />
            <View style={appContentStyle}>
            <View
              style={[
                styles.root,
                isLightMode ? styles.rootLight : null,
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
                isLightMode ? styles.rootLight : null,
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
                isLightMode ? styles.rootLight : null,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: app.tab === 'insights' ? 1 : 0,
                },
              ]}
              pointerEvents={app.tab === 'insights' ? 'auto' : 'none'}
            >
              <InsightsScreen {...insightsProps} />
            </View>
            <View
              style={[
                styles.root,
                isLightMode ? styles.rootLight : null,
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
            <TabBar tab={app.tab} onTabChange={app.setTab} themeMode={app.themeMode} />
          </View>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
