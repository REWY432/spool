/**
 * Модуль для работы с настройками
 * @module app-settings
 */

import { saveSettingsToFirebase } from './services/firebase.js';
import { escapeHtml } from './utils/sanitize.js';

const showToast = (msg, type) => {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}] ${msg}`);
    }
};

/**
 * Открывает модальное окно настроек
 */
function openSettings() {
    renderSettingsModal();
    
    if (window.bootstrap) {
        const modal = new window.bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    }
}
window.openSettings = openSettings;

/**
 * Рендерит модальное окно настроек
 */
function renderSettingsModal() {
    const container = document.getElementById('settingsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const models = window.appSettings?.models || [];
    
    models.forEach((m, index) => {
        const row = document.createElement('div');
        row.className = 'input-group input-group-sm';
        row.innerHTML = `
            <span class="input-group-text">Год</span>
            <input type="text" class="form-control" placeholder="2024" value="${escapeHtml(m.year || '')}" 
                   onchange="window.updateSetting(${index}, 'year', this.value)">
            <span class="input-group-text">EAN</span>
            <input type="text" class="form-control" placeholder="Code" value="${escapeHtml(m.ean || '')}" 
                   onchange="window.updateSetting(${index}, 'ean', this.value)">
            <button class="btn btn-outline-danger" onclick="window.removeSettingRow(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(row);
    });
}

/**
 * Добавляет новую строку настроек
 */
function addSettingRow() {
    if (!window.appSettings.models) {
        window.appSettings.models = [];
    }
    
    window.appSettings.models.push({ year: '', ean: '' });
    renderSettingsModal();
}
window.addSettingRow = addSettingRow;

/**
 * Удаляет строку настроек
 * @param {number} index - Индекс строки
 */
function removeSettingRow(index) {
    if (window.appSettings.models && window.appSettings.models[index]) {
        window.appSettings.models.splice(index, 1);
        renderSettingsModal();
    }
}
window.removeSettingRow = removeSettingRow;

/**
 * Обновляет значение настройки
 * @param {number} index - Индекс модели
 * @param {string} field - Поле ('year' или 'ean')
 * @param {string} value - Новое значение
 */
function updateSetting(index, field, value) {
    if (window.appSettings.models && window.appSettings.models[index]) {
        window.appSettings.models[index][field] = value;
    }
}
window.updateSetting = updateSetting;

/**
 * Сохраняет настройки
 */
async function saveSettings() {
    if (!window.appSettings.models) {
        window.appSettings.models = [];
    }
    
    // Фильтруем пустые записи
    window.appSettings.models = window.appSettings.models.filter(m => m.year && m.ean);
    
    const result = await saveSettingsToFirebase(window.appSettings, showToast);
    
    if (result.success && window.bootstrap) {
        const modal = window.bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (modal) {
            modal.hide();
        }
        
        // Обновляем выпадающие списки
        if (window.updateDropdowns) {
            window.updateDropdowns();
        }
    }
}
window.saveSettings = saveSettings;

/**
 * Открывает модальное окно меню
 */
function openMenuModal() {
    if (window.bootstrap) {
        const modal = new window.bootstrap.Modal(document.getElementById('menuModal'));
        modal.show();
    }
}
window.openMenuModal = openMenuModal;

