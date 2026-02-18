import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '../components/Ionicons';
import { styles } from './styles';

type Props = {
  username: string;
  displayName: string;
  error: string;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onSave: () => void;
  onSignOut: () => void;
};

export function OnboardingScreen(props: Props) {
  const { username, displayName, error, onUsernameChange, onDisplayNameChange, onSave, onSignOut } = props;

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
      <TouchableOpacity style={styles.button} onPress={onSave}>
        <View style={styles.buttonContentRow}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.buttonText}>Save Profile</Text>
        </View>
      </TouchableOpacity>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.buttonDanger} onPress={onSignOut}>
        <View style={styles.buttonContentRow}>
          <Ionicons name="log-out-outline" size={16} color="#fff" />
          <Text style={styles.buttonText}>Sign Out</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
