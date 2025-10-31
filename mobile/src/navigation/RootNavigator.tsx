// ============================================
// 3. src/navigation/RootNavigator.tsx
// ============================================
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { VehicleListScreen } from '../screens/VehicleListScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { DealerListScreen } from '../screens/DealerListScreen';
import { TestDriveScreen } from '../screens/TestDriveScreen';
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
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
};