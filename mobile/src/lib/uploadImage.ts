import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { api } from './api';

/**
 * Prompts user to pick an image and uploads it to the BACKEND for processing/storage.
 * @param bucketName The name of the storage bucket ('equipment-images', 'profile-images')
 * @returns The public URL of the uploaded image, or null if failed/cancelled.
 */
export const pickAndUploadImage = async (bucketName: string): Promise<string | null> => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'You need to allow camera roll access to upload images.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8, // Basic client-side compression before sending to server
    });

    if (result.canceled) {
      return null;
    }

    const imageUri = result.assets[0].uri;
    const fileName = imageUri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(fileName);
    const type = match ? `image/${match[1]}` : `image`;

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type,
    } as any);
    formData.append('bucket', bucketName);

    // Upload to our Backend instead of direct Supabase
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;

  } catch (error: any) {
    console.error('Upload Error:', error);
    Alert.alert('Upload Failed', error.response?.data?.error || 'Could not upload image. Please try again.');
    return null;
  }
};
