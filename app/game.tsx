import { StyleSheet, View, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width } = Dimensions.get('window');
const CAMERA_WIDTH = width - 32;
const CAMERA_HEIGHT = Math.min((CAMERA_WIDTH * 4) / 3, 300);

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
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: theme.text }]}>
            Camera toegang wordt aangevraagd...
          </Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: theme.text }]}>
            We hebben toegang tot je camera nodig om dartscores te herkennen
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Geef toegang</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons name="close" size={28} color={theme.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.scoreBoard, { backgroundColor: theme.card }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerText, { color: theme.textSecondary }]}>PLAYER</Text>
            <View style={styles.statsHeader}>
              <Text style={[styles.headerText, { color: theme.textSecondary }]}>SETS</Text>
              <Text style={[styles.headerText, { color: theme.textSecondary }]}>LEGS</Text>
              <Text style={[styles.headerText, { color: theme.textSecondary }]}>SCORE</Text>
            </View>
          </View>
          {players.map((player, index) => (
            <View 
              key={index} 
              style={[
                styles.playerRow,
                index === 0 && styles.firstPlayer,
                index === activePlayerIndex && { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
                { borderTopColor: theme.border }
              ]}
            >
              <View style={styles.playerInfo}>
                <Text style={[
                  styles.playerName, 
                  { color: theme.text }
                ]}>{player.name}</Text>
              </View>
              <View style={styles.statsContainer}>
                <Text style={[styles.statValue, { color: theme.text }]}>{player.sets}</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{player.legs}</Text>
                <Text style={[styles.score, { color: theme.text }]}>{player.score}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.turnDisplay, { backgroundColor: theme.card }]}>
          <Text style={[styles.turnLabel, { color: theme.textSecondary }]}>HUIDIGE BEURT</Text>
          <View style={styles.dartsContainer}>
            {currentDarts.map((dart, index) => (
              <View 
                key={index} 
                style={[
                  styles.dartBox,
                  { borderColor: theme.border }
                ]}
              >
                <Text style={[styles.dartValue, { color: theme.text }]}>
                  {dart.value ?? '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView 
            style={[styles.camera, { height: CAMERA_HEIGHT }]}
            facing="back"
            ratio="4:3"
          />
        </View>
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
  content: {
    flex: 1,
    paddingTop: 80,
  },
  scoreBoard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    gap: 32,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  firstPlayer: {
    borderTopWidth: 0,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    width: 32,
    textAlign: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
    width: 48,
    textAlign: 'right',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cameraContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: CAMERA_HEIGHT,
  },
  camera: {
    width: '100%',
  },
  turnDisplay: {
    margin: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 16,
  },
  turnLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  dartsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  dartBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dartValue: {
    fontSize: 24,
    fontWeight: '700',
  },
}); 