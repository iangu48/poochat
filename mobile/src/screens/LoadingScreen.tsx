import { Text, View } from 'react-native';
import { styles } from './styles';

export function LoadingScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Loading...</Text>
    </View>
  );
}
