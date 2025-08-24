/**
 * Simple in-memory song storage service
 * In production, this should be replaced with a proper database
 */
class SongStorageService {
  constructor() {
    this.songs = new Map();
    this.requestCounter = 0;
  }

  /**
   * Create a new song request
   * @param {Object} songData - Song request data
   * @returns {Object} Created song with ID
   */
  createSong(songData) {
    const songId = `song_${Date.now()}_${this._generateId()}`;
    const song = {
      id: songId,
      ...songData,
      provider: null,
      providerJobId: null,
      providerMeta: null,
      status: 'queued',
      progress: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audioUrl: null,
      downloadUrl: null,
      savedFilename: null
    };
    
    this.songs.set(songId, song);
    console.log(`📝 [STORAGE] Created song: ${songId}`);
    return song;
  }

  /**
   * Get a song by ID
   * @param {string} songId - Song ID
   * @returns {Object|null} Song data or null if not found
   */
  getSong(songId) {
    return this.songs.get(songId) || null;
  }

  /**
   * Update song provider information
   * @param {string} songId - Song ID
   * @param {Object} providerInfo - Provider information
   * @returns {Object|null} Updated song or null if not found
   */
  updateProviderInfo(songId, providerInfo) {
    const song = this.songs.get(songId);
    if (!song) {
      console.warn(`⚠️ [STORAGE] Song not found: ${songId}`);
      return null;
    }

    song.provider = providerInfo.provider || song.provider;
    song.providerJobId = providerInfo.providerJobId || song.providerJobId;
    song.providerMeta = providerInfo.providerMeta || song.providerMeta;
    song.status = providerInfo.status || song.status;
    song.progress = providerInfo.progress || song.progress;
    song.updatedAt = new Date().toISOString();

    console.log(`📝 [STORAGE] Updated song ${songId}:`, {
      provider: song.provider,
      providerJobId: song.providerJobId,
      status: song.status,
      progress: song.progress
    });

    return song;
  }

  /**
   * Update song status and progress
   * @param {string} songId - Song ID
   * @param {Object} statusInfo - Status information
   * @returns {Object|null} Updated song or null if not found
   */
  updateStatus(songId, statusInfo) {
    const song = this.songs.get(songId);
    if (!song) {
      console.warn(`⚠️ [STORAGE] Song not found: ${songId}`);
      return null;
    }

    song.status = statusInfo.status || song.status;
    song.progress = statusInfo.progress !== undefined ? statusInfo.progress : song.progress;
    song.audioUrl = statusInfo.audioUrl || song.audioUrl;
    song.downloadUrl = statusInfo.downloadUrl || song.downloadUrl;
    song.savedFilename = statusInfo.savedFilename || song.savedFilename;
    song.updatedAt = new Date().toISOString();

    if (statusInfo.startedAt) song.startedAt = statusInfo.startedAt;
    if (statusInfo.etaSeconds !== undefined) song.etaSeconds = statusInfo.etaSeconds;

    console.log(`📝 [STORAGE] Updated song ${songId} status:`, {
      status: song.status,
      progress: song.progress,
      audioUrl: song.audioUrl ? 'Found' : 'Missing'
    });

    return song;
  }

  /**
   * Get all songs (for admin purposes)
   * @returns {Array} Array of all songs
   */
  getAllSongs() {
    return Array.from(this.songs.values());
  }

  /**
   * Delete a song (for cleanup)
   * @param {string} songId - Song ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteSong(songId) {
    const deleted = this.songs.delete(songId);
    if (deleted) {
      console.log(`🗑️ [STORAGE] Deleted song: ${songId}`);
    }
    return deleted;
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   * @private
   */
  _generateId() {
    this.requestCounter++;
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStats() {
    const songs = Array.from(this.songs.values());
    const statusCounts = songs.reduce((acc, song) => {
      acc[song.status] = (acc[song.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalSongs: songs.length,
      statusCounts,
      oldestSong: songs.length > 0 ? songs[0].startedAt : null,
      newestSong: songs.length > 0 ? songs[songs.length - 1].startedAt : null
    };
  }
}

module.exports = new SongStorageService();
