import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usersApi, UserProfile, AvatarFile } from '../api/users';
import { pendingEmailStorage } from '../storage/pendingEmailStorage';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: UserProfile | null;
  avatarUri: string | null;
  pendingEmail: string | null; // new email still waiting for its confirmation link
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  uploadAvatar: (file: AvatarFile) => Promise<void>;
  removeAvatar: () => Promise<void>;
  requestEmailChange: (newEmail: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Shared user profile + avatar so every screen showing the avatar (Home header,
// Profile) stays in sync after an upload or removal.
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const [me, avatar] = await Promise.all([
        usersApi.getMe(),
        usersApi.getAvatar().catch(() => null),
      ]);
      setProfile(me);
      setAvatarUri(avatar);
      // Drop the pending change once it's applied (or if it belongs to another account).
      const pending = await pendingEmailStorage.get();
      if (pending && (pending.userId !== me.id || pending.email.toLowerCase() === me.email.toLowerCase())) {
        await pendingEmailStorage.clear();
        setPendingEmail(null);
      } else {
        setPendingEmail(pending?.email ?? null);
      }
    } catch {
      // error surfaced globally by axios interceptor (toast)
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshProfile();
    } else {
      setProfile(null);
      setAvatarUri(null);
      setPendingEmail(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshProfile]);

  const uploadAvatar = useCallback(async (file: AvatarFile) => {
    await usersApi.uploadAvatar(file);
    // Show the server's copy; fall back to the local pick if the refetch fails.
    setAvatarUri((await usersApi.getAvatar().catch(() => null)) ?? file.uri);
  }, []);

  const removeAvatar = useCallback(async () => {
    await usersApi.deleteAvatar();
    setAvatarUri(null);
  }, []);

  const requestEmailChange = useCallback(
    async (newEmail: string) => {
      await usersApi.requestEmailChange({ newEmail });
      if (profile) await pendingEmailStorage.set({ userId: profile.id, email: newEmail });
      setPendingEmail(newEmail);
    },
    [profile]
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        avatarUri,
        pendingEmail,
        isLoading,
        refreshProfile,
        uploadAvatar,
        removeAvatar,
        requestEmailChange,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
