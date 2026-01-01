/**
 * Утилиты для санитизации данных (защита от XSS)
 * @module utils/sanitize
 */

/**
 * Экранирует HTML символы в тексте
 * @param {string} text - Текст для экранирования
 * @returns {string} Экранированный текст
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') {
        return String(text);
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Создает DOM элемент безопасным способом
 * @param {string} tag - Тег элемента
 * @param {Object} attributes - Атрибуты элемента
 * @param {string} text - Текстовое содержимое
 * @returns {HTMLElement} Созданный элемент
 */
export function createElement(tag, attributes = {}, text = '') {
    const el = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class') {
            el.className = escapeHtml(String(value));
        } else if (key.startsWith('data-')) {
            el.setAttribute(key, escapeHtml(String(value)));
        } else {
            el.setAttribute(key, escapeHtml(String(value)));
        }
    });
    
    if (text) {
        el.textContent = text;
    }
    
    return el;
}

/**
 * Безопасно устанавливает innerHTML (требует DOMPurify)
 * @param {HTMLElement} element - Элемент
 * @param {string} html - HTML содержимое
 */
export function safeSetInnerHTML(element, html) {
    // Если DOMPurify доступен, используем его
    if (window.DOMPurify) {
        element.innerHTML = window.DOMPurify.sanitize(html);
    } else {
        // Fallback: используем textContent для безопасности
        console.warn('DOMPurify не загружен, используем textContent');
        element.textContent = html.replace(/<[^>]*>/g, '');
    }
}

