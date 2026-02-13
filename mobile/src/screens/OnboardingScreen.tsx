import { Text, TextInput, TouchableOpacity, View } from 'react-native';
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
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.buttonDanger} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
