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
    manufacturer: 'Общество ограниченной ответственности «Юпитер»',
    manufacturerShort: 'ООО «ЮПИТЕР»',
    inn: '7807188191',
    kpp: '780701001',
    address: '198264, Санкт-Петербург, ул. Пограничника Гарькавого д 37 к 1 кв. 25',
    ogrn: '1177847381700',
    email: 'Jup.fencing@gmail.com',
    designer: 'ИП «Ригин Д. В»',
    trademark: 'Inspiration Point'
};

/**
 * Данные о катушке-сматывателе (точный текст по шаблону)
 */
const SPOOL_INFO = {
    name: 'Катушка-сматыватель Inspiration Point «Малевич»',
    designation: 'ТУ 32.30.15–002-74833738-2023',
    
    purpose: `Катушка-сматыватель является оборудованием для вида спорта фехтование и используются для проведения тренировочного процесса и соревнований, а также для регистрации уколов при фехтовании на рапирах и саблях, в соответствии с правилами вида спорта Фехтование. Катушка-сматыватель обеспечивает автоматическое сматывание и разматывание кабеля при движении спортсмена, таким образом, чтобы исключить разрыв кабеля, перемещение катушки-сматывателя и создание помех для движения спортсменов при сматывании или разматывании кабеля.

Катушка-сматыватель обеспечивает электрическое соединение между личным шнуром спортсмена и подводящим кабелем к катушке. Сматывающий механизм позволяет проводу разматываться на 20 метров и обеспечивает его обратное сматывание в корпус катушки. Катушка-сматыватель соответствует требованиям правил Международной федерации фехтования FIE (фр. Federation internationale d'escrime).`,
    
    specs: `Вес Изделия: 5,5 кг, габаритные размеры: 35x35x5см`,
    
    conditions: `Изделие может эксплуатироваться при температуре окружающей среды до плюс 40 °C, и относительной влажности воздуха до 80% при плюс 25 °C.

После транспортирования или хранения при отрицательной температуре, Катушку-сматыватель необходимо выдержать при комнатной температуре не менее 6 часов перед ее применением.`,
    
    package: [
        { item: 'Катушка-сматыватель «Малевич»', designation: 'ТУ 32.30.15–002-74833738-2023', qty: '1 шт.' },
        { item: 'Паспорт Изделия', designation: 'ТУ 32.30.15–002-74833738-2023 ПС', qty: '1 шт.' },
        { item: 'Тара упаковочная', designation: '', qty: '1 шт.' }
    ],
    
    usage: [
        'открыть коробку и распаковать катушку-сматыватель.',
        'аккуратно и надежно установить катушку-сматыватель рядом с концом дорожки.',
        'подключить подводящий шнур к катушке-сматывателю.'
    ],
    
    warranty: `Гарантийный срок службы Катушки-сматывателя – 12 месяцев с момента отгрузки, определяемого по дате на товарной накладной на отгрузку.`,
    
    warrantyWarning: [
        'по истечении гарантийного срока;',
        'при несоблюдении потребителем условий и правил хранения, транспортирования, монтажа и эксплуатации, установленных в эксплуатационной документации.'
    ],
    
    noWarranty: `Катушка-сматыватель, имеющая механические повреждения по вине потребителя и вышедшая из строя вследствие несоблюдения правил транспортирования, эксплуатации или хранения гарантийному ремонту не подлежит.`,
    
    faults: `При обнаружении повреждений Катушки сматывателя или ее неисправного технического состояния следует прекратить эксплуатацию Изделия и обратиться к изготовителю Изделия в случае, если неисправность произошла в период гарантийного срока эксплуатации.`,
    
    packaging: `Изделие стандартно упаковано в картонную коробку. По желанию Заказчика вид упаковки может быть изменен.`
};

/**
 * Форматирует дату изготовления
 * @param {Object} item - Запись катушки
 * @returns {string} Отформатированная дата
 */
