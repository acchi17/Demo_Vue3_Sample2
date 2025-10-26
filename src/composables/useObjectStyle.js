import { computed } from 'vue'

/**
 * Common management of object styles
 * @returns {Object} The methods for getting object style
 */
export function useObjectStyle() {
  // Static font size constants
  const FONT_SIZES = {
    text: 12,      // For text display (block-id, etc.)
    button: 16     // For buttons (remove-button, etc.)
  }
  
  // Constants for layout calculation
  const LAYOUT_CONSTANTS = {
    buttonSizeRatio: 1.5  // Ratio of button area to font size
  }
  
  /**
   * Get the style for entry text
   * @returns {ComputedRef} CSS style object (including width, height)
   */
  const getEntryTextStyle = () => {
    return computed(() => {
      return {
        fontSize: `${FONT_SIZES.text}px`,
        color: '#333',
        whiteSpace: 'nowrap',     // Prevent line breaks
        overflow: 'hidden',       // Hide overflow content
        textOverflow: 'ellipsis', // Show ellipsis for overflow
        // The following settings are for centering text within the content
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    })
  }

  /**
   * Get the style for entry buttons
   * @returns {ComputedRef} CSS style object
   */
  const getEntryButtonStyle = () => {
    return computed(() => {
      const size = FONT_SIZES.button * LAYOUT_CONSTANTS.buttonSizeRatio
      return {
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${FONT_SIZES.button}px`,
        color: '#333',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        cursor: 'pointer',
        // The following settings are for centering text within the content
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    })
  }
  
  return {
    getEntryButtonStyle,
    getEntryTextStyle,
  }
}
