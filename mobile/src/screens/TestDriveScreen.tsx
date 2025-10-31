// ============================================
// 2. src/screens/TestDriveScreen.tsx
// ============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DealerCard } from '../components/DealerCard';
import { TestDriveForm } from '../components/TestDriveForm';
import { Loading } from '../components/common/Loading';
import { ErrorView } from '../components/common/ErrorView';
import { dealerApi } from '../api/dealers';
import { vehicleApi } from '../api/vehicles';
import { testDriveApi } from '../api/testDrives';
import { Dealer } from '../types/dealer';
import { Vehicle } from '../types/vehicle';
import { TestDriveRequest } from '../types/testDrive';
import { COLORS } from '../constants/config';
import { RootStackParamList } from '../navigation/RootNavigator';

type TestDriveScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TestDrive'>;
type TestDriveScreenRouteProp = RouteProp<RootStackParamList, 'TestDrive'>;

interface Props {
  navigation: TestDriveScreenNavigationProp;
  route: TestDriveScreenRouteProp;
}

export const TestDriveScreen: React.FC<Props> = ({ navigation, route }) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select-dealer' | 'form'>('select-dealer');

  const { vehicleId, dealerId } = route.params;

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const loadData = async () => {
    try {
      setError(null);
      const [vehicleResponse, dealersResponse] = await Promise.all([
        vehicleApi.getVehicleById(vehicleId),
        dealerApi.getDealersWithVehicle(vehicleId),
      ]);

      setVehicle(vehicleResponse.data);
      setDealers(dealersResponse.data);

      // Nếu có dealerId từ params, tự động chọn đại lý đó
      if (dealerId) {
        const preSelectedDealer = dealersResponse.data.find((d) => d.id === dealerId);
        if (preSelectedDealer) {
          setSelectedDealer(preSelectedDealer);
          setStep('form');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDealer = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    setStep('form');
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('select-dealer');
      setSelectedDealer(null);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async (data: TestDriveRequest) => {
    try {
      setSubmitting(true);
      const response = await testDriveApi.bookTestDrive(data);

      Alert.alert(
        'Thành công! 🎉',
        'Lịch lái thử của bạn đã được đặt. Chúng tôi sẽ liên hệ với bạn sớm nhất.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đặt lịch lái thử');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Đang tải thông tin..." />;
  }

  if (error || !vehicle) {
    return <ErrorView message={error || 'Không tìm thấy xe'} onRetry={loadData} />;
  }

  return (
    <View style={testDriveStyles.container}>
      {/* Header */}
      <View style={testDriveStyles.header}>
        <TouchableOpacity onPress={handleBack} style={testDriveStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={testDriveStyles.headerContent}>
          <Text style={testDriveStyles.headerTitle}>Đặt lịch lái thử</Text>
          <Text style={testDriveStyles.headerSubtitle}>
            {vehicle.model} {vehicle.variant}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={testDriveStyles.progress}>
        <View style={testDriveStyles.progressItem}>
          <View
            style={[
              testDriveStyles.progressDot,
              step === 'select-dealer' && testDriveStyles.progressDotActive,
            ]}
          >
            <Text style={testDriveStyles.progressNumber}>1</Text>
          </View>
          <Text style={testDriveStyles.progressLabel}>Chọn đại lý</Text>
        </View>
        <View style={testDriveStyles.progressLine} />
        <View style={testDriveStyles.progressItem}>
          <View
            style={[
              testDriveStyles.progressDot,
              step === 'form' && testDriveStyles.progressDotActive,
            ]}
          >
            <Text style={testDriveStyles.progressNumber}>2</Text>
          </View>
          <Text style={testDriveStyles.progressLabel}>Thông tin</Text>
        </View>
      </View>

      {/* Content */}
      {step === 'select-dealer' ? (
        <ScrollView style={testDriveStyles.content} showsVerticalScrollIndicator={false}>
          <Text style={testDriveStyles.sectionTitle}>
            Chọn đại lý bạn muốn đến lái thử
          </Text>
          {dealers.length === 0 ? (
            <View style={testDriveStyles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
              <Text style={testDriveStyles.emptyText}>
                Không có đại lý nào có sẵn xe này
              </Text>
            </View>
          ) : (
            dealers.map((dealer) => (
              <DealerCard
                key={dealer.id}
                dealer={dealer}
                onSelect={handleSelectDealer}
                showAvailability={true}
                isSelected={selectedDealer?.id === dealer.id}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <>
          {/* Selected Dealer */}
          <View style={testDriveStyles.selectedDealer}>
            <Text style={testDriveStyles.selectedDealerLabel}>Đại lý đã chọn:</Text>
            {selectedDealer && (
              <DealerCard dealer={selectedDealer} showAvailability={false} />
            )}
            <TouchableOpacity
              style={testDriveStyles.changeDealerButton}
              onPress={() => setStep('select-dealer')}
            >
              <Text style={testDriveStyles.changeDealerText}>Đổi đại lý khác</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          {selectedDealer && (
            <TestDriveForm
              vehicleId={vehicleId}
              dealerId={selectedDealer.id}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
            />
          )}
        </>
      )}
    </View>
  );
};

const testDriveStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    margin: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  selectedDealer: {
    backgroundColor: COLORS.card,
    padding: 16,
    marginBottom: 8,
  },
  selectedDealerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  changeDealerButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeDealerText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});