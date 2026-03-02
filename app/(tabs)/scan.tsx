import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { createDraftReceipt } from '@/lib/services/receipt';
import { COLORS, THEME } from '@/constants/colors';
import { Camera, Image as ImageIcon } from 'lucide-react-native';

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !user?.id) return;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        await processReceipt(photo.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && user?.id && result.assets && result.assets.length > 0) {
      setIsProcessing(true);
      try {
        await processReceipt(result.assets[0].uri);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const processReceipt = async (imageUri: string) => {
    if (!user?.id) return;

    try {
      const receiptId = await createDraftReceipt(user.id, imageUri);
      router.push({
        pathname: '/(tabs)/results',
        params: { receiptId, imageUri },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to process receipt');
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Loading camera...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>We need camera access to scan receipts</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan Receipt</Text>
            <Text style={styles.subtitle}>Frame your receipt clearly</Text>
          </View>

          <View style={styles.receiptFrame}>
            <View style={styles.frameBorder} />
          </View>

          <View style={styles.controls}>
            {isProcessing && <ActivityIndicator size="large" color={COLORS.primary} />}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.galleryButton]}
                onPress={handlePickImage}
                disabled={isProcessing}
              >
                <ImageIcon size={24} color={COLORS.primary} />
                <Text style={styles.buttonLabel}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.captureButton]}
                onPress={handleTakePhoto}
                disabled={isProcessing}
              >
                <Camera size={32} color={COLORS.dark} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.flipButton]}
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                disabled={isProcessing}
              >
                <Text style={styles.flipText}>Flip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.lg,
  },
  text: {
    color: COLORS.white,
    fontSize: THEME.fonts.base,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  permissionText: {
    color: COLORS.white,
    fontSize: THEME.fonts.lg,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
  },
  permissionButtonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: THEME.fonts.lg,
  },
  header: {
    alignItems: 'center',
  },
  headerText: {
    color: COLORS.white,
    fontSize: THEME.fonts.xxl,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.gray300,
    fontSize: THEME.fonts.base,
    marginTop: THEME.spacing.sm,
  },
  receiptFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameBorder: {
    width: '80%',
    aspectRatio: 0.6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: 'rgba(0, 217, 163, 0.05)',
  },
  controls: {
    alignItems: 'center',
    gap: THEME.spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.lg,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.full,
  },
  captureButton: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primary,
  },
  galleryButton: {
    width: 60,
    height: 60,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  flipButton: {
    width: 60,
    height: 60,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonLabel: {
    color: COLORS.primary,
    fontSize: THEME.fonts.sm,
    marginTop: THEME.spacing.xs,
  },
  flipText: {
    color: COLORS.white,
    fontSize: THEME.fonts.lg,
    fontWeight: 'bold',
  },
});
