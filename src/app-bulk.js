/**
 * Модуль для массовых операций (добавление, редактирование, удаление)
 * @module app-bulk
 */

import { DEFAULT_PREFIX, DEFAULT_WIRE_TYPE, MAX_BULK_ADD } from './config/constants.js';
import { generateSerial, findDuplicateInRange } from './utils/serial.js';
import { getCurrentDateValues } from './utils/date.js';
import { saveSpoolRecord, bulkUpdateSpoolRecords, bulkDeleteSpoolRecords, deleteSpoolRecord } from './services/firebase.js';
import { escapeHtml } from './utils/sanitize.js';

const showToast = (msg, type) => {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}] ${msg}`);
    }
};

/**
 * Открывает модальное окно массового добавления
 */
function openBulkAdd() {
    const form = document.getElementById('bulkAddForm');
    if (form) {
        form.reset();
    }
    
    if (window.updateDropdowns) {
        window.updateDropdowns();
    }
    
    if (window.handleWireChange) {
        window.handleWireChange('bulkAdd');
    }
    
    // Сброс прогресс-бара
    const container = document.getElementById('baProgressContainer');
    const bar = document.getElementById('baProgressBar');
    const text = document.getElementById('baProgressText');
    const submitBtn = document.getElementById('baSubmitBtn');
    const cancelBtn = document.getElementById('baCancelBtn');
    
    if (container) container.style.display = 'none';
    if (bar) bar.style.width = '0%';
    if (text) text.innerText = '0%';
    if (submitBtn) submitBtn.disabled = false;
    if (cancelBtn) cancelBtn.disabled = false;
    
    const { month, year } = getCurrentDateValues();
    const monthEl = document.getElementById('baMonth');
    const yearEl = document.getElementById('baYear');
    
    if (monthEl) monthEl.value = month;
    if (yearEl) yearEl.value = year;
    
    const prefixEl = document.getElementById('baPrefix');
    if (prefixEl) prefixEl.value = DEFAULT_PREFIX;
    
    if (window.bootstrap) {
        const modal = new window.bootstrap.Modal(document.getElementById('bulkAddModal'));
        modal.show();
    }
}
window.openBulkAdd = openBulkAdd;

/**
 * Выполняет массовое добавление записей
 */
async function executeBulkAdd() {
    const countInput = document.getElementById('baCount');
    const prefixInput = document.getElementById('baPrefix');
    const startNumInput = document.getElementById('baStartNum');
    const wireInput = document.getElementById('baWireType');
    const modelInput = document.getElementById('baSpoolModel');
    const monthInput = document.getElementById('baMonth');
    const yearInput = document.getElementById('baYear');
    
    if (!countInput || !prefixInput || !wireInput || !modelInput) {
        showToast('Ошибка: не найдены необходимые поля формы', 'error');
        return;
    }
    
    const count = Math.min(parseInt(countInput.value) || 1, MAX_BULK_ADD);
    const prefixRaw = prefixInput.value.trim() || DEFAULT_PREFIX;
    const startNum = parseInt(startNumInput?.value);
    const wire = wireInput.value || DEFAULT_WIRE_TYPE;
    const sModel = modelInput.value;
    const bMonth = parseInt(monthInput?.value) || getCurrentDateValues().month;
    const bYear = parseInt(yearInput?.value) || getCurrentDateValues().year;
    
    let startSeq = (!isNaN(startNum) && startNum > 0) ? startNum : 1;
    
    // Проверка диапазона на дубликаты
    const duplicate = findDuplicateInRange(startSeq, count, window.localDB);
    if (duplicate) {
        showToast(`Ошибка: Номер #${duplicate} уже занят. Выберите другой диапазон.`, 'error');
        return;
    }
    
    // Показываем прогресс-бар
    const container = document.getElementById('baProgressContainer');
    const bar = document.getElementById('baProgressBar');
    const text = document.getElementById('baProgressText');
    const submitBtn = document.getElementById('baSubmitBtn');
    const cancelBtn = document.getElementById('baCancelBtn');
    
    if (container) container.style.display = 'block';
    if (submitBtn) submitBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    
    let currentSeq = startSeq;
    let createdCount = 0;
    const errors = [];
    
    for (let i = 0; i < count; i++) {
        try {
            const serial = generateSerial(prefixRaw, wire, currentSeq);
            const record = {
                serial: serial,
                globalSeq: currentSeq,
                prefix: prefixRaw,
                wireType: wire,
                spoolModel: sModel,
                month: bMonth,
                year: bYear,
                notes: "Массовое добавление",
                isInCRM: false
            };
            
            const result = await saveSpoolRecord(record, null, null);
            if (result.success) {
                createdCount++;
            } else {
                errors.push({ seq: currentSeq, error: result.error });
            }
        } catch (error) {
            errors.push({ seq: currentSeq, error });
        }
        
        currentSeq++;
        
        // Обновляем прогресс
        if (bar && text) {
            const percent = Math.round((createdCount / count) * 100);
            bar.style.width = `${percent}%`;
            text.innerText = `${percent}%`;
        }
    }
    
    // Восстанавливаем кнопки
    if (submitBtn) submitBtn.disabled = false;
    if (cancelBtn) cancelBtn.disabled = false;
    
    // Закрываем модальное окно
    if (window.bootstrap) {
        const modal = window.bootstrap.Modal.getInstance(document.getElementById('bulkAddModal'));
        if (modal) {
            setTimeout(() => {
                modal.hide();
                showToast(`Добавлено: ${createdCount} из ${count} шт.`);
                if (errors.length > 0) {
                    console.error('Ошибки при массовом добавлении:', errors);
                }
            }, 300);
        }
    }
}
window.executeBulkAdd = executeBulkAdd;

