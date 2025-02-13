import { StyleSheet, View, Dimensions, SafeAreaView, TextInput, ScrollView, useColorScheme } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  light: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007AFF',
    danger: '#FF3B30',
    inputBackground: '#F2F2F7',
    border: '#E5E5EA',
    disabled: '#A2A2A2',
  },
  dark: {
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    primary: '#0A84FF',
    danger: '#FF453A',
    inputBackground: '#2C2C2E',
    border: '#38383A',
    disabled: '#636366',
  },
};

type GameMode = 'local' | 'online' | null;

export default function NewGameScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [players, setPlayers] = useState(['', '']);
  const [selectedGame, setSelectedGame] = useState('');

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, '']);
    }
  };

  const updatePlayer = (text: string, index: number) => {
    const newPlayers = [...players];
    newPlayers[index] = text;
    setPlayers(newPlayers);
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const getPlayerName = (index: number) => {
    return players[index].trim() || `Player ${index + 1}`;
  };

  const canStartGame = () => {
    return selectedGame !== '';
  };

  const startGame = () => {
    const gameData = {
      gameType: selectedGame,
      players: players.map((name, index) => ({
        id: index + 1,
        name: name.trim() || `Player ${index + 1}`
      }))
    };
    
    router.push({
      pathname: '/game',
      params: {
        gameType: selectedGame,
        players: JSON.stringify(gameData.players)
      }
    });
  };

  if (!gameMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>DartCounts</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Choose how you want to play</Text>
          </View>

          <View style={styles.modeSelection}>
            <TouchableOpacity 
              style={[styles.modeCard, { backgroundColor: theme.card }]}
              onPress={() => setGameMode('local')}
            >
              <View style={[styles.modeIconContainer, { backgroundColor: theme.inputBackground }]}>
                <MaterialCommunityIcons name="account-group" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.modeTitle, { color: theme.text }]}>Local Game</Text>
              <Text style={[styles.modeDescription, { color: theme.textSecondary }]}>
                Play with friends on this device
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modeCard, { backgroundColor: theme.card }]}
              onPress={() => setGameMode('online')}
            >
              <View style={[styles.modeIconContainer, { backgroundColor: theme.inputBackground }]}>
                <MaterialCommunityIcons name="earth" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.modeTitle, { color: theme.text }]}>Online Game</Text>
              <Text style={[styles.modeDescription, { color: theme.textSecondary }]}>
                Play with friends online
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setGameMode(null)}
            >
              <MaterialCommunityIcons name="chevron-left" size={32} color={theme.primary} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: theme.text }]}>New Game</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {gameMode === 'local' ? "Who's playing? (optional)" : 'Create online game'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.playersSection, { backgroundColor: theme.card }]}>
          {players.map((player, index) => (
            <View key={index} style={styles.playerInput}>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
                <MaterialCommunityIcons name="account" size={24} color={theme.primary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={`Player ${index + 1}`}
                  placeholderTextColor={theme.textSecondary}
                  value={player}
                  onChangeText={(text) => updatePlayer(text, index)}
                  maxLength={15}
                />
              </View>
              {players.length > 2 && (
                <TouchableOpacity 
                  onPress={() => removePlayer(index)}
                  style={styles.removeButton}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color={theme.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {players.length < 4 && (
            <TouchableOpacity style={styles.addPlayerButton} onPress={addPlayer}>
              <MaterialCommunityIcons name="plus" size={24} color={theme.primary} />
              <Text style={[styles.addPlayerText, { color: theme.primary }]}>Add Player</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.playerNote, { color: theme.textSecondary }]}>
            Leave empty to use default names
          </Text>
        </View>

        <View style={styles.gameSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Game Mode</Text>
          <View style={styles.gameGrid}>
            {[
              { id: '501', title: '501', icon: 'numeric-5', description: 'Classic 501 game' },
              { id: '301', title: '301', icon: 'numeric-3', description: 'Quick 301 game' },
              { id: 'clock', title: 'Around the Clock', icon: 'clock-outline', description: 'Hit 1 to 20 in order' },
              { id: 'cricket', title: 'Cricket', icon: 'crown', description: 'Strategic scoring game' }
            ].map((game) => (
              <TouchableOpacity 
                key={game.id}
                style={[
                  styles.gameCard,
                  { backgroundColor: theme.card },
                  selectedGame === game.id && { backgroundColor: theme.primary }
                ]}
                onPress={() => setSelectedGame(game.id)}
              >
                <View style={[
                  styles.iconContainer, 
                  { backgroundColor: theme.inputBackground },
                  selectedGame === game.id && { backgroundColor: 'rgba(255,255,255,0.2)' }
                ]}>
                  <MaterialCommunityIcons 
                    name={game.icon as any} 
                    size={28} 
                    color={selectedGame === game.id ? '#FFFFFF' : theme.primary} 
                  />
                </View>
                <Text style={[
                  styles.gameTitle,
                  { color: theme.text },
                  selectedGame === game.id && styles.selectedText
                ]}>
                  {game.title}
                </Text>
                <Text style={[
                  styles.gameDescription,
                  { color: theme.textSecondary },
                  selectedGame === game.id && styles.selectedText
                ]}>
                  {game.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[
            styles.startButton,
            { backgroundColor: theme.primary },
            !canStartGame() && { backgroundColor: theme.disabled }
          ]}
          disabled={!canStartGame()}
          onPress={startGame}
        >
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
  },
  modeSelection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  modeCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 15,
    lineHeight: 20,
  },
  playersSection: {
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 24,
  },
  playerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 17,
  },
  removeButton: {
    marginLeft: 12,
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  addPlayerText: {
    fontSize: 17,
    marginLeft: 8,
  },
  playerNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  gameSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gameCard: {
    borderRadius: 16,
    padding: 16,
    width: width / 2 - 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  gameDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  startButton: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
