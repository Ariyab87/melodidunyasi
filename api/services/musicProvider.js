const SunoApiOrgProvider = require('./providers/sunoApiOrg');
const SunoOfficialProvider = require('./providers/sunoOfficial');

class MusicProviderService {
  constructor() {
    this.provider = null;
    this.currentProvider = null;
    this.initializeProvider();
  }

  initializeProvider() {
    const providerType = process.env.MUSIC_PROVIDER || 'sunoapi_org';
    console.log('🎵 Music Provider initialized:', providerType);

    try {
      switch (providerType) {
        case 'sunoapi_org':
          this.provider = new SunoApiOrgProvider();
          this.currentProvider = 'sunoapi_org';
          break;
        case 'suno_official':
          this.provider = new SunoOfficialProvider();
          this.currentProvider = 'suno_official';
          break;
        default:
          throw new Error(`Unknown music provider: ${providerType}`);
      }

      console.log('✅ Music provider configured:', this.currentProvider);
    } catch (error) {
      console.error('❌ Failed to initialize music provider:', error.message);
      throw error;
    }
  }

  getProvider() {
    if (!this.provider) {
      throw new Error('Music provider not initialized');
    }
    return this.provider;
  }

  getCurrentProvider() {
    return this.currentProvider;
  }

  async health() {
    try {
      if (!this.provider) {
        return {
          ok: false,
          status: 503,
          reason: 'PROVIDER_NOT_INITIALIZED',
          message: 'Music provider not initialized',
          provider: 'unknown'
        };
      }

      return await this.provider.health();
    } catch (error) {
      console.error('❌ Music provider health check failed:', error.message);
      return {
        ok: false,
        status: 500,
        reason: 'HEALTH_CHECK_FAILED',
        message: error.message,
        provider: this.currentProvider || 'unknown'
      };
    }
  }

  async generateSong(prompt, duration, style, mood, debugSmall) {
    try {
      if (!this.provider) {
        throw new Error('Music provider not initialized');
      }

      return await this.provider.generateSong(prompt, duration, style, mood, debugSmall);
    } catch (error) {
      console.error('❌ Song generation failed:', error.message);
      throw error;
    }
  }
}

module.exports = new MusicProviderService();
