// Simple sound cache to avoid reloading
const audioCache = {};
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const loadSound = (url) => {
  if (audioCache[url]) {
    return Promise.resolve(audioCache[url]);
  }

  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      audioCache[url] = audioBuffer;
      return audioBuffer;
    })
    .catch(error => {
        console.error(`Error loading sound: ${url}`, error);
        // Return null or a specific marker to indicate failure
        return null;
    });
};

// Preload common sounds (optional, improves responsiveness)
const sounds = {
  operationSuccess: '/sfx/pop.wav', // Replace with your file path
  operationFail: '/sfx/error.wav',
  levelSolved: '/sfx/success.wav',
  levelStart: '/sfx/start.wav',
  undo: '/sfx/swoosh.wav',
  reset: '/sfx/reset.wav',
};

export const preloadSounds = () => {
    console.log("Preloading sounds...");
    Object.values(sounds).forEach(url => {
        loadSound(url); // Start loading without waiting
    });
};


export const playSound = async (soundName) => {
  if (!sounds[soundName]) {
    console.warn(`Sound not found: ${soundName}`);
    return;
  }

  // Ensure context is running (required after user interaction)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const url = sounds[soundName];
  try {
      const audioBuffer = await loadSound(url);
      if (!audioBuffer) {
          console.warn(`Could not play sound ${soundName}, buffer is null.`);
          return; // Don't proceed if buffer failed to load
      }
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
  } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
  }
};