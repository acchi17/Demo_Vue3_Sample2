/**
 * Container class
 * Class that inherits from Entry class and corresponds to a lime-colored rectangle
 * Container can contain other entries (Block or Container) inside
 */
import Entry from './Entry';

export default class Container extends Entry {
  /**
   * Constructor
   * @param {string} id - Unique ID of the container
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  constructor(id, x, y) {
    // Specify default size
    super(id, x, y, 150, 100);
    this.type = 'container';  // Container type
    this.color = '#c5e1a5';   // Lime color
    this._children = [];      // Array of child elements
    this._dropAreas = [       // Array of drop areas
      { id: `${id}-area-0`, index: 0 }
    ];
  }

  /**
   * Method to add a child element
   * @param {Entry} child - Child element to add (Block or Container)
   * @param {number} areaIndex - Index position to add
   * @returns {boolean} Whether addition was successful
   */
  addChild(child, areaIndex) {
    // Add child element at specified index
    if (areaIndex >= 0 && areaIndex <= this._children.length) {
      this._children.splice(areaIndex, 0, child);
      this._updateDropAreas();
      this._updateSize();
      return true;
    }
    return false;
  }

  /**
   * Method to remove a child element
   * @param {string} childId - ID of child element to remove
   * @returns {boolean} Whether removal was successful
   */
  removeChild(childId) {
    const index = this._children.findIndex(child => child.id === childId);
    if (index !== -1) {
      this._children.splice(index, 1);
      this._updateDropAreas();
      this._updateSize();
      return true;
    }
    return false;
  }

  /**
   * Method to update drop areas
   * Updates drop areas based on number of child elements
   */
  _updateDropAreas() {
    // Update drop areas based on number of child elements
    this._dropAreas = [];
    for (let i = 0; i <= this._children.length; i++) {
      this._dropAreas.push({ id: `${this.id}-area-${i}`, index: i });
    }
  }

  /**
   * Method to update container size
   * Calculates container size based on child elements
   */
  _updateSize() {
    // Calculate container size based on child elements
    let totalHeight = 0;
    let maxWidth = this.width;

    // Sum up heights of each child element and find maximum width
    this._children.forEach(child => {
      totalHeight += child.height + 20; // Add 20px margin
      maxWidth = Math.max(maxWidth, child.width + 40); // Add 20px margin on each side
    });

    // Ensure minimum size
    totalHeight = Math.max(100, totalHeight);
    maxWidth = Math.max(150, maxWidth);

    // Update size
    super.updateSize(maxWidth, totalHeight);
  }

  /**
   * Override prepare for removal method
   * Indicates that child elements also need to be removed
   * @returns {boolean} Whether removal is possible
   */
  prepareForRemoval() {
    // Indicate that child elements also need to be removed
    return true;
  }

  /**
   * Method to get array of child elements
   * @returns {Array} Array of child elements
   */
  getChildren() {
    return this._children;
  }

  /**
   * Method to get array of drop areas
   * @returns {Array} Array of drop areas
   */
  getDropAreas() {
    return this._dropAreas;
  }
}
