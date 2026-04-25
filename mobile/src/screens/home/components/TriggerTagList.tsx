import { Text, View } from 'react-native';
import type { TriggerTag } from '../../../types/domain';
import { styles } from '../../styles';
import { getThemePalette, type ThemeMode } from '../../../theme';

type Props = {
  themeMode: ThemeMode;
  tags: TriggerTag[];
  maxVisible?: number;
};

export function TriggerTagList(props: Props) {
  const { themeMode, tags, maxVisible = 4 } = props;
  const colors = getThemePalette(themeMode);
  if (tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = Math.max(0, tags.length - visibleTags.length);

  return (
    <View style={styles.entryTriggerTagRow}>
      {visibleTags.map((tag) => (
        <View
          key={tag.id}
          style={[styles.entryTriggerTagChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        >
          <Text style={[styles.entryTriggerTagText, { color: colors.text }]} numberOfLines={1}>
            {tag.label}
          </Text>
        </View>
      ))}
      {remainingCount > 0 ? (
        <View style={[styles.entryTriggerTagChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.entryTriggerTagText, { color: colors.mutedText }]} numberOfLines={1}>
            +{remainingCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
