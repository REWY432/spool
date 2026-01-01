/**
 * Сервис для оптимистичных обновлений UI
 * @module services/optimisticUpdates
 */

/**
 * Хранилище оригинальных данных для rollback
 * @type {Map<string, Object>}
 */
const originalDataStore = new Map();

/**
 * Применяет оптимистичное обновление к локальной базе данных
 * @param {Array<Object>} database - Локальная база данных
 * @param {string} itemId - ID элемента для обновления
 * @param {Object} updates - Объект с обновлениями
 * @param {Function} renderCallback - Функция для перерисовки UI
 * @param {Function} showToast - Функция для показа уведомлений
 * @returns {Object} Обновленный элемент или null
 */
export function applyOptimisticUpdate(database, itemId, updates, renderCallback, showToast) {
    const index = database.findIndex(x => x.id === itemId);
    if (index === -1) {
        console.warn(`Item ${itemId} not found for optimistic update`);
        return null;
    }
    
    // Сохраняем оригинальные данные для rollback
    if (!originalDataStore.has(itemId)) {
        originalDataStore.set(itemId, { ...database[index] });
    }
    
    // Применяем обновление локально
    database[index] = { ...database[index], ...updates };
    
    // Обновляем UI сразу
    if (renderCallback) {
        renderCallback();
    }
    
    if (showToast) {
        showToast('Обновлено', 'success');
    }
    
    return database[index];
}

/**
 * Откатывает оптимистичное обновление (rollback)
 * @param {Array<Object>} database - Локальная база данных
 * @param {string} itemId - ID элемента для отката
 * @param {Function} renderCallback - Функция для перерисовки UI
 * @param {Function} showToast - Функция для показа уведомлений
 */
export function rollbackUpdate(database, itemId, renderCallback, showToast) {
    const original = originalDataStore.get(itemId);
    if (!original) {
        console.warn(`No original data found for ${itemId}`);
        return;
    }
    
    const index = database.findIndex(x => x.id === itemId);
    if (index !== -1) {
        database[index] = original;
    }
    
    originalDataStore.delete(itemId);
    
    if (renderCallback) {
        renderCallback();
    }
    
    if (showToast) {
        showToast('Изменения отменены из-за ошибки', 'warning');
    }
}

/**
 * Подтверждает успешное обновление (очищает оригинальные данные)
 * @param {string} itemId - ID элемента
 */
export function confirmUpdate(itemId) {
    originalDataStore.delete(itemId);
}

/**
 * Очищает все сохраненные оригинальные данные
 */
export function clearOriginalData() {
    originalDataStore.clear();
}

/**
 * Применяет оптимистичное создание записи
 * @param {Array<Object>} database - Локальная база данных
 * @param {Object} newItem - Новая запись (с временным ID)
 * @param {Function} renderCallback - Функция для перерисовки UI
 * @param {Function} showToast - Функция для показа уведомлений
 */
export function applyOptimisticCreate(database, newItem, renderCallback, showToast) {
    database.push(newItem);
    
    if (renderCallback) {
        renderCallback();
    }
    
    if (showToast) {
        showToast('Создано', 'success');
    }
}

/**
 * Откатывает создание записи
 * @param {Array<Object>} database - Локальная база данных
 * @param {string} tempId - Временный ID созданной записи
 * @param {Function} renderCallback - Функция для перерисовки UI
 */
export function rollbackCreate(database, tempId, renderCallback) {
    const index = database.findIndex(x => x.id === tempId || x.tempId === tempId);
    if (index !== -1) {
        database.splice(index, 1);
    }
    
    if (renderCallback) {
        renderCallback();
    }
}

/**
 * Обновляет ID записи после успешного создания на сервере
 * @param {Array<Object>} database - Локальная база данных
 * @param {string} tempId - Временный ID
 * @param {string} realId - Реальный ID с сервера
 */
export function updateItemId(database, tempId, realId) {
    const item = database.find(x => x.id === tempId || x.tempId === tempId);
    if (item) {
        item.id = realId;
        delete item.tempId;
    }
}

