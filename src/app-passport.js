/**
 * Модуль для генерации паспортов изделий
 * @module app-passport
 */

import { loadJsPDF, loadHtml2Canvas } from './utils/dynamicImport.js';
import { MONTHS } from './config/constants.js';

/**
 * Данные о компании для паспорта
 */
const COMPANY_INFO = {
    manufacturer: 'Общество с ограниченной ответственностью «Юпитер»',
    manufacturerShort: 'ООО «ЮПИТЕР»',
    inn: '7807188191',
    kpp: '780701001',
    address: '198264, Санкт-Петербург, ул. Пограничника Гарькавого д 37 к 1 кв. 25',
    ogrn: '1177847381700',
    email: 'Jup.fencing@gmail.com',
    designer: 'ИП «Ригин Д. В»',
    trademark: '«Малевич»',
    otkName: 'РИГИН Д.В.'
};

/**
 * Данные о катушке-сматывателе
 */
const SPOOL_INFO = {
    name: 'Катушка-сматыватель «Малевич»',
    designation: 'ТУ 32.30.15-001-2044003044-2023',
    purpose: `Катушка-сматыватель является оборудованием для вида спорта фехтование и используется для проведения тренировочного процесса и соревнований. Устройство предназначено для автоматического сматывания и размотки электрошнура фехтовальщика.`,
    specs: [
        { label: 'Длина шнура', value: '20 м' },
        { label: 'Сопротивление', value: '≤ 2 Ом' },
        { label: 'Усилие натяжения', value: '0,3-0,5 Н' },
        { label: 'Габариты (ДхШхВ)', value: '180×120×85 мм' },
        { label: 'Масса', value: '≤ 1,2 кг' }
    ],
    conditions: `Эксплуатация при температуре от -10°C до +40°C, влажности до 80% при +25°C.`,
    package: [
        { item: 'Катушка-сматыватель «Малевич»', qty: '1 шт.' },
        { item: 'Паспорт Изделия', qty: '1 шт.' },
        { item: 'Упаковка', qty: '1 шт.' }
    ],
    usage: [
        'снять упаковку и проверить целостность;',
        'подключить катушку к аппарату;',
        'вытянуть шнур и подключить к оружию;',
        'после использования отключить шнур.'
    ],
    warranty: `Гарантийный срок – 12 месяцев с момента отгрузки.`,
    warrantyWarning: 'Гарантия не распространяется на механические повреждения по вине потребителя.',
    faults: `При обнаружении неисправностей обратитесь к изготовителю.`
};

/**
 * Форматирует дату изготовления
 * @param {Object} item - Запись катушки
 * @returns {string} Отформатированная дата
 */
function formatProductionDateFull(item) {
    const month = parseInt(item.prodMonth) || new Date().getMonth() + 1;
    const year = parseInt(item.prodYear) || new Date().getFullYear();
    return `${MONTHS[month - 1]} ${year} г.`;
}

/**
 * Генерирует HTML для паспорта (альбомный формат)
 * @param {Object} item - Данные катушки
 * @returns {string} HTML строка
 */
