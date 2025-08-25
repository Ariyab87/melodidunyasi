const fs = require('fs').promises;
const path = require('path');

/**
 * Persistent JSON-backed request store with atomic writes
 */
class RequestStore {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.dataFile = path.join(this.dataDir, 'requests.json');
    this.requests = new Map();
    this.fileLock = null;
    this.initialized = false;
  }

  /**
   * Initialize the store - create data directory and load existing data
   */
  async init() {
    if (this.initialized) return;

    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Create data file if it doesn't exist
      try {
        await fs.access(this.dataFile);
      } catch (accessError) {
        if (accessError.code === 'ENOENT') {
          // File doesn't exist, create it with empty array
          await fs.writeFile(this.dataFile, '[]', 'utf8');
          console.log('📁 [STORE] Created new data file');
        } else {
          throw accessError;
        }
      }
      
      // Try to load existing data
      try {
        const data = await fs.readFile(this.dataFile, 'utf8');
        const parsed = JSON.parse(data);
        
        // Convert array to Map for faster lookups
        if (Array.isArray(parsed)) {
          parsed.forEach(record => {
            this.requests.set(record.id, record);
          });
        }
        
        console.log(`📁 [STORE] Loaded ${this.requests.size} existing requests from disk`);
      } catch (readError) {
        if (readError.code === 'ENOENT') {
          console.log('📁 [STORE] No existing data file, starting fresh');
        } else {
          console.warn('⚠️ [STORE] Error reading existing data:', readError.message);
          // If file is corrupted, start fresh
          await fs.writeFile(this.dataFile, '[]', 'utf8');
          console.log('📁 [STORE] Reset corrupted data file, starting fresh');
        }
      }
      
      this.initialized = true;
      console.log('✅ [STORE] Request store initialized successfully');
      
    } catch (error) {
      console.error('❌ [STORE] Failed to initialize:', error.message);
      throw error;
    }
  }

  /**
   * Acquire file lock for atomic writes
   */
  async acquireLock() {
    if (this.fileLock) {
      await this.fileLock;
    }
    
    let resolveLock;
    this.fileLock = new Promise(resolve => {
      resolveLock = resolve;
    });
    
    return resolveLock;
  }

  /**
   * Release file lock
   */
  releaseLock() {
    if (this.fileLock) {
      this.fileLock = null;
    }
  }

  /**
   * Save data to disk atomically
   */
  async saveToDisk() {
    const releaseLock = await this.acquireLock();
    
    try {
      // Convert Map to array for JSON serialization
      const dataArray = Array.from(this.requests.values());
      
      // Write to temporary file first
      const tempFile = `${this.dataFile}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(dataArray, null, 2), 'utf8');
      
      // Atomic rename (this is atomic on most filesystems)
      await fs.rename(tempFile, this.dataFile);
      
      console.log(`💾 [STORE] Saved ${dataArray.length} requests to disk`);
      
    } catch (error) {
      console.error('❌ [STORE] Failed to save to disk:', error.message);
      throw error;
    } finally {
      releaseLock();
      this.releaseLock();
    }
  }

  /**
   * Create a new request record
   */
  async create(record) {
    await this.init();
    
    const newRecord = {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || new Date().toISOString()
    };
    
    this.requests.set(newRecord.id, newRecord);
    console.log(`📝 [STORE] Created request: ${newRecord.id}`);
    
    return newRecord;
  }

  /**
   * Update an existing request record
   */
  async update(id, patch) {
    await this.init();
    
    const existing = this.requests.get(id);
    if (!existing) {
      throw new Error(`Request not found: ${id}`);
    }
    
    const updatedRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    
    this.requests.set(id, updatedRecord);
    console.log(`📝 [STORE] Updated request: ${id}`, Object.keys(patch));
    
    return updatedRecord;
  }

  /**
   * Upsert a request record (create if doesn't exist, update if it does)
   */
  async upsert(id, patch) {
    await this.init();
    
    const existing = this.requests.get(id);
    if (existing) {
      return this.update(id, patch);
    } else {
      const newRecord = {
        id,
        ...patch,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.requests.set(id, newRecord);
      console.log(`📝 [STORE] Upserted request: ${id}`);
      return newRecord;
    }
  }

  /**
   * Set error state for a request
   */
  async setError(id, error) {
    await this.init();
    
    const existing = this.requests.get(id);
    if (!existing) {
      throw new Error(`Request not found: ${id}`);
    }
    
    const errorRecord = {
      ...existing,
      status: 'failed',
      providerError: error,
      updatedAt: new Date().toISOString()
    };
    
    this.requests.set(id, errorRecord);
    console.log(`❌ [STORE] Set error for request: ${id}`, error.message);
    
    return errorRecord;
  }

  /**
   * Get a request by ID
   */
  async getById(id) {
    await this.init();
    return this.requests.get(id) || null;
  }

  /**
   * Get a request by provider job ID
   */
  async getByProviderJobId(providerJobId) {
    await this.init();
    for (const [id, request] of this.requests.entries()) {
      if (request.providerJobId === providerJobId) {
        return request;
      }
    }
    return null;
  }

  /**
   * Get a request by provider record ID
   */
  async getByProviderRecordId(providerRecordId) {
    await this.init();
    for (const [id, request] of this.requests.entries()) {
      if (request.providerRecordId === providerRecordId) {
        return request;
      }
    }
    return null;
  }

  /**
   * List all requests
   */
  async list() {
    await this.init();
    return Array.from(this.requests.values());
  }

  /**
   * Force flush to disk
   */
  async saveNow() {
    await this.saveToDisk();
  }

  /**
   * Get store statistics
   */
  async getStats() {
    await this.init();
    
    const requests = Array.from(this.requests.values());
    const statusCounts = requests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalRequests: requests.length,
      statusCounts,
      oldestRequest: requests.length > 0 ? requests[0].createdAt : null,
      newestRequest: requests.length > 0 ? requests[requests.length - 1].createdAt : null,
      dataFile: this.dataFile,
      initialized: this.initialized
    };
  }

  /**
   * Clean up old completed/failed requests (optional)
   */
  async cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    await this.init();
    
    const cutoff = new Date(Date.now() - maxAge);
    const before = this.requests.size;
    
    for (const [id, request] of this.requests.entries()) {
      if (request.status === 'completed' || request.status === 'failed' || request.status === 'ready') {
        if (new Date(request.updatedAt) < cutoff) {
          this.requests.delete(id);
        }
      }
    }
    
    const after = this.requests.size;
    const cleaned = before - after;
    
    if (cleaned > 0) {
      console.log(`🧹 [STORE] Cleaned up ${cleaned} old requests`);
      await this.saveToDisk();
    }
    
    return cleaned;
  }
}

module.exports = new RequestStore();
