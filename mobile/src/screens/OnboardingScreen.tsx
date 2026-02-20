import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

type Props = {
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

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create Your Profile</Text>
      <Text style={styles.muted}>Username and display name are required.</Text>
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        placeholder="e.g. poopcaptain"
        placeholderTextColor="#8b949e"
        value={username}
        onChangeText={onUsernameChange}
      />
      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Alex"
        placeholderTextColor="#8b949e"
        value={displayName}
        onChangeText={onDisplayNameChange}
      />
      <TouchableOpacity style={[styles.button, profileSaving && styles.buttonDisabled]} onPress={onSave} disabled={profileSaving}>
        <View style={styles.buttonContentRow}>
          {profileSaving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
          <Text style={styles.buttonText}>{profileSaving ? 'Saving...' : 'Save Profile'}</Text>
        </View>
      </TouchableOpacity>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={[styles.buttonDanger, signingOut && styles.buttonDisabled]} onPress={onSignOut} disabled={signingOut}>
        <View style={styles.buttonContentRow}>
          {signingOut ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="log-out-outline" size={16} color="#fff" />}
          <Text style={styles.buttonText}>{signingOut ? 'Signing Out...' : 'Sign Out'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
