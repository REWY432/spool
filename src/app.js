/**
 * Главный файл приложения Spool Manager
 * @module app
 */

// Импорты конфигурации
import { DEFAULT_PREFIX, DEFAULT_WIRE_TYPE, DEFAULT_ITEMS_PER_PAGE, MONTHS } from './config/constants.js';

// Импорты сервисов
import { 
    initFirebase, 
    subscribeToSpools, 
    subscribeToSettings, 
    saveSpoolRecord, 
    deleteSpoolRecord,
    bulkUpdateSpoolRecords,
    bulkDeleteSpoolRecords,
    saveSettings as saveSettingsToFirebase,
    isFirebaseReady
} from './services/firebase.js';
import { handleFirestoreError, setupGlobalErrorHandler } from './services/errorHandler.js';
import { 
    applyOptimisticUpdate, 
    rollbackUpdate, 
    confirmUpdate,
    applyOptimisticCreate,
    rollbackCreate,
    updateItemId
} from './services/optimisticUpdates.js';
import { saveTheme, loadTheme, saveSettingsCache, loadSettingsCache } from './services/storage.js';
import { processPendingOperations, queueOperation, OperationType } from './services/offlineQueue.js';

// Импорты утилит
import { getWireType } from './utils/wireType.js';
import { validateRecord, getFirstError } from './utils/validation.js';
import { applyFilters, getCurrentFilters } from './utils/filters.js';
import { applySort, updateSortUI } from './utils/sort.js';
import { paginate, updatePaginationUI } from './utils/pagination.js';
import { generateSerial, hasDuplicateSerial, hasDuplicateSeq, findDuplicateInRange } from './utils/serial.js';
import { isItemNew, formatProductionDate, getCurrentDateValues } from './utils/date.js';
import { escapeHtml } from './utils/sanitize.js';
import { loadChartJS, loadQRCode, loadHtml5QRCode, loadJsPDF, loadHtml2Canvas, loadJsBarcode } from './utils/dynamicImport.js';

// Импорты компонентов
import { renderTableRow } from './components/Table/renderRow.js';
import { shouldVirtualize } from './components/Table/virtualizedTable.js';

// Глобальное состояние
window.localDB = [];
window.appSettings = {
    models: [
        { year: "2024", ean: "2000000010632" },
        { year: "2025", ean: "2000000040783" }
    ]
};
window.shipmentBuffer = [];
window.pendingImportData = [];

// Локальное состояние
let isLoading = true;
let currentPage = 1;
let itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
let selectedIds = new Set();
let renderTimer = null;
let modelPieInstance = null;
let currentSort = { field: 'globalSeq', direction: 'desc' };
let offcanvasInstance = null;
let qrScanner = null;
let isAutoSerialEnabled = true;
let unsubscribeSpools = null;
let unsubscribeSettings = null;
let isOnline = navigator.onLine;

// --- УТИЛИТЫ ---

/**
 * Показывает toast уведомление
 * @param {string} msg - Сообщение
 * @param {string} type - Тип: 'success', 'error', 'warning', 'info'
 */
function showToast(msg, type = 'success') {
    const bg = type === 'error' ? 'bg-danger' : (type === 'warning' ? 'bg-warning text-dark' : type === 'info' ? 'bg-info' : 'bg-success');
    const el = document.createElement('div');
    el.className = `toast show align-items-center ${type === 'error' || type === 'success' || type === 'info' ? 'text-white' : ''} ${bg} border-0 shadow`;
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapeHtml(msg)}</div>
            <button class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    const container = document.getElementById('toastContainer');
    if (container) {
        container.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
}
window.showToast = showToast;

/**
 * Обновляет статус подключения
 * @param {boolean} online - Онлайн ли
 */
