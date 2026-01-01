/**
 * Модуль для работы с буфером отгрузки
 * @module app-shipment
 */

import { getWireType } from './utils/wireType.js';
import { escapeHtml } from './utils/sanitize.js';

const showToast = (msg, type) => {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}] ${msg}`);
    }
};

/**
 * Открывает модальное окно буфера отгрузки
 */
function openShipmentModal() {
    const searchInput = document.getElementById('shipmentSearchInput');
    const resultsDiv = document.getElementById('shipmentSearchResults');
    
    if (searchInput) searchInput.value = '';
    if (resultsDiv) resultsDiv.innerHTML = '';
    
    renderShipmentBuffer();
    
    if (window.bootstrap) {
        const modal = new window.bootstrap.Modal(document.getElementById('shipmentModal'));
        modal.show();
    }
    
    // Автофокус на поле поиска
    setTimeout(() => {
        if (searchInput) {
            searchInput.focus();
            searchInput.click();
        }
    }, 600);
}
window.openShipmentModal = openShipmentModal;

/**
 * Обрабатывает нажатие клавиши в поле поиска отгрузки
 * @param {KeyboardEvent} e - Событие клавиатуры
 */
function handleShipmentKey(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = e.target.value.trim().toLowerCase();
        if (!query) return;
        
        // 1. Точное совпадение по серийному номеру
        let bestMatch = window.localDB.find(item => 
            item.serial.toLowerCase() === query
        );
        
        // 2. Точное совпадение по сквозному номеру
        if (!bestMatch) {
            bestMatch = window.localDB.find(item => 
                String(item.globalSeq) === query
            );
        }
        
        // 3. Первое совпадение из списка поиска
        if (!bestMatch) {
            const matches = window.localDB.filter(item => {
                const isInBuffer = window.shipmentBuffer.some(b => b.id === item.id);
                const matchesQuery = 
                    item.serial.toLowerCase().includes(query) || 
                    (item.globalSeq && String(item.globalSeq).includes(query));
                return !isInBuffer && matchesQuery;
            });
            if (matches.length > 0) {
                bestMatch = matches[0];
            }
        }
        
        if (bestMatch) {
            // Проверяем, не добавлена ли уже
            if (window.shipmentBuffer.some(b => b.id === bestMatch.id)) {
                showToast('Уже в списке', 'warning');
            } else {
                addToShipment(bestMatch.id);
            }
        } else {
            showToast('Катушка не найдена', 'error');
        }
        
        // Очищаем поле и возвращаем фокус
        e.target.value = '';
        handleShipmentSearch('');
        e.target.focus();
    }
}
window.handleShipmentKey = handleShipmentKey;

/**
 * Обрабатывает поиск в буфере отгрузки
 * @param {string} query - Поисковый запрос
 */
function handleShipmentSearch(query) {
    const resultsDiv = document.getElementById('shipmentSearchResults');
    if (!resultsDiv) return;
    
    if (!query || query.trim() === '') {
        resultsDiv.classList.add('d-none');
        return;
    }
    
    query = query.toLowerCase();
    
    const matches = window.localDB
        .filter(item => {
            const isInBuffer = window.shipmentBuffer.some(b => b.id === item.id);
            const matchesQuery = 
                item.serial.toLowerCase().includes(query) || 
                (item.globalSeq && String(item.globalSeq).includes(query));
            return !isInBuffer && matchesQuery;
        })
        .slice(0, 10);
    
    if (matches.length === 0) {
        resultsDiv.classList.remove('d-none');
        resultsDiv.innerHTML = '<div class="p-3 text-muted small text-center">Ничего не найдено</div>';
    } else {
        let html = '';
        matches.forEach(item => {
            const wire = getWireType(item);
            html += `
                <div class="shipment-item" style="cursor:pointer;" onclick="window.addToShipment('${escapeHtml(item.id)}')">
                    <div>
                        <span class="fw-bold text-primary">${escapeHtml(item.serial)}</span>
                        <span class="text-muted small ms-2">${escapeHtml(wire)}</span>
                    </div>
                    <i class="fas fa-plus text-success"></i>
                </div>`;
        });
        resultsDiv.innerHTML = html;
        resultsDiv.classList.remove('d-none');
    }
}
window.handleShipmentSearch = handleShipmentSearch;

/**
 * Добавляет катушку в буфер отгрузки
 * @param {string} id - ID катушки
 */
function addToShipment(id) {
    const item = window.localDB.find(x => x.id === id);
    if (!item) return;
    
    // Проверяем, не добавлена ли уже
    if (window.shipmentBuffer.some(b => b.id === id)) {
        showToast('Уже в списке', 'warning');
        return;
    }
    
    window.shipmentBuffer.push(item);
    
    const searchInput = document.getElementById('shipmentSearchInput');
    const resultsDiv = document.getElementById('shipmentSearchResults');
    
    if (searchInput) searchInput.value = '';
    if (resultsDiv) resultsDiv.classList.add('d-none');
    
    renderShipmentBuffer();
    showToast('Добавлено в буфер');
    
    // Возвращаем фокус для непрерывного сканирования
    if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
    }
}
window.addToShipment = addToShipment;

/**
 * Удаляет катушку из буфера отгрузки
 * @param {string} id - ID катушки
 */
function removeFromShipment(id) {
    window.shipmentBuffer = window.shipmentBuffer.filter(x => x.id !== id);
    renderShipmentBuffer();
}
window.removeFromShipment = removeFromShipment;

/**
 * Очищает буфер отгрузки
 */
function clearShipmentBuffer() {
    window.shipmentBuffer = [];
    renderShipmentBuffer();
}
window.clearShipmentBuffer = clearShipmentBuffer;

/**
 * Рендерит буфер отгрузки
 */
function renderShipmentBuffer() {
    const list = document.getElementById('shipmentBufferList');
    const countSpan = document.getElementById('shipmentCount');
    const summaryDiv = document.getElementById('shipmentSummary');
    
    if (!list) return;
    
    if (countSpan) {
        countSpan.innerText = window.shipmentBuffer.length;
    }
    
    if (window.shipmentBuffer.length === 0) {
        if (summaryDiv) summaryDiv.innerHTML = '';
        list.innerHTML = `
            <div class="text-center text-muted py-5 mt-3">
                <i class="fas fa-box-open fa-3x mb-3 opacity-50"></i>
                <p class="mb-1">Буфер пуст</p>
            </div>`;
        return;
    }
    
    // Вычисляем статистику по типам проводов
    const stats = window.shipmentBuffer.reduce((acc, item) => {
        const wire = getWireType(item);
        acc[wire] = (acc[wire] || 0) + 1;
        return acc;
    }, {});
    
    if (summaryDiv) {
        summaryDiv.innerHTML = Object.entries(stats)
            .map(([type, count]) => {
                const color = type === 'Favero' ? 'secondary' : 'primary';
                return `<span class="badge badge-soft-${color} border">${escapeHtml(type)}: ${count}</span>`;
            })
            .join('');
    }
    
    // Рендерим список (в обратном порядке - последние добавленные сверху)
    let html = '';
    [...window.shipmentBuffer].reverse().forEach(item => {
        const wire = getWireType(item);
        html += `
            <div class="card p-2 border shadow-sm">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold text-primary">${escapeHtml(item.serial)}</div>
                        <div class="small text-muted">${escapeHtml(wire)}</div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="window.removeFromShipment('${escapeHtml(item.id)}')" title="Убрать">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    });
    list.innerHTML = html;
}

