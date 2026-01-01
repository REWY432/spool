/**
 * Модуль для импорта/экспорта CSV
 * @module app-import
 */

import { getWireType } from './utils/wireType.js';
import { saveSpoolRecord } from './services/firebase.js';
import { escapeHtml } from './utils/sanitize.js';

const showToast = (msg, type) => {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}] ${msg}`);
    }
};

/**
 * Загружает библиотеку PapaParse для парсинга CSV
 * @returns {Promise<*>} PapaParse
 */
async function loadPapaParse() {
    if (window.Papa) {
        return window.Papa;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
        script.async = true;
        
        script.onload = () => {
            if (window.Papa) {
                resolve(window.Papa);
            } else {
                reject(new Error('PapaParse not loaded'));
            }
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load PapaParse'));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Импортирует данные из CSV файла
 * @param {HTMLInputElement} input - Input элемент с файлом
 */
async function importData(input) {
    if (!input.files || input.files.length === 0) {
        return;
    }
    
    const file = input.files[0];
    if (!file.name.endsWith('.csv')) {
        showToast('Выберите CSV файл', 'error');
        return;
    }
    
    try {
        const Papa = await loadPapaParse();
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV parsing errors:', results.errors);
                }
                
                const data = results.data;
                if (data.length === 0) {
                    showToast('CSV файл пуст', 'warning');
                    return;
                }
                
                // Сохраняем данные для подтверждения
                window.pendingImportData = data.map((row, index) => {
                    return {
                        serial: row.Serial || row.serial || '',
                        wireType: row.WireType || row.wireType || row.Model || row.model || '',
                        spoolModel: row.Model || row.model || row.SpoolModel || row.spoolModel || '',
                        notes: row.Notes || row.notes || '',
                        index: index + 1
                    };
                }).filter(item => item.serial); // Фильтруем пустые строки
                
                if (window.pendingImportData.length === 0) {
                    showToast('Не найдено данных для импорта', 'warning');
                    return;
                }
                
                // Показываем модальное окно подтверждения
                const msgEl = document.getElementById('importMsg');
                const btnTextEl = document.getElementById('importBtnText');
                
                if (msgEl) {
                    msgEl.innerHTML = `Найдено <strong>${window.pendingImportData.length}</strong> записей для импорта.`;
                }
                
                if (btnTextEl) {
                    btnTextEl.innerText = `Загрузить ${window.pendingImportData.length} записей`;
                }
                
                if (window.bootstrap) {
                    const modal = new window.bootstrap.Modal(document.getElementById('importModal'));
                    modal.show();
                }
            },
            error: (error) => {
                showToast('Ошибка чтения CSV: ' + error.message, 'error');
            }
        });
    } catch (error) {
        showToast('Ошибка импорта: ' + error.message, 'error');
    }
}
window.importData = importData;

/**
 * Подтверждает импорт данных
 */
async function confirmImport() {
    if (!window.pendingImportData || window.pendingImportData.length === 0) {
        showToast('Нет данных для импорта', 'warning');
        return;
    }
    
    const data = window.pendingImportData;
    let successCount = 0;
    let errorCount = 0;
    
    showToast('Импорт начат...', 'info');
    
    for (const item of data) {
        try {
            // Определяем тип провода
            let wireType = item.wireType;
            if (!wireType || wireType === '') {
                wireType = item.spoolModel?.includes('У') ? 'Favero' : 'Китайский';
            }
            
            // Нормализуем тип провода
            if (wireType === 'Стандарт') wireType = 'Китайский';
            if (wireType === 'У') wireType = 'Favero';
            
            const record = {
                serial: item.serial.trim(),
                wireType: wireType,
                spoolModel: item.spoolModel || (wireType === 'Favero' ? '2025' : '2024'),
                notes: item.notes || '',
                isInCRM: false
            };
            
            // Проверяем на дубликаты
            const isDuplicate = window.localDB.some(x => x.serial === record.serial);
            if (isDuplicate) {
                errorCount++;
                continue;
            }
            
            const result = await saveSpoolRecord(record, null, null);
            if (result.success) {
                successCount++;
            } else {
                errorCount++;
            }
        } catch (error) {
            console.error('Import error:', error);
            errorCount++;
        }
    }
    
    // Очищаем данные
    window.pendingImportData = [];
    
    // Закрываем модальное окно
    if (window.bootstrap) {
        const modal = window.bootstrap.Modal.getInstance(document.getElementById('importModal'));
        if (modal) modal.hide();
    }
    
    // Показываем результат
    if (errorCount > 0) {
        showToast(`Импортировано: ${successCount}, ошибок: ${errorCount}`, 'warning');
    } else {
        showToast(`Успешно импортировано: ${successCount} записей`, 'success');
    }
}
window.confirmImport = confirmImport;

/**
 * Экспортирует данные в CSV
 */
function exportCSV() {
    if (!window.localDB || window.localDB.length === 0) {
        showToast('Нет данных для экспорта', 'warning');
        return;
    }
    
    const headers = ['Serial', 'WireType', 'Model', 'Notes'];
    const rows = window.localDB.map(item => {
        const wire = getWireType(item);
        const model = item.spoolModel || '';
        const notes = (item.notes || '').replace(/"/g, '""'); // Экранируем кавычки
        
        return `"${item.serial}","${wire}","${model}","${notes}"`;
    });
    
    const csv = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM для Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Spools_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Экспорт завершен', 'success');
}
window.exportCSV = exportCSV;

