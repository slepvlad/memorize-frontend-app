import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import { audioApi } from '../api/audio';
import type { ApiLanguage } from '../api/phrases';
import { triggerToast } from '../context/ToastContext';

export interface AudioTarget {
  /** Clip the backend already stores for this text, when it has one. */
  audioId?: string | null;
  /** Text to synthesize when there is no stored clip yet. */
  text: string;
  language: ApiLanguage;
}

export interface AudioPlayback {
  /**
   * Starts playback for `key`, or stops it when that same key is already playing.
   * Resolves to the clip id used — so callers can persist it — or to null when
   * playback was stopped or the clip could not be produced.
   */
  play: (key: string, target: AudioTarget) => Promise<string | null>;
  stop: () => void;
  /** Key whose clip is still being synthesized or downloaded. */
  loadingKey: string | null;
  /** Key that is playing now, so its speaker can show the active state. */
  playingKey: string | null;
}

// Clips are immutable, and a spoken phrase is ~100 KB of base64, so keep a
// bounded LRU to make repeat taps instant without growing memory forever.
const clipCache = new Map<string, string>();
const MAX_CACHED_CLIPS = 20;

function readCache(audioId: string): string | undefined {
  const clip = clipCache.get(audioId);
  if (clip !== undefined) {
    clipCache.delete(audioId);
    clipCache.set(audioId, clip);
  }
  return clip;
}

function writeCache(audioId: string, clip: string) {
  clipCache.set(audioId, clip);
  while (clipCache.size > MAX_CACHED_CLIPS) {
    const oldest = clipCache.keys().next().value;
    if (oldest === undefined) break;
    clipCache.delete(oldest);
  }
}

/** Test-only: drops cached clips so each case starts cold. */
export function clearAudioClipCache() {
  clipCache.clear();
}

export function useAudioPlayback(): AudioPlayback {
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const { t } = useTranslation();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (status.didJustFinish) setPlayingKey(null);
  }, [status.didJustFinish]);

  const stop = useCallback(() => {
    player.pause();
    setPlayingKey(null);
  }, [player]);

  const play = useCallback(
    async (key: string, target: AudioTarget): Promise<string | null> => {
      if (playingKey === key) {
        stop();
        return null;
      }
      // One clip in flight at a time: the screen has a single player instance.
      if (busy.current) return null;
      busy.current = true;
      setLoadingKey(key);
      try {
        const audioId =
          target.audioId ?? (await audioApi.generate(target.text, target.language)).audio_id;
        const clip = readCache(audioId) ?? (await audioApi.getClip(audioId));
        writeCache(audioId, clip);
        player.replace({ uri: clip });
        player.play();
        setPlayingKey(key);
        return audioId;
      } catch (error) {
        // HTTP failures are already toasted by the axios interceptor.
        if (!axios.isAxiosError(error)) triggerToast(t('audioUnavailable'), 'error');
        return null;
      } finally {
        busy.current = false;
        setLoadingKey(null);
      }
    },
    [playingKey, stop, player, t]
  );

  return { play, stop, loadingKey, playingKey };
}
