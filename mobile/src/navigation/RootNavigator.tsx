// mobile/src/navigation/RootNavigator.tsx (UPDATED)
import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { VehicleListScreen } from '../screens/VehicleListScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { DealerListScreen } from '../screens/DealerListScreen';
import { TestDriveScreen } from '../screens/TestDriveScreen';
import { ChatBot } from '../components/ChatBot/ChatBot';
import { FloatingChatButton } from '../components/FloatingChatButton';
import { ChatBotProvider, useChatBot } from '../contexts/ChatBotContext';
import { COLORS } from '../constants/config';

export type RootStackParamList = {
  Home: undefined;
  VehicleList: {
    search?: string;
    manufacturerId?: string;
    bodyType?: string;
  };
  VehicleDetail: {
    vehicleId: string;
  };
  DealerList: {
    vehicleId: string;
  };
  TestDrive: {
    vehicleId: string;
    dealerId?: string;
    prefillData?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      scheduledDate: string;
    };
  };
};
type RootNavigationProp = StackNavigationProp<RootStackParamList>;

const Stack = createStackNavigator<RootStackParamList>();

// ✅ Inner component có access vào navigation
const NavigationWithChatBot = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const { isOpen, closeChat } = useChatBot();

  const handleNavigate = (screen: string, params?: any) => {
    // ✅ Đóng chat trước khi navigate
    closeChat();
    
    setTimeout(() => {
      navigation.navigate(screen as any, params);
    }, 300);
  };

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VehicleList"
          component={VehicleListScreen}
          options={{
            title: 'Danh sách xe',
          }}
        />
        <Stack.Screen
          name="VehicleDetail"
          component={VehicleDetailScreen}
          options={{
            title: 'Chi tiết xe',
          }}
        />
        <Stack.Screen
          name="DealerList"
          component={DealerListScreen}
          options={{
            title: 'Đại lý',
          }}
        />
        <Stack.Screen
          name="TestDrive"
          component={TestDriveScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>

      {/* ✅ Global Floating Chat Button */}
      <FloatingChatButton />

      {/* ✅ Global ChatBot Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={closeChat}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <ChatBot onClose={closeChat} onNavigate={handleNavigate} />
        </View>
      </Modal>
    </>
  );
};

// ✅ Root component wrap với Provider
export const RootNavigator: React.FC = () => {
  return (
    <ChatBotProvider>
      <NavigationContainer>
        <NavigationWithChatBot />
      </NavigationContainer>
    </ChatBotProvider>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});