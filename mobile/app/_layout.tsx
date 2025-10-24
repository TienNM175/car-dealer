import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(dealer)" />
          <Stack.Screen name="(evm)" />
        </Stack>
        <Toast />
      </PaperProvider>
    </AuthProvider>
  );
}