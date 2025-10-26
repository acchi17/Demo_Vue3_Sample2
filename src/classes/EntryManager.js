/**
 * EntryManager class
 * Class that manages parent-child relationships between entries
 */
export default class EntryManager {
  constructor() {
    // Dictionary of entry IDs and objects
    this._entriesMap = new Map();
    
    // Dictionary of child IDs and their parent IDs
    this._parentChildMap = new Map();
  }

  /**
   * Register an entry (Internal use)
   * @param {Entry} entry - Entry to register
   * @returns {boolean} Whether the registration was successful
   * @private
   */
  _registerEntry(entry) {
    if (!entry || !entry.id) return false;
    
    // Overwrite if already registered
    this._entriesMap.set(entry.id, entry);
    return true;
  }

  /**
   * Get an entry
   * @param {string} entryId - ID of the entry to get
   * @returns {Entry|null} Retrieved entry or null
   */
  getEntry(entryId) {
    return this._entriesMap.get(entryId) || null;
  }

  /**
   * Get the parent of an entry
   * @param {string} entryId - ID of the child entry
   * @returns {Entry|null} Parent entry or null
   */
  getParentEntry(entryId) {
    const parentId = this._parentChildMap.get(entryId);
    if (!parentId) return null;
    
    return this._entriesMap.get(parentId) || null;
  }

  /**
   * Get the parent ID of an entry
   * @param {string} entryId - ID of the child entry
   * @returns {string|null} Parent entry ID or null
   */
  getParentId(entryId) {
    return this._parentChildMap.get(entryId) || null;
  }

  /**
   * Get the list of IDs for an entry and all its descendants
   * @param {string} entryId - Target entry ID
   * @returns {Array<string>} List of IDs for the entry and all its descendants
   */
  getAllDescendantIds(entryId) {
    const ids = new Set([entryId]);
    
    const entry = this._entriesMap.get(entryId);
    if (!entry || entry.type !== 'container') return Array.from(ids);
    
    // Recursively get child entries
    for (const childEntry of entry._children) {
      const childIds = this.getAllDescendantIds(childEntry.id);
      childIds.forEach(id => ids.add(id));
    }
    
    return Array.from(ids);
  }

  /**
   * Add an entry to a parent entry
   * If parentId is null, the entry is just registered without a parent
   * @param {string|null} parentId - ID of the parent entry, or null to just register
   * @param {Entry} entry - Entry to add
   * @param {number} index - Index position to add (ignored if parentId is null)
   * @returns {boolean} Whether the addition was successful
   */
  addEntry(parentId, entry, index) {
    // If parentId is null, just register the entry without a parent
    if (parentId === null) {
      return this._registerEntry(entry);
    }
    
    // Get parent entry
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return false;
    
    // Register child entry
    this._registerEntry(entry);
    
    // Set parent-child relationship
    this._parentChildMap.set(entry.id, parentId);
    
    // Add directly to parent's _children array
    if (index >= 0 && index <= parentEntry._children.length) {
      parentEntry._children.splice(index, 0, entry);
      return true;
    }
    return false;
  }

  /**
   * Remove an entry from a parent entry
   * @param {string} entryId - ID of the entry to remove
   * @returns {Entry|null} Removed entry or null
   */
  removeEntry(entryId) {
    // Get parent entry
    const parentId = this._parentChildMap.get(entryId);
    if (!parentId) return null;
    
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return null;
    
    // Get child entry
    const childEntry = this._entriesMap.get(entryId);
    if (!childEntry) return null;
    
    // Remove from parent's _children array
    const index = parentEntry._children.findIndex(child => child.id === entryId);
    if (index !== -1) {
      parentEntry._children.splice(index, 1);
      // Delete parent-child relationship
      this._parentChildMap.delete(entryId);
      return childEntry;
    }
    
    return null;
  }

