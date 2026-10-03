// ============================================================
// ScanScreen – Scan QR to join a group (API-backed)
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';

export default function ScanScreen() {
  const nav       = useNavigation<any>();
  const t         = useTheme();
  const joinGroup = useStore((s) => s.joinGroup);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned,       setScanned]       = useState(false);
  const [processing,    setProcessing]    = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) =>
      setHasPermission(status === 'granted')
    );
  }, []);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    // Expect deep link: splitwise://join?token=<token>
    try {
      const url   = new URL(data);
      const token = url.searchParams.get('token');
      if (!token) throw new Error('No token in QR code');

      const result = await joinGroup(token);
      if (result) {
        Alert.alert('Joined!', `You've joined "${result.groupName}" 🎉`, [
          { text: 'Great!', onPress: () => nav.goBack() },
        ]);
      } else {
        Alert.alert('Invalid QR', 'This invite is invalid or has expired.', [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Cancel',    onPress: () => nav.goBack() },
        ]);
      }
    } catch {
      Alert.alert('Invalid QR Code', 'Not a valid SplitWise invite QR.', [
        { text: 'Try Again', onPress: () => setScanned(false) },
        { text: 'Cancel',    onPress: () => nav.goBack() },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.background }]}>
        <Text style={[styles.msg, { color: t.onSurface }]}>Requesting camera permission…</Text>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: t.background }]}>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
          <Text style={[styles.msg, { color: t.onSurface }]}>Camera access is required to scan QR codes.</Text>
          <TouchableOpacity onPress={() => nav.goBack()} style={[styles.backBtn, { backgroundColor: t.primary }]}>
            <Text style={{ color: t.onPrimary, fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
      />

      {/* Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Text style={{ fontSize: 18, color: '#fff' }}>✕</Text>
        </TouchableOpacity>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            {['tl','tr','bl','br'].map((corner) => (
              <View key={corner} style={[styles.corner, styles[corner as keyof typeof styles] as any, { borderColor: t.primary }]} />
            ))}
          </View>
          <Text style={styles.scanHint}>
            {processing ? '⏳ Joining group…' : 'Point at a SplitWise QR code'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORNER = 24;

const styles = StyleSheet.create({
  root:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerContent:{ alignItems: 'center', padding: 32, gap: 16 },
  msg:          { fontSize: 16, textAlign: 'center' },
  backBtn:      { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  overlay:      { flex: 1, justifyContent: 'space-between' },
  closeBtn:     { margin: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  scanArea:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 60 },
  scanFrame:    { width: 240, height: 240, position: 'relative' },
  corner:       { position: 'absolute', width: CORNER, height: CORNER, borderWidth: 3.5 },
  tl:           { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr:           { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl:           { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br:           { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanHint:     { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
