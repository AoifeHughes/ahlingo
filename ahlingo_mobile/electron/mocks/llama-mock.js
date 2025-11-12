// Mock implementation of llama.rn for Electron
// In a production app, you would use a different AI/ML solution for desktop

const LlamaContext = class {
  constructor(options) {
    console.warn('Llama.rn mock: LlamaContext created with options:', options);
  }

  async completion(params) {
    console.warn('Llama.rn mock: completion called with params:', params);
    return {
      text: 'Mock response - Llama.rn is not available in Electron',
      timings: { predicted_ms: 0 }
    };
  }

  async release() {
    console.warn('Llama.rn mock: release called');
  }
};

const initLlama = async (options) => {
  console.warn('Llama.rn mock: initLlama called with options:', options);
  return {
    loadModel: async (path) => {
      console.warn('Llama.rn mock: loadModel called with path:', path);
      return new LlamaContext({ model: path });
    }
  };
};

export { initLlama, LlamaContext };
export default { initLlama, LlamaContext };
