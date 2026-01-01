/**
 * Виртуализированная таблица для больших списков
 * @module components/Table/virtualizedTable
 * 
 * Простая реализация виртуализации без внешних библиотек
 * Для больших объемов данных рекомендуется использовать react-window или аналоги
 */

/**
 * Создает виртуализированную таблицу
 * @param {HTMLElement} container - Контейнер для таблицы
 * @param {Array<Object>} data - Данные для отображения
 * @param {Function} renderRow - Функция для рендеринга строки
 * @param {Object} options - Опции виртуализации
 * @param {number} [options.rowHeight=60] - Высота строки в пикселях
 * @param {number} [options.visibleRows=10] - Количество видимых строк
 * @returns {Object} API для управления таблицей
 */
export function createVirtualizedTable(container, data, renderRow, options = {}) {
    const {
        rowHeight = 60,
        visibleRows = 10,
        buffer = 5
    } = options;
    
    let scrollTop = 0;
    let containerHeight = container.clientHeight;
    
    // Создаем виртуальный контейнер
    const virtualContainer = document.createElement('div');
    virtualContainer.style.position = 'relative';
    virtualContainer.style.height = `${data.length * rowHeight}px`;
    virtualContainer.style.overflow = 'hidden';
    
    // Создаем видимую область
    const visibleArea = document.createElement('div');
    visibleArea.style.position = 'absolute';
    visibleArea.style.top = '0';
    visibleArea.style.left = '0';
    visibleArea.style.right = '0';
    visibleArea.style.height = `${containerHeight}px`;
    visibleArea.style.overflow = 'auto';
    
    const tbody = document.createElement('tbody');
    visibleArea.appendChild(tbody);
    
    virtualContainer.appendChild(visibleArea);
    container.appendChild(virtualContainer);
    
    /**
     * Обновляет видимые строки
     */
    function updateVisibleRows() {
        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
        const endIndex = Math.min(
            data.length,
            Math.ceil((scrollTop + containerHeight) / rowHeight) + buffer
        );
        
        const visibleData = data.slice(startIndex, endIndex);
        
        tbody.innerHTML = visibleData.map((item, index) => {
            const actualIndex = startIndex + index;
            const row = document.createElement('tr');
            row.style.position = 'absolute';
            row.style.top = `${actualIndex * rowHeight}px`;
            row.style.height = `${rowHeight}px`;
            row.style.width = '100%';
            row.innerHTML = renderRow(item);
            return row.outerHTML;
        }).join('');
    }
    
    /**
     * Обработчик скролла
     */
    function handleScroll() {
        scrollTop = visibleArea.scrollTop;
        updateVisibleRows();
    }
    
    visibleArea.addEventListener('scroll', handleScroll);
    
    // Инициализация
    updateVisibleRows();
    
    /**
     * Обновляет данные таблицы
     * @param {Array<Object>} newData - Новые данные
     */
    function updateData(newData) {
        data = newData;
        virtualContainer.style.height = `${data.length * rowHeight}px`;
        updateVisibleRows();
    }
    
    /**
     * Обновляет размер контейнера
     */
    function updateSize() {
        containerHeight = container.clientHeight;
        visibleArea.style.height = `${containerHeight}px`;
        updateVisibleRows();
    }
    
    // Обработка изменения размера окна
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    
    return {
        updateData,
        updateSize,
        destroy: () => {
            resizeObserver.disconnect();
            visibleArea.removeEventListener('scroll', handleScroll);
            container.removeChild(virtualContainer);
        }
    };
}

/**
 * Проверяет, нужна ли виртуализация для данных
 * @param {number} dataLength - Количество элементов
 * @param {number} threshold - Порог для включения виртуализации
 * @returns {boolean} true, если нужна виртуализация
 */
export function shouldVirtualize(dataLength, threshold = 100) {
    return dataLength > threshold;
}

