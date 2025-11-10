// mobile/src/components/ChatBot/ChatBot.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatbotApi } from '../../api/chatbot';
import { COLORS } from '../../constants/config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  vehicles?: any[];
  suggestedActions?: any[];
}

interface ChatBotProps {
  onClose: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ onClose, onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      // Get or create session ID
      let storedSessionId = await AsyncStorage.getItem('chatbot_session_id');
      if (!storedSessionId) {
        storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('chatbot_session_id', storedSessionId);
      }
      setSessionId(storedSessionId);

      // Load chat history
      const history = await AsyncStorage.getItem(`chatbot_history_${storedSessionId}`);
      if (history) {
        const parsed = JSON.parse(history);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } else {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content:
              'Xin chào! Tôi là trợ lý AI của EVM. Tôi có thể giúp bạn:\n\n✅ Tư vấn chọn xe phù hợp\n✅ So sánh các mẫu xe\n✅ Tìm hiểu về xe điện\n\nBạn cần tôi hỗ trợ gì?',
            timestamp: new Date(),
            suggestedActions: [
              { label: '🚗 Tư vấn xe', action: 'GET_RECOMMENDATION' },
              { label: '📊 So sánh xe', action: 'COMPARE_VEHICLES' },
              { label: '🔍 Xem tất cả xe', action: 'VIEW_ALL_VEHICLES' },
            ],
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const saveHistory = async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem(
        `chatbot_history_${sessionId}`,
        JSON.stringify(newMessages)
      );
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const sendMessage = async (text?: string, context?: any) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(sessionId, messageText, context);

      // ✅ Debug logs
      console.log('📥 API Response:', response);
      console.log('💬 Reply:', response.data?.reply);
      console.log('🚗 Vehicles:', response.data?.vehicles);

      // ✅ Validate response
      if (!response.data || !response.data.reply) {
        throw new Error('Invalid response from API');
      }

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.data.reply,
        timestamp: new Date(),
        vehicles: response.data.vehicles || [],
        suggestedActions: response.data.suggestedActions || [],
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);

      // Auto scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);

      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content:
          'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hotline: 1900-xxxx',
        timestamp: new Date(),
      };

      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionPress = (action: any) => {
    switch (action.action) {
      case 'VIEW_VEHICLE':
        onNavigate?.('VehicleDetail', { vehicleId: action.vehicleId });
        break;

      case 'VIEW_ALL_VEHICLES':
        onNavigate?.('VehicleList', {});
        break;

      case 'SELECT_VEHICLE':
        sendMessage(`Tôi chọn ${action.label}`, {
          selectedVehicleId: action.vehicleId,
        });
        break;

      case 'ADD_TO_COMPARISON':
        sendMessage(`Thêm ${action.label || 'xe này'} vào so sánh`, {
          selectedVehicleId: action.vehicleId,
        });
        break;

      case 'GO_HOME':
        onNavigate?.('Home', {});
        onClose();
        break;

      case 'RESTART_CHAT':
        clearChat();
        break;

      case 'CALL_HOTLINE':
        sendMessage('Số hotline: 1900-xxxx');
        break;

      case 'CHANGE_VEHICLE':
        sendMessage('Tư vấn xe khác cho tôi');
        break;

      case 'RESTART_COMPARISON':
        sendMessage('So sánh xe mới');
        break;

      case 'GET_RECOMMENDATION':
        sendMessage('Tư vấn xe phù hợp cho tôi');
        break;

      case 'COMPARE_VEHICLES':
        sendMessage('So sánh các mẫu xe cho tôi');
        break;

      default:
        sendMessage(action.label);
    }
  };

  const clearChat = async () => {
    try {
      await chatbotApi.clearSession(sessionId);
      await AsyncStorage.removeItem(`chatbot_history_${sessionId}`);
      await AsyncStorage.removeItem('chatbot_session_id');
      await initializeChat();
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>EVM Assistant</Text>
            <Text style={styles.headerSubtitle}>Luôn sẵn sàng hỗ trợ bạn</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={clearChat} style={styles.headerButton}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View key={message.id}>
            <MessageBubble message={message} onActionPress={handleActionPress} />
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang suy nghĩ...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={isLoading || !inputText.trim()}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

interface MessageBubbleProps {
  message: Message;
  onActionPress: (action: any) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onActionPress }) => {
  const isUser = message.role === 'user';

  // ✅ Debug log
  console.log('🎨 Rendering message:', {
    id: message.id,
    role: message.role,
    contentLength: message.content?.length,
    hasVehicles: message.vehicles?.length,
    hasActions: message.suggestedActions?.length,
  });

  return (
    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      {!isUser && (
        <View style={styles.botIcon}>
          <Ionicons name="chatbubble" size={16} color={COLORS.primary || '#007AFF'} />
        </View>
      )}

      <View style={styles.messageContent}>
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message.content || '[Empty message]'}
        </Text>

        {/* Vehicle Cards */}
        {message.vehicles && message.vehicles.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehiclesList}>
            {message.vehicles.map((vehicle, index) => (
              <TouchableOpacity
                key={index}
                style={styles.vehicleCard}
                onPress={() => onActionPress({ action: 'VIEW_VEHICLE', vehicleId: vehicle.vehicleId })}
              >
                {vehicle.image && (
                  <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
                )}
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleModel} numberOfLines={1}>
                    {vehicle.manufacturer} {vehicle.model}
                  </Text>
                  <Text style={styles.vehiclePrice}>
                    {(vehicle.price / 1000000).toFixed(0)}M VND
                  </Text>
                  {vehicle.reason && (
                    <Text style={styles.vehicleReason} numberOfLines={2}>
                      {vehicle.reason}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Suggested Actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <View style={styles.actionsContainer}>
            {message.suggestedActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={() => onActionPress(action)}
              >
                <Text style={styles.actionButtonText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text || '#000000', // ✅ Fallback color
    backgroundColor: COLORS.card || '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    lineHeight: 20,
  },
  userMessageText: {
    backgroundColor: COLORS.primary || '#007AFF',
    color: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  vehiclesList: {
    marginTop: 12,
  },
  vehicleCard: {
    width: 180,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vehicleImage: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.border,
  },
  vehicleInfo: {
    padding: 10,
  },
  vehicleModel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  vehiclePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  vehicleReason: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    maxWidth: '50%',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});