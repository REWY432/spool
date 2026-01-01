/**
 * Утилиты для работы с серийными номерами
 * @module utils/serial
 */

import { WIRE_TYPES } from '../config/constants.js';

/**
 * Генерирует серийный номер на основе префикса, типа провода и номера
 * @param {string} prefix - Префикс серийного номера
 * @param {string} wireType - Тип провода
 * @param {number} seq - Сквозной номер
 * @returns {string} Сгенерированный серийный номер
 */
export function generateSerial(prefix, wireType, seq) {
    let effectivePrefix = prefix;
    
    if (wireType === WIRE_TYPES.FAVERO) {
        const lastDotIndex = effectivePrefix.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            effectivePrefix = effectivePrefix.slice(0, lastDotIndex) + 'У' + effectivePrefix.slice(lastDotIndex);
        } else {
            effectivePrefix += 'У';
        }
    }
    
    return `${effectivePrefix}${seq}`;
}

/**
 * Проверяет, существует ли серийный номер в базе данных
 * @param {string} serial - Серийный номер для проверки
 * @param {Array<Object>} database - База данных
 * @param {string} [excludeId] - ID записи, которую исключить из проверки
 * @returns {boolean} true, если серийный номер уже существует
 */
export function hasDuplicateSerial(serial, database, excludeId = null) {
    return database.some(item => 
        item.serial === serial && item.id !== excludeId
    );
}

/**
 * Проверяет, существует ли сквозной номер в базе данных
 * @param {number} globalSeq - Сквозной номер для проверки
 * @param {Array<Object>} database - База данных
 * @param {string} [excludeId] - ID записи, которую исключить из проверки
 * @returns {boolean} true, если сквозной номер уже существует
 */
export function hasDuplicateSeq(globalSeq, database, excludeId = null) {
    return database.some(item => 
        item.globalSeq === globalSeq && item.id !== excludeId
    );
}

/**
 * Проверяет диапазон сквозных номеров на дубликаты
 * @param {number} startSeq - Начальный номер
 * @param {number} count - Количество номеров
 * @param {Array<Object>} database - База данных
 * @returns {number|null} Первый найденный дубликат или null
 */
export function findDuplicateInRange(startSeq, count, database) {
    for (let i = 0; i < count; i++) {
        const checkSeq = startSeq + i;
        if (hasDuplicateSeq(checkSeq, database)) {
            return checkSeq;
        }
    }
    return null;
}

