import { StyleSheet, View, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { DartPredictor, DartPredictorImpl } from '../ml/dart_predictor';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [predictor, setPredictor] = useState<DartPredictor | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [detection, setDetection] = useState<{
    boardBox?: { x: number; y: number; width: number; height: number };
    dartPositions?: { x: number; y: number }[];
  }>({});
  const [detectionStatus, setDetectionStatus] = useState<'searching' | 'found' | 'processing'>('searching');
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const processingTimeoutRef = useRef<NodeJS.Timeout>();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const cameraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(1, Math.min(5, scale.value)) }]
  }));

  useEffect(() => {
    async function initializePredictor() {
      try {
        await tf.ready();
        const dartPredictor = new DartPredictorImpl();
        setPredictor(dartPredictor);
        setIsModelReady(true);
      } catch (error) {
        console.error('Error initializing predictor:', error);
      }
    }
    initializePredictor();
  }, []);

  useEffect(() => {
    let isProcessing = false;
    const COOLDOWN_TIME = 2000; // 2 seconden wachten tussen detecties
    let lastProcessTime = 0;
    const FRAME_INTERVAL = 1000 / 24; // ~42ms voor 24 FPS
    let frameId: number;
    let consecutiveDetections = 0;
    const REQUIRED_DETECTIONS = 3; // Aantal opeenvolgende detecties nodig voor bevestiging

    const processPreviewFrame = async () => {
      if (!isModelReady || !predictor || !cameraRef.current || isProcessing) {
        frameId = requestAnimationFrame(processPreviewFrame);
        return;
      }

      const now = Date.now();
      if (now - lastProcessTime < FRAME_INTERVAL) {
        frameId = requestAnimationFrame(processPreviewFrame);
        return;
      }
      lastProcessTime = now;

      try {
        isProcessing = true;
        if (now - lastDetectionTime < COOLDOWN_TIME && detectionStatus === 'processing') {
          isProcessing = false;
          frameId = requestAnimationFrame(processPreviewFrame);
          return;
        }

        // Simuleer frame data voor nu
        const scores = await predictor.predict(new Uint8Array(100));
        
        if (scores.length > 0) {
          consecutiveDetections++;
          
          if (consecutiveDetections >= REQUIRED_DETECTIONS) {
            if (detectionStatus !== 'found' && detectionStatus !== 'processing') {
              setDetectionStatus('found');
              setLastDetectionTime(now);
              
              // Clear any existing timeout
              if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
              }

              // Start processing after a short delay
              processingTimeoutRef.current = setTimeout(() => {
                setDetectionStatus('processing');
                const dartIndex = currentDarts.findIndex(dart => dart.value === null);
                if (dartIndex !== -1) {
                  const newDarts = [...currentDarts];
                  newDarts[dartIndex] = { value: scores[0] };
                  setCurrentDarts(newDarts);

                  if (dartIndex === 2) {
                    const totalScore = newDarts.reduce((sum, dart) => sum + (dart.value || 0), 0);
                    const newPlayers = [...players];
                    const currentPlayer = newPlayers[activePlayerIndex];
                    currentPlayer.score -= totalScore;
                    
                    setPlayers(newPlayers);
                    setActivePlayerIndex((activePlayerIndex + 1) % players.length);
                    setCurrentDarts([
                      { value: null },
                      { value: null },
                      { value: null }
                    ]);
                  }
                  consecutiveDetections = 0;
                  setDetectionStatus('searching');
                }
              }, 500);
            }
          }
        } else {
          consecutiveDetections = 0;
          if (detectionStatus !== 'processing') {
            setDetectionStatus('searching');
          }
        }
      } catch (error: any) {
        console.error('Error processing frame:', error);
        consecutiveDetections = 0;
        if (detectionStatus !== 'processing') {
          setDetectionStatus('searching');
        }
      } finally {
        isProcessing = false;
        frameId = requestAnimationFrame(processPreviewFrame);
      }
    };

    // Start frame processing
    frameId = requestAnimationFrame(processPreviewFrame);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [isModelReady, predictor]);

  const calculateScore = (boardBox: any, dartPosition: any) => {
    // Implementatie van score berekening zoals in dart_detector.py
    // ... code van calculate_score functie ...
  };

  if (!permission) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.permissionContainer}>
            <Text style={[styles.permissionText, { color: theme.text }]}>
              Camera toegang wordt aangevraagd...
            </Text>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!permission.granted) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            <GestureDetector gesture={pinchGesture}>
              <Animated.View style={[styles.camera, { height: CAMERA_HEIGHT }, cameraAnimatedStyle]}>
                <CameraView 
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  ratio="4:3"
                  zoom={scale.value}
                />
              </Animated.View>
            </GestureDetector>
            <View 
              style={[
                styles.statusContainer,
                { 
                  backgroundColor: 
                    detectionStatus === 'searching' ? theme.primary : 
                    detectionStatus === 'found' ? theme.success :
                    theme.active
                }
              ]}
            >
              <Text style={styles.statusText}>
                {detectionStatus === 'searching' ? 'Zoeken naar dartbord...' :
                 detectionStatus === 'found' ? 'Dartbord gevonden!' :
                 'Score verwerken...'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
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
  statusContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.9,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
}); 