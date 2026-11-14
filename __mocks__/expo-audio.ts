const player = {
  play: jest.fn(),
  pause: jest.fn(),
  replace: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn(),
  muted: false,
  playing: false,
};

const defaultStatus = {
  id: 'mock-player',
  currentTime: 0,
  playbackState: 'idle',
  timeControlStatus: 'paused',
  reasonForWaitingToPlay: '',
  mute: false,
  duration: 0,
  playing: false,
  loop: false,
  didJustFinish: false,
  isBuffering: false,
  isLoaded: true,
  playbackRate: 1,
  shouldCorrectPitch: true,
  isLive: false,
};

const useAudioPlayer = jest.fn(() => player);
const useAudioPlayerStatus = jest.fn(() => ({ ...defaultStatus }));

module.exports = {
  useAudioPlayer,
  useAudioPlayerStatus,
  createAudioPlayer: jest.fn(() => player),
  setAudioModeAsync: jest.fn(),
  _mockPlayer: player, // expose for assertions
  _mockDefaultStatus: defaultStatus,
};
