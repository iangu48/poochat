import { Text, TouchableOpacity, View } from 'react-native';
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
  leaderboardError: string;
  leaderboardLoading: boolean;
  onSelectLeaderboardYear: (year: number) => void;
  onRefreshLeaderboard: () => void;
  onToggleShareFeed: () => void;
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
  leaderboardError,
  leaderboardLoading,
  onSelectLeaderboardYear,
  onRefreshLeaderboard,
  onToggleShareFeed,
  onSignOut,
}: Props) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.muted}>{email ?? 'No email on file'}</Text>
      <Text style={styles.muted}>
        {profile.displayName} (@{profile.username})
      </Text>
      <Text style={styles.label}>Feed Visibility</Text>
      <Text style={styles.muted}>
        {profile.shareFeed ? 'Friends can see your entries in feed.' : 'Your entries are hidden from friend feed.'}
      </Text>
      <TouchableOpacity style={styles.buttonSecondary} onPress={onToggleShareFeed}>
        <Text style={styles.buttonText}>{profile.shareFeed ? 'Hide My Feed Activity' : 'Share My Feed Activity'}</Text>
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
          style={[styles.buttonSecondary, selectedLeaderboardYear === currentYear && styles.segmentButtonActive]}
          onPress={() => onSelectLeaderboardYear(currentYear)}
        >
          <Text style={styles.buttonText}>{currentYear}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, selectedLeaderboardYear === previousYear && styles.segmentButtonActive]}
          onPress={() => onSelectLeaderboardYear(previousYear)}
        >
          <Text style={styles.buttonText}>{previousYear}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onRefreshLeaderboard}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {leaderboardLoading && <Text style={styles.muted}>Loading leaderboard...</Text>}
      {!!leaderboardError && <Text style={styles.error}>{leaderboardError}</Text>}
      {leaderboardRows.map((row) => (
        <View key={row.subjectId} style={styles.card}>
          <Text style={styles.cardTitle}>
            #{row.rank} {row.displayName} (@{row.username})
          </Text>
          <Text style={styles.muted}>
            Score {row.score} | Avg {row.avgRating.toFixed(2)}
          </Text>
        </View>
      ))}
      {leaderboardRows.length === 0 && !leaderboardLoading && <Text style={styles.muted}>No leaderboard rows.</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.buttonDanger} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
