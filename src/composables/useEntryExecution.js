import { inject } from 'vue';
import { useEntryState } from './useEntryState'
import { useSystemState } from './useSystemState'

/**
 * Provides entry execution functionality as a composable function
 * @return {Object} Object containing executeEntry function and reactive state
 */
export function useEntryExecution() {
  const entryExecutionService = inject('entryExecutionService');
  const executionLogService = inject('executionLogService');
  const { cancelConnection } = useEntryState()
  const { setExecuting } = useSystemState()

  /**
   * Execute an entry (Block or Container)
   * @param {Entry} entry Entry to execute
   */
  const executeEntry = async (entry) => {
    if (!entry) return;
    cancelConnection();

    setExecuting(true);
    try {
      await entryExecutionService.executeEntry(entry);
    } finally {
      setExecuting(false);
    }
  };

  /**
   * Get execution logs from the ExecutionLogService
   * Returns a reactive reference to the logs
   * @return {Object} Reactive reference containing logs
   */
  const getLogs = () => {
    return executionLogService.getLogs();
  };

  /**
   * Clear all execution logs from the ExecutionLogService
   */
  const clearLogs = () => {
    executionLogService.clearLogs();
  };

  // Return public API
  return {
    executeEntry,
    getLogs,
    clearLogs
  };
}
