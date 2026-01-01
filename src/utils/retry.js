/**
 * Утилиты для повторных попыток выполнения операций
 * @module utils/retry
 */

import { MAX_RETRIES, RETRY_DELAY } from '../config/constants.js';

/**
 * Выполняет операцию с повторными попытками при ошибке
 * @param {Function} operation - Асинхронная функция для выполнения
 * @param {number} [maxRetries=MAX_RETRIES] - Максимальное количество попыток
 * @param {number} [delay=RETRY_DELAY] - Задержка между попытками (мс)
 * @returns {Promise<*>} Результат выполнения операции
 * @throws {Error} Последняя ошибка, если все попытки неудачны
 */
export async function retryOperation(operation, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            // Если это последняя попытка, выбрасываем ошибку
            if (i === maxRetries - 1) {
                throw error;
            }
            
            // Экспоненциальная задержка: delay * (попытка + 1)
            const waitTime = delay * (i + 1);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    throw lastError;
}

/**
 * Проверяет, является ли ошибка временной (можно повторить)
 * @param {Error} error - Ошибка для проверки
 * @returns {boolean} true, если ошибка временная
 */
export function isRetryableError(error) {
    const retryableCodes = [
        'unavailable',
        'deadline-exceeded',
        'internal',
        'aborted'
    ];
    
    return retryableCodes.includes(error.code);
}

