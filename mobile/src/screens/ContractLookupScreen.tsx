// mobile/src/screens/ContractLookupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../constants/config';
import { contractLookupApi } from '../api/contractLookup';

type ContractLookupScreenNavigationProp = StackNavigationProp<any, 'ContractLookup'>;

interface Props {
  navigation: ContractLookupScreenNavigationProp;
}

export const ContractLookupScreen: React.FC<Props> = ({ navigation }) => {
  const [contractCode, setContractCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!contractCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã hợp đồng');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hoặc số điện thoại');
      return;
    }

    setLoading(true);
    try {
      const result = await contractLookupApi.lookupContract({
        contractCode: contractCode.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      // Navigate to contract details screen
      navigation.navigate('ContractDetails', {
        contractData: result.data,
      });
    } catch (error: any) {
      Alert.alert(
        'Không tìm thấy',
        error.message || 'Không tìm thấy hợp đồng với thông tin đã nhập. Vui lòng kiểm tra lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tra cứu hợp đồng</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={48} color={COLORS.primary} />
        <Text style={styles.infoTitle}>Tra cứu thông tin hợp đồng</Text>
        <Text style={styles.infoText}>
          Nhập mã hợp đồng và email hoặc số điện thoại để xem thông tin công nợ và lịch thanh toán
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Contract Code */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Mã hợp đồng <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              value={contractCode}
              onChangeText={setContractCode}
              placeholder="Ví dụ: CT-202401-0001"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
            />
          </View>
          <Text style={styles.hint}>Mã hợp đồng được cung cấp khi ký hợp đồng</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Thông tin xác thực</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* OR */}
        <Text style={styles.orText}>HOẶC</Text>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="0901234567"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleLookup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Tra cứu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Cần hỗ trợ?</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="call" size={20} color={COLORS.primary} />
          <Text style={styles.helpButtonText}>Liên hệ Hotline: 1900-xxxx</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 12,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginVertical: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpSection: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});