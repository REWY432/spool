/**
 * Сервис для работы с локальным хранилищем (offline режим)
 * @module services/storage
 */

const STORAGE_KEYS = {
    THEME: 'theme',
    SETTINGS: 'app_settings_cache',
    LAST_SYNC: 'last_sync_timestamp',
    PENDING_OPERATIONS: 'pending_operations'
};

/**
 * Сохраняет данные в localStorage
 * @param {string} key - Ключ
 * @param {*} value - Значение (будет сериализовано в JSON)
 */
export function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save to storage (${key}):`, error);
    }
}

/**
 * Загружает данные из localStorage
 * @param {string} key - Ключ
 * @param {*} defaultValue - Значение по умолчанию, если ключ не найден
 * @returns {*} Десериализованное значение или defaultValue
 */
export function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Failed to load from storage (${key}):`, error);
        return defaultValue;
    }
}

/**
 * Удаляет данные из localStorage
 * @param {string} key - Ключ
 */
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Failed to remove from storage (${key}):`, error);
    }
}

/**
 * Сохраняет тему приложения
 * @param {string} theme - Тема ('light' или 'dark')
 */
export function saveTheme(theme) {
    saveToStorage(STORAGE_KEYS.THEME, theme);
}

/**
 * Загружает сохраненную тему
 * @returns {string} Тема или 'light' по умолчанию
 */
export function loadTheme() {
    return loadFromStorage(STORAGE_KEYS.THEME, 'light');
}

/**
 * Сохраняет кэш настроек
 * @param {Object} settings - Объект настроек
 */
export function saveSettingsCache(settings) {
    saveToStorage(STORAGE_KEYS.SETTINGS, {
        data: settings,
        timestamp: Date.now()
    });
}

/**
 * Загружает кэш настроек
 * @param {number} maxAge - Максимальный возраст кэша в мс (по умолчанию 1 час)
 * @returns {Object|null} Настройки или null, если кэш устарел
 */
export function loadSettingsCache(maxAge = 3600000) {
    const cached = loadFromStorage(STORAGE_KEYS.SETTINGS, null);
    
    if (!cached || !cached.timestamp) {
        return null;
    }
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
        removeFromStorage(STORAGE_KEYS.SETTINGS);
        return null;
    }
    
    return cached.data;
}

/**
 * Сохраняет операцию в очередь для выполнения при восстановлении соединения
 * @param {Object} operation - Операция для сохранения
 */
export function savePendingOperation(operation) {
    const pending = loadFromStorage(STORAGE_KEYS.PENDING_OPERATIONS, []);
    pending.push({
        ...operation,
        timestamp: Date.now()
    });
    saveToStorage(STORAGE_KEYS.PENDING_OPERATIONS, pending);
}

/**
 * Загружает все ожидающие операции
 * @returns {Array<Object>} Массив операций
 */
export function loadPendingOperations() {
    return loadFromStorage(STORAGE_KEYS.PENDING_OPERATIONS, []);
}

/**
 * Удаляет операцию из очереди
 * @param {number} index - Индекс операции
 */
export function removePendingOperation(index) {
    const pending = loadPendingOperations();
    pending.splice(index, 1);
    saveToStorage(STORAGE_KEYS.PENDING_OPERATIONS, pending);
}

/**
 * Очищает все ожидающие операции
 */
export function clearPendingOperations() {
    removeFromStorage(STORAGE_KEYS.PENDING_OPERATIONS);
}

/**
 * Сохраняет метку времени последней синхронизации
 */
export function saveLastSyncTimestamp() {
    saveToStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
}

/**
 * Загружает метку времени последней синхронизации
 * @returns {number|null} Timestamp или null
 */
export function loadLastSyncTimestamp() {
    return loadFromStorage(STORAGE_KEYS.LAST_SYNC, null);
}

/**
 * Очищает все данные хранилища
 */
export function clearAllStorage() {
    Object.values(STORAGE_KEYS).forEach(key => {
        removeFromStorage(key);
    });
}

/**
 * Проверяет, доступен ли localStorage
 * @returns {boolean} true, если доступен
 */
export function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

