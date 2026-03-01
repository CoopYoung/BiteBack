/**
 * Mocks for Expo modules used across tests.
 */

// expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  CameraType: { back: 'back', front: 'front' },
  useCameraPermissions: jest.fn().mockReturnValue([
    { granted: true, canAskAgain: true },
    jest.fn(),
  ]),
}));

// expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///mock-image.jpg' }],
  }),
  MediaTypeOptions: { Images: 'Images' },
}));

// expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('bW9ja2Jhc2U2NA=='),
  EncodingType: { Base64: 'base64' },
}));

// expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
}));

// @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

// lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const mockComponent = (name: string) => {
    const Component = (props: Record<string, unknown>) => `${name}Icon`;
    Component.displayName = name;
    return Component;
  };
  return {
    Camera: mockComponent('Camera'),
    Home: mockComponent('Home'),
    TrendingUp: mockComponent('TrendingUp'),
    User: mockComponent('User'),
    Trophy: mockComponent('Trophy'),
    Medal: mockComponent('Medal'),
    Check: mockComponent('Check'),
    X: mockComponent('X'),
    Share2: mockComponent('Share2'),
    LogOut: mockComponent('LogOut'),
    Settings: mockComponent('Settings'),
    Image: mockComponent('Image'),
  };
});
