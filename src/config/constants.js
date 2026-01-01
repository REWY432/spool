/**
 * Константы приложения
 * @module config/constants
 */

/** @type {string} Префикс серийного номера по умолчанию */
export const DEFAULT_PREFIX = "M3/2023.";

/** @type {string} Тип провода по умолчанию */
export const DEFAULT_WIRE_TYPE = "Китайский";

/** @type {number} Количество элементов на странице по умолчанию */
export const DEFAULT_ITEMS_PER_PAGE = 10;

/** @type {number} Максимальное количество элементов при массовом добавлении */
export const MAX_BULK_ADD = 100;

/** @type {Object<string, string>} Типы проводов */
export const WIRE_TYPES = {
    CHINESE: "Китайский",
    FAVERO: "Favero"
};

/** @type {string[]} Названия месяцев */
export const MONTHS = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

/** @type {Object} Конфигурация Firebase */
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBH0rLK0bi0zSkjI7fEhUCXoQfphRr-_Xg",
    authDomain: "reels4f.firebaseapp.com",
    projectId: "reels4f",
    storageBucket: "reels4f.firebasestorage.app",
    messagingSenderId: "646479694296",
    appId: "1:646479694296:web:160adcb14d32c6f8a20aad",
    measurementId: "G-M4YN1LGVNR"
};

/** @type {number} Количество попыток при retry */
export const MAX_RETRIES = 3;

/** @type {number} Задержка между попытками (мс) */
export const RETRY_DELAY = 1000;

