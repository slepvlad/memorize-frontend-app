import { renderHook, act } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';
import { audioApi } from '../../../src/api/audio';
import { triggerToast } from '../../../src/context/ToastContext';
import { clearAudioClipCache, useAudioPlayback } from '../../../src/audio/useAudioPlayback';

jest.mock('../../../src/api/audio', () => ({
  audioApi: { generate: jest.fn(), getClip: jest.fn() },
}));

jest.mock('../../../src/context/ToastContext', () => ({
  triggerToast: jest.fn(),
}));

// The root __mocks__/expo-audio.ts supplies the player; require() keeps the
// mock-only exports out of the public expo-audio types.
const { _mockPlayer, useAudioPlayerStatus } = require('expo-audio');
const mockStatus = useAudioPlayerStatus as jest.Mock;
const mockGenerate = audioApi.generate as jest.Mock;
const mockGetClip = audioApi.getClip as jest.Mock;
const mockTriggerToast = triggerToast as jest.Mock;

const CLIP = 'data:audio/wav;base64,AAA';
const storedTarget = { audioId: 'a1', text: 'ephemeral', language: 'ENGLISH' as const };
const unstoredTarget = { audioId: null, text: 'bonjour', language: 'RUSSIAN' as const };

const httpError = (status: number) =>
  new AxiosError('fail', String(status), undefined, undefined, {
    status,
    statusText: '',
    data: null,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

/** Resolves only when the test releases it, to observe the loading state. */
const deferred = () => {
  let release: (value: string) => void = () => {};
  const promise = new Promise<string>((resolve) => {
    release = resolve;
  });
  return { promise, release };
};

beforeEach(() => {
  jest.clearAllMocks();
  clearAudioClipCache();
  mockStatus.mockReturnValue({ playing: false, didJustFinish: false });
  mockGenerate.mockResolvedValue({ audio_id: 'gen-1' });
  mockGetClip.mockResolvedValue(CLIP);
});

describe('useAudioPlayback — resolving the clip', () => {
  it('plays a stored clip without synthesizing', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    let audioId: string | null = null;
    await act(async () => {
      audioId = await result.current.play('k', storedTarget);
    });

    expect(audioId).toBe('a1');
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockGetClip).toHaveBeenCalledWith('a1');
    expect(_mockPlayer.replace).toHaveBeenCalledWith({ uri: CLIP });
    expect(_mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('synthesizes a clip when none is stored and returns the new id', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    let audioId: string | null = null;
    await act(async () => {
      audioId = await result.current.play('k', unstoredTarget);
    });

    expect(mockGenerate).toHaveBeenCalledWith('bonjour', 'RUSSIAN');
    expect(mockGetClip).toHaveBeenCalledWith('gen-1');
    expect(audioId).toBe('gen-1');
  });

  it('treats a missing audioId as unstored', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play('k', { text: 'hello', language: 'ENGLISH' });
    });

    expect(mockGenerate).toHaveBeenCalledWith('hello', 'ENGLISH');
  });

  it('serves a repeat play from the in-memory cache', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.play('k1', storedTarget);
    });
    await act(async () => {
      await result.current.play('k2', storedTarget);
    });

    expect(mockGetClip).toHaveBeenCalledTimes(1);
    expect(_mockPlayer.replace).toHaveBeenCalledTimes(2);
  });

  it('evicts the least recently used clip once the cache is full', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    for (let i = 0; i < 21; i++) {
      await act(async () => {
        await result.current.play(`k${i}`, { audioId: `a${i}`, text: 'x', language: 'ENGLISH' });
      });
    }
    expect(mockGetClip).toHaveBeenCalledTimes(21);

    // a0 was evicted, so it is fetched again…
    await act(async () => {
      await result.current.play('oldest', { audioId: 'a0', text: 'x', language: 'ENGLISH' });
    });
    expect(mockGetClip).toHaveBeenCalledTimes(22);

    // …while the newest entry is still cached.
    await act(async () => {
      await result.current.play('newest', { audioId: 'a20', text: 'x', language: 'ENGLISH' });
    });
    expect(mockGetClip).toHaveBeenCalledTimes(22);
  });
});

