// components/SettingsMenuItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';

type SettingsMenuItemProps = {
  icon: React.ReactNode;
  name: string;
  color?: string;
  onPress: () => void;
  badge?: string | number;
  rightText?: string;
};

export const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
  icon,
  name,
  color = Colors.text,
  onPress,
  badge,
  rightText,
}) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={[styles.menuText, { color }]}>{name}</Text>
      
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      
      {rightText && (
        <Text style={styles.rightText}>{rightText}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rightText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
