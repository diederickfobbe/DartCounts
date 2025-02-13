import { StyleSheet, View, SafeAreaView, useColorScheme } from 'react-native';
import { Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const colors = {
  light: {
    background: '#F2F2F7',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007AFF',
    border: '#E5E5EA',
  },
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    primary: '#0A84FF',
    border: '#38383A',
  },
};

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>History</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your recent games</Text>
        </View>

        <View style={styles.emptyState}>
          <View style={[styles.iconContainer, { borderColor: theme.border }]}>
            <MaterialCommunityIcons name="history" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Games Yet</Text>
          <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
            Your completed games will appear here
          </Text>
        </View>
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
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
  },
}); 