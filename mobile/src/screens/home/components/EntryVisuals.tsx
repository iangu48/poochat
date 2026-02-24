import { TouchableOpacity, Text, View } from 'react-native';
import { styles } from '../../styles';
import { getRatingEmoji, getRatingEmotion, getRatingPillColors } from '../utils';

export function BristolVisual({ typeValue }: { typeValue: number }) {
  const value = Math.max(1, Math.min(7, Math.round(typeValue)));

  if (value === 1) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolDotsRow}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={`type1-${index}`} style={[styles.bristolDot, styles.bristolDotHard, index % 2 === 0 ? styles.bristolDotSkewA : styles.bristolDotSkewB]}>
                <View style={styles.bristolDotSpecular} />
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Hard separate lumps</Text>
      </View>
    );
  }

  if (value === 2) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolLumpySausage}>
            <View style={styles.bristolTextureRow}>
              <View style={styles.bristolTextureDot} />
              <View style={styles.bristolTextureDot} />
              <View style={styles.bristolTextureDot} />
            </View>
            <View style={styles.bristolContourLine} />
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Lumpy sausage</Text>
      </View>
    );
  }

  if (value === 3) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={[styles.bristolSmoothSausage, styles.bristolCracked]}>
            <View style={styles.bristolCrackMarkA} />
            <View style={styles.bristolCrackMarkB} />
            <View style={styles.bristolCrackMarkC} />
            <View style={styles.bristolShadowBand} />
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Sausage with cracks</Text>
      </View>
    );
  }

  if (value === 4) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolSmoothSausage}>
            <View style={styles.bristolHighlight} />
            <View style={styles.bristolHighlightSoft} />
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Smooth, soft sausage (ideal)</Text>
      </View>
    );
  }

  if (value === 5) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolDotsRow}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={`type5-${index}`} style={[styles.bristolBlob, styles.bristolDotSoft, index % 2 === 0 ? styles.bristolBlobA : styles.bristolBlobB]}>
                <View style={styles.bristolDotSpecularSoft} />
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Soft blobs</Text>
      </View>
    );
  }

  if (value === 6) {
    return (
      <View style={styles.bristolVisualCard}>
        <View style={styles.bristolVisualGlyphWrap}>
          <View style={styles.bristolMushy}>
            <View style={styles.bristolMushyLayer} />
            <View style={styles.bristolMushyLayerSmall} />
            <View style={styles.bristolMushyGrainA} />
            <View style={styles.bristolMushyGrainB} />
          </View>
        </View>
        <Text style={styles.bristolVisualText}>Mushy consistency</Text>
      </View>
    );
  }

  return (
    <View style={styles.bristolVisualCard}>
      <View style={styles.bristolVisualGlyphWrap}>
        <View style={styles.bristolLiquid}>
          <View style={styles.bristolWaveA} />
          <View style={styles.bristolWaveB} />
          <View style={styles.bristolWaveC} />
        </View>
      </View>
      <Text style={styles.bristolVisualText}>Mostly liquid / watery</Text>
    </View>
  );
}

export function BristolTypeChip({ typeValue }: { typeValue: number }) {
  const value = Math.max(1, Math.min(7, Math.round(typeValue)));

  if (value === 1) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypeDotsRow}>
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotHard]} />
        </View>
      </View>
    );
  }

  if (value === 2) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypePillLumpy}>
          <View style={styles.entryTypeNotchA} />
          <View style={styles.entryTypeNotchB} />
        </View>
      </View>
    );
  }

  if (value === 3) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypePillCracked}>
          <View style={styles.entryTypeCrackA} />
          <View style={styles.entryTypeCrackB} />
        </View>
      </View>
    );
  }

  if (value === 4) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypePillSmooth}>
          <View style={styles.entryTypeHighlight} />
        </View>
      </View>
    );
  }

  if (value === 5) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypeDotsRow}>
          <View style={[styles.entryTypeDot, styles.entryTypeDotSoft]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotSoft]} />
          <View style={[styles.entryTypeDot, styles.entryTypeDotSoft]} />
        </View>
      </View>
    );
  }

  if (value === 6) {
    return (
      <View style={styles.entryTypeChip}>
        <View style={styles.entryTypeMushy}>
          <View style={styles.entryTypeMushyLayer} />
          <View style={styles.entryTypeMushyLayerSmall} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.entryTypeChip}>
      <View style={styles.entryTypeLiquid}>
        <View style={styles.entryTypeWaveA} />
        <View style={styles.entryTypeWaveB} />
      </View>
    </View>
  );
}

export function RatingVisual({ ratingValue, onSelect }: { ratingValue: number; onSelect: (value: number) => void }) {
  const value = Math.max(1, Math.min(5, Math.round(ratingValue)));
  const levels = [1, 2, 3, 4, 5];

  return (
    <View style={styles.ratingVisualCard}>
      <Text style={styles.ratingVisualTitle}>Emotion by Rating</Text>
      <View style={styles.ratingPillRow}>
        {levels.map((level) => {
          const selected = level === value;
          const pillColors = getRatingPillColors(level, selected);
          return (
            <TouchableOpacity
              key={`rating-pill-${level}`}
              style={[
                styles.ratingPill,
                {
                  backgroundColor: pillColors.backgroundColor,
                  borderColor: pillColors.borderColor,
                },
                selected ? styles.ratingPillActive : null,
              ]}
              onPress={() => onSelect(level)}
            >
              <Text style={[styles.ratingPillEmoji, { color: pillColors.levelColor }]}>{getRatingEmoji(level)}</Text>
              <Text style={[styles.ratingPillLabel, { color: pillColors.labelColor }]}>{getRatingEmotion(level)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
