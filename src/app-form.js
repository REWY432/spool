/**
 * Модуль для работы с формой редактирования
 * @module app-form
 */

import { DEFAULT_PREFIX, DEFAULT_WIRE_TYPE, MONTHS } from './config/constants.js';
import { generateSerial, hasDuplicateSerial, hasDuplicateSeq } from './utils/serial.js';
import { validateRecord, getFirstError } from './utils/validation.js';
import { saveSpoolRecord } from './services/firebase.js';
import { applyOptimisticUpdate, rollbackUpdate, confirmUpdate } from './services/optimisticUpdates.js';
import { getCurrentDateValues } from './utils/date.js';
import { showToast } from './app.js';

let isAutoSerialEnabled = true;
let offcanvasInstance = null;

/**
 * Инициализирует offcanvas
 * @returns {*} Экземпляр offcanvas
 */
function getOffcanvas() {
    if (!offcanvasInstance) {
        const el = document.getElementById('editorOffcanvas');
        if (el && window.bootstrap) {
            offcanvasInstance = new window.bootstrap.Offcanvas(el);
        }
    }
    return offcanvasInstance;
}

/**
 * Обновляет серийный номер автоматически
 */
function updateSmartSerial() {
    if (!isAutoSerialEnabled) return;
    
    const wire = document.getElementById('wireType')?.value;
    const prefix = document.getElementById('serialPrefix')?.value;
    const seq = document.getElementById('globalSeq')?.value;
    
    if (!wire || !prefix || !seq) return;
    
    const serial = generateSerial(prefix, wire, seq);
    const serialInput = document.getElementById('serialNumber');
    if (serialInput) {
        serialInput.value = serial;
    }
}
window.updateSmartSerial = updateSmartSerial;

/**
 * Проверяет уникальность сквозного номера
 */
function checkSeqUniqueness() {
    const inputSeq = parseInt(document.getElementById('globalSeq')?.value);
    const currentEditId = document.getElementById('editId')?.value;
    const warningEl = document.getElementById('seqWarning');
    
    if (!warningEl) return;
    
    if (isNaN(inputSeq)) {
        warningEl.classList.add('d-none');
        return;
    }
    
    const duplicate = window.localDB.find(
        item => item.globalSeq === inputSeq && item.id !== currentEditId
    );
    
    if (duplicate) {
        warningEl.classList.remove('d-none');
    } else {
        warningEl.classList.add('d-none');
    }
}
window.checkSeqUniqueness = checkSeqUniqueness;

/**
 * Устанавливает автоматический сквозной номер
 */
function setAutoSeq() {
    const seqInput = document.getElementById('globalSeq');
    if (!seqInput) return;
    
    const maxSeq = window.localDB.length > 0 
        ? Math.max(...window.localDB.map(o => o.globalSeq || 0)) 
        : 0;
    
    seqInput.value = maxSeq + 1;
    updateSmartSerial();
}
window.setAutoSeq = setAutoSeq;

/**
 * Обрабатывает изменение типа провода
 * @param {string} mode - Режим: 'standard', 'bulkAdd', 'bulkEdit'
 */
function handleWireChange(mode) {
    let wireEl, modelEl;
    
    if (mode === 'bulkAdd') {
        wireEl = document.getElementById('baWireType');
        modelEl = document.getElementById('baSpoolModel');
    } else if (mode === 'bulkEdit') {
        wireEl = document.getElementById('bulkWireType');
        modelEl = document.getElementById('bulkSpoolModel');
    } else {
        wireEl = document.getElementById('wireType');
        modelEl = document.getElementById('spoolModel');
    }
    
    if (!wireEl || !modelEl) return;
    
    const wireVal = wireEl.value;
    
    if (wireVal === 'Китайский') {
        modelEl.value = '2024';
        modelEl.disabled = false;
    } else if (wireVal === 'Favero') {
        modelEl.value = '2025';
        modelEl.disabled = false;
    } else if (mode === 'bulkEdit' && wireVal === '') {
        modelEl.value = '';
        modelEl.disabled = true;
    }
    
    if (mode === 'standard') {
        updateSmartSerial();
    }
}
window.handleWireChange = handleWireChange;

/**
 * Открывает форму для создания новой записи
 */
function openCreate() {
    const form = document.getElementById('maskForm');
    if (form) {
        form.reset();
    }
    
    document.getElementById('editId').value = '';
    document.getElementById('isInCRM').checked = false;
    
    const titleEl = document.getElementById('offcanvasTitle');
    if (titleEl) {
        titleEl.innerHTML = '<i class="fas fa-plus-circle text-success me-2"></i>Новая катушка';
    }
    
    document.getElementById('deleteBtnInForm').style.display = 'none';
    document.getElementById('seqWarning').classList.add('d-none');
    
    document.getElementById('serialPrefix').value = DEFAULT_PREFIX;
    document.getElementById('wireType').value = DEFAULT_WIRE_TYPE;
    
    const { month, year } = getCurrentDateValues();
    document.getElementById('prodMonth').value = month;
    document.getElementById('prodYear').value = year;
    
    setAutoSeq();
    isAutoSerialEnabled = true;
    
    setTimeout(() => handleWireChange('standard'), 100);
    
    const offcanvas = getOffcanvas();
    if (offcanvas) {
        offcanvas.show();
    }
}
window.openCreate = openCreate;

