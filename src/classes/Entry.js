/**
 * Entry class
 * Superclass that provides common functionality and attributes for Block and Container classes
 */
export default class Entry {
  /**
   * Constructor
   * @param {string} id - Unique ID of the entry
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} width - Width
   * @param {number} height - Height
   */
  constructor(id, x, y, width, height) {
    this.id = id;          // Unique ID
    this.x = x;            // X coordinate
    this.y = y;            // Y coordinate
    this.width = width;    // Width
    this.height = height;  // Height
  }

  /**
   * Update position method
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   */
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Update size method
   * @param {number} width - New width
   * @param {number} height - New height
   */
  updateSize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Prepare for removal method
   * Pre-removal processing (can be overridden)
   * @returns {boolean} Whether removal is possible
   */
  prepareForRemoval() {
    // Pre-removal processing (can be overridden)
    return true;
  }
}
