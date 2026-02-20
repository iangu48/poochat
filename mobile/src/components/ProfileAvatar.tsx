import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../screens/styles';

type Props = {
  avatarUrl: string | null;
  avatarTint: string;
  size?: number;
};

export function ProfileAvatar({ avatarUrl, avatarTint, size = 72 }: Props) {
  return (
    <View style={[styles.avatarSquare, { width: size, height: size, backgroundColor: avatarTint }]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
      ) : (
        <Ionicons name="person" size={Math.round(size * 0.62)} color="#f0f6fc" />
      )}
    </View>
  );
}
