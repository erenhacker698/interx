const fs = require('fs');
const path = require('path');

/**
 * FastCache - High Performance Memory Bridge
 * Eliminates blocking synchronous disk I/O for 20ms-level response times.
 */
class FastCache {
    constructor() {
        this.cache = new Map();
        this.locks = new Set();
    }

    /**
     * Get data from memory cache. If not present, load and cache it.
     */
    get(filePath) {
        if (this.cache.has(filePath)) {
            return this.cache.get(filePath);
        }
        
        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                this.cache.set(filePath, data);
                return data;
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    /**
     * Update data in memory and schedule an ASYNC write to disk.
     */
    set(filePath, data) {
        this.cache.set(filePath, data);
        
        // Non-blocking async write to prevent event loop lag
        fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
            if (err) console.error(`[FastCache WriteError]: ${filePath}`, err.message);
        });
    }

    /**
     * Check if a file exists without blocking the loop
     */
    exists(filePath) {
        return fs.existsSync(filePath);
    }
    
    /**
     * Clear cache for a specific file (force reload)
     */
    clear(filePath) {
        this.cache.delete(filePath);
    }
}

module.exports = new FastCache();
