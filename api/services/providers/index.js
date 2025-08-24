const { createSunoApiProvider } = require('./sunoapi_org');

function loadModule(mod) {
  // handle ESM/CJS default interop
  return mod && mod.default ? mod.default : mod;
}

function getMusicProvider() {
  const name = (process.env.MUSIC_PROVIDER || 'sunoapi_org').toLowerCase();
  switch (name) {
    case 'sunoapi_org':
    case 'sunoapi':
    case 'suno':
      return createSunoApiProvider();
    default:
      console.warn(`[providers] Unknown MUSIC_PROVIDER="${name}", falling back to sunoapi_org`);
      return createSunoApiProvider();
  }
}

module.exports = { getMusicProvider };
