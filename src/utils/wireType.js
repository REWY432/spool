/**
 * Утилиты для работы с типами проводов
 * @module utils/wireType
 */

import { WIRE_TYPES } from '../config/constants.js';

/**
 * Определяет тип провода из данных катушки
 * @param {Object} item - Объект катушки
 * @param {string} [item.wireType] - Тип провода
 * @param {string} [item.model] - Модель (может содержать 'У' для Favero)
 * @returns {string} Тип провода: "Китайский" или "Favero"
 */
export function getWireType(item) {
    if (item.wireType) {
        return normalizeWireType(item.wireType);
    }
    
    if (item.model?.includes('У')) {
        return WIRE_TYPES.FAVERO;
    }
    
    return WIRE_TYPES.CHINESE;
}

/**
 * Нормализует старые значения типов проводов
 * @param {string} wireType - Тип провода для нормализации
 * @returns {string} Нормализованный тип провода
 */
export function normalizeWireType(wireType) {
    const map = {
        "Стандарт": WIRE_TYPES.CHINESE,
        "У": WIRE_TYPES.FAVERO
    };
    return map[wireType] || wireType;
}

/**
 * Проверяет, является ли тип провода Favero
 * @param {string} wireType - Тип провода
 * @returns {boolean}
 */
export function isFavero(wireType) {
    return normalizeWireType(wireType) === WIRE_TYPES.FAVERO;
}

/**
 * Проверяет, является ли тип провода Китайским
 * @param {string} wireType - Тип провода
 * @returns {boolean}
 */
export function isChinese(wireType) {
    return normalizeWireType(wireType) === WIRE_TYPES.CHINESE;
}

