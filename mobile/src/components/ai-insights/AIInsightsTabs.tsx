import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

interface AIInsightsTabsProps {
  activeTab: 'executive' | 'dealer' | 'market';
  onTabChange: (tab: 'executive' | 'dealer' | 'market') => void;
}

export function AIInsightsTabs({ activeTab, onTabChange }: AIInsightsTabsProps) {
  const tabs = [
    { id: 'executive', label: 'Báo cáo' },
    { id: 'dealer', label: 'Đại lý' },
    { id: 'market', label: 'Thị trường' },
  ] as const;

  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / tabs.length; // chia đều 3 tab

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            { width: tabWidth },
            activeTab === tab.id && styles.tabActive,
          ]}
          onPress={() => onTabChange(tab.id as any)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
