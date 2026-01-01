/**
 * Сервис для управления очередью операций в offline режиме
 * @module services/offlineQueue
 */

import { savePendingOperation, loadPendingOperations, clearPendingOperations, removePendingOperation } from './storage.js';
import { saveSpoolRecord, deleteSpoolRecord, bulkUpdateSpoolRecords, bulkDeleteSpoolRecords } from './firebase.js';

/**
 * Типы операций
 * @enum {string}
 */
export const OperationType = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    BULK_UPDATE: 'bulk_update',
    BULK_DELETE: 'bulk_delete'
};

/**
 * Добавляет операцию в очередь
 * @param {string} type - Тип операции
 * @param {Object} data - Данные операции
 */
export function queueOperation(type, data) {
    savePendingOperation({
        type,
        data,
        id: `${type}_${Date.now()}_${Math.random()}`
    });
}

/**
 * Выполняет все ожидающие операции
 * @param {Function} [showToast] - Функция для показа уведомлений
 * @returns {Promise<{success: number, failed: number}>} Результат выполнения
 */
export async function processPendingOperations(showToast = null) {
    const pending = loadPendingOperations();
    
    if (pending.length === 0) {
        return { success: 0, failed: 0 };
    }
    
    let success = 0;
    let failed = 0;
    const errors = [];
    
    for (let i = 0; i < pending.length; i++) {
        const operation = pending[i];
        
        try {
            await executeOperation(operation);
            removePendingOperation(i - (pending.length - pending.length + failed));
            success++;
        } catch (error) {
            console.error(`Failed to execute operation ${operation.id}:`, error);
            errors.push({ operation, error });
            failed++;
        }
    }
    
    if (showToast && success > 0) {
        showToast(`Синхронизировано операций: ${success}`, 'success');
    }
    
    if (showToast && failed > 0) {
        showToast(`Не удалось синхронизировать: ${failed}`, 'warning');
    }
    
    return { success, failed, errors };
}

/**
 * Выполняет одну операцию
 * @param {Object} operation - Операция для выполнения
 * @returns {Promise<*>} Результат выполнения
 */
async function executeOperation(operation) {
    const { type, data } = operation;
    
    switch (type) {
        case OperationType.CREATE:
            return await saveSpoolRecord(data.record, null);
            
        case OperationType.UPDATE:
            return await saveSpoolRecord(data.record, data.id);
            
        case OperationType.DELETE:
            return await deleteSpoolRecord(data.id);
            
        case OperationType.BULK_UPDATE:
            return await bulkUpdateSpoolRecords(data.ids, data.updates);
            
        case OperationType.BULK_DELETE:
            return await bulkDeleteSpoolRecords(data.ids);
            
        default:
            throw new Error(`Unknown operation type: ${type}`);
    }
}

/**
 * Очищает очередь операций
 */
export function clearQueue() {
    clearPendingOperations();
}

/**
 * Получает количество ожидающих операций
 * @returns {number} Количество операций
 */
export function getQueueLength() {
    return loadPendingOperations().length;
}

