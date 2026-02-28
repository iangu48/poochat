import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatar } from '../components/ProfileAvatar';
import type { LeaderboardRow, Profile } from '../types/domain';
import { styles } from './styles';

type Props = {
  email?: string;
  profile: Profile;
  error: string;
  currentYear: number;
  previousYear: number;
  currentYearRank: number | null;
  previousYearRank: number | null;
  selectedLeaderboardYear: number;
  leaderboardRows: LeaderboardRow[];
  profilesById: Record<string, Profile>;
  leaderboardError: string;
  leaderboardLoading: boolean;
  onSelectLeaderboardYear: (year: number) => void;
  onRefreshLeaderboard: () => void;
  onToggleShareFeed: () => void;
  toggleShareFeedLoading: boolean;
  onUploadAvatar: () => void;
  avatarUploading: boolean;
  signingOut: boolean;
  onSignOut: () => void;
};

export function AccountScreen({
  email,
  profile,
  error,
  currentYear,
  previousYear,
  currentYearRank,
  previousYearRank,
  selectedLeaderboardYear,
  leaderboardRows,
  profilesById,
  leaderboardError,
  leaderboardLoading,
  onSelectLeaderboardYear,
  onRefreshLeaderboard,
  onToggleShareFeed,
  toggleShareFeedLoading,
  onUploadAvatar,
  avatarUploading,
  signingOut,
  onSignOut,
}: Props) {
  const [pullDistance, setPullDistance] = useState(0);
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      onScroll={(event) => {
        const y = event.nativeEvent.contentOffset.y;
        setPullDistance(Math.max(0, Math.min(72, -y)));
      }}
      onScrollEndDrag={() => {
        if (!leaderboardLoading) setPullDistance(0);
      }}
      onMomentumScrollEnd={() => {
        if (!leaderboardLoading) setPullDistance(0);
      }}
      scrollEventThrottle={16}
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        <RefreshControl
          refreshing={leaderboardLoading}
          onRefresh={onRefreshLeaderboard}
          tintColor="#f0f6fc"
          progressViewOffset={0}
        />
      }
    >
      {leaderboardLoading || pullDistance > 0 ? (
        <View style={[styles.refreshGapIndicator, { height: leaderboardLoading ? 48 : pullDistance }]}>
          {!leaderboardLoading ? (
            <Text style={[styles.refreshHint, { opacity: Math.min(1, pullDistance / 42) }]}>Pull to refresh</Text>
          ) : null}
          {leaderboardLoading ? <ActivityIndicator size="small" color="#f0f6fc" /> : null}
        </View>
      ) : null}
      <Text style={styles.title}>Account</Text>
      <Text style={styles.muted}>{email ?? 'No email on file'}</Text>
      <View style={styles.profileHeader}>
        <ProfileAvatar avatarUrl={profile.avatarUrl} avatarTint={profile.avatarTint} />
        <View style={styles.profileHeaderText}>
          <Text style={styles.muted}>
            {profile.displayName} (@{profile.username})
          </Text>
          <TouchableOpacity
            style={[styles.buttonSecondary, avatarUploading && styles.buttonDisabled]}
            onPress={onUploadAvatar}
            disabled={avatarUploading}
          >
            <View style={styles.buttonContentRow}>
              {avatarUploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="image" size={16} color="#fff" />}
              <Text style={styles.buttonText}>{avatarUploading ? 'Uploading...' : 'Upload Photo'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.label}>Feed Visibility</Text>
      <Text style={styles.muted}>
        {profile.shareFeed ? 'Friends can see your entries in feed.' : 'Your entries are hidden from friend feed.'}
      </Text>
      <TouchableOpacity
        style={[styles.buttonSecondary, toggleShareFeedLoading && styles.buttonDisabled]}
        onPress={onToggleShareFeed}
        disabled={toggleShareFeedLoading}
      >
        <View style={styles.buttonContentRow}>
          {toggleShareFeedLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={profile.shareFeed ? 'eye-off' : 'eye'} size={16} color="#fff" />
          )}
          <Text style={styles.buttonText}>
            {toggleShareFeedLoading
              ? 'Updating...'
              : profile.shareFeed
                ? 'Hide My Feed Activity'
                : 'Share My Feed Activity'}
          </Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Your Ranking</Text>
      <Text style={styles.muted}>
        {currentYear}: {currentYearRank ? `#${currentYearRank}` : 'Unranked'}
      </Text>
      <Text style={styles.muted}>
        {previousYear}: {previousYearRank ? `#${previousYearRank}` : 'Unranked'}
      </Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.buttonSecondary,
            selectedLeaderboardYear === currentYear && styles.segmentButtonActive,
            leaderboardLoading && styles.buttonDisabled,
          ]}
          onPress={() => onSelectLeaderboardYear(currentYear)}
          disabled={leaderboardLoading}
        >
          <Text style={styles.buttonText}>{currentYear}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.buttonSecondary,
            selectedLeaderboardYear === previousYear && styles.segmentButtonActive,
            leaderboardLoading && styles.buttonDisabled,
          ]}
          onPress={() => onSelectLeaderboardYear(previousYear)}
          disabled={leaderboardLoading}
        >
          <Text style={styles.buttonText}>{previousYear}</Text>
        </TouchableOpacity>
      </View>

      {leaderboardLoading && <Text style={styles.muted}>Loading leaderboard...</Text>}
      {!!leaderboardError && <Text style={styles.error}>{leaderboardError}</Text>}
      {leaderboardRows.map((row) => (
        <View key={row.subjectId} style={styles.card}>
          <View style={styles.inlineRow}>
            <ProfileAvatar
              size={32}
              avatarUrl={profilesById[row.subjectId]?.avatarUrl ?? null}
              avatarTint={profilesById[row.subjectId]?.avatarTint ?? '#5b6c8a'}
            />
            <Text style={[styles.cardTitle, styles.inlineLeft]}>
              #{row.rank} {row.displayName} (@{row.username})
            </Text>
          </View>
          <Text style={styles.muted}>
            Score {row.score} | Avg {row.avgRating.toFixed(2)}
          </Text>
        </View>
      ))}
      {leaderboardRows.length === 0 && !leaderboardLoading && <Text style={styles.muted}>No leaderboard rows.</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={[styles.buttonDanger, signingOut && styles.buttonDisabled]} onPress={onSignOut} disabled={signingOut}>
        <View style={styles.buttonContentRow}>
          {signingOut ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="log-out-outline" size={16} color="#fff" />}
          <Text style={styles.buttonText}>{signingOut ? 'Signing Out...' : 'Sign Out'}</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
