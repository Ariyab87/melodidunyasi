// api/services/musicProvider.js
/* eslint-disable no-console */
const SunoApiOrgProvider = require('./providers/sunoApiOrg');
const SunoOfficialProvider = require('./providers/sunoOfficial');

/**
 * Normalize provider env into our two supported values.
 */
function resolveProviderEnv() {
  const raw = (process.env.MUSIC_PROVIDER || 'sunoapi_org').trim().toLowerCase();
  if (['suno', 'sunoapi', 'sunoapi_org', 'sunoapi-org'].includes(raw)) return 'sunoapi_org';
  if (['suno_official', 'suno-official', 'official'].includes(raw)) return 'suno_official';
  return 'sunoapi_org';
}

/**
 * For Suno API (sunoapi_org) we expect these envs. We don't throw if missing,
 * but we print loud warnings so 401/404 issues are easy to spot.
 */
function printSunoEnvDiagnostics() {
  const base = process.env.SUNOAPI_ORG_BASE_URL || '';
  const gen = process.env.SUNOAPI_ORG_GENERATE_PATH || '';
  const rec = process.env.SUNOAPI_ORG_RECORDINFO_PATH || '';
  const keyPresent = !!process.env.SUNOAPI_ORG_API_KEY;

  console.log(
    '🔧 [Suno env] BASE=%s | GENERATE=%s | RECORDINFO=%s | KEY_PRESENT=%s',
    base || '<empty>',
    gen || '<empty>',
    rec || '<empty>',
    keyPresent
  );

  if (!keyPresent) {
    console.warn('⚠️  SUNOAPI_ORG_API_KEY is not set. Generation will return 401 Unauthorized.');
  }
  if (!base || !gen) {
    console.warn('⚠️  SUNOAPI_ORG_BASE_URL or SUNOAPI_ORG_GENERATE_PATH missing. Status may be ok but generate will fail.');
  }
}

class MusicProviderService {
  constructor() {
    this.provider = null;
    this.currentProvider = null;
    this.initializeProvider();
  }

  initializeProvider() {
    const providerType = resolveProviderEnv();
    console.log('🎵 Music Provider initializing →', providerType);

    try {
      switch (providerType) {
        case 'sunoapi_org': {
          // Providers read env themselves; we just ensure env looks sane
          printSunoEnvDiagnostics();
          this.provider = new SunoApiOrgProvider();
          this.currentProvider = 'sunoapi_org';
          break;
        }
        case 'suno_official': {
          this.provider = new SunoOfficialProvider();
          this.currentProvider = 'suno_official';
          break;
        }
        default: {
          throw new Error(`Unknown music provider: ${providerType}`);
        }
      }

      console.log('✅ Music provider configured:', this.currentProvider);
    } catch (error) {
      console.error('❌ Failed to initialize music provider:', error.message);
      throw error;
    }
  }

  /**
   * Allow switching at runtime if you ever change MUSIC_PROVIDER and call this.
   */
  reload() {
    this.provider = null;
    this.currentProvider = null;
    this.initializeProvider();
  }

  getProvider() {
    if (!this.provider) throw new Error('Music provider not initialized');
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
          provider: 'unknown',
        };
      }
      // Delegate to provider; ensure a consistent shape
      const h = await this.provider.health?.();
      return {
        ok: !!h?.ok,
        status: Number.isFinite(h?.status) ? h.status : (h?.ok ? 200 : 500),
        provider: this.currentProvider || 'unknown',
        ...(h || {}),
      };
    } catch (error) {
      console.error('❌ Music provider health check failed:', error.message);
      return {
        ok: false,
        status: 500,
        reason: 'HEALTH_CHECK_FAILED',
        message: error.message,
        provider: this.currentProvider || 'unknown',
      };
    }
  }

  /**
   * Keep the same signature your routes expect.
   * Provider implementations should accept (prompt, duration, style, mood, debugSmall, instrumental, language).
   */
  async generateSong(prompt, duration, style, mood, debugSmall, instrumental = false, language = 'en') {
    if (!this.provider) throw new Error('Music provider not initialized');

    try {
      return await this.provider.generateSong(prompt, duration, style, mood, debugSmall, instrumental, language);
    } catch (error) {
      // Improve logs for common Suno mistakes
      if (this.currentProvider === 'sunoapi_org') {
        const hasKey = !!process.env.SUNOAPI_ORG_API_KEY;
        console.error(
          '❌ Suno generate failed. keyPresent=%s base=%s gen=%s err=%s',
          hasKey,
          process.env.SUNOAPI_ORG_BASE_URL || '<empty>',
          process.env.SUNOAPI_ORG_GENERATE_PATH || '<empty>',
          error?.message
        );
      }
      throw error;
    }
  }
}

module.exports = new MusicProviderService();
