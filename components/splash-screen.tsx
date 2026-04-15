import React from 'react';
import { View, Image, StyleSheet, Text, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Decorative background shapes */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
      {/* Logo */}
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {/* App Name or Tagline */}
      <Text style={styles.title}>JumpQ Cashier</Text>
      <Text style={styles.subtitle}>Fast. Simple. Reliable.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#393939',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    marginBottom: 32,
    zIndex: 2,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    zIndex: 2,
  },
  subtitle: {
    color: '#E6F4FE',
    fontSize: 16,
    letterSpacing: 1,
    zIndex: 2,
  },
  circle1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#E6F4FE22',
    top: -width * 0.6,
    left: -width * 0.1,
    zIndex: 0,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#E6F4FE33',
    bottom: -width * 0.2,
    right: -width * 0.2,
    zIndex: 0,
  },
  circle3: {
    position: 'absolute',
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: '#fff2',
    bottom: height * 0.18,
    left: width * 0.1,
    zIndex: 1,
  },
});
