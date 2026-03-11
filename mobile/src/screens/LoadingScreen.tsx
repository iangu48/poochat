import { Text, View } from 'react-native';
import { styles } from './styles';
import { getThemePalette, type ThemeMode } from '../theme';

type Props = {
  themeMode: ThemeMode;
};

export function LoadingScreen({ themeMode }: Props) {
  const colors = getThemePalette(themeMode);
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Loading...</Text>
    </View>
  );
}