function generatePassportHTML(item) {
    const dateStr = formatProductionDateFull(item);
    const currentYear = item.prodYear || new Date().getFullYear();
    
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Паспорт изделия - ${item.serial}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
            background: #fff;
        }
        
        .page {
            width: 297mm;
            height: 210mm;
            padding: 10mm 15mm;
            background: white;
            page-break-after: always;
            display: flex;
            flex-direction: column;
        }
        
        .page:last-child {
            page-break-after: auto;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }
        
        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 5px;
        }
        
        .header .product-name {
            font-size: 14pt;
            font-weight: bold;
        }
        
        .content {
            display: flex;
            gap: 15mm;
            flex: 1;
        }
        
        .column {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        h2 {
            font-size: 10pt;
            font-weight: bold;
            margin-top: 8px;
            margin-bottom: 5px;
            background: #f0f0f0;
            padding: 3px 6px;
            border-left: 3px solid #333;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        
        .info-table td {
            padding: 2px 4px;
            vertical-align: top;
            border-bottom: 1px dotted #ccc;
        }
        
        .info-table .label {
            width: 50%;
            color: #555;
        }
        
        .info-table .value {
            font-weight: bold;
        }
        
        .manufacturer-block {
            font-size: 8pt;
            padding: 5px;
            background: #f9f9f9;
            border: 1px solid #ddd;
            margin-top: 5px;
        }
        
        p {
            text-align: justify;
            margin-bottom: 5px;
            font-size: 9pt;
        }
        
        .specs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }
        
        .specs-table td {
            padding: 2px 5px;
            border-bottom: 1px dotted #ccc;
        }
        
        .specs-table td:last-child {
            font-weight: bold;
            text-align: right;
        }
        
        .package-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }
        
        .package-table td {
            padding: 2px 5px;
            border: 1px solid #999;
        }
        
        ol, ul {
            margin-left: 15px;
            font-size: 9pt;
        }
        
        li {
            margin-bottom: 2px;
        }
        
        .certificate-box {
            border: 2px solid #000;
            padding: 8px;
            margin-top: auto;
            font-size: 9pt;
        }
        
        .certificate-box h3 {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .signature-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
        }
        
        .signature-field {
            border-bottom: 1px solid #000;
            min-width: 80px;
            display: inline-block;
            margin: 0 5px;
        }
        
        .sale-box {
            border: 2px solid #000;
            padding: 8px;
            margin-top: 8px;
            font-size: 9pt;
        }
        
        .sale-box h3 {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .sale-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
        }
        
        .footer-text {
            text-align: center;
            font-size: 9pt;
            margin-top: 8px;
            font-weight: bold;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .page {
                margin: 0;
                padding: 10mm 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Заголовок -->
        <div class="header">
            <h1>Паспорт изделия</h1>
            <div class="product-name">${SPOOL_INFO.name}</div>
        </div>
        
        <!-- Две колонки -->
        <div class="content">
            <!-- ЛЕВАЯ КОЛОНКА -->
            <div class="column">
                <h2>Общие сведения</h2>
                <table class="info-table">
                    <tr>
                        <td class="label">Обозначение:</td>
                        <td class="value">${SPOOL_INFO.designation}</td>
                    </tr>
                    <tr>
                        <td class="label">Серийный номер:</td>
                        <td class="value">№ ${item.serial}</td>
                    </tr>
                    <tr>
                        <td class="label">Дата изготовления:</td>
                        <td class="value">${dateStr}</td>
                    </tr>
                    <tr>
                        <td class="label">Проектировщик:</td>
                        <td class="value">${COMPANY_INFO.designer}</td>
                    </tr>
                    <tr>
                        <td class="label">Торговая марка:</td>
                        <td class="value">${COMPANY_INFO.trademark}</td>
                    </tr>
                </table>
                
                <div class="manufacturer-block">
                    <strong>Изготовитель:</strong> ${COMPANY_INFO.manufacturer}<br>
                    ИНН ${COMPANY_INFO.inn} | ОГРН ${COMPANY_INFO.ogrn}<br>
                    ${COMPANY_INFO.address}<br>
                    Email: ${COMPANY_INFO.email}
                </div>
                
                <h2>Назначение</h2>
                <p>${SPOOL_INFO.purpose}</p>
                
                <h2>Технические характеристики</h2>
                <table class="specs-table">
                    ${SPOOL_INFO.specs.map(spec => `
                        <tr>
                            <td>${spec.label}</td>
                            <td>${spec.value}</td>
                        </tr>
                    `).join('')}
                </table>
                <p style="font-size: 8pt; margin-top: 5px;">${SPOOL_INFO.conditions}</p>
                
                <h2>Комплект поставки</h2>
                <table class="package-table">
                    ${SPOOL_INFO.package.map(pkg => `
                        <tr>
                            <td>${pkg.item}</td>
                            <td style="text-align: center; width: 50px;">${pkg.qty}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <!-- ПРАВАЯ КОЛОНКА -->
            <div class="column">
                <h2>Порядок эксплуатации</h2>
                <ol>
                    ${SPOOL_INFO.usage.map(step => `<li>${step}</li>`).join('')}
                </ol>
                
                <h2>Гарантийные обязательства</h2>
                <p>${SPOOL_INFO.warranty}</p>
                <p style="font-size: 8pt; color: #666;">${SPOOL_INFO.warrantyWarning}</p>
                
                <h2>Неисправности</h2>
                <p>${SPOOL_INFO.faults}</p>
                
                <!-- Свидетельство о приемке -->
                <div class="certificate-box">
                    <h3>Свидетельство о приемке</h3>
                    <p>
                        Изделие серийный № <strong>${item.serial}</strong> изготовлено и принято 
                        в соответствии с требованиями стандартов и признано годным для эксплуатации.
                    </p>
                    <div class="signature-row">
                        <span>ОТК <span class="signature-field"></span> /${COMPANY_INFO.otkName}/</span>
                        <span>«___» ____________ ${currentYear} г.</span>
                    </div>
                </div>
                
                <!-- Отметка о продаже -->
                <div class="sale-box">
                    <h3>Отметка о продаже</h3>
                    <div class="sale-row">
                        <span>Дата: «___» __________ 20___ г.</span>
                        <span>Продавец: ${COMPANY_INFO.manufacturerShort}</span>
                    </div>
                    <div class="signature-row" style="margin-top: 8px;">
                        <span>Подпись: <span class="signature-field"></span></span>
                        <span>М.П.</span>
                    </div>
                </div>
                
                <p class="footer-text">Сделано в России 🇷🇺</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Открывает паспорт для печати в новом окне
 * @param {string} id - ID катушки
 */
function printFullPassport(id) {
    const item = window.localDB.find(x => x.id === id);
    if (!item) {
        window.showToast('Катушка не найдена', 'error');
        return;
    }
    
    const html = generatePassportHTML(item);
    const win = window.open('', '_blank', 'width=1000,height=700');
    
    if (win) {
        win.document.write(html);
        win.document.close();
        
        // Даем время на загрузку стилей
        setTimeout(() => {
            win.print();
        }, 500);
        
        window.showToast('Паспорт открыт для печати', 'success');
    } else {
        window.showToast('Не удалось открыть окно. Проверьте блокировщик popup.', 'error');
    }
}
window.printFullPassport = printFullPassport;

/**
 * Скачивает паспорт как PDF
 * @param {string} id - ID катушки
 */
async function downloadPassport(id) {
    const item = window.localDB.find(x => x.id === id);
    if (!item) {
        window.showToast('Катушка не найдена', 'error');
        return;
    }
    
    try {
        window.showToast('Генерация PDF...', 'info');
        
        const { jsPDF } = await loadJsPDF();
        const html2canvas = await loadHtml2Canvas();
        
        // Создаем временный контейнер
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-10000px';
        container.style.left = '-10000px';
        container.style.width = '297mm';
        container.innerHTML = generatePassportHTML(item);
        document.body.appendChild(container);
        
        const pages = container.querySelectorAll('.page');
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            
            await new Promise(r => setTimeout(r, 100));
            
            const canvas = await html2canvas(page, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            if (i > 0) {
                doc.addPage();
            }
            
            // Альбомный формат: 297 x 210
            doc.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        }
        
        document.body.removeChild(container);
        
        const fileName = `Паспорт_${item.serial.replace(/[\/\\:*?"<>|]/g, '_')}.pdf`;
        doc.save(fileName);
        
        window.showToast('Паспорт сохранен: ' + fileName, 'success');
    } catch (error) {
        console.error('Passport generation error:', error);
        window.showToast('Ошибка генерации: ' + error.message, 'error');
    }
}
window.downloadPassport = downloadPassport;

/**
 * Массовая печать паспортов
 */
async function bulkPrintFullPassports() {
    const selectedIds = window.selectedIds || new Set();
    
    if (!selectedIds || selectedIds.size === 0) {
        window.showToast('Выберите хотя бы одну катушку', 'warning');
        return;
    }
    
    const items = window.localDB.filter(x => selectedIds.has(x.id));
    
    // Берем стили из первого паспорта
    const firstHtml = generatePassportHTML(items[0]);
    const styleMatch = firstHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styles = styleMatch ? styleMatch[1] : '';
    
    const combinedHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Паспорта изделий (${items.length} шт.)</title>
    <style>${styles}</style>
</head>
<body>
    ${items.map(item => {
        const html = generatePassportHTML(item);
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        return bodyMatch ? bodyMatch[1] : '';
    }).join('')}
</body>
</html>`;
    
    const win = window.open('', '_blank', 'width=1000,height=700');
    
    if (win) {
        win.document.write(combinedHtml);
        win.document.close();
        
        setTimeout(() => {
            win.print();
        }, 800);
        
        window.showToast(`Открыто ${items.length} паспортов для печати`, 'success');
    } else {
        window.showToast('Не удалось открыть окно. Проверьте блокировщик popup.', 'error');
    }
    
    if (window.clearSelection) {
        window.clearSelection();
    }
}
window.bulkPrintFullPassports = bulkPrintFullPassports;

/**
 * Массовое скачивание паспортов как PDF
 */
async function bulkDownloadPassports() {
    const selectedIds = window.selectedIds || new Set();
    
    if (!selectedIds || selectedIds.size === 0) {
        window.showToast('Выберите хотя бы одну катушку', 'warning');
        return;
    }
    
    const items = window.localDB.filter(x => selectedIds.has(x.id));
    
    window.showToast(`Генерация ${items.length} паспортов...`, 'info');
    
    try {
        const { jsPDF } = await loadJsPDF();
        const html2canvas = await loadHtml2Canvas();
        
        // Создаем один большой PDF со всеми паспортами (альбомный)
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        let isFirstPage = true;
        
        for (const item of items) {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '-10000px';
            container.style.left = '-10000px';
            container.style.width = '297mm';
            container.innerHTML = generatePassportHTML(item);
            document.body.appendChild(container);
            
            const pages = container.querySelectorAll('.page');
            
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                
                await new Promise(r => setTimeout(r, 50));
                
                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.92);
                
                if (!isFirstPage) {
                    doc.addPage();
                }
                isFirstPage = false;
                
                // Альбомный формат: 297 x 210
                doc.addImage(imgData, 'JPEG', 0, 0, 297, 210);
            }
            
            document.body.removeChild(container);
        }
        
        const fileName = `Паспорта_${items.length}_шт_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        
        window.showToast(`Сохранено ${items.length} паспортов в ${fileName}`, 'success');
        
        if (window.clearSelection) {
            window.clearSelection();
        }
    } catch (error) {
        console.error('Bulk passport error:', error);
        window.showToast('Ошибка генерации: ' + error.message, 'error');
    }
}
window.bulkDownloadPassports = bulkDownloadPassports;

export { generatePassportHTML, printFullPassport, downloadPassport, bulkPrintFullPassports, bulkDownloadPassports };
