/**
 * Модуль для печати этикеток и паспортов
 * @module app-print
 */

import { loadQRCode, loadJsBarcode, loadJsPDF, loadHtml2Canvas } from './utils/dynamicImport.js';
import { formatProductionDate } from './utils/date.js';
import { MONTHS } from './config/constants.js';

/**
 * Генерирует SVG штрихкода
 * @param {string} code - Код для штрихкода
 * @returns {Promise<string>} SVG код
 */
async function generateBarcodeSVG(code) {
    if (!code) return "";
    
    try {
        const JsBarcode = await loadJsBarcode();
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        
        JsBarcode(svg, code, {
            format: "EAN13",
            width: 1.4,
            height: 25,
            displayValue: true,
            fontSize: 12,
            margin: 0
        });
        
        return new XMLSerializer().serializeToString(svg);
    } catch (e) {
        console.error("Barcode gen error", e);
        return "";
    }
}
window.generateBarcodeSVG = generateBarcodeSVG;

/**
 * Печатает этикетку для одной катушки
 * @param {string} id - ID катушки
 */
async function printLabel(id) {
    const item = window.localDB.find(x => x.id === id);
    if (!item) return;
    
    const sModel = item.spoolModel || "2024";
    const setting = (window.appSettings.models || []).find(m => m.year === sModel);
    const eanCode = setting ? setting.ean : "";
    const barcodeSvg = await generateBarcodeSVG(eanCode);
    
    const QRCode = await loadQRCode();
    
    const html = `
        <div class="label-container">
            <div class="qr-box">
                <div id="qr-${item.id}"></div>
                <div class="sn-text">${item.serial}</div>
            </div>
            <div class="barcode-container">
                ${barcodeSvg}
            </div>
        </div>
        <script>
            new QRCode(document.getElementById("qr-${item.id}"), { 
                text: "${item.globalSeq}", 
                width: 80, 
                height: 80, 
                correctLevel: QRCode.CorrectLevel.M 
            });
        <\/script>`;
    
    const win = window.open('', '', 'width=400,height=400');
    win.document.write(`
        <html>
        <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
            <style>
                @page{size:58mm 40mm;margin:0}
                body{margin:0;font-family:sans-serif}
                .label-container{width:58mm;height:40mm;display:flex;flex-direction:column;justify-content:center;align-items:center;border:1px dashed #ddd;box-sizing:border-box;overflow:hidden;page-break-after:always; padding: 2px;}
                .qr-box{display:flex;flex-direction:column;align-items:center;justify-content:center; margin-bottom: 0px;}
                .sn-text{font-weight:800;font-size:14px;font-family:monospace;margin-top:2px}
                .ean-text{font-size:10px;font-family:monospace;color:#666;margin-top:1px}
                .barcode-container svg { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>${html}<script>setTimeout(()=>window.print(),500)<\/script></body>
        </html>`);
}
window.printLabel = printLabel;

/**
 * Печатает паспорт катушки
 * @param {string} id - ID катушки
 */
function printPassport(id) {
    const item = window.localDB.find(x => x.id === id);
    if (!item) return;

    const dateStr = formatProductionDate(item);

    const html = `
        <div class="label-container">
            <div class="header">Катушка-сматыватель<br>«Малевич»</div>
            <div class="main-info">
                <div class="row">
                    <span class="label">Серийный номер:</span>
                    <span class="value">${item.serial}</span>
                </div>
                <div class="row">
                    <span class="label">Дата изготовления:</span>
                    <span class="value">${dateStr}</span>
                </div>
            </div>
            <div class="manufacturer">
                <div class="man-label">Производитель:</div>
                <div class="man-value">ООО «Юпитер»</div>
            </div>
            <div class="footer">Сделано в России</div>
        </div>`;

    const win = window.open('', '', 'width=400,height=400');
    win.document.write(`
        <html>
        <head>
            <style>
                @page { size: 58mm 40mm; margin: 0; }
                body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; }
                .label-container {
                    width: 58mm; height: 40mm; padding: 2mm 3mm; box-sizing: border-box;
                    display: flex; flex-direction: column; justify-content: space-between; text-align: center;
                }
                .header { font-weight: bold; font-size: 11pt; line-height: 1.1; margin-bottom: 2mm; }
                .main-info { text-align: left; font-size: 9pt; line-height: 1.3; margin-bottom: 2mm; }
                .row { display: block; }
                .label { font-weight: normal; }
                .value { font-weight: bold; padding-left: 3px; }
                .manufacturer { text-align: left; font-size: 8pt; line-height: 1.2; }
                .man-label { font-weight: normal; }
                .man-value { font-weight: bold; }
                .footer { font-size: 7pt; font-weight: bold; margin-top: auto; text-align: center; width: 100%; }
            </style>
        </head>
        <body>${html}<script>setTimeout(() => window.print(), 500);<\/script></body>
        </html>
    `);
}
window.printPassport = printPassport;

