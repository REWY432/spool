# Конкретные примеры улучшений кода

## 1. Утилита для определения типа провода

**Проблема:** Логика определения типа провода дублируется в 10+ местах

**Текущий код:**
```javascript
const wire = item.wireType || (item.model && item.model.includes('У') ? 'Favero' : 'Китайский');
```

**Улучшенный код:**
```javascript
// utils/wireType.js
export function getWireType(item) {
    if (item.wireType) {
        // Нормализация старых значений
        if (item.wireType === "Стандарт") return "Китайский";
        if (item.wireType === "У") return "Favero";
        return item.wireType;
    }
    
    if (item.model?.includes('У')) return 'Favero';
    return 'Китайский';
}

export function normalizeWireType(wireType) {
    const map = {
        "Стандарт": "Китайский",
        "У": "Favero"
    };
    return map[wireType] || wireType;
}
```

## 2. Рефакторинг функции renderTable

**Проблема:** Функция делает слишком много (200+ строк)

**Текущий код:**
```javascript
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if(isLoading) { tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center">Загрузка...</td></tr>'; return; }

    const pageData = getPageData();
    // ... 150+ строк кода
}
```

**Улучшенный код:**
```javascript
// utils/filters.js
export function applyFilters(data, filters) {
    return data.filter(item => {
        const matchesSearch = !filters.search || 
            item.serial.toLowerCase().includes(filters.search) ||
            (item.notes || "").toLowerCase().includes(filters.search);
        
        const matchesModel = !filters.model || getWireType(item) === filters.model;
        
        const matchesCRM = filters.crm === "" || 
            (filters.crm === '1' ? !!item.isInCRM : !item.isInCRM);
        
        return matchesSearch && matchesModel && matchesCRM;
    });
}

// utils/sort.js
export function applySort(data, sortConfig) {
    return [...data].sort((a, b) => {
        let valA = getSortValue(a, sortConfig.field);
        let valB = getSortValue(b, sortConfig.field);
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function getSortValue(item, field) {
    switch(field) {
        case 'serial': return item.serial.toLowerCase();
        case 'wireType': return getWireType(item).toLowerCase();
        case 'spoolModel': return item.spoolModel || "0";
        case 'globalSeq': return item.globalSeq || 0;
        default: return 0;
    }
}

// utils/pagination.js
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

// components/Table/renderRow.js
export function renderTableRow(item, isChecked, isNew) {
    const wire = getWireType(item);
    const modelColor = wire === 'Favero' ? 'secondary' : 'primary';
    const crmIcon = item.isInCRM 
        ? '<i class="fas fa-check-circle text-success"></i>' 
        : '<i class="far fa-circle text-muted opacity-50"></i>';
    
    const rowClass = [
        "fade-in-row",
        isChecked ? "bg-light" : "",
        isNew ? "row-new" : ""
    ].filter(Boolean).join(" ");
    
    const serialDisplay = isNew 
        ? `<span class="new-indicator" title="Создано сегодня"></span><span class="fw-bold font-mono text-primary">${item.serial}</span>` 
        : `<span class="fw-bold font-mono text-primary">${item.serial}</span>`;
    
    return `
        <tr id="row-${item.id}" onclick="window.openEdit('${item.id}')" class="${rowClass}">
            ${renderCheckboxCell(item.id, isChecked)}
            ${renderNumberCell(item.globalSeq)}
            ${renderSerialCell(item, serialDisplay, crmIcon, modelColor, wire)}
            ${renderWireCell(wire, modelColor)}
            ${renderModelCell(item.spoolModel)}
            ${renderNotesCell(item.notes)}
            ${renderActionsCell(item.id)}
        </tr>
    `;
}

// app.js
function renderTable() {
    const tbody = document.getElementById('tableBody');
    
    if (isLoading) {
        tbody.innerHTML = renderLoadingState();
        return;
    }
    
    const filters = getCurrentFilters();
    const filtered = applyFilters(window.localDB, filters);
    const sorted = applySort(filtered, currentSort);
    const { data: pageData, currentPage: validPage, totalPages } = paginate(sorted, currentPage, itemsPerPage);
    
    currentPage = validPage;
    updatePaginationUI(validPage, totalPages);
    updateSortUI(currentSort);
    updateSelectionUI(pageData);
    
    tbody.innerHTML = pageData.map(item => {
        const isChecked = selectedIds.has(item.id);
        const isNew = isItemNew(item);
        return renderTableRow(item, isChecked, isNew);
    }).join('');
    
    addSwipeListeners();
    updateBulkActionsPanel();
    updateCharts();
}
```

## 3. Обработка ошибок с retry

