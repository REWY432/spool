/**
 * Утилиты для работы с датами
 * @module utils/date
 */

import { MONTHS } from '../config/constants.js';

/**
 * Проверяет, была ли запись создана сегодня
 * @param {Object} item - Объект записи
 * @param {Object|Date} [item.createdAt] - Дата создания
 * @returns {boolean} true, если запись создана сегодня
 */
export function isItemNew(item) {
    if (!item.createdAt) return false;
    
    const todayStr = new Date().toDateString();
    const itemDate = item.createdAt.toDate 
        ? item.createdAt.toDate() 
        : new Date(item.createdAt);
    
    return itemDate.toDateString() === todayStr;
}

/**
 * Форматирует дату изготовления в строку
 * @param {Object} item - Объект записи
 * @param {number} [item.month] - Месяц (1-12)
 * @param {number} [item.year] - Год
 * @returns {string} Отформатированная дата
 */
export function formatProductionDate(item) {
    const month = item.month || 1;
    const year = item.year || new Date().getFullYear();
    const monthName = MONTHS[month - 1] || MONTHS[0];
    return `${monthName} ${year}`;
}

/**
 * Получает текущие значения месяца и года
 * @returns {{month: number, year: number}} Объект с месяцем и годом
 */
export function getCurrentDateValues() {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        year: now.getFullYear()
    };
}

