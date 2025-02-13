import { StyleSheet, View, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  light: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007AFF',
    success: '#34C759',
    border: '#E5E5EA',
  },
  dark: {
    background: '#1C1C1E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    primary: '#0A84FF',
    success: '#30D158',
    border: '#38383A',
  },
};

interface Player {
  id: number;
  name: string;
}

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const gameType = params.gameType as string;
  const players = JSON.parse(params.players as string) as Player[];
  const startingScore = gameType === '501' ? 501 : 301;

  const [scores] = useState(players.map(() => startingScore));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons name="close" size={28} color={theme.primary} />
      </TouchableOpacity>

      <View style={styles.scoreBoard}>
        {players.map((player, index) => (
          <View 
            key={index} 
            style={[
              styles.playerScore,
              { backgroundColor: theme.card }
            ]}
          >
            <Text style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
            <Text style={[styles.score, { color: theme.text }]}>
              {scores[index]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    padding: 8,
    zIndex: 1,
  },
  scoreBoard: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 120,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  playerScore: {
    width: 140,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '600',
  },
  score: {
    fontSize: 32,
    fontWeight: '700',
  },
}); 