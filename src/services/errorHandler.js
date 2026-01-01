/**
 * Сервис для обработки ошибок
 * @module services/errorHandler
 */

/**
 * Сообщения об ошибках Firestore
 * @type {Object<string, string>}
 */
const ERROR_MESSAGES = {
    'permission-denied': 'Нет доступа к операции',
    'unavailable': 'Сервис временно недоступен. Проверьте подключение к интернету.',
    'deadline-exceeded': 'Превышено время ожидания. Попробуйте еще раз.',
    'already-exists': 'Запись уже существует',
    'not-found': 'Запись не найдена',
    'failed-precondition': 'Операция не может быть выполнена в текущем состоянии',
    'aborted': 'Операция была прервана',
    'out-of-range': 'Значение вне допустимого диапазона',
    'unimplemented': 'Операция не реализована',
    'internal': 'Внутренняя ошибка сервера',
    'data-loss': 'Потеря данных',
    'unauthenticated': 'Требуется аутентификация'
};

/**
 * Обрабатывает ошибку Firestore и показывает пользователю понятное сообщение
 * @param {Error} error - Ошибка Firestore
 * @param {string} [context=''] - Контекст операции (например, "При сохранении")
 * @param {Function} [showToast] - Функция для показа уведомлений
 */
export function handleFirestoreError(error, context = '', showToast = null) {
    const errorCode = error.code || '';
    const message = ERROR_MESSAGES[errorCode] || error.message || 'Произошла неизвестная ошибка';
    const fullMessage = context ? `${context}: ${message}` : message;
    
    console.error(`Firestore Error [${context}]:`, error);
    
    if (showToast && typeof showToast === 'function') {
        const type = errorCode === 'unavailable' ? 'warning' : 'error';
        showToast(fullMessage, type);
    }
    
    return {
        code: errorCode,
        message: fullMessage,
        originalError: error
    };
}

/**
 * Проверяет, является ли ошибка критичной (нельзя повторить)
 * @param {Error} error - Ошибка для проверки
 * @returns {boolean} true, если ошибка критичная
 */
export function isCriticalError(error) {
    const criticalCodes = [
        'permission-denied',
        'not-found',
        'already-exists',
        'failed-precondition',
        'out-of-range',
        'unauthenticated'
    ];
    
    return criticalCodes.includes(error.code);
}

/**
 * Глобальный обработчик необработанных ошибок
 * @param {Function} showToast - Функция для показа уведомлений
 */
export function setupGlobalErrorHandler(showToast) {
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        if (showToast) {
            showToast('Произошла непредвиденная ошибка. Проверьте консоль.', 'error');
        }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        if (showToast) {
            showToast('Ошибка при выполнении операции. Проверьте консоль.', 'error');
        }
    });
}

