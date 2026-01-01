/**
 * Компонент для рендеринга строки таблицы
 * @module components/Table/renderRow
 */

import { getWireType } from '../../utils/wireType.js';
import { isItemNew } from '../../utils/date.js';
import { escapeHtml } from '../../utils/sanitize.js';

/**
 * Рендерит ячейку с чекбоксом
 * @param {string} itemId - ID элемента
 * @param {boolean} isChecked - Выбран ли элемент
 * @returns {string} HTML строки
 */
function renderCheckboxCell(itemId, isChecked) {
    return `
        <td class="ps-4 mobile-row-content" style="width: 40px" onclick="event.stopPropagation()">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" 
                       onchange="window.toggleSelect('${escapeHtml(itemId)}')" 
                       ${isChecked ? 'checked' : ''}>
            </div>
        </td>
    `;
}

/**
 * Рендерит ячейку с номером
 * @param {number} globalSeq - Сквозной номер
 * @returns {string} HTML строки
 */
function renderNumberCell(globalSeq) {
    return `
        <td class="font-mono text-muted small mobile-row-content" data-label="№">
            #${globalSeq || '-'}
        </td>
    `;
}

/**
 * Рендерит ячейку с серийным номером
 * @param {Object} item - Элемент данных
 * @param {string} serialDisplay - HTML для отображения серийного номера
 * @param {string} crmIcon - HTML иконки CRM
 * @param {string} modelColor - Цвет модели
 * @param {string} wire - Тип провода
 * @returns {string} HTML строки
 */
function renderSerialCell(item, serialDisplay, crmIcon, modelColor, wire) {
    return `
        <td class="mobile-row-content" data-label="Катушка">
            <div class="d-flex align-items-center">
                <div class="me-3 fs-5">${crmIcon}</div>
                <div class="rounded-circle bg-${modelColor} bg-opacity-10 text-${modelColor} d-flex align-items-center justify-content-center me-3 d-none d-sm-flex" style="width:40px;height:40px;">
                    <i class="fas fa-bolt"></i>
                </div>
                <div>
                    ${serialDisplay}
                    <div class="small text-muted d-block d-sm-none">${escapeHtml(wire)}</div>
                </div>
            </div>
        </td>
    `;
}

/**
 * Рендерит ячейку с типом провода
 * @param {string} wire - Тип провода
 * @param {string} modelColor - Цвет модели
 * @returns {string} HTML строки
 */
function renderWireCell(wire, modelColor) {
    return `
        <td class="hide-on-mobile mobile-row-content" data-label="Провод">
            <span class="badge badge-soft-${modelColor}">${escapeHtml(wire)}</span>
        </td>
    `;
}

/**
 * Рендерит ячейку с моделью
 * @param {string} spoolModel - Модель катушки
 * @returns {string} HTML строки
 */
function renderModelCell(spoolModel) {
    const displayModel = spoolModel || "2024";
    return `
        <td class="mobile-row-content" data-label="Модель">
            <span class="badge bg-light text-dark border">${escapeHtml(displayModel)}</span>
        </td>
    `;
}

/**
 * Рендерит ячейку с примечаниями
 * @param {string} notes - Примечания
 * @returns {string} HTML строки
 */
function renderNotesCell(notes) {
    const notesText = (notes || "").substring(0, 20);
    return `
        <td class="mobile-row-content" data-label="Прим.">
            <span class="text-muted small">${escapeHtml(notesText)}</span>
        </td>
    `;
}

/**
 * Рендерит ячейку с действиями
 * @param {string} itemId - ID элемента
 * @returns {string} HTML строки
 */
function renderActionsCell(itemId) {
    return `
        <td class="text-end pe-4 no-print mobile-row-content" onclick="event.stopPropagation()">
            <div class="hover-actions d-inline-block">
                <button class="btn btn-sm btn-light border me-1" onclick="window.openEdit('${escapeHtml(itemId)}')" title="Редактировать">
                    <i class="fas fa-pen text-secondary"></i>
                </button>
                <button class="btn btn-sm btn-primary shadow-sm me-1" onclick="window.copyAndOpen('${escapeHtml(itemId)}')" title="Копировать SN">
                    <i class="fas fa-clipboard-check"></i>
                </button>
                <button class="btn btn-sm btn-light border me-1" onclick="window.printLabel('${escapeHtml(itemId)}')" title="Печать QR этикетки">
                    <i class="fas fa-qrcode text-muted"></i>
                </button>
                <button class="btn btn-sm btn-light border me-1" onclick="window.printPassport('${escapeHtml(itemId)}')" title="Мини-паспорт 58x40мм">
                    <i class="fas fa-tag text-muted"></i>
                </button>
                <button class="btn btn-sm btn-outline-success border" onclick="window.printFullPassport('${escapeHtml(itemId)}')" title="Паспорт изделия A4">
                    <i class="fas fa-file-contract"></i>
                </button>
            </div>
        </td>
    `;
}

/**
 * Рендерит строку таблицы
 * @param {Object} item - Элемент данных
 * @param {boolean} isChecked - Выбран ли элемент
 * @param {boolean} isNew - Создан ли сегодня
 * @returns {string} HTML строки таблицы
 */
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
        ? `<span class="new-indicator" title="Создано сегодня"></span><span class="fw-bold font-mono text-primary">${escapeHtml(item.serial)}</span>` 
        : `<span class="fw-bold font-mono text-primary">${escapeHtml(item.serial)}</span>`;
    
    return `
        <tr id="row-${escapeHtml(item.id)}" onclick="window.openEdit('${escapeHtml(item.id)}')" style="cursor: pointer;" class="${rowClass}">
            <div class="mobile-actions-layer d-lg-none">
                <div class="mobile-action-btn mobile-edit-btn" onclick="event.stopPropagation(); window.openEdit('${escapeHtml(item.id)}')">
                    <i class="fas fa-pen"></i>
                </div>
                <div class="mobile-action-btn mobile-delete-btn" onclick="event.stopPropagation(); window.deleteRecordDirect('${escapeHtml(item.id)}')">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
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