describe('useAudioPlayback — playback state', () => {
  it('marks the key as loading only while the clip is in flight', async () => {
    const { promise, release } = deferred();
    mockGetClip.mockReturnValueOnce(promise);
    const { result } = renderHook(() => useAudioPlayback());

    let finished: Promise<string | null> = Promise.resolve(null);
    act(() => {
      finished = result.current.play('k', storedTarget);
    });
    expect(result.current.loadingKey).toBe('k');
    expect(result.current.playingKey).toBeNull();

    await act(async () => {
      release(CLIP);
      await finished;
    });
    expect(result.current.loadingKey).toBeNull();
    expect(result.current.playingKey).toBe('k');
  });

  it('ignores another tap while a clip is still loading', async () => {
    const { promise, release } = deferred();
    mockGetClip.mockReturnValueOnce(promise);
    const { result } = renderHook(() => useAudioPlayback());

    let first: Promise<string | null> = Promise.resolve(null);
    act(() => {
      first = result.current.play('k1', storedTarget);
    });

    let second: string | null = 'unset';
    await act(async () => {
      second = await result.current.play('k2', unstoredTarget);
    });

    expect(second).toBeNull();
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockGetClip).toHaveBeenCalledTimes(1);

    await act(async () => {
      release(CLIP);
      await first;
    });
  });

  it('clears the playing key on stop', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    await act(async () => {
      await result.current.play('k', storedTarget);
    });

    act(() => {
      result.current.stop();
    });

    expect(_mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(result.current.playingKey).toBeNull();
  });

  it('stops instead of restarting when the same key is pressed twice', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    await act(async () => {
      await result.current.play('k', storedTarget);
    });

    let second: string | null = 'unset';
    await act(async () => {
      second = await result.current.play('k', storedTarget);
    });

    expect(second).toBeNull();
    expect(_mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(_mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(result.current.playingKey).toBeNull();
  });

  it('restarts a different key while one is playing', async () => {
    const { result } = renderHook(() => useAudioPlayback());
    await act(async () => {
      await result.current.play('k1', storedTarget);
    });

    let second: string | null = null;
    await act(async () => {
      second = await result.current.play('k2', { audioId: 'a2', text: 'x', language: 'ENGLISH' });
    });

    expect(second).toBe('a2');
    expect(result.current.playingKey).toBe('k2');
    expect(_mockPlayer.pause).not.toHaveBeenCalled();
  });

  it('clears the playing key when the clip finishes', async () => {
    const { result, rerender } = renderHook(() => useAudioPlayback());
    await act(async () => {
      await result.current.play('k', storedTarget);
    });
    expect(result.current.playingKey).toBe('k');

    mockStatus.mockReturnValue({ playing: false, didJustFinish: true });
    rerender(undefined);

    expect(result.current.playingKey).toBeNull();
  });
});

describe('useAudioPlayback — failures', () => {
  it('toasts and returns null when playback fails outside HTTP', async () => {
    mockGetClip.mockRejectedValueOnce(new Error('decode failed'));
    const { result } = renderHook(() => useAudioPlayback());

    let audioId: string | null = 'unset';
    await act(async () => {
      audioId = await result.current.play('k', storedTarget);
    });

    expect(audioId).toBeNull();
    expect(mockTriggerToast).toHaveBeenCalledWith(expect.stringContaining('play audio'), 'error');
    expect(_mockPlayer.play).not.toHaveBeenCalled();
    expect(result.current.loadingKey).toBeNull();
  });

  it('leaves HTTP errors to the axios interceptor toast', async () => {
    mockGetClip.mockRejectedValueOnce(httpError(500));
    const { result } = renderHook(() => useAudioPlayback());

    let audioId: string | null = 'unset';
    await act(async () => {
      audioId = await result.current.play('k', storedTarget);
    });

    expect(audioId).toBeNull();
    expect(mockTriggerToast).not.toHaveBeenCalled();
  });

  it('returns null when synthesis is rejected', async () => {
    mockGenerate.mockRejectedValueOnce(httpError(400));
    const { result } = renderHook(() => useAudioPlayback());

    let audioId: string | null = 'unset';
    await act(async () => {
      audioId = await result.current.play('k', unstoredTarget);
    });

    expect(audioId).toBeNull();
    expect(mockGetClip).not.toHaveBeenCalled();
    expect(result.current.playingKey).toBeNull();
  });
});
