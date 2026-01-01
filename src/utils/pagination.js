/**
 * Утилиты для пагинации
 * @module utils/pagination
 */

/**
 * Применяет пагинацию к данным
 * @param {Array<Object>} data - Массив данных
 * @param {number} page - Номер страницы (начиная с 1)
 * @param {number} itemsPerPage - Количество элементов на странице
 * @returns {{data: Array<Object>, currentPage: number, totalPages: number, totalItems: number}} Результат пагинации
 */
export function paginate(data, page, itemsPerPage) {
    const totalPages = Math.ceil(data.length / itemsPerPage) || 1;
    const validPage = Math.max(1, Math.min(page, totalPages));
    const start = (validPage - 1) * itemsPerPage;
    
    return {
        data: data.slice(start, start + itemsPerPage),
        currentPage: validPage,
        totalPages,
        totalItems: data.length
    };
}

/**
 * Обновляет UI пагинации
 * @param {number} currentPage - Текущая страница
 * @param {number} totalPages - Всего страниц
 */
export function updatePaginationUI(currentPage, totalPages) {
    const pageNumberDisplay = document.getElementById('pageNumberDisplay');
    const pageInfoDesktop = document.getElementById('pageInfoDesktop');
    
    if (pageNumberDisplay) {
        pageNumberDisplay.innerText = currentPage;
    }
    
    if (pageInfoDesktop) {
        pageInfoDesktop.innerText = `Стр. ${currentPage}`;
    }
}

