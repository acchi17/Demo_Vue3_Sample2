/**
 * Add block implementation
 * it returns the result of adding a and b from the input argument
 * @param {Object} inputParams - Input parameters object with 'a' and 'b' properties
 * @returns {Object} Execution result with 'result' field
 */
export function execute(inputParams) {
  let result = {};

  result.success = false;
  try {
    result.output = inputParams.a + inputParams.b;
    result.success = true;
  } catch (error) {
    result.errorMessage = error.message;
  }
  return result;
}