/**
 * Копирует список отгрузки в буфер обмена
 */
function copyShipmentList() {
    if (window.shipmentBuffer.length === 0) {
        showToast('Список пуст', 'warning');
        return;
    }
    
    const text = window.shipmentBuffer.map(i => i.serial).join('\n');
    copyTextToClipboard(text);
}
window.copyShipmentList = copyShipmentList;

/**
 * Печатает упаковочный лист
 */
function printShipmentList() {
    if (window.shipmentBuffer.length === 0) {
        showToast('Список пуст', 'warning');
        return;
    }
    
    const itemsHtml = window.shipmentBuffer.map((item, index) => {
        const wire = getWireType(item);
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(item.serial)}</strong></td>
                <td>${escapeHtml(wire)}</td>
                <td>${escapeHtml(item.spoolModel || '-')}</td>
                <td>-</td>
            </tr>
        `;
    }).join('');
    
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(`
        <html>
        <head>
            <title>Упаковочный лист</title>
            <style>
                body { font-family: sans-serif; padding: 20px; color: #333; }
                .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; display:flex; justify-content:space-between; align-items:flex-end; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; font-size: 12px; }
                tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h2>Упаковочный лист</h2>
                    <div>Катушки</div>
                </div>
                <div style="text-align:right;">
                    <div><strong>Дата:</strong> ${new Date().toLocaleDateString()}</div>
                    <div><strong>Всего позиций:</strong> ${window.shipmentBuffer.length}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">№</th>
                        <th>Серийный номер</th>
                        <th>Провод</th>
                        <th>Модель/Год</th>
                        <th>Отметка</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <script>setTimeout(() => window.print(), 500);<\/script>
        </body>
        </html>
    `);
}
window.printShipmentList = printShipmentList;

/**
 * Копирует текст в буфер обмена
 * @param {string} text - Текст для копирования
 */
function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Скопировано: ' + text);
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}
window.copyTextToClipboard = copyTextToClipboard;

/**
 * Fallback метод копирования (для старых браузеров)
 * @param {string} text - Текст для копирования
 */
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('Скопировано: ' + text);
        } else {
            prompt('Скопируйте текст:', text);
        }
    } catch (err) {
        showToast('Ошибка копирования', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Копирует серийный номер и открывает редактирование
 * @param {string} id - ID катушки
 */
function copyAndOpen(id) {
    const rec = window.localDB.find(x => x.id === id);
    if (!rec) return;
    
    copyTextToClipboard(rec.serial);
    
    if (window.openEdit) {
        window.openEdit(id);
    }
}
window.copyAndOpen = copyAndOpen;

