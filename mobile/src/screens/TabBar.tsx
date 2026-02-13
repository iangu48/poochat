import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

export type Tab = 'home' | 'friends' | 'leaderboard' | 'chat' | 'account';

type Props = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function TabBar({ tab, onTabChange }: Props) {
  return (
    <View style={styles.tabRow}>
      <TabButton tab={tab} label="Home" value="home" onPress={onTabChange} />
      <TabButton tab={tab} label="Friends" value="friends" onPress={onTabChange} />
      <TabButton tab={tab} label="Leaderboard" value="leaderboard" onPress={onTabChange} />
      <TabButton tab={tab} label="Chat" value="chat" onPress={onTabChange} />
      <TabButton tab={tab} label="Account" value="account" onPress={onTabChange} />
    </View>
  );
}

type TabButtonProps = {
  tab: Tab;
  value: Tab;
  label: string;
  onPress: (tab: Tab) => void;
};

function TabButton({ tab, value, label, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity style={[styles.tabButton, tab === value && styles.tabButtonActive]} onPress={() => onPress(value)}>
      <Text style={styles.tabButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}