function formatProductionDateFull(item) {
    const month = parseInt(item.prodMonth) || new Date().getMonth() + 1;
    const year = parseInt(item.prodYear) || new Date().getFullYear();
    return `${MONTHS[month - 1]} ${year}`;
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
            margin: 8mm 12mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 9pt;
            line-height: 1.25;
            color: #000;
            background: #fff;
        }
        
        .page {
            width: 297mm;
            height: 210mm;
            padding: 8mm 12mm;
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
            padding-bottom: 5px;
            margin-bottom: 8px;
        }
        
        .header h1 {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .content {
            display: flex;
            gap: 12mm;
            flex: 1;
        }
        
        .column {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        h2 {
            font-size: 9pt;
            font-weight: bold;
            margin-top: 6px;
            margin-bottom: 3px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 2px;
        }
        
        .info-label {
            min-width: 160px;
        }
        
        .info-value {
            font-weight: normal;
        }
        
        .manufacturer-block {
            font-size: 8pt;
            margin-top: 5px;
            margin-bottom: 8px;
            padding: 6px 8px;
            border: 1px solid #999;
            border-radius: 4px;
            background: linear-gradient(to bottom, #fafafa, #f0f0f0);
        }
        
        .manufacturer-title {
            font-weight: bold;
            font-size: 8pt;
            color: #333;
            margin-bottom: 3px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2px;
        }
        
        .manufacturer-name {
            font-weight: bold;
            font-size: 9pt;
            color: #000;
            margin-bottom: 4px;
        }
        
        .manufacturer-details {
            width: 100%;
            font-size: 7.5pt;
            border-collapse: collapse;
        }
        
        .manufacturer-details td {
            padding: 1px 0;
            vertical-align: top;
        }
        
        .manufacturer-details td:first-child {
            width: 65px;
            color: #555;
            font-weight: normal;
        }
        
        .manufacturer-details td:last-child {
            color: #000;
        }
        
        p {
            text-align: justify;
            margin-bottom: 4px;
        }
        
        .package-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin: 3px 0;
        }
        
        .package-table td {
            padding: 2px 4px;
            border: 1px solid #000;
        }
        
        ul {
            margin-left: 15px;
            margin-bottom: 4px;
        }
        
        li {
            margin-bottom: 1px;
        }
        
        .warning-text {
            font-weight: bold;
        }
        
        .certificate-box {
            border: 2px solid #000;
            padding: 8px;
            margin-top: 5px;
        }
        
        .certificate-box h3 {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 5px;
        }
        
        .signature-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 8px;
        }
        
        .signature-field {
            border-bottom: 1px solid #000;
            min-width: 100px;
            display: inline-block;
        }
        
        .sale-box {
            border: 2px solid #000;
            padding: 8px;
            margin-top: 5px;
        }
        
        .sale-box h3 {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 5px;
        }
        
        .mp-circle {
            width: 25px;
            height: 25px;
            border: 1px solid #000;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 7pt;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .page {
                margin: 0;
                padding: 8mm 12mm;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Заголовок -->
        <div class="header">
            <h1>ПАСПОРТ ИЗДЕЛИЯ</h1>
        </div>
        
        <!-- Две колонки -->
        <div class="content">
            <!-- ЛЕВАЯ КОЛОНКА -->
            <div class="column">
                <h2>Общие сведения об Изделии:</h2>
                
                <div class="info-row">
                    <span class="info-label">Наименование Изделия:</span>
                    <span class="info-value">${SPOOL_INFO.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Обозначение Изделия:</span>
                    <span class="info-value">${SPOOL_INFO.designation}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Серийный номер Изделия</span>
                    <span class="info-value">№ ${item.serial}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Дата изготовления Изделия</span>
                    <span class="info-value">${dateStr} г.</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Предприятие-проектировщик:</span>
                    <span class="info-value">${COMPANY_INFO.designer}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Торговая марка Изделия:</span>
                    <span class="info-value">${COMPANY_INFO.trademark}</span>
                </div>
                
                <div class="manufacturer-block">
                    <div class="manufacturer-title">Предприятие-изготовитель:</div>
                    <div class="manufacturer-name">${COMPANY_INFO.manufacturer}</div>
                    <table class="manufacturer-details">
                        <tr><td>ИНН/КПП:</td><td>${COMPANY_INFO.inn}/${COMPANY_INFO.kpp}</td></tr>
                        <tr><td>ОГРН:</td><td>${COMPANY_INFO.ogrn}</td></tr>
                        <tr><td>Адрес:</td><td>${COMPANY_INFO.address}</td></tr>
                        <tr><td>Эл. почта:</td><td>${COMPANY_INFO.email}</td></tr>
                    </table>
                </div>
                
                <h2>Назначение изделия и область использования</h2>
                <p>${SPOOL_INFO.purpose.replace(/\n\n/g, '</p><p>')}</p>
                
                <h2>Рабочие параметры, свойства и режимы эксплуатации Изделия</h2>
                <p>${SPOOL_INFO.specs}</p>
                <p>${SPOOL_INFO.conditions.replace(/\n\n/g, '</p><p>')}</p>
                
                <h2>Комплектность поставки Изделия</h2>
                <table class="package-table">
                    ${SPOOL_INFO.package.map(pkg => `
                        <tr>
                            <td>${pkg.item} ${pkg.designation}</td>
                            <td style="width: 40px; text-align: center;">${pkg.qty}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <!-- ПРАВАЯ КОЛОНКА -->
            <div class="column">
                <h2>Правила и порядок эксплуатации/использования</h2>
                <p>Перед эксплуатацией Изделия необходимо:</p>
                <ul>
                    ${SPOOL_INFO.usage.map(step => `<li>${step}</li>`).join('')}
                </ul>
                
                <h2>Гарантийный срок</h2>
                <p>${SPOOL_INFO.warranty}</p>
                <p><span class="warning-text">Внимание!</span> Действие гарантийных обязательств прекращается:</p>
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
                        технической документации и признан годным для эксплуатации.
                    </p>
                    <div class="signature-row">
                        <span>Начальник ОТК <span class="signature-field"></span> / <span class="signature-field" style="min-width: 80px;"></span> /</span>
                        <span class="mp-circle">МП</span>
                    </div>
                    <p style="margin-top: 8px;">«____» _______________ ${currentYear}г.</p>
                </div>
                
                <!-- Отметка о продаже -->
                <div class="sale-box">
                    <h3>Отметка о продаже</h3>
                    <p>Дата продажи: «____» _______________ 20___г.</p>
                    <p>Продавец: ${COMPANY_INFO.manufacturerShort}</p>
                    <div class="signature-row">
                        <span>Подпись продавца: <span class="signature-field"></span></span>
                        <span class="mp-circle">МП</span>
                    </div>
                </div>
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
