// mobile/src/components/users/UserCard.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/lib/types/user';
import { ROLE_CONFIG } from '@/constants/userRoles';

interface UserCardProps {
  user: User;
  onViewDetail: () => void;
  onEdit: () => void;
  onChangePassword: () => void;
  onAssignDealer: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

export default function UserCard({
  user,
  onViewDetail,
  onEdit,
  onChangePassword,
  onAssignDealer,
  onToggleStatus,
  onDelete,
  isAdmin,
}: UserCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const roleConfig = ROLE_CONFIG[user.role];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onViewDetail}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName[0]}
            {user.lastName[0]}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.phone && <Text style={styles.phone}>📱 {user.phone}</Text>}
        </View>

        <View style={[styles.statusIndicator, { backgroundColor: user.isActive ? '#10b981' : '#ef4444' }]}>
          <View style={styles.statusDot} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.roleBadge, { backgroundColor: roleConfig?.color }]}>
          <Text style={styles.roleText}>{roleConfig?.label}</Text>
        </View>

        {user.dealer && (
          <Text style={styles.dealer}>
            🏢 {user.dealer.name}
          </Text>
        )}

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {showMenu && (
        <View style={styles.menu}>
          <ActionMenuItem
            icon="eye-outline"
            label="Chi tiết"
            color="#2563eb"
            onPress={() => {
              onViewDetail();
              setShowMenu(false);
            }}
          />
          {isAdmin && (
            <ActionMenuItem
              icon="pencil-outline"
              label="Chỉnh sửa"
              color="#10b981"
              onPress={() => {
                onEdit();
                setShowMenu(false);
              }}
            />
          )}
          <ActionMenuItem
            icon="key-outline"
            label="Đổi mật khẩu"
            color="#f59e0b"
            onPress={() => {
              onChangePassword();
              setShowMenu(false);
            }}
          />
          {isAdmin && user.role !== 'ADMIN' && user.role !== 'EVM_STAFF' && (
            <ActionMenuItem
              icon="business-outline"
              label="Gán Dealer"
              color="#8b5cf6"
              onPress={() => {
                onAssignDealer();
                setShowMenu(false);
              }}
            />
          )}
          {isAdmin && (
            <>
              <View style={styles.divider} />
              <ActionMenuItem
                icon={user.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'}
                label={user.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                color={user.isActive ? '#f59e0b' : '#10b981'}
                onPress={() => {
                  onToggleStatus();
                  setShowMenu(false);
                }}
              />
              <ActionMenuItem
                icon="trash-outline"
                label="Xóa"
                color="#ef4444"
                onPress={() => {
                  onDelete();
                  setShowMenu(false);
                }}
              />
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function ActionMenuItem({
  icon,
  label,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.menuItemText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  email: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  phone: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  dealer: {
    fontSize: 11,
    color: '#6b7280',
    flex: 1,
  },
  menuBtn: {
    padding: 6,
  },
  menu: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
});