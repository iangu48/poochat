import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';
import { styles } from '../screens/styles';
import { getThemePalette, type ThemeMode } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  themeMode?: ThemeMode;
  height?: number | `${number}%`;
  maxHeight?: number | `${number}%`;
  closeOnBackdrop?: boolean;
  showHandle?: boolean;
};

export function BottomDrawer({
  visible,
  onClose,
  children,
  themeMode = 'dark',
  height = '30%',
  maxHeight = '45%',
  closeOnBackdrop = true,
  showHandle = true,
}: Props) {
  const colors = getThemePalette(themeMode);
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(420)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }).start();
      return;
    }

    Animated.timing(translateY, {
      toValue: 420,
      duration: 170,
      useNativeDriver: true,
    }).start(() => setMounted(false));
  }, [translateY, visible]);

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={styles.commentsDrawerOverlay}>
        <Pressable style={[styles.commentsDrawerBackdrop, { backgroundColor: colors.overlay }]} onPress={closeOnBackdrop ? onClose : undefined} />
        <View style={styles.commentsDrawerWrap} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.commentsDrawerSheet,
              { height, maxHeight, transform: [{ translateY }], backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {showHandle ? (
              <View style={styles.commentsDrawerHandleWrap}>
                <View style={[styles.commentsDrawerHandle, { backgroundColor: colors.mutedText }]} />
              </View>
            ) : null}
            {children}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
