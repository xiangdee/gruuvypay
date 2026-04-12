// Builds the X-Device-UA header the server parses for session management
// Format: "{modelName}-{OS}"  e.g. "iPhone 15 Pro-iOS"

import * as Device from 'expo-device';
import { Platform } from 'react-native';

let cachedUA: string | null = null;

export async function getDeviceUA(): Promise<string> {
  if (cachedUA) return cachedUA;

  const model = Device.modelName ?? 'Unknown';

  let os: string;
  if (Platform.OS === 'ios') {
    // Distinguish iPhone from iPad
    os = Device.deviceType === Device.DeviceType.TABLET ? 'iPadOS' : 'iOS';
  } else if (Platform.OS === 'android') {
    os = 'Android';
  } else {
    os = 'Unknown';
  }

  cachedUA = `${model}-${os}`;
  return cachedUA;
}

// Call this at app boot so the value is ready before any API call
export async function initDeviceUA(): Promise<void> {
  await getDeviceUA();
}