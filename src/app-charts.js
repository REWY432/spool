/**
 * Модуль для работы с графиками
 * @module app-charts
 */

import { loadChartJS } from './utils/dynamicImport.js';
import { getWireType } from './utils/wireType.js';

let modelPieInstance = null;

/**
 * Обновляет графики
 */
async function updateCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const ctxM = document.getElementById('modelPieChart');
    
    if (!ctxM) return;
    
    // Загружаем Chart.js только когда нужен
    const Chart = await loadChartJS();
    
    if (modelPieInstance) {
        modelPieInstance.destroy();
    }
    
    const counts = [
        window.localDB.filter(x => getWireType(x) === 'Китайский').length,
        window.localDB.filter(x => getWireType(x) === 'Favero').length
    ];
    
    modelPieInstance = new Chart(ctxM, {
        type: 'doughnut',
        data: {
            labels: ['Китайский', 'Favero'],
            datasets: [{
                data: counts,
                backgroundColor: ['#0d6efd', '#6f42c1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        color: tickColor
                    }
                }
            }
        }
    });
}
window.updateCharts = updateCharts;

