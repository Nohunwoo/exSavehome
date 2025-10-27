// components/ui/Logo.tsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const logoImage = require('@/assets/images/HL.png');

export const Logo = () => (
  <View style={styles.logoContainer}>
    <Image source={logoImage} style={styles.logoImage} />
  </View>
);

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoImage: {
    width: 200, 
    height: 200, 
    resizeMode: 'contain', 
  },
});