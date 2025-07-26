/**
 * Block class
 * Class that inherits from Entry class and corresponds to a white-gray rectangle
 */
import Entry from './Entry';

export default class Block extends Entry {
  /**
   * Constructor
   * @param {string} id - Unique ID of the block
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  constructor(id, x, y) {
    // Specify default size
    super(id, x, y, 100, 50);
    this.type = 'block';    // Block type
    this.color = '#f0f0f0'; // White-gray color
  }

  // Add Block class specific methods if needed
  // Example: Method to set block content, etc.
  
  /**
   * Method to change block color
   * @param {string} color - New color (hexadecimal color code)
   */
  setColor(color) {
    this.color = color;
  }
}
