import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '../components/Ionicons';
import type { LeaderboardRow } from '../types/domain';
import { styles } from './styles';

type Props = {
  year: string;
  rows: LeaderboardRow[];
  error: string;
  onYearChange: (value: string) => void;
  onLoad: () => void;
};

export function LeaderboardScreen({ year, rows, error, onYearChange, onLoad }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Leaderboard</Text>
      <Text style={styles.label}>Year</Text>
      <TextInput style={styles.input} keyboardType="number-pad" value={year} onChangeText={onYearChange} />
      <TouchableOpacity style={styles.button} onPress={onLoad}>
        <View style={styles.buttonContentRow}>
          <Ionicons name="search" size={16} color="#fff" />
          <Text style={styles.buttonText}>Load</Text>
        </View>
      </TouchableOpacity>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {rows.map((row) => (
        <View key={row.subjectId} style={styles.card}>
          <Text style={styles.cardTitle}>
            #{row.rank} {row.displayName} (@{row.username})
          </Text>
          <Text style={styles.muted}>
            Score {row.score} | Avg {row.avgRating.toFixed(2)}
          </Text>
        </View>
      ))}
      {rows.length === 0 && <Text style={styles.muted}>No leaderboard rows.</Text>}
    </ScrollView>
  );
}
