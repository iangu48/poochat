import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export type Tab = 'home' | 'social' | 'account';

type Props = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function TabBar({ tab, onTabChange }: Props) {
  return (
    <View style={styles.tabRow}>
      <TabButton tab={tab} label="Home" icon="home" value="home" onPress={onTabChange} />
      <TabButton tab={tab} label="Social" icon="people" value="social" onPress={onTabChange} />
      <TabButton tab={tab} label="Account" icon="person" value="account" onPress={onTabChange} />
    </View>
  );
}

type TabButtonProps = {
  tab: Tab;
  value: Tab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: (tab: Tab) => void;
};

function TabButton({ tab, value, label, icon, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity style={[styles.tabButton, tab === value && styles.tabButtonActive]} onPress={() => onPress(value)}>
      <Ionicons name={icon} size={16} color="#f0f6fc" />
      <Text style={styles.tabButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}
