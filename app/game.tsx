import { StyleSheet, View, SafeAreaView, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

const colors = {
  light: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007AFF',
    danger: '#FF3B30',
    success: '#34C759',
    inputBackground: '#F2F2F7',
    border: '#E5E5EA',
  },
  dark: {
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    primary: '#0A84FF',
    danger: '#FF453A',
    success: '#30D158',
    inputBackground: '#2C2C2E',
    border: '#38383A',
  },
};

const DOUBLE_SEGMENTS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const TRIPLE_SEGMENTS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  const gameType = params.gameType as string;
  const players = JSON.parse(params.players as string);
  const startingScore = gameType === '501' ? 501 : 301;

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState(players.map(() => startingScore));
  const [currentThrow, setCurrentThrow] = useState<number[]>([]);
  const [history, setHistory] = useState<Array<{player: number, throws: number[], remaining: number}>[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  const addThrow = (score: number) => {
    if (gameOver || currentThrow.length >= 3) return;
    
    const newThrow = [...currentThrow, score];
    setCurrentThrow(newThrow);

    if (newThrow.length === 3) {
      const throwSum = newThrow.reduce((a, b) => a + b, 0);
      const newScores = [...scores];
      const newScore = newScores[currentPlayerIndex] - throwSum;

      if (newScore === 0) {
        setGameOver(true);
        setWinner(currentPlayerIndex);
      } else if (newScore < 0 || newScore === 1) {
        // Bust - score reverts back
        setHistory([...history, {
          player: currentPlayerIndex,
          throws: newThrow,
          remaining: scores[currentPlayerIndex]
        }]);
      } else {
        newScores[currentPlayerIndex] = newScore;
        setScores(newScores);
        setHistory([...history, {
          player: currentPlayerIndex,
          throws: newThrow,
          remaining: newScore
        }]);
      }

      setTimeout(() => {
        setCurrentThrow([]);
        if (!gameOver && newScore !== 1 && newScore >= 0) {
          setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
        }
      }, 1500);
    }
  };

  const undoLastThrow = () => {
    if (currentThrow.length > 0) {
      setCurrentThrow(currentThrow.slice(0, -1));
    } else if (history.length > 0) {
      const lastEntry = history[history.length - 1];
      setScores(scores.map((score, idx) => 
        idx === lastEntry.player ? lastEntry.remaining : score
      ));
      setHistory(history.slice(0, -1));
      setCurrentPlayerIndex(lastEntry.player);
      setGameOver(false);
      setWinner(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="close" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{gameType}</Text>
        <TouchableOpacity 
          style={styles.undoButton}
          onPress={undoLastThrow}
          disabled={currentThrow.length === 0 && history.length === 0}
        >
          <MaterialCommunityIcons 
            name="undo" 
            size={28} 
            color={currentThrow.length === 0 && history.length === 0 ? theme.textSecondary : theme.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.scoreBoard}>
          {players.map((player, index) => (
            <View 
              key={index} 
              style={[
                styles.playerScore,
                { backgroundColor: theme.card },
                currentPlayerIndex === index && !gameOver && styles.activePlayer,
                winner === index && { backgroundColor: theme.success }
              ]}
            >
              <Text style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
              <Text style={[
                styles.score, 
                { color: theme.text },
                winner === index && { color: '#FFFFFF' }
              ]}>
                {scores[index]}
              </Text>
              {currentPlayerIndex === index && !gameOver && (
                <View style={styles.throwContainer}>
                  {[0,1,2].map(i => (
                    <View 
                      key={i} 
                      style={[
                        styles.throwIndicator,
                        { borderColor: theme.border },
                        currentThrow[i] !== undefined && { backgroundColor: theme.primary }
                      ]} 
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {gameOver ? (
          <View style={[styles.gameOverCard, { backgroundColor: theme.card }]}>
            <MaterialCommunityIcons name="trophy" size={48} color={theme.success} />
            <Text style={[styles.gameOverTitle, { color: theme.text }]}>
              {players[winner!].name} Wins!
            </Text>
            <TouchableOpacity 
              style={[styles.newGameButton, { backgroundColor: theme.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.newGameButtonText}>New Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputSection}>
            <View style={[styles.scoreInput, { backgroundColor: theme.card }]}>
              {[...Array(20)].map((_, i) => (
                <TouchableOpacity
                  key={i + 1}
                  style={[styles.scoreButton, { borderColor: theme.border }]}
                  onPress={() => addThrow(i + 1)}
                >
                  <Text style={[styles.scoreButtonText, { color: theme.text }]}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.scoreButton, { borderColor: theme.border }]}
                onPress={() => addThrow(25)}
              >
                <Text style={[styles.scoreButtonText, { color: theme.text }]}>Bull</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scoreButton, { borderColor: theme.border }]}
                onPress={() => addThrow(0)}
              >
                <Text style={[styles.scoreButtonText, { color: theme.text }]}>Miss</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.multipliers, { backgroundColor: theme.card }]}>
              <TouchableOpacity
                style={[styles.multiplierButton, { borderColor: theme.border }]}
                onPress={() => {
                  if (currentThrow.length > 0) {
                    const lastThrow = currentThrow[currentThrow.length - 1];
                    const newThrows = [...currentThrow.slice(0, -1), lastThrow * 2];
                    setCurrentThrow(newThrows);
                  }
                }}
              >
                <Text style={[styles.multiplierText, { color: theme.text }]}>Double</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.multiplierButton, { borderColor: theme.border }]}
                onPress={() => {
                  if (currentThrow.length > 0) {
                    const lastThrow = currentThrow[currentThrow.length - 1];
                    const newThrows = [...currentThrow.slice(0, -1), lastThrow * 3];
                    setCurrentThrow(newThrows);
                  }
                }}
              >
                <Text style={[styles.multiplierText, { color: theme.text }]}>Triple</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  undoButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scoreBoard: {
    padding: 16,
    gap: 12,
  },
  playerScore: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activePlayer: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  playerName: {
    fontSize: 17,
    fontWeight: '600',
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
  },
  throwContainer: {
    flexDirection: 'row',
    gap: 4,
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: [{ translateX: -24 }],
  },
  throwIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  inputSection: {
    padding: 16,
    gap: 16,
  },
  scoreInput: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    borderRadius: 16,
    padding: 12,
  },
  scoreButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  multipliers: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
  },
  multiplierButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  multiplierText: {
    fontSize: 17,
    fontWeight: '600',
  },
  gameOverCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  gameOverTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  newGameButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  newGameButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
}); 