  /**
   * Reorder an entry within a parent entry
   * @param {string} parentId - ID of the parent entry
   * @param {string} entryId - ID of the entry to reorder
   * @param {number} index - Target index position
   * @returns {boolean} Whether the reordering was successful
   */
  reorderEntry(parentId, entryId, index) {
    // Get parent entry
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return false;
    
    // Reorder within parent's _children array
    const currentIndex = parentEntry._children.findIndex(child => child.id === entryId);
    if (currentIndex !== -1) {
      let targetIndex = index;
      if (index > currentIndex) {
        targetIndex = targetIndex - 1;
      }
      const child = parentEntry._children.splice(currentIndex, 1)[0];
      parentEntry._children.splice(targetIndex, 0, child);
      return true;
    }
    return false;
  }

  /**
   * Move an entry to a different parent
   * @param {string} entryId - ID of the child entry to move
   * @param {string|null} newParentId - ID of the new parent entry (null to set as parentless)
   * @param {number} index - Target index position
   * @returns {Entry|null} Moved entry or null (if move failed)
   */
  moveEntry(entryId, newParentId, index) {
    // Get and remove the entry from its original parent
    const childEntry = this.removeEntry(entryId);
    if (!childEntry) {
      // If no parent (MainArea entry), just get the entry
      const entry = this._entriesMap.get(entryId);
      if (!entry) return null;
      
      // If no parent-child relationship, return the entry
      if (!this._parentChildMap.has(entryId)) {
        return entry;
      }
      
      return null;
    }
    
    if (newParentId === null) {
      // Set as parentless (move to MainArea)
      // Just delete the parent-child relationship, MainArea component will handle adding it
      return childEntry;
    } else {
      // Add to new parent
      const success = this.addEntry(newParentId, childEntry, index);
      return success ? childEntry : null;
    }
  }

  /**
   * Find a container by ID
   * @param {string} containerId - ID of the container to find
   * @returns {Container|null} Found container or null
   * @unused This method is currently not used but kept for future extensibility
   */
  findContainerById(containerId) {
    const entry = this._entriesMap.get(containerId);
    if (entry && entry.type === 'container') {
      return entry;
    }
    return null;
  }

  /**
   * Check if an entry has a parent
   * @param {string} entryId - ID of the entry to check
   * @returns {boolean} Whether the entry has a parent
   * @unused This method is currently not used but kept for future extensibility
   */
  hasParent(entryId) {
    return this._parentChildMap.has(entryId);
  }

  /**
   * Check if an entry belongs to a specific parent
   * @param {string} entryId - ID of the child entry
   * @param {string} parentId - ID of the parent entry
   * @returns {boolean} Whether the child belongs to the parent
   * @unused This method is currently not used but kept for future extensibility
   */
  isChildOf(entryId, parentId) {
    return this._parentChildMap.get(entryId) === parentId;
  }
  
  /**
   * Set parent-child relationship (overwrites existing relationship)
   * @param {string} childId - ID of the child entry
   * @param {string|null} parentId - ID of the parent entry (null to set as parentless)
   * @returns {boolean} Whether the setting was successful
   * @unused This method is currently not used but kept for future extensibility
   */
  setParentChildRelation(childId, parentId) {
    if (!childId) return false;
    
    if (parentId === null) {
      // Set as parentless
      this._parentChildMap.delete(childId);
      return true;
    }
    
    // Check if parent entry exists
    const parentEntry = this._entriesMap.get(parentId);
    if (!parentEntry || parentEntry.type !== 'container') return false;
    
    // Check if child entry exists
    const childEntry = this._entriesMap.get(childId);
    if (!childEntry) return false;
    
    // Set parent-child relationship
    this._parentChildMap.set(childId, parentId);
    return true;
  }
  
  /**
   * Remove parent-child relationship
   * @param {string} childId - ID of the child entry
   * @returns {boolean} Whether the removal was successful
   * @unused This method is currently not used but kept for future extensibility
   */
  removeParentChildRelation(childId) {
    if (!childId) return false;
    
    if (this._parentChildMap.has(childId)) {
      this._parentChildMap.delete(childId);
      return true;
    }
    
    return false;
  }
}
