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
    purpose: `Катушка-сматыватель является оборудованием для вида спорта фехтование и используется для проведения тренировочного процесса и соревнований. Устройство предназначено для автоматического сматывания и размотки электрошнура фехтовальщика, обеспечивая свободу передвижения спортсмена по дорожке.

Изделие соответствует требованиям Международной Федерации Фехтования (FIE) и может использоваться на соревнованиях любого уровня.`,
    specs: [
        { label: 'Длина шнура', value: '20 метров' },
        { label: 'Сопротивление электрошнура', value: 'не более 2 Ом' },
        { label: 'Усилие натяжения', value: '0,3-0,5 Н' },
        { label: 'Габаритные размеры (ДхШхВ)', value: '180 х 120 х 85 мм' },
        { label: 'Масса', value: 'не более 1,2 кг' }
    ],
    conditions: `Изделие может эксплуатироваться при температуре окружающей среды от минус 10°C до плюс 40°C, и относительной влажности воздуха до 80% при плюс 25°C. После транспортирования или хранения при отрицательной температуре, Катушку-сматыватель необходимо выдержать при комнатной температуре не менее 2 часов перед ее применением.`,
    package: [
        { item: 'Катушка-сматыватель «Малевич»', designation: 'ТУ 32.30.15-001-2044003044-2023', qty: '1 шт.' },
        { item: 'Паспорт Изделия', designation: 'ТУ 32.30.15-001-2044003044-2023 ПС', qty: '1 шт.' },
        { item: 'Тара упаковочная', designation: '', qty: '1 шт.' }
    ],
    usage: [
        'снять упаковочную плёнку;',
        'проверить целостность корпуса и электрошнура;',
        'подключить катушку к аппарату (электрофиксатору);',
        'вытянуть шнур на необходимую длину и подключить к оружию фехтовальщика;',
        'после использования отключить шнур от оружия – шнур автоматически смотается.'
    ],
    warranty: `Гарантийный срок службы Катушки-сматывателя – 12 месяцев с момента отгрузки, определяемого по дате на товарной накладной на отгрузку.`,
    warrantyWarning: [
        'по истечении гарантийного срока;',
        'при несоблюдении потребителем условий и правил хранения, транспортирования, монтажа и эксплуатации, установленных в эксплуатационной документации.'
    ],
    faults: `При обнаружении повреждений Катушки-сматывателя или ее неисправного технического состояния (заедание шнура, механические повреждения, неисправность контактов) следует прекратить ее эксплуатацию и обратиться к изготовителю Изделия.`,
    noWarranty: `Катушка-сматыватель, имеющая механические повреждения по вине потребителя и вышедшая из строя вследствие несоблюдения правил транспортирования, эксплуатации или хранения гарантийному ремонту не подлежит.`,
    packaging: `Изделие стандартно упаковано в картонную коробку с защитным наполнителем. По желанию Заказчика вид упаковки может быть изменен.`
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
 * Генерирует HTML для паспорта
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
            size: A4;
            margin: 15mm 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
            background: white;
            page-break-after: always;
        }
        
        .page:last-child {
            page-break-after: auto;
        }
        
        h1 {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        h2 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 8px;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
        }
        
        .info-table {
            width: 100%;
            margin-bottom: 10px;
        }
        
        .info-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        
        .info-table .label {
            width: 45%;
            font-weight: normal;
        }
        
        .info-table .value {
            font-weight: bold;
        }
        
        .manufacturer-block {
            margin-top: 10px;
            padding: 8px;
            background: #f9f9f9;
            border: 1px solid #ddd;
            font-size: 10pt;
        }
        
        .manufacturer-block strong {
            display: block;
            margin-bottom: 5px;
        }
        
        p {
            text-align: justify;
            margin-bottom: 8px;
        }
        
        .specs-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        .specs-table td {
            padding: 4px 8px;
            border-bottom: 1px dotted #ccc;
        }
        
        .specs-table td:first-child {
            width: 60%;
        }
        
        .specs-table td:last-child {
            font-weight: bold;
        }
        
        .package-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        .package-table th,
        .package-table td {
            border: 1px solid #000;
            padding: 5px 8px;
            text-align: left;
        }
        
        .package-table th {
            background: #f0f0f0;
            font-weight: bold;
        }
        
        ol, ul {
            margin-left: 20px;
            margin-bottom: 10px;
        }
        
        li {
            margin-bottom: 4px;
        }
        
        .warning {
            font-weight: bold;
            margin-top: 10px;
        }
        
        .certificate-box {
            border: 2px solid #000;
            padding: 15px;
            margin: 20px 0;
        }
        
        .certificate-box h3 {
            text-align: center;
            font-size: 13pt;
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        
        .signature-line {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .signature-field {
            border-bottom: 1px solid #000;
            min-width: 150px;
            display: inline-block;
            margin: 0 10px;
        }
        
        .sale-box {
            border: 2px solid #000;
            padding: 15px;
            margin: 20px 0;
        }
        
        .sale-box h3 {
            text-align: center;
            font-size: 13pt;
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        
        .footer-text {
            text-align: center;
            font-size: 10pt;
            margin-top: 20px;
            color: #666;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .page {
                margin: 0;
                padding: 15mm 20mm;
            }
        }
    </style>
</head>
<body>
    <!-- Страница 1 -->
    <div class="page">
        <h1>Паспорт изделия</h1>
        
        <h2>Общие сведения об Изделии</h2>
        
        <table class="info-table">
            <tr>
                <td class="label">Наименование Изделия:</td>
                <td class="value">${SPOOL_INFO.name}</td>
            </tr>
            <tr>
                <td class="label">Обозначение Изделия:</td>
                <td class="value">${SPOOL_INFO.designation}</td>
            </tr>
            <tr>
                <td class="label">Серийный номер Изделия:</td>
                <td class="value">№ ${item.serial}</td>
            </tr>
            <tr>
                <td class="label">Дата изготовления Изделия:</td>
                <td class="value">${dateStr}</td>
            </tr>
            <tr>
                <td class="label">Предприятие-проектировщик:</td>
                <td class="value">${COMPANY_INFO.designer}</td>
            </tr>
            <tr>
                <td class="label">Торговая марка Изделия:</td>
                <td class="value">${COMPANY_INFO.trademark}</td>
            </tr>
        </table>
        
        <div class="manufacturer-block">
            <strong>Предприятие-изготовитель:</strong>
            ${COMPANY_INFO.manufacturer}<br>
            ИНН/КПП ${COMPANY_INFO.inn}/${COMPANY_INFO.kpp}<br>
            ${COMPANY_INFO.address}<br>
            ОГРН ${COMPANY_INFO.ogrn}; эл. почта: ${COMPANY_INFO.email}
        </div>
        
        <h2>Назначение изделия и область использования</h2>
        <p>${SPOOL_INFO.purpose.replace(/\n/g, '</p><p>')}</p>
        
        <h2>Рабочие параметры, свойства и режимы эксплуатации Изделия</h2>
        
        <table class="specs-table">
            ${SPOOL_INFO.specs.map(spec => `
                <tr>
                    <td>${spec.label}:</td>
                    <td>${spec.value}</td>
                </tr>
            `).join('')}
        </table>
        
        <p>${SPOOL_INFO.conditions}</p>
        
        <h2>Комплектность поставки Изделия</h2>
        
        <table class="package-table">
            <tr>
                <th>Наименование</th>
                <th>Обозначение</th>
                <th>Кол-во</th>
            </tr>
            ${SPOOL_INFO.package.map(pkg => `
                <tr>
                    <td>${pkg.item}</td>
                    <td>${pkg.designation}</td>
                    <td>${pkg.qty}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    
    <!-- Страница 2 -->
    <div class="page">
        <h2>Правила и порядок эксплуатации/использования</h2>
        <p>Перед эксплуатацией Изделия необходимо:</p>
        <ol>
            ${SPOOL_INFO.usage.map(step => `<li>${step}</li>`).join('')}
        </ol>
        
        <h2>Гарантийный срок</h2>
        <p>${SPOOL_INFO.warranty}</p>
        
        <p class="warning">Внимание! Действие гарантийных обязательств прекращается:</p>
        <ul>
            ${SPOOL_INFO.warrantyWarning.map(w => `<li>${w}</li>`).join('')}
        </ul>
        
        <p>${SPOOL_INFO.noWarranty}</p>
        
        <h2>Возможные неисправности и поломки, способы их диагностики и пути устранения</h2>
        <p>${SPOOL_INFO.faults}</p>
        
        <h2>Упаковка</h2>
        <p>${SPOOL_INFO.packaging}</p>
        
        <!-- Свидетельство о приемке -->
        <div class="certificate-box">
            <h3>Свидетельство о приемке</h3>
            <p>
                Катушка-сматыватель серийный № <strong>${item.serial}</strong>, изготовлена и принята 
                в соответствии с обязательными требованиями национальных стандартов, действующей 
                технической документации и признана годной для эксплуатации.
            </p>
            <div class="signature-line">
                <span>ОТК <span class="signature-field"></span> /${COMPANY_INFO.otkName}/</span>
            </div>
            <p style="margin-top: 15px;">«___» _______________ ${currentYear} г.</p>
        </div>
        
        <!-- Отметка о продаже -->
        <div class="sale-box">
            <h3>Отметка о продаже</h3>
            <p>Дата продажи: «___» _______________ 20___ г.</p>
            <p style="margin-top: 10px;">Продавец: ${COMPANY_INFO.manufacturerShort}</p>
            <div class="signature-line" style="margin-top: 15px;">
                <span>Подпись: <span class="signature-field"></span></span>
                <span style="margin-left: 50px;">М.П.</span>
            </div>
        </div>
        
        <p class="footer-text">Сделано в России</p>
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
    const win = window.open('', '_blank', 'width=900,height=700');
    
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
        container.style.width = '210mm';
        container.innerHTML = generatePassportHTML(item);
        document.body.appendChild(container);
        
        const pages = container.querySelectorAll('.page');
        const doc = new jsPDF({
            orientation: 'portrait',
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
            
            doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
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
    
    // Генерируем HTML для всех паспортов
    const allHtml = items.map(item => generatePassportHTML(item).replace(/<\/?html[^>]*>|<\/?head[^>]*>|<\/?body[^>]*>|<meta[^>]*>|<title[^>]*>.*?<\/title>|<style[^>]*>[\s\S]*?<\/style>/gi, '')).join('');
    
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
    
    const win = window.open('', '_blank', 'width=900,height=700');
    
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
        
        // Создаем один большой PDF со всеми паспортами
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        let isFirstPage = true;
        
        for (const item of items) {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '-10000px';
            container.style.left = '-10000px';
            container.style.width = '210mm';
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
                
                doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
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
