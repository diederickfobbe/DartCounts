import { StyleSheet, View, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    active: '#FF3B30',
  },
  dark: {
    background: '#1C1C1E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    primary: '#0A84FF',
    success: '#30D158',
    border: '#38383A',
    active: '#FF453A',
  },
};

interface Player {
  id: number;
  name: string;
  score: number;
  legs: number;
  sets: number;
}

interface Dart {
  value: number | null;
}

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const gameType = params.gameType as string;
  const playersFromParams = JSON.parse(params.players as string) as Player[];
  const startingScore = gameType === '501' ? 501 : 301;

  const [players, setPlayers] = useState<Player[]>(
    playersFromParams.map(player => ({
      ...player,
      score: startingScore,
      legs: 0,
      sets: 0,
    }))
  );
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [currentDarts, setCurrentDarts] = useState<Dart[]>([
    { value: null },
    { value: null },
    { value: null }
  ]);
  const [inputScore, setInputScore] = useState('');

  const handleNumberPress = (num: number) => {
    if (inputScore.length < 2) {
      setInputScore(prev => {
        const newScore = prev + num;
        if (parseInt(newScore) <= 60) {
          return newScore;
        }
        return prev;
      });
    }
  };

  const handleBackspace = () => {
    setInputScore(prev => prev.slice(0, -1));
  };

  const handleScoreSubmit = () => {
    const value = parseInt(inputScore);
    if (!isNaN(value) && value >= 0 && value <= 180) {
      const dartIndex = currentDarts.findIndex(dart => dart.value === null);
      if (dartIndex !== -1) {
        const newDarts = [...currentDarts];
        newDarts[dartIndex] = { value };
        setCurrentDarts(newDarts);
        setInputScore('');

        if (dartIndex === 2) {
          const totalScore = newDarts.reduce((sum, dart) => sum + (dart.value || 0), 0);
          const newPlayers = [...players];
          const currentPlayer = newPlayers[activePlayerIndex];
          
          if (currentPlayer.score - totalScore >= 0) {
            currentPlayer.score -= totalScore;
            if (currentPlayer.score === 0) {
              currentPlayer.legs += 1;
              newPlayers.forEach(player => {
                if (player.id !== currentPlayer.id) {
                  player.score = startingScore;
                }
              });
            }
          }
          
          setPlayers(newPlayers);
          setActivePlayerIndex((activePlayerIndex + 1) % players.length);
          setCurrentDarts([
            { value: null },
            { value: null },
            { value: null }
          ]);
        }
      }
    }
    setInputScore('');
  };

  const renderKeypadButton = (content: string | number, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.keypadButton, { backgroundColor: theme.card }]}
      onPress={onPress}
    >
      <Text style={[styles.keypadButtonText, { color: theme.text }]}>{content}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.topContainer}>
          <View style={styles.playersContainer}>
            {players.map((player, index) => (
              <View
                key={player.id}
                style={[
                  styles.playerCard,
                  { backgroundColor: theme.card },
                  index === activePlayerIndex && { borderColor: theme.active, borderWidth: 2 }
                ]}
              >
                <Text style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
                <Text style={[styles.playerScore, { color: theme.text }]}>{player.score}</Text>
                <Text style={[styles.playerStats, { color: theme.textSecondary }]}>
                  Legs: {player.legs} | Sets: {player.sets}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.dartsContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.dartsTitle, { color: theme.textSecondary }]}>HUIDIGE BEURT</Text>
            <View style={styles.dartsRow}>
              {currentDarts.map((dart, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dartBox,
                    { borderColor: theme.border },
                    dart.value !== null && { backgroundColor: theme.primary }
                  ]}
                >
                  <Text 
                    style={[
                      styles.dartValue,
                      { color: dart.value !== null ? '#FFFFFF' : theme.text }
                    ]}
                  >
                    {dart.value !== null ? dart.value : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.scoreDisplay, { backgroundColor: theme.card }]}>
            <Text style={[styles.scoreDisplayText, { color: theme.text }]}>
              {inputScore || '0'}
            </Text>
          </View>
        </View>

        <View style={styles.keypadContainer}>
          <View style={styles.keypadRow}>
            {renderKeypadButton(7, () => handleNumberPress(7))}
            {renderKeypadButton(8, () => handleNumberPress(8))}
            {renderKeypadButton(9, () => handleNumberPress(9))}
          </View>
          <View style={styles.keypadRow}>
            {renderKeypadButton(4, () => handleNumberPress(4))}
            {renderKeypadButton(5, () => handleNumberPress(5))}
            {renderKeypadButton(6, () => handleNumberPress(6))}
          </View>
          <View style={styles.keypadRow}>
            {renderKeypadButton(1, () => handleNumberPress(1))}
            {renderKeypadButton(2, () => handleNumberPress(2))}
            {renderKeypadButton(3, () => handleNumberPress(3))}
          </View>
          <View style={styles.keypadRow}>
            {renderKeypadButton('⌫', handleBackspace)}
            {renderKeypadButton(0, () => handleNumberPress(0))}
            <TouchableOpacity
              style={[styles.keypadButton, { backgroundColor: theme.primary }]}
              onPress={handleScoreSubmit}
            >
              <Text style={[styles.keypadButtonText, { color: '#FFFFFF' }]}>↵</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topContainer: {
    flex: 1,
    padding: 16,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  playerCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: width / 2 - 32,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playerScore: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playerStats: {
    fontSize: 14,
  },
  dartsContainer: {
    marginBottom: 20,
    borderRadius: 8,
    padding: 16,
  },
  dartsTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  dartsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dartBox: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dartValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreDisplay: {
    height: 60,
    borderRadius: 8,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDisplayText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  keypadContainer: {
    padding: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  keypadButton: {
    width: (width - 64) / 3,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 