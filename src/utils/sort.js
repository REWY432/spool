/**
 * Утилиты для сортировки данных
 * @module utils/sort
 */

import { getWireType } from './wireType.js';

/**
 * Получает значение для сортировки из элемента
 * @param {Object} item - Элемент данных
 * @param {string} field - Поле для сортировки
 * @returns {*} Значение для сравнения
 */
function getSortValue(item, field) {
    switch(field) {
        case 'serial':
            return item.serial.toLowerCase();
        case 'wireType':
            return getWireType(item).toLowerCase();
        case 'spoolModel':
            return item.spoolModel || "0";
        case 'globalSeq':
            return item.globalSeq || 0;
        default:
            return 0;
    }
}

/**
 * Применяет сортировку к данным
 * @param {Array<Object>} data - Массив данных для сортировки
 * @param {Object} sortConfig - Конфигурация сортировки
 * @param {string} sortConfig.field - Поле для сортировки
 * @param {string} sortConfig.direction - Направление: 'asc' или 'desc'
 * @returns {Array<Object>} Отсортированные данные (новый массив)
 */
export function applySort(data, sortConfig) {
    return [...data].sort((a, b) => {
        const valA = getSortValue(a, sortConfig.field);
        const valB = getSortValue(b, sortConfig.field);
        
        if (valA < valB) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

/**
 * Обновляет UI индикаторов сортировки
 * @param {Object} sortConfig - Конфигурация сортировки
 */
export function updateSortUI(sortConfig) {
    // Сбрасываем все индикаторы
    document.querySelectorAll('th.sortable i').forEach(i => {
        i.className = 'fas fa-sort small';
    });
    
    // Устанавливаем активный индикатор
    const activeHeader = document.querySelector(`th[onclick*="handleSort('${sortConfig.field}')"]`);
    if (activeHeader) {
        const icon = activeHeader.querySelector('i');
        if (icon) {
            icon.className = sortConfig.direction === 'asc' 
                ? 'fas fa-sort-up text-primary' 
                : 'fas fa-sort-down text-primary';
            activeHeader.classList.add('active');
        }
    }
}

