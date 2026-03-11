import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export type Tab = 'overview' | 'home' | 'account';
type ThemeMode = 'dark' | 'light';

type Props = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  themeMode: ThemeMode;
};

export function TabBar({ tab, onTabChange, themeMode }: Props) {
  const isLight = themeMode === 'light';
  const iconColor = isLight ? '#1b1f24' : '#f0f6fc';
  return (
    <View style={styles.tabIslandDock} pointerEvents="box-none">
      <View style={[styles.tabRow, isLight ? styles.tabRowLight : null]}>
        <TabButton tab={tab} label="Overview" icon="analytics" value="overview" onPress={onTabChange} iconColor={iconColor} isLight={isLight} />
        <TabButton tab={tab} label="Home" icon="home" value="home" onPress={onTabChange} iconColor={iconColor} isLight={isLight} />
        <TabButton tab={tab} label="Account" icon="person" value="account" onPress={onTabChange} iconColor={iconColor} isLight={isLight} />
      </View>
    </View>
  );
}

type TabButtonProps = {
  tab: Tab;
  value: Tab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: (tab: Tab) => void;
  iconColor: string;
  isLight: boolean;
};

function TabButton({ tab, value, label, icon, onPress, iconColor, isLight }: TabButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        isLight ? styles.tabButtonLight : null,
        tab === value ? (isLight ? styles.tabButtonActiveLight : styles.tabButtonActive) : null,
      ]}
      onPress={() => onPress(value)}
    >
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={[styles.tabButtonText, isLight ? styles.tabButtonTextLight : null]}>{label}</Text>
    </TouchableOpacity>
  );
}
