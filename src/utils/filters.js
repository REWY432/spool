/**
 * Утилиты для фильтрации данных
 * @module utils/filters
 */

import { getWireType } from './wireType.js';

/**
 * Применяет фильтры к данным
 * @param {Array<Object>} data - Массив данных для фильтрации
 * @param {Object} filters - Объект с фильтрами
 * @param {string} [filters.search] - Поисковый запрос
 * @param {string} [filters.model] - Фильтр по типу провода
 * @param {string} [filters.crm] - Фильтр по статусу CRM ("1", "0" или "")
 * @returns {Array<Object>} Отфильтрованные данные
 */
export function applyFilters(data, filters) {
    return data.filter(item => {
        // Поиск по серийному номеру и примечаниям
        const matchesSearch = !filters.search || 
            item.serial.toLowerCase().includes(filters.search) ||
            (item.notes || "").toLowerCase().includes(filters.search);
        
        // Фильтр по типу провода
        const wire = getWireType(item);
        const matchesModel = !filters.model || wire === filters.model;
        
        // Фильтр по статусу CRM
        let matchesCRM = true;
        if (filters.crm === '1') {
            matchesCRM = !!item.isInCRM;
        } else if (filters.crm === '0') {
            matchesCRM = !item.isInCRM;
        }
        
        return matchesSearch && matchesModel && matchesCRM;
    });
}

/**
 * Получает текущие фильтры из DOM
 * @returns {Object} Объект с фильтрами
 */
export function getCurrentFilters() {
    return {
        search: (document.getElementById('searchSerial')?.value || "").toLowerCase(),
        model: document.getElementById('filterModel')?.value || "",
        crm: document.getElementById('filterCRM')?.value || ""
    };
}

