// Inventory Management JavaScript
import { fetchWithErrorHandling, showErrorMessage } from './utils.js';

// Constants
const REFRESH_INTERVAL = 300000; // 5 minutes
const CACHE_KEY = 'inventory_data';
const CACHE_DURATION = 300000; // 5 minutes

// DOM Elements
const inventoryTable = document.getElementById('inventoryItemsTable');
const refreshTableBtn = document.getElementById('refreshTableBtn');
const loadingSpinner = document.createElement('div');

// Initialize loading spinner
loadingSpinner.className = 'text-center my-4 d-none';
loadingSpinner.innerHTML = `
    <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">جاري التحميل...</span>
    </div>
`;
inventoryTable.parentNode.insertBefore(loadingSpinner, inventoryTable);

// Cache management
function getCachedData() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
    return data;
}

function setCachedData(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
    }));
}

// Fetch and display inventory data
async function fetchInventoryData(forceRefresh = false) {
    try {
        loadingSpinner.classList.remove('d-none');
        inventoryTable.classList.add('d-none');

        // Check cache first if not forcing refresh
        if (!forceRefresh) {
            const cachedData = getCachedData();
            if (cachedData) {
                updateInventoryTable(cachedData);
                return;
            }
        }

        const result = await fetchWithErrorHandling('/inventory');
        if (!result.success) {
            throw new Error(result.error);
        }

        const data = result.data;
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format received from server');
        }

        if (data.length === 0) {
            showError('لا توجد عناصر في المخزون');
        } else {
            setCachedData(data);
            updateInventoryTable(data);
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
        showErrorMessage('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى');
        
        // Try to use cached data as fallback
        const cachedData = getCachedData();
        if (cachedData) {
            updateInventoryTable(cachedData);
        }
    } finally {
        loadingSpinner.classList.add('d-none');
        inventoryTable.classList.remove('d-none');
    }
}

// Update table with inventory data
function updateInventoryTable(data) {
    const tbody = inventoryTable.querySelector('tbody') || inventoryTable.createTBody();
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">لا توجد عناصر في المخزون</td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.itemId || '-'}</td>
            <td>${item.name || '-'}</td>
            <td>${item.category || '-'}</td>
            <td>${item.price ? `${item.price} ريال` : '-'}</td>
            <td>
                <span class="badge ${getQuantityBadgeClass(item.quantity)}">
                    ${item.quantity || 0}
                </span>
            </td>
        `;
        row.addEventListener('click', () => showItemDetails(item));
    });
}

// Get appropriate badge class based on quantity
function getQuantityBadgeClass(quantity) {
    if (quantity <= 0) return 'bg-danger';
    if (quantity <= 10) return 'bg-warning';
    return 'bg-success';
}

// Show error message
function showError(message) {
    const tbody = inventoryTable.querySelector('tbody') || inventoryTable.createTBody();
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>${message}
            </td>
        </tr>
    `;
}

// Show item details in modal
function showItemDetails(item) {
    // Update modal content with item details
    document.getElementById('viewItemId').textContent = item.itemId || '-';
    document.getElementById('viewItemName').textContent = item.name || '-';
    document.getElementById('viewItemCategory').textContent = item.category || '-';
    document.getElementById('viewItemPrice').textContent = item.price ? `${item.price} ريال` : '-';
    
    // Update stock level
    const stockLevel = document.getElementById('viewStockLevel');
    const progressBar = document.querySelector('.progress-bar');
    const percentage = Math.min(Math.max((item.quantity / 100) * 100, 0), 100);
    
    stockLevel.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
    progressBar.className = `progress-bar ${getProgressBarClass(percentage)}`;

    // Show movement history if available
    const historyBody = document.getElementById('stockMovementHistory');
    historyBody.innerHTML = '';

    if (item.movements && item.movements.length > 0) {
        item.movements.forEach(movement => {
            const row = historyBody.insertRow();
            row.innerHTML = `
                <td>${new Date(movement.date).toLocaleDateString('ar-SA')}</td>
                <td>${movement.type === 'in' ? 'وارد' : 'صادر'}</td>
                <td>${movement.quantity}</td>
                <td>${movement.userId || '-'}</td>
                <td>${movement.notes || '-'}</td>
            `;
        });
    } else {
        historyBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">لا يوجد سجل حركة</td>
            </tr>
        `;
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewItemModal'));
    modal.show();
}

// Get progress bar class based on percentage
function getProgressBarClass(percentage) {
    if (percentage <= 25) return 'bg-danger';
    if (percentage <= 50) return 'bg-warning';
    return 'bg-success';
}

// Event Listeners
refreshTableBtn.addEventListener('click', fetchInventoryData);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    fetchInventoryData();
    // Set up auto-refresh
    setInterval(fetchInventoryData, REFRESH_INTERVAL);
});