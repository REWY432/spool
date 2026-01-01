/**
 * Утилиты для динамической загрузки библиотек
 * @module utils/dynamicImport
 */

/**
 * Кэш загруженных библиотек
 * @type {Map<string, *>}
 */
const libraryCache = new Map();

/**
 * Динамически загружает библиотеку
 * @param {string} libraryName - Имя библиотеки
 * @param {string} url - URL библиотеки
 * @param {string} [globalName] - Глобальное имя библиотеки (если не ES модуль)
 * @returns {Promise<*>} Загруженная библиотека
 */
export async function loadLibrary(libraryName, url, globalName = null) {
    // Проверяем кэш
    if (libraryCache.has(libraryName)) {
        return libraryCache.get(libraryName);
    }
    
    try {
        // Пытаемся загрузить как ES модуль
        try {
            const module = await import(url);
            libraryCache.set(libraryName, module);
            return module;
        } catch (e) {
            // Если не ES модуль, загружаем через script tag
            if (globalName) {
                return await loadScriptLibrary(libraryName, url, globalName);
            }
            throw e;
        }
    } catch (error) {
        console.error(`Failed to load library ${libraryName}:`, error);
        throw error;
    }
}

/**
 * Загружает библиотеку через script tag
 * @param {string} libraryName - Имя библиотеки
 * @param {string} url - URL библиотеки
 * @param {string} globalName - Глобальное имя библиотеки
 * @returns {Promise<*>} Загруженная библиотека
 */
function loadScriptLibrary(libraryName, url, globalName) {
    return new Promise((resolve, reject) => {
        // Проверяем, не загружена ли уже
        if (window[globalName]) {
            libraryCache.set(libraryName, window[globalName]);
            resolve(window[globalName]);
            return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        script.onload = () => {
            if (window[globalName]) {
                libraryCache.set(libraryName, window[globalName]);
                resolve(window[globalName]);
            } else {
                reject(new Error(`Library ${globalName} not found in window`));
            }
        };
        
        script.onerror = () => {
            reject(new Error(`Failed to load script: ${url}`));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Загружает Chart.js только когда нужен
 * @returns {Promise<*>} Chart.js
 */
export async function loadChartJS() {
    // Chart.js UMD ДОЛЖЕН загружаться через script tag, не через import()
    return await loadScriptLibrary(
        'chartjs',
        'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
        'Chart'
    );
}

/**
 * Загружает QRCode.js только когда нужен
 * @returns {Promise<*>} QRCode
 */
export async function loadQRCode() {
    return await loadLibrary(
        'qrcode',
        'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
        'QRCode'
    );
}

/**
 * Загружает html5-qrcode только когда нужен
 * @returns {Promise<*>} Html5Qrcode
 */
export async function loadHtml5QRCode() {
    return await loadLibrary(
        'html5qrcode',
        'https://unpkg.com/html5-qrcode',
        'Html5Qrcode'
    );
}

/**
 * Загружает jsPDF только когда нужен
 * @returns {Promise<*>} jsPDF
 */
export async function loadJsPDF() {
    return await loadLibrary(
        'jspdf',
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'jspdf'
    );
}

/**
 * Загружает html2canvas только когда нужен
 * @returns {Promise<*>} html2canvas
 */
export async function loadHtml2Canvas() {
    return await loadLibrary(
        'html2canvas',
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        'html2canvas'
    );
}

/**
 * Загружает JsBarcode только когда нужен
 * @returns {Promise<*>} JsBarcode
 */
export async function loadJsBarcode() {
    return await loadLibrary(
        'jsbarcode',
        'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
        'JsBarcode'
    );
}

/**
 * Очищает кэш библиотек
 */
export function clearLibraryCache() {
    libraryCache.clear();
}

