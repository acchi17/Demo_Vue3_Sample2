/**
 * EntryConnectionManager class
 * Manages connection states between entry output parameters and input parameters.
 *
 * Each connection represents a directed link from a source endpoint (typically an
 * output parameter of one entry) to a destination endpoint (typically an input
 * parameter of another entry).
 *
 * Endpoint schema:
 *   { entryId: string, category: 'input'|'output', dataType: string, paramName: string }
 *
 * Connection schema:
 *   { id: string, source: Endpoint, destination: Endpoint }
 */
export default class EntryConnectionManager {
  constructor() {
    // Map of connection id -> connection object
    this._connectionsById = new Map();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Validate an endpoint object.
   * @param {Object} endpoint
   * @returns {boolean}
   * @private
   */
  _isValidEndpoint(endpoint) {
    if (!endpoint || typeof endpoint !== 'object') return false;
    const { entryId, category, dataType, paramName } = endpoint;
    if (!entryId || typeof entryId !== 'string') return false;
    if (category !== 'input' && category !== 'output') return false;
    if (!dataType || typeof dataType !== 'string') return false;
    if (!paramName || typeof paramName !== 'string') return false;
    return true;
  }

  /**
   * Generate a UUID for a new connection.
   * @returns {string}
   * @private
   */
  _generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ---------------------------------------------------------------------------
  // CRUD operations
  // ---------------------------------------------------------------------------

  /**
   * Add a new connection between a source and a destination endpoint.
   * @param {Object} source      - Source endpoint { entryId, category, dataType, paramName }
   * @param {Object} destination - Destination endpoint { entryId, category, dataType, paramName }
   * @returns {string|null} The new connection id, or null if validation fails
   */
  addConnection(source, destination) {
    if (!this._isValidEndpoint(source)) {
      console.error('EntryConnectionManager: invalid source endpoint', source);
      return null;
    }
    if (!this._isValidEndpoint(destination)) {
      console.error('EntryConnectionManager: invalid destination endpoint', destination);
      return null;
    }

    const id = this._generateId();
    this._connectionsById.set(id, {
      id,
      source: { ...source },
      destination: { ...destination }
    });
    return id;
  }

  /**
   * Remove a connection by its id.
   * @param {string} connectionId
   * @returns {boolean} true if the connection was found and removed
   */
  removeConnection(connectionId) {
    return this._connectionsById.delete(connectionId);
  }

  /**
   * Get a connection by its id.
   * @param {string} connectionId
   * @returns {Object|null}
   */
  getConnection(connectionId) {
    return this._connectionsById.get(connectionId) || null;
  }

  /**
   * Get all connections as an array.
   * @returns {Array<Object>}
   */
  getConnections() {
    return Array.from(this._connectionsById.values());
  }

  /**
   * Get all connections that involve the given entry id
   * (either as source or destination).
   * @param {string} entryId
   * @returns {Array<Object>}
   */
  getConnectionsByEntryId(entryId) {
    const result = [];
    for (const conn of this._connectionsById.values()) {
      if (conn.source.entryId === entryId || conn.destination.entryId === entryId) {
        result.push(conn);
      }
    }
    return result;
  }

  /**
   * Get all connections for a specific parameter endpoint.
   * @param {string} entryId
   * @param {'input'|'output'} category
   * @param {string} paramName
   * @returns {Array<Object>}
   */
  getConnectionsByEndpoint(entryId, category, paramName) {
    const result = [];
    for (const conn of this._connectionsById.values()) {
      const src = conn.source;
      const dst = conn.destination;
      if (
        (src.entryId === entryId && src.category === category && src.paramName === paramName) ||
        (dst.entryId === entryId && dst.category === category && dst.paramName === paramName)
      ) {
        result.push(conn);
      }
    }
    return result;
  }

  /**
   * Remove all connections that involve the given entry id.
   * @param {string} entryId
   * @returns {number} Number of connections removed
   */
  removeConnectionsByEntryId(entryId) {
    let count = 0;
    for (const [id, conn] of this._connectionsById.entries()) {
      if (conn.source.entryId === entryId || conn.destination.entryId === entryId) {
        this._connectionsById.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all connections.
   */
  clear() {
    this._connectionsById.clear();
  }

  // ---------------------------------------------------------------------------
  // Serialisation / persistence
  // ---------------------------------------------------------------------------

  /**
   * Export all connection states as a plain JSON-serialisable object.
   * The returned structure can be saved to a file with JSON.stringify().
   * @returns {{ connections: Array<Object> }}
   */
  toJson() {
    return {
      connections: this.getConnections()
    };
  }

  /**
   * Restore connection states from a parsed JSON object.
   * Replaces all existing connections with the ones stored in the data.
   *
   * Expected JSON structure:
   * {
   *   "connections": [
   *     {
   *       "id": "<optional – overridden with a new uuid if omitted>",
   *       "source":      { "entryId": "...", "category": "output", "dataType": "integer", "paramName": "result" },
   *       "destination": { "entryId": "...", "category": "input",  "dataType": "integer", "paramName": "value"  }
   *     }
   *   ]
   * }
   *
   * @param {Object} data - Parsed JSON object (from JSON.parse or FileService.readJsonFile)
   * @returns {number} Number of connections successfully restored
   */
  restoreFromJson(data) {
    this.clear();

    if (!data || !Array.isArray(data.connections)) {
      console.warn('EntryConnectionManager.restoreFromJson: no valid "connections" array found');
      return 0;
    }

    let count = 0;
    data.connections.forEach((item, index) => {
      if (!this._isValidEndpoint(item.source)) {
        console.warn(`EntryConnectionManager.restoreFromJson: skipping connection[${index}] – invalid source`);
        return;
      }
      if (!this._isValidEndpoint(item.destination)) {
        console.warn(`EntryConnectionManager.restoreFromJson: skipping connection[${index}] – invalid destination`);
        return;
      }

      const id = (item.id && typeof item.id === 'string') ? item.id : this._generateId();
      this._connectionsById.set(id, {
        id,
        source: { ...item.source },
        destination: { ...item.destination }
      });
      count++;
    });

    return count;
  }

  /**
   * Load and restore connection states from a JSON file using FileService.
   * @param {string} filePath - Path to the JSON file
   * @param {FileService} fileService - FileService instance for file I/O
   * @returns {Promise<number>} Number of connections successfully restored
   */
  async loadFromJsonFile(filePath, fileService) {
    try {
      const data = await fileService.readJsonFile(filePath);
      return this.restoreFromJson(data);
    } catch (error) {
      console.error(`EntryConnectionManager.loadFromJsonFile: failed to load "${filePath}": ${error.message}`);
      return 0;
    }
  }
}
