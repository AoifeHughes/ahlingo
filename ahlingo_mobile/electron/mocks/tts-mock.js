// Mock implementation of react-native-tts for Electron
// In a production app, you would use Web Speech API or a similar solution

const Tts = {
  getInitStatus: () => Promise.resolve('success'),
  setDefaultLanguage: (language) => {
    console.log('TTS mock: setDefaultLanguage:', language);
    return Promise.resolve();
  },
  setDefaultVoice: (voice) => {
    console.log('TTS mock: setDefaultVoice:', voice);
    return Promise.resolve();
  },
  setDefaultRate: (rate) => {
    console.log('TTS mock: setDefaultRate:', rate);
    return Promise.resolve();
  },
  setDefaultPitch: (pitch) => {
    console.log('TTS mock: setDefaultPitch:', pitch);
    return Promise.resolve();
  },
  speak: (text, options = {}) => {
    console.log('TTS mock: speak:', text);
    // You could implement Web Speech API here
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    return Promise.resolve();
  },
  stop: () => {
    console.log('TTS mock: stop');
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return Promise.resolve();
  },
  voices: () => {
    console.log('TTS mock: voices');
    return Promise.resolve([]);
  },
  addEventListener: (event, handler) => {
    console.log('TTS mock: addEventListener:', event);
  },
  removeEventListener: (event, handler) => {
    console.log('TTS mock: removeEventListener:', event);
  }
};

export default Tts;