function updateConnectionStatus(online) {
    isOnline = online;
    const el = document.getElementById('connectionStatus');
    if (el) {
        el.innerHTML = online 
            ? '<span class="text-success fw-bold"><i class="fas fa-check-circle me-1"></i>Online</span>' 
            : '<span class="text-danger"><i class="fas fa-exclamation-circle me-1"></i>Offline</span>';
    }
    
    // Если вернулись онлайн, обрабатываем очередь
    if (online) {
        processPendingOperations(showToast).catch(err => {
            console.error('Failed to process pending operations:', err);
        });
    }
}
window.updateConnectionStatus = updateConnectionStatus;

// Обработчики онлайн/оффлайн
window.addEventListener('online', () => {
    updateConnectionStatus(true);
    showToast('Подключение восстановлено', 'success');
});

window.addEventListener('offline', () => {
    updateConnectionStatus(false);
    showToast('Нет подключения к интернету. Работа в offline режиме.', 'warning');
});

// --- РЕНДЕРИНГ ТАБЛИЦЫ ---

/**
 * Получает данные для текущей страницы
 * @returns {Array<Object>} Массив данных страницы
 */
function getPageData() {
    const filters = getCurrentFilters();
    const filtered = applyFilters(window.localDB, filters);
    const sorted = applySort(filtered, currentSort);
    const result = paginate(sorted, currentPage, itemsPerPage);
    
    // Обновляем текущую страницу, если она была невалидной
    if (result.currentPage !== currentPage) {
        currentPage = result.currentPage;
    }
    
    return result.data;
}

/**
 * Рендерит таблицу
 */
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    if (isLoading) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center">Загрузка...</td></tr>';
        return;
    }
    
    const pageData = getPageData();
    const filters = getCurrentFilters();
    const filtered = applyFilters(window.localDB, filters);
    const sorted = applySort(filtered, currentSort);
    const paginationResult = paginate(sorted, currentPage, itemsPerPage);
    
    currentPage = paginationResult.currentPage;
    
    // Обновляем UI
    updateSortUI(currentSort);
    updatePaginationUI(currentPage, paginationResult.totalPages);
    updateSelectionUI(pageData);
    
    // Проверяем, нужна ли виртуализация
    const needsVirtualization = shouldVirtualize(window.localDB.length, 100);
    
    if (needsVirtualization && window.innerWidth > 991) {
        // Для больших списков можно использовать виртуализацию
        // Пока используем обычный рендеринг, но можно улучшить
    }
    
    // Рендерим строки
    const rowsHTML = pageData.map(item => {
        const isChecked = selectedIds.has(item.id);
        const isNew = isItemNew(item);
        return renderTableRow(item, isChecked, isNew);
    });
    
    tbody.innerHTML = rowsHTML.join('');
    
    // Добавляем обработчики свайпа для мобильных
    addSwipeListeners();
    
    // Обновляем панель массовых действий
    updateBulkActionsPanel();
    
    // Обновляем пустое состояние
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.classList.toggle('d-none', pageData.length > 0);
    }
    
    // Обновляем графики
    updateCharts();
}
window.renderTable = renderTable;

/**
 * Дебаунсированная версия renderTable
 */
function debouncedRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderTable, 300);
}
window.debouncedRender = debouncedRender;

/**
 * Обновляет UI выбора
 * @param {Array<Object>} pageData - Данные страницы
 */
function updateSelectionUI(pageData) {
    const selectAllBox = document.getElementById('selectAll');
    if (!selectAllBox) return;
    
    if (pageData.length > 0) {
        const allSelected = pageData.every(item => selectedIds.has(item.id));
        selectAllBox.checked = allSelected;
        selectAllBox.indeterminate = !allSelected && pageData.some(item => selectedIds.has(item.id));
    } else {
        selectAllBox.checked = false;
        selectAllBox.indeterminate = false;
    }
}

/**
 * Обновляет панель массовых действий
 */
