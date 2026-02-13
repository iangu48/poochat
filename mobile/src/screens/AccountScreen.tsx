import { Text, TouchableOpacity, View } from 'react-native';
import type { Profile } from '../types/domain';
import { styles } from './styles';

type Props = {
  email?: string;
  profile: Profile;
  error: string;
  onToggleShareFeed: () => void;
  onSignOut: () => void;
};

export function AccountScreen({ email, profile, error, onToggleShareFeed, onSignOut }: Props) {
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
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.buttonDanger} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