/**
 * Открывает модальное окно массового редактирования
 */
function openBulkEdit() {
    if (!window.selectedIds || window.selectedIds.size === 0) {
        showToast('Выберите хотя бы одну запись', 'warning');
        return;
    }
    
    if (window.selectedIds.size === 1) {
        // Если выбрана одна запись, открываем обычное редактирование
        if (window.openEdit) {
            window.openEdit(Array.from(window.selectedIds)[0]);
        }
        return;
    }
    
    const countDisplay = document.getElementById('bulkCountDisplay');
    if (countDisplay) {
        countDisplay.innerText = window.selectedIds.size;
    }
    
    const form = document.getElementById('bulkEditForm');
    if (form) {
        form.reset();
    }
    
    const modelEl = document.getElementById('bulkSpoolModel');
    if (modelEl) {
        modelEl.disabled = true;
    }
    
    if (window.updateDropdowns) {
        window.updateDropdowns();
    }
    
    if (window.bootstrap) {
        const modal = new window.bootstrap.Modal(document.getElementById('bulkEditModal'));
        modal.show();
    }
}
window.openBulkEdit = openBulkEdit;

/**
 * Применяет массовое редактирование
 */
async function submitBulkEdit() {
    if (!window.selectedIds || window.selectedIds.size === 0) {
        return;
    }
    
    const wireEl = document.getElementById('bulkWireType');
    const modelEl = document.getElementById('bulkSpoolModel');
    const crmEl = document.getElementById('bulkCRMSelect');
    
    const updates = {};
    
    if (wireEl && wireEl.value) {
        updates.wireType = wireEl.value;
    }
    
    if (modelEl && modelEl.value) {
        updates.spoolModel = modelEl.value;
    }
    
    if (crmEl && crmEl.value !== "") {
        updates.isInCRM = (crmEl.value === '1');
    }
    
    if (Object.keys(updates).length === 0) {
        if (window.bootstrap) {
            const modal = window.bootstrap.Modal.getInstance(document.getElementById('bulkEditModal'));
            if (modal) modal.hide();
        }
        return;
    }
    
    const ids = Array.from(window.selectedIds);
    const result = await bulkUpdateSpoolRecords(ids, updates, showToast);
    
    if (window.bootstrap) {
        const modal = window.bootstrap.Modal.getInstance(document.getElementById('bulkEditModal'));
        if (modal) modal.hide();
    }
    
    if (result.success && window.clearSelection) {
        window.clearSelection();
    }
}
window.submitBulkEdit = submitBulkEdit;

/**
 * Подтверждает массовое удаление
 */
function bulkDeleteConfirm() {
    if (!window.selectedIds || window.selectedIds.size === 0) {
        return;
    }
    
    const titleEl = document.getElementById('deleteTitle');
    if (titleEl) {
        titleEl.innerText = `Удалить ${window.selectedIds.size} шт?`;
    }
    
    window.isBulkDelete = true;
    
    if (window.bootstrap) {
        const modal = new window.bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }
}
window.bulkDeleteConfirm = bulkDeleteConfirm;

/**
 * Выполняет удаление (одиночное или массовое)
 */
async function executeDelete() {
    const modalEl = document.getElementById('deleteModal');
    if (window.bootstrap && modalEl) {
        const modal = window.bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
    
    if (window.isBulkDelete && window.selectedIds && window.selectedIds.size > 0) {
        const ids = Array.from(window.selectedIds);
        const result = await bulkDeleteSpoolRecords(ids, showToast);
        
        if (result.success && window.clearSelection) {
            window.clearSelection();
        }
        
        window.isBulkDelete = false;
    } else if (window.recordToDeleteId) {
        const result = await deleteSpoolRecord(window.recordToDeleteId, showToast);
        window.recordToDeleteId = null;
    }
}
window.executeDelete = executeDelete;

/**
 * Удаляет запись из формы
 */
function deleteFromForm() {
    const editIdEl = document.getElementById('editId');
    if (!editIdEl || !editIdEl.value) {
        return;
    }
    
    window.recordToDeleteId = editIdEl.value;
    window.isBulkDelete = false;
    
    if (window.closeOffcanvas) {
        window.closeOffcanvas();
    }
    
    executeDelete();
}
window.deleteFromForm = deleteFromForm;

/**
 * Удаляет запись напрямую (без модального окна)
 * @param {string} id - ID записи
 */
function deleteRecordDirect(id) {
    window.recordToDeleteId = id;
    window.isBulkDelete = false;
    executeDelete();
}
window.deleteRecordDirect = deleteRecordDirect;