function updateBulkActionsPanel() {
    const bulkPanel = document.getElementById('bulkActionsPanel');
    const selectedCount = document.getElementById('selectedCount');
    
    if (bulkPanel && selectedCount) {
        if (selectedIds.size > 0) {
            bulkPanel.classList.add('visible');
            selectedCount.innerText = selectedIds.size;
        } else {
            bulkPanel.classList.remove('visible');
        }
    }
}

// --- ОБРАБОТКА СОРТИРОВКИ ---

/**
 * Обрабатывает сортировку
 * @param {string} field - Поле для сортировки
 */
function handleSort(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    renderTable();
}
window.handleSort = handleSort;

// --- ПАГИНАЦИЯ ---

/**
 * Изменяет размер страницы
 * @param {string|number} val - Количество элементов на странице
 */
function changePageSize(val) {
    itemsPerPage = parseInt(val);
    currentPage = 1;
    renderTable();
}
window.changePageSize = changePageSize;

/**
 * Изменяет страницу
 * @param {number} delta - Изменение страницы (-1 или 1)
 */
function changePage(delta) {
    const filters = getCurrentFilters();
    const filtered = applyFilters(window.localDB, filters);
    const sorted = applySort(filtered, currentSort);
    const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
    
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
    }
}
window.changePage = changePage;

// --- ВЫБОР ЭЛЕМЕНТОВ ---

/**
 * Переключает выбор элемента
 * @param {string} id - ID элемента
 */
function toggleSelect(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    renderTable();
}
window.toggleSelect = toggleSelect;

/**
 * Переключает выбор всех элементов на странице
 */
function toggleSelectAll() {
    const checkbox = document.getElementById('selectAll');
    if (!checkbox) return;
    
    const isChecked = checkbox.checked;
    const pageData = getPageData();
    
    pageData.forEach(item => {
        if (isChecked) {
            selectedIds.add(item.id);
        } else {
            selectedIds.delete(item.id);
        }
    });
    
    renderTable();
}
window.toggleSelectAll = toggleSelectAll;

/**
 * Очищает выбор
 */
function clearSelection() {
    selectedIds.clear();
    renderTable();
}
window.clearSelection = clearSelection;

// --- ОБНОВЛЕНИЕ СЧЕТЧИКОВ ---

/**
 * Обновляет счетчики в статистике
 */
function updateCounts() {
    const totalEl = document.getElementById('totalCount');
    const stdEl = document.getElementById('stdCount');
    const uEl = document.getElementById('uCount');
    
    if (totalEl) {
        totalEl.innerText = window.localDB.length;
    }
    
    const stdCount = window.localDB.filter(x => getWireType(x) === 'Китайский').length;
    const uCount = window.localDB.filter(x => getWireType(x) === 'Favero').length;
    
    if (stdEl) {
        stdEl.innerText = stdCount;
    }
    
    if (uEl) {
        uEl.innerText = uCount;
    }
}
window.updateCounts = updateCounts;

// --- МОБИЛЬНЫЙ СВАЙП ---

/**
 * Добавляет обработчики свайпа для мобильных устройств
 */
function addSwipeListeners() {
    if (window.innerWidth > 991) return;
    
    const rows = document.querySelectorAll('.table tr');
    
    rows.forEach(row => {
        let startX, currentX;
        const content = row.querySelectorAll('.mobile-row-content');
        
        row.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        row.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            if (diff < 0 && diff > -160) {
                content.forEach(el => {
                    el.style.transform = `translateX(${diff}px)`;
                });
            }
        }, { passive: true });
        
        row.addEventListener('touchend', () => {
            const diff = currentX - startX;
            if (diff < -70) {
                content.forEach(el => {
                    el.style.transform = 'translateX(-140px)';
                });
                row.classList.add('swiped');
            } else {
                content.forEach(el => {
                    el.style.transform = 'translateX(0)';
                });
                row.classList.remove('swiped');
            }
        });
    });
}

// --- ИНИЦИАЛИЗАЦИЯ ---

