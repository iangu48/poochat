import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileAvatar } from '../components/ProfileAvatar';
import type { LeaderboardRow, Profile } from '../types/domain';
import { styles } from './styles';
import { getThemePalette } from '../theme';

type Props = {
  email?: string;
  profile: Profile;
  themeMode: 'dark' | 'light';
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
  onToggleThemeMode: () => void;
  onSignOut: () => void;
};

export function AccountScreen({
  email,
  profile,
  themeMode,
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
  onToggleThemeMode,
  onSignOut,
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = getThemePalette(themeMode);
  const neutralButtonTextColor = colors.text;
  const dangerButtonTextColor = themeMode === 'light' ? '#7c1d1d' : '#ffffff';
  const switchTrackColor = themeMode === 'light' ? { false: '#cfd8e3', true: '#9fc2fa' } : { false: '#2f3742', true: '#2d74da' };
  const switchThumbColor = themeMode === 'light' ? '#ffffff' : '#f0f6fc';
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.screen, { paddingTop: Math.max(12, insets.top + 8), backgroundColor: colors.background }]}
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        <RefreshControl
          refreshing={leaderboardLoading}
          onRefresh={onRefreshLeaderboard}
          tintColor={colors.text}
          progressViewOffset={0}
        />
      }
    >
      {leaderboardLoading ? (
        <View style={styles.refreshGapIndicator}>
          <ActivityIndicator size="small" color={colors.text} />
        </View>
      ) : null}
      <Text style={[styles.title, { color: colors.text, marginTop: 0 }]}>Account</Text>
      <View style={styles.profileHeader}>
        <ProfileAvatar avatarUrl={profile.avatarUrl} avatarTint={profile.avatarTint} />
        <View style={styles.profileHeaderText}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {profile.displayName} (@{profile.username})
          </Text>
          <Text style={[styles.muted, { color: colors.mutedText }]}>{email ?? 'No email on file'}</Text>
          <TouchableOpacity
            style={[
              styles.appActionButtonSecondary,
              { backgroundColor: colors.surface, borderColor: colors.border },
              avatarUploading && styles.buttonDisabled,
            ]}
            onPress={onUploadAvatar}
            disabled={avatarUploading}
          >
            <View style={styles.buttonContentRow}>
              {avatarUploading ? <ActivityIndicator size="small" color={neutralButtonTextColor} /> : <Ionicons name="image" size={16} color={neutralButtonTextColor} />}
              <Text style={[styles.buttonText, { color: neutralButtonTextColor }]}>{avatarUploading ? 'Uploading...' : 'Photo'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.inlineRow}>
          <View style={styles.inlineLeft}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Dark Mode</Text>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={onToggleThemeMode}
            trackColor={switchTrackColor}
            thumbColor={switchThumbColor}
            ios_backgroundColor={switchTrackColor.false}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.inlineRow}>
          <View style={styles.inlineLeft}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Share Feed</Text>
          </View>
          {toggleShareFeedLoading ? (
            <ActivityIndicator size="small" color={neutralButtonTextColor} />
          ) : (
            <Switch
              value={profile.shareFeed}
              onValueChange={onToggleShareFeed}
              trackColor={switchTrackColor}
              thumbColor={switchThumbColor}
              ios_backgroundColor={switchTrackColor.false}
            />
          )}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Rank</Text>
        <Text style={[styles.muted, { color: colors.mutedText }]}>
          {currentYear}: {currentYearRank ? `#${currentYearRank}` : '—'}  |  {previousYear}: {previousYearRank ? `#${previousYearRank}` : '—'}
        </Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.buttonSecondary,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            selectedLeaderboardYear === currentYear && styles.segmentButtonActive,
            leaderboardLoading && styles.buttonDisabled,
          ]}
          onPress={() => onSelectLeaderboardYear(currentYear)}
          disabled={leaderboardLoading}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: selectedLeaderboardYear === currentYear ? '#ffffff' : neutralButtonTextColor,
              },
            ]}
          >
            {currentYear}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.buttonSecondary,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            selectedLeaderboardYear === previousYear && styles.segmentButtonActive,
            leaderboardLoading && styles.buttonDisabled,
          ]}
          onPress={() => onSelectLeaderboardYear(previousYear)}
          disabled={leaderboardLoading}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: selectedLeaderboardYear === previousYear ? '#ffffff' : neutralButtonTextColor,
              },
            ]}
          >
            {previousYear}
          </Text>
        </TouchableOpacity>
      </View>

      {leaderboardLoading && <Text style={[styles.muted, { color: colors.mutedText }]}>Loading leaderboard...</Text>}
      {!!leaderboardError && <Text style={styles.error}>{leaderboardError}</Text>}
      {leaderboardRows.map((row) => (
        <View key={row.subjectId} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.inlineRow}>
            <ProfileAvatar
              size={32}
              avatarUrl={profilesById[row.subjectId]?.avatarUrl ?? null}
              avatarTint={profilesById[row.subjectId]?.avatarTint ?? '#5b6c8a'}
            />
            <Text style={[styles.cardTitle, styles.inlineLeft, { color: colors.text }]}>
              #{row.rank} {row.displayName} (@{row.username})
            </Text>
          </View>
          <Text style={[styles.muted, { color: colors.mutedText }]}>
            Score {row.score} | Avg {row.avgRating.toFixed(2)}
          </Text>
        </View>
      ))}
      {leaderboardRows.length === 0 && !leaderboardLoading && (
        <Text style={[styles.muted, { color: colors.mutedText }]}>No leaderboard rows.</Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={[
          styles.appActionButtonDanger,
          { backgroundColor: colors.danger, borderColor: colors.dangerBorder },
          signingOut && styles.buttonDisabled,
        ]}
        onPress={onSignOut}
        disabled={signingOut}
      >
        <View style={styles.buttonContentRow}>
          {signingOut ? (
            <ActivityIndicator size="small" color={dangerButtonTextColor} />
          ) : (
            <Ionicons name="log-out-outline" size={16} color={dangerButtonTextColor} />
          )}
          <Text style={[styles.buttonText, { color: dangerButtonTextColor }]}>{signingOut ? 'Signing Out...' : 'Sign Out'}</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
