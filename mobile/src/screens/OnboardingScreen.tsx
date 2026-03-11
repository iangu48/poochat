import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { getThemePalette, type ThemeMode } from '../theme';

type Props = {
  themeMode: ThemeMode;
  username: string;
  displayName: string;
  error: string;
  profileSaving: boolean;
  signingOut: boolean;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onSave: () => void;
  onSignOut: () => void;
};

export function OnboardingScreen(props: Props) {
  const {
    themeMode,
    username,
    displayName,
    error,
    profileSaving,
    signingOut,
    onUsernameChange,
    onDisplayNameChange,
    onSave,
    onSignOut,
  } = props;
  const colors = getThemePalette(themeMode);
  const dangerButtonTextColor = themeMode === 'light' ? '#7c1d1d' : '#ffffff';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Create Your Profile</Text>
      <Text style={[styles.muted, { color: colors.mutedText }]}>Username and display name are required.</Text>
      <Text style={[styles.label, { color: colors.text }]}>Username</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
        autoCapitalize="none"
        placeholder="e.g. poopcaptain"
        placeholderTextColor={colors.mutedText}
        value={username}
        onChangeText={onUsernameChange}
      />
      <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. Alex"
        placeholderTextColor={colors.mutedText}
        value={displayName}
        onChangeText={onDisplayNameChange}
      />
      <TouchableOpacity
        style={[
          styles.appActionButtonPrimary,
          { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
          profileSaving && styles.buttonDisabled,
        ]}
        onPress={onSave}
        disabled={profileSaving}
      >
        <View style={styles.buttonContentRow}>
          {profileSaving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
          <Text style={styles.buttonText}>{profileSaving ? 'Saving...' : 'Save Profile'}</Text>
        </View>
      </TouchableOpacity>
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
    </View>
  );
}
