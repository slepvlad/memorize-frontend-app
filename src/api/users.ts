import { Platform } from 'react-native';
import axios from 'axios';
import apiClient from './client';
import type { AuthResponse } from './auth';
import { tokenStorage } from '../storage/tokenStorage';

export interface UserProfile {
  id: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface EmailChangeRequest {
  newEmail: string;
}

export interface MessageResponse {
  message: string;
}

export interface AvatarFile {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

// The avatar endpoint requires the JWT, so <Image> can't load it by URL —
// fetch the bytes through apiClient and hand <Image> a data URI instead.
function toDataUri(buffer: ArrayBuffer, contentType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}

export const usersApi = {
  getMe: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>('/api/v1/users/me');
    return data;
  },

  /** Returns the avatar as a data URI, or null when the user has none (404). */
  getAvatar: async (): Promise<string | null> => {
    try {
      const { data, headers } = await apiClient.get<ArrayBuffer>('/api/v1/users/me/avatar', {
        responseType: 'arraybuffer',
      });
      return toDataUri(data, String(headers['content-type'] ?? 'image/jpeg'));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  uploadAvatar: async (file: AvatarFile): Promise<void> => {
    const type = file.mimeType ?? 'image/jpeg';
    const name = file.fileName ?? `avatar.${type.split('/')[1] ?? 'jpg'}`;
    const form = new FormData();
    if (Platform.OS === 'web') {
      // On web the picker returns a blob/data URI — convert it to a real Blob.
      const blob = await (await fetch(file.uri)).blob();
      form.append('file', blob, name);
    } else {
      form.append('file', { uri: file.uri, name, type } as unknown as Blob);
    }
    await apiClient.post('/api/v1/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar: async (): Promise<void> => {
    await apiClient.delete('/api/v1/users/me/avatar');
  },

  /** Changing the password revokes every token — store the fresh pair it returns. */
  changePassword: async (request: ChangePasswordRequest): Promise<void> => {
    const { data } = await apiClient.post<AuthResponse>('/api/v1/users/me/password', request);
    await tokenStorage.setTokens(data.access_token, data.refresh_token);
  },

  /** Emails a confirmation link to the new address; the email changes once it's opened. */
  requestEmailChange: async (request: EmailChangeRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>('/api/v1/users/me/email', request);
    return data;
  },
};