/**
 * Массовая печать этикеток
 */
async function bulkPrint() {
    if (selectedIds.size === 0) return;
    
    const items = window.localDB.filter(x => selectedIds.has(x.id));
    const win = window.open('', '', 'width=800,height=600');
    
    const QRCode = await loadQRCode();
    
    const content = await Promise.all(items.map(async item => {
        const sModel = item.spoolModel || "2024";
        const setting = (window.appSettings.models || []).find(m => m.year === sModel);
        const eanCode = setting ? setting.ean : "";
        const barcodeSvg = await generateBarcodeSVG(eanCode);
        
        return `
            <div class="label-container">
                <div class="qr-box">
                    <div id="qr-${item.id}"></div>
                    <div class="sn-text">${item.serial}</div>
                    ${eanCode ? `<div class="ean-text">${eanCode}</div>` : ''}
                </div>
                <div class="barcode-container">
                    ${barcodeSvg}
                </div>
            </div>
            <script>
                new QRCode(document.getElementById("qr-${item.id}"), { 
                    text: "${item.globalSeq}", 
                    width: 80, 
                    height: 80, 
                    correctLevel: QRCode.CorrectLevel.M 
                });
            <\/script>`;
    }));
    
    win.document.write(`
        <html>
        <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
            <style>
                @page{size:58mm 40mm;margin:0}
                body{margin:0;font-family:sans-serif}
                .label-container{width:58mm;height:40mm;display:flex;flex-direction:column;justify-content:center;align-items:center;border:1px dashed #ddd;box-sizing:border-box;overflow:hidden;padding:2px;}
                .qr-box{display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:0px;}
                .sn-text{font-weight:800;font-size:14px;font-family:monospace;margin-top:2px}
                .ean-text{font-size:10px;font-family:monospace;color:#666;margin-top:1px}
                .barcode-container svg { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>${content.join('<div style="page-break-after: always; height: 1px;"></div>')}<script>setTimeout(()=>window.print(),1000)<\/script></body>
        </html>`);
}
window.bulkPrint = bulkPrint;

/**
 * Массовая печать паспортов
 */
async function bulkPrintPassports() {
    if (selectedIds.size === 0) {
        showToast('Выберите хотя бы одну катушку', 'warning');
        return;
    }
    
    const items = window.localDB.filter(x => selectedIds.has(x.id));
    const { jsPDF } = await loadJsPDF();
    const html2canvas = await loadHtml2Canvas();
    
    showToast('Генерация PDF...', 'info');
    
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [58, 40]
    });
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    document.body.appendChild(container);
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const dateStr = formatProductionDate(item);
        
        container.innerHTML = `
            <div style="width: 58mm; height: 40mm; padding: 2mm 3mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; text-align: center; background: white; font-family: Arial, sans-serif;">
                <div style="font-weight: bold; font-size: 11pt; line-height: 1.1; margin-bottom: 2mm;">Катушка-сматыватель<br>«Малевич»</div>
                <div style="text-align: left; font-size: 9pt; line-height: 1.3; margin-bottom: 2mm;">
                    <div style="display: block;"><span style="font-weight: normal;">Серийный номер:</span> <span style="font-weight: bold; padding-left: 3px;">${item.serial}</span></div>
                    <div style="display: block;"><span style="font-weight: normal;">Дата изготовления:</span> <span style="font-weight: bold; padding-left: 3px;">${dateStr}</span></div>
                </div>
                <div style="text-align: left; font-size: 8pt; line-height: 1.2;">
                    <div style="font-weight: normal;">Производитель:</div>
                    <div style="font-weight: bold;">ООО «Юпитер»</div>
                </div>
                <div style="font-size: 7pt; font-weight: bold; margin-top: auto; width: 100%;">Сделано в России</div>
            </div>
        `;
        
        await new Promise(r => setTimeout(r, 10));
        const canvas = await html2canvas(container.firstElementChild, { scale: 4 });
        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) doc.addPage();
        doc.addImage(imgData, 'PNG', 0, 0, 58, 40);
    }
    
    document.body.removeChild(container);
    
    const pdfBlob = doc.output('bloburl');
    const printWin = window.open(pdfBlob);
    if (printWin) {
        showToast('PDF открыт. Нажмите печать в браузере.');
    } else {
        doc.save('Passports_Batch.pdf');
        showToast('PDF скачан (всплывающие окна заблокированы');
    }
    if (window.clearSelection) {
        window.clearSelection();
    }
}
window.bulkPrintPassports = bulkPrintPassports;

// Используем глобальную функцию showToast
const showToast = (msg, type) => {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}] ${msg}`);
    }
};