/**
 * Инициализирует приложение
 */
async function initApp() {
    try {
        // Инициализация Firebase
        await initFirebase();
        updateConnectionStatus(true);
        
        // Настройка глобального обработчика ошибок
        setupGlobalErrorHandler(showToast);
        
        // Загрузка темы
        const savedTheme = loadTheme();
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Подписка на данные
        unsubscribeSpools = subscribeToSpools(
            (data) => {
                window.localDB = data;
                isLoading = false;
                renderTable();
                updateCounts();
            },
            (error) => {
                handleFirestoreError(error, 'При загрузке данных', showToast);
            }
        );
        
        // Подписка на настройки
        unsubscribeSettings = subscribeToSettings((settings) => {
            window.appSettings = settings;
            updateDropdowns();
        });
        
        // Инициализация генератора серийных номеров
        const { initSerialGenerator } = await import('./app-form.js');
        initSerialGenerator();
        
        // Инициализация горячих клавиш
        initKeyboardShortcuts();
        
        // Очистка панели массовых действий
        document.getElementById('bulkActionsPanel')?.classList.remove('visible');
        selectedIds.clear();
        
    } catch (e) {
        console.error("Init Error:", e);
        updateConnectionStatus(false);
        showToast('Ошибка инициализации: ' + e.message, 'error');
    }
}

/**
 * Инициализирует горячие клавиши
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'n' || e.key === 'N') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            window.openCreate();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchSerial')?.focus();
        }
    });
}

/**
 * Обновляет выпадающие списки моделей
 */
function updateDropdowns() {
    const models = window.appSettings.models || [];
    const options = models.map(m => `<option value="${m.year}">${m.year}</option>`).join('');
    
    const selects = ['spoolModel', 'baSpoolModel'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const currentVal = el.value;
            el.innerHTML = options;
            if (currentVal && models.some(m => m.year === currentVal)) {
                el.value = currentVal;
            }
        }
    });
    
    const bulkModelEl = document.getElementById('bulkSpoolModel');
    if (bulkModelEl) {
        bulkModelEl.innerHTML = '<option value="">(Не менять)</option>' + options;
    }
    
    if (window.handleWireChange) {
        window.handleWireChange('standard');
    }
    
    const monthSelects = ['prodMonth', 'baMonth'];
    monthSelects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = MONTHS.map((m, i) => `<option value="${i+1}">${m}</option>`).join('');
        }
    });
}
window.updateDropdowns = updateDropdowns;

/**
 * Переключает тему
 */
function toggleTheme() {
    const h = document.documentElement;
    const next = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    h.setAttribute('data-theme', next);
    saveTheme(next);
    
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    if (window.updateCharts) {
        window.updateCharts();
    }
}
window.toggleTheme = toggleTheme;

/**
 * Очищает локальные данные
 */
function clearLocalData() {
    localStorage.clear();
    location.reload();
}
window.clearLocalData = clearLocalData;

/**
 * Переключает вкладку
 * @param {string} tabName - Имя вкладки
 */
function switchTab(tabName) {
    document.querySelectorAll('.nav-item-mobile').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const navBtn = document.getElementById(`nav-${tabName === 'inventory' ? 'inv' : 'stat'}`);
    if (navBtn) {
        navBtn.classList.add('active');
    }
    
    // Bootstrap tab switching
    const tabElement = document.querySelector(`[data-bs-target="#${tabName}"]`);
    if (tabElement && window.bootstrap) {
        const tab = new window.bootstrap.Tab(tabElement);
        tab.show();
    }
}
window.switchTab = switchTab;

// Импортируем остальные модули
import './app-form.js';
import './app-charts.js';
import './app-print.js';
import './app-bulk.js';
import './app-import.js';
import './app-shipment.js';
import './app-scanner.js';
import './app-settings.js';

// Запуск приложения
initApp();

// Экспорт для использования в других модулях
export { showToast };