/**
 * Открывает форму для редактирования записи
 * @param {string} id - ID записи
 */
function openEdit(id) {
    const rec = window.localDB.find(x => x.id === id);
    if (!rec) return;
    
    isAutoSerialEnabled = true;
    
    document.getElementById('editId').value = rec.id;
    document.getElementById('serialNumber').value = rec.serial;
    document.getElementById('globalSeq').value = rec.globalSeq;
    
    let wireVal = rec.wireType;
    if (!wireVal && rec.model) {
        wireVal = rec.model.includes('У') ? 'Favero' : 'Китайский';
    }
    if (wireVal === "Стандарт") wireVal = "Китайский";
    if (wireVal === "У") wireVal = "Favero";
    
    document.getElementById('wireType').value = wireVal || DEFAULT_WIRE_TYPE;
    document.getElementById('spoolModel').value = rec.spoolModel || (wireVal === "Favero" ? "2025" : "2024");
    document.getElementById('spoolModel').disabled = false;
    
    document.getElementById('prodMonth').value = rec.month || getCurrentDateValues().month;
    document.getElementById('prodYear').value = rec.year || getCurrentDateValues().year;
    
    document.getElementById('serialPrefix').value = rec.prefix || DEFAULT_PREFIX;
    document.getElementById('notes').value = rec.notes || "";
    document.getElementById('isInCRM').checked = !!rec.isInCRM;
    
    const titleEl = document.getElementById('offcanvasTitle');
    if (titleEl) {
        titleEl.innerHTML = '<i class="fas fa-edit text-primary me-2"></i>Редактирование';
    }
    
    document.getElementById('deleteBtnInForm').style.display = 'block';
    document.getElementById('seqWarning').classList.add('d-none');
    
    const offcanvas = getOffcanvas();
    if (offcanvas) {
        offcanvas.show();
    }
}
window.openEdit = openEdit;

/**
 * Закрывает offcanvas
 */
function closeOffcanvas() {
    const offcanvas = getOffcanvas();
    if (offcanvas) {
        offcanvas.hide();
    }
}
window.closeOffcanvas = closeOffcanvas;

/**
 * Сохраняет запись
 */
async function saveRecord() {
    const editId = document.getElementById('editId')?.value;
    const serial = document.getElementById('serialNumber')?.value.trim();
    const seq = Number(document.getElementById('globalSeq')?.value);
    
    if (!serial) {
        showToast('Введите серийный номер', 'error');
        return;
    }
    
    // Валидация
    const record = {
        serial: serial,
        prefix: document.getElementById('serialPrefix')?.value || DEFAULT_PREFIX,
        globalSeq: seq,
        wireType: document.getElementById('wireType')?.value,
        spoolModel: document.getElementById('spoolModel')?.value,
        month: Number(document.getElementById('prodMonth')?.value),
        year: Number(document.getElementById('prodYear')?.value),
        notes: document.getElementById('notes')?.value || "",
        isInCRM: document.getElementById('isInCRM')?.checked || false
    };
    
    const validation = validateRecord(record);
    if (!validation.isValid) {
        const firstError = getFirstError(validation);
        showToast(firstError || 'Ошибка валидации', 'error');
        return;
    }
    
    // Проверка дубликатов
    if (hasDuplicateSerial(serial, window.localDB, editId)) {
        showToast('Серийный номер уже существует!', 'error');
        return;
    }
    
    if (hasDuplicateSeq(seq, window.localDB, editId)) {
        showToast(`Сквозной номер #${seq} уже занят!`, 'error');
        return;
    }
    
    // Оптимистичное обновление
    if (editId) {
        applyOptimisticUpdate(
            window.localDB,
            editId,
            record,
            window.renderTable,
            showToast
        );
    }
    
    // Сохранение на сервер
    const result = await saveSpoolRecord(record, editId, showToast);
    
    if (result.success) {
        if (editId) {
            confirmUpdate(editId);
        }
        closeOffcanvas();
    } else {
        // Rollback при ошибке
        if (editId) {
            rollbackUpdate(window.localDB, editId, window.renderTable, showToast);
        }
    }
}
window.saveRecord = saveRecord;

/**
 * Инициализирует генератор серийных номеров
 */
function initSerialGenerator() {
    const inputs = ['wireType', 'serialPrefix', 'globalSeq'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => handleWireChange('standard'));
            el.addEventListener('input', updateSmartSerial);
        }
    });
}

export { initSerialGenerator, getOffcanvas };

