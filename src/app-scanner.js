/**
 * Модуль для работы с QR сканером
 * @module app-scanner
 */

import { loadHtml5QRCode } from './utils/dynamicImport.js';

let qrScanner = null;

const showToast = (msg, type) => {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}] ${msg}`);
    }
};

/**
 * Открывает модальное окно QR сканера
 */
async function openScanner() {
    try {
        const Html5Qrcode = await loadHtml5QRCode();
        const scannerDiv = document.getElementById('qr-reader');
        
        if (!scannerDiv) {
            showToast('Элемент сканера не найден', 'error');
            return;
        }
        
        // Очищаем предыдущий сканер, если есть
        if (qrScanner) {
            try {
                await qrScanner.stop();
            } catch (e) {
                // Игнорируем ошибки остановки
            }
            qrScanner = null;
        }
        
        // Очищаем содержимое
        scannerDiv.innerHTML = '';
        
        // Создаем новый экземпляр сканера
        qrScanner = new Html5Qrcode(scannerDiv.id);
        
        // Показываем модальное окно
        if (window.bootstrap) {
            const modal = new window.bootstrap.Modal(document.getElementById('scannerModal'));
            modal.show();
            
            // Запускаем сканер после показа модального окна
            modal._element.addEventListener('shown.bs.modal', async () => {
                try {
                    await qrScanner.start(
                        {
                            facingMode: 'environment' // Используем заднюю камеру
                        },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 }
                        },
                        (decodedText) => {
                            // Успешное сканирование
                            handleScannedCode(decodedText);
                        },
                        (errorMessage) => {
                            // Игнорируем ошибки сканирования (они нормальны)
                        }
                    );
                } catch (error) {
                    console.error('Scanner start error:', error);
                    showToast('Ошибка запуска камеры: ' + error.message, 'error');
                }
            }, { once: true });
            
            // Останавливаем сканер при закрытии модального окна
            modal._element.addEventListener('hidden.bs.modal', async () => {
                if (qrScanner) {
                    try {
                        await qrScanner.stop();
                        qrScanner.clear();
                    } catch (e) {
                        // Игнорируем ошибки
                    }
                    qrScanner = null;
                }
            });
        }
    } catch (error) {
        console.error('Scanner error:', error);
        showToast('Ошибка инициализации сканера: ' + error.message, 'error');
    }
}
window.openScanner = openScanner;

/**
 * Обрабатывает отсканированный код
 * @param {string} code - Отсканированный код
 */
function handleScannedCode(code) {
    if (!code || code.trim() === '') {
        return;
    }
    
    // Останавливаем сканер
    if (qrScanner) {
        qrScanner.stop().catch(() => {});
    }
    
    // Закрываем модальное окно
    if (window.bootstrap) {
        const modal = window.bootstrap.Modal.getInstance(document.getElementById('scannerModal'));
        if (modal) {
            modal.hide();
        }
    }
    
    // Ищем катушку по отсканированному коду
    // Код может быть серийным номером или сквозным номером
    let item = window.localDB.find(x => x.serial === code);
    
    if (!item) {
        // Пробуем найти по сквозному номеру
        const seq = parseInt(code);
        if (!isNaN(seq)) {
            item = window.localDB.find(x => x.globalSeq === seq);
        }
    }
    
    if (item) {
        // Открываем редактирование найденной катушки
        if (window.openEdit) {
            window.openEdit(item.id);
        }
        showToast('Найдено: ' + item.serial);
    } else {
        // Если не найдено, вставляем в поле поиска
        const searchInput = document.getElementById('searchSerial');
        if (searchInput) {
            searchInput.value = code;
            if (window.debouncedRender) {
                window.debouncedRender();
            }
        }
        showToast('Катушка не найдена. Добавлен в поиск.', 'warning');
    }
}