**Текущий код:**
```javascript
async function saveRecord() {
    // ...
    if(editId) { 
        updateDoc(doc(dbRef, "spools", editId), record)
            .then(() => showToast('Обновлено'))
            .catch(e => showToast('Ошибка: ' + e.message, 'error'));
    }
}
```

**Улучшенный код:**
```javascript
// utils/retry.js
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

// utils/errorHandler.js
export function handleFirestoreError(error, context = '') {
    const errorMessages = {
        'permission-denied': 'Нет доступа к операции',
        'unavailable': 'Сервис временно недоступен',
        'deadline-exceeded': 'Превышено время ожидания',
        'already-exists': 'Запись уже существует',
        'not-found': 'Запись не найдена'
    };
    
    const message = errorMessages[error.code] || error.message;
    showToast(`${context} ${message}`, 'error');
    console.error(`Firestore Error [${context}]:`, error);
}

// services/firestore.js
export async function saveSpoolRecord(record, editId = null) {
    const operation = async () => {
        if (editId) {
            return await updateDoc(doc(dbRef, "spools", editId), {
                ...record,
                updatedAt: serverTimestamp()
            });
        } else {
            return await addDoc(collection(dbRef, "spools"), {
                ...record,
                createdAt: serverTimestamp()
            });
        }
    };
    
    try {
        await retryOperation(operation);
        showToast(editId ? 'Обновлено' : 'Создано');
        return { success: true };
    } catch (error) {
        handleFirestoreError(error, editId ? 'При обновлении' : 'При создании');
        return { success: false, error };
    }
}
```

## 4. Валидация данных

**Текущий код:**
```javascript
function saveRecord() {
    const serial = document.getElementById('serialNumber').value.trim();
    if (!serial) { showToast('Введите серийный номер', 'error'); return; }
    // ...
}
```

**Улучшенный код:**
```javascript
// utils/validation.js
export const ValidationRules = {
    serial: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: /^[A-Z0-9\/\.У]+$/i,
        message: 'Серийный номер должен содержать только буквы, цифры, /, . и У'
    },
    globalSeq: {
        required: true,
        min: 1,
        max: 999999,
        message: 'Сквозной номер должен быть от 1 до 999999'
    },
    prefix: {
        required: true,
        minLength: 1,
        maxLength: 20,
        pattern: /^[A-Z0-9\/\.]+$/i
    }
};

export function validateField(value, rule) {
    const errors = [];
    
    if (rule.required && (!value || value.trim() === '')) {
        errors.push('Поле обязательно для заполнения');
    }
    
    if (value && rule.minLength && value.length < rule.minLength) {
        errors.push(`Минимальная длина: ${rule.minLength}`);
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
        errors.push(`Максимальная длина: ${rule.maxLength}`);
    }
    
    if (value && rule.min !== undefined && Number(value) < rule.min) {
        errors.push(`Минимальное значение: ${rule.min}`);
    }
    
    if (value && rule.max !== undefined && Number(value) > rule.max) {
        errors.push(`Максимальное значение: ${rule.max}`);
    }
    
    if (value && rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message || 'Неверный формат');
    }
    
    return errors;
}

export function validateRecord(record) {
    const errors = {};
    
    errors.serial = validateField(record.serial, ValidationRules.serial);
    errors.globalSeq = validateField(record.globalSeq, ValidationRules.globalSeq);
    errors.prefix = validateField(record.prefix, ValidationRules.prefix);
    
    return {
        isValid: Object.values(errors).every(err => err.length === 0),
        errors
    };
}

// Использование
function saveRecord() {
    const record = {
        serial: document.getElementById('serialNumber').value.trim(),
        globalSeq: Number(document.getElementById('globalSeq').value),
        prefix: document.getElementById('serialPrefix').value,
        // ...
    };
    
    const validation = validateRecord(record);
    if (!validation.isValid) {
        const firstError = Object.values(validation.errors)
            .flat()
            .find(err => err.length > 0);
        showToast(firstError, 'error');
        return;
    }
    
    // Проверка дубликатов
    if (hasDuplicateSerial(record.serial, record.id)) {
        showToast('Серийный номер уже существует!', 'error');
        return;
    }
    
    if (hasDuplicateSeq(record.globalSeq, record.id)) {
        showToast(`Сквозной номер #${record.globalSeq} уже занят!`, 'error');
        return;
    }
    
    saveSpoolRecord(record, record.id);
}
```

## 5. Оптимистичные обновления

**Текущий код:**
```javascript
updateDoc(doc(dbRef, "spools", editId), record)
    .then(() => showToast('Обновлено'))
    .catch(e => showToast('Ошибка: ' + e.message, 'error'));
```

**Улучшенный код:**
```javascript
// services/optimisticUpdates.js
export function optimisticUpdate(itemId, updates) {
    // Сохраняем оригинальные данные для rollback
    const originalItem = window.localDB.find(x => x.id === itemId);
    if (!originalItem) return;
    
    // Применяем обновление локально
    const index = window.localDB.findIndex(x => x.id === itemId);
    window.localDB[index] = { ...window.localDB[index], ...updates };
    
    // Обновляем UI сразу
    renderTable();
    showToast('Обновлено', 'success');
    
    // Отправляем на сервер
    updateDoc(doc(dbRef, "spools", itemId), {
        ...updates,
        updatedAt: serverTimestamp()
    }).catch(error => {
        // Rollback при ошибке
        window.localDB[index] = originalItem;
        renderTable();
        handleFirestoreError(error, 'При обновлении');
    });
}
```

## 6. Константы и конфигурация

**Текущий код:**
```javascript
document.getElementById('serialPrefix').value = "M3/2023.";
document.getElementById('wireType').value = "Китайский";
```

**Улучшенный код:**
```javascript
// config/constants.js
export const DEFAULTS = {
    SERIAL_PREFIX: "M3/2023.",
    WIRE_TYPE: "Китайский",
    ITEMS_PER_PAGE: 10,
    MAX_BULK_ADD: 100
};

export const WIRE_TYPES = {
    CHINESE: "Китайский",
    FAVERO: "Favero"
};

export const MONTHS = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

// Использование
import { DEFAULTS, WIRE_TYPES } from './config/constants.js';

document.getElementById('serialPrefix').value = DEFAULTS.SERIAL_PREFIX;
document.getElementById('wireType').value = WIRE_TYPES.CHINESE;
```

## 7. Безопасность (XSS защита)

**Текущий код:**
```javascript
el.innerHTML = `<div>${item.serial}</div>`;
```

**Улучшенный код:**
```javascript
// utils/sanitize.js
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function createElement(tag, attributes = {}, text = '') {
    const el = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        el.setAttribute(key, escapeHtml(String(value)));
    });
    if (text) el.textContent = text;
    return el;
}

// Использование
const cell = createElement('td', { 
    'data-label': 'Катушка',
    'class': 'mobile-row-content'
}, item.serial);

// Или для сложных случаев использовать DOMPurify
import DOMPurify from 'dompurify';

function safeInnerHTML(element, html) {
    element.innerHTML = DOMPurify.sanitize(html);
}
```

## 8. Мемоизация для производительности

**Текущий код:**
```javascript
function getPageData() {
    const search = (document.getElementById('searchSerial').value || "").toLowerCase();
    // ... фильтрация и сортировка каждый раз
}
```

**Улучшенный код:**
```javascript
// utils/memoize.js
export function memoize(fn, keyFn) {
    const cache = new Map();
    return function(...args) {
        const key = keyFn ? keyFn(...args) : JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}

// Использование
const memoizedFilter = memoize(
    (data, filters) => applyFilters(data, filters),
    (data, filters) => `${data.length}-${JSON.stringify(filters)}`
);

function getPageData() {
    const filters = {
        search: (document.getElementById('searchSerial').value || "").toLowerCase(),
        model: document.getElementById('filterModel').value,
        crm: document.getElementById('filterCRM').value
    };
    
    const filtered = memoizedFilter(window.localDB, filters);
    // ...
}
```

## 9. Web Worker для тяжелых операций

**Текущий код:**
```javascript
async function bulkPrintPassports() {
    // Генерация PDF блокирует UI
    for (let i = 0; i < items.length; i++) {
        // ... тяжелые операции
    }
}
```

**Улучшенный код:**
```javascript
// workers/pdfGenerator.js
self.onmessage = function(e) {
    const { items, months } = e.data;
    // Генерация PDF в отдельном потоке
    // ...
    self.postMessage({ progress: 100, pdfData: pdfBlob });
};

// app.js
async function bulkPrintPassports() {
    showToast('Генерация PDF...', 'info');
    
    const worker = new Worker('workers/pdfGenerator.js');
    
    worker.postMessage({
        items: items,
        months: MONTHS
    });
    
    worker.onmessage = function(e) {
        const { progress, pdfData } = e.data;
        updateProgressBar(progress);
        
        if (progress === 100) {
            // Открыть PDF
            const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
            const url = URL.createObjectURL(pdfBlob);
            window.open(url);
            worker.terminate();
        }
    };
}
```

---

Эти примеры показывают, как можно улучшить код, сделав его более модульным, безопасным и производительным.

