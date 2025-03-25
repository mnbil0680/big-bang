import { fetchWithErrorHandling, formatDate, formatPhoneNumber } from './utils.js';

let customersTable;
const CACHE_KEY = 'customers_data';
const CACHE_DURATION = 300000; // 5 minutes

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

// Initialize DataTable
async function initializeCustomersTable(forceRefresh = false) {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
            initializeTable(cachedData);
            return;
        }
    }

    const result = await fetchWithErrorHandling('/customers');
    if (!result.success) return;

    const customers = result.data;
    setCachedData(customers);
    initializeTable(customers);
}

function initializeTable(customers) {
    if (customersTable) {
        customersTable.destroy();
    }

    customersTable = new DataTable('#customersTable', {
        data: customers,
        columns: [
            { 
                data: null,
                title: 'اسم العميل',
                className: 'align-middle',
                render: function(data) {
                    return `
                        <div class="d-flex align-items-center gap-3">
                            <div class="customer-avatar rounded-circle d-flex align-items-center justify-content-center">
                                ${data.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h6 class="mb-0">${data.name}</h6>
                                <small class="text-muted">${formatDate(data.createdAt)}</small>
                            </div>
                        </div>
                    `;
                }
            },
            { 
                data: 'phone',
                title: 'رقم الجوال',
                className: 'align-middle text-center',
                render: function(data) {
                    return `<span class="phone-number" dir="ltr">${formatPhoneNumber(data)}</span>`;
                }
            },
            { 
                data: 'address',
                title: 'العنوان',
                className: 'align-middle',
                render: function(data) {
                    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                        return '<span class="text-muted"><i class="bi bi-dash-circle"></i> لا يوجد عنوان</span>';
                    }
                    
                    const addressParts = [];
                    if (data.street) addressParts.push(`<span class="text-dark">شارع ${data.street}</span>`);
                    if (data.district) addressParts.push(`<span class="text-dark">حي ${data.district}</span>`);
                    if (data.city) addressParts.push(`<span class="text-dark">مدينة ${data.city}</span>`);

                    if (addressParts.length === 0) {
                        return '<span class="text-muted"><i class="bi bi-dash-circle"></i> لا يوجد عنوان</span>';
                    }
                    
                    const fullAddress = addressParts.join('<span class="text-muted mx-1">|</span>');
                    
                    return `
                        <div class="address-wrapper position-relative" 
                             data-bs-toggle="tooltip" 
                             data-bs-placement="top"
                             data-bs-html="true"
                             title="${fullAddress}">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-geo-alt text-primary me-2"></i>
                                <div class="text-truncate" style="max-width: 200px;">
                                    ${addressParts[0]}
                                    ${addressParts.length > 1 ? 
                                        `<span class="badge bg-light text-muted ms-1">+${addressParts.length - 1}</span>` 
                                        : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }
            },
            {
                data: 'type',
                title: 'نوع العميل',
                className: 'align-middle text-center',
                render: function(data) {
                    const types = {
                        company: { class: 'badge-soft-info', text: 'شركة' },
                        individual: { class: 'badge-soft-primary', text: 'فرد' }
                    };
                    const type = types[data] || { class: 'badge-soft-secondary', text: data };
                    return `<span class="customer-badge ${type.class}">${type.text}</span>`;
                }
            },
            {
                data: null,
                title: 'الإجراءات',
                className: 'align-middle text-center',
                orderable: false,
                render: function(data) {
                    return `
                        <div class="action-buttons d-flex gap-2 justify-content-center">
                            <button class="btn btn-soft-primary btn-icon" onclick="editCustomer('${data._id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-soft-danger btn-icon" onclick="deleteCustomer('${data._id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
        },
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        order: [[0, 'asc']],
        pageLength: 10,
        responsive: true,
        autoWidth: false
    });
}

// Improved error handling and loading states
async function fetchData(endpoint) {
    try {
        document.querySelectorAll('.loading-indicator').forEach(el => el.classList.remove('d-none'));
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        showErrorMessage(`فشل في تحميل البيانات: ${error.message}`);
        return null;
    } finally {
        document.querySelectorAll('.loading-indicator').forEach(el => el.classList.add('d-none'));
    }
}

// Enhanced statistics update with error handling
async function updateStatistics() {
    try {
        const [customers, technicians, inventory, orders] = await Promise.all([
            fetchData('/customers'),
            fetchData('/technicians'),
            fetchData('/inventory'),
            fetchData('/orders')
        ]);

        updateStatCard('customerCount', customers?.length || 0);
        updateStatCard('technicianCount', technicians?.length || 0);
        updateStatCard('inventoryCount', inventory?.length || 0);
        updateStatCard('orderCount', orders?.length || 0);
    } catch (error) {
        console.error('Error updating statistics:', error);
        showErrorMessage('فشل في تحديث الإحصائيات');
    }
}

// Helper function to update stat cards with animation
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const currentValue = parseInt(element.textContent) || 0;
    animateValue(element, currentValue, value, 500);
}

// Improved recent customers display
async function updateRecentCustomers() {
    const customers = await fetchData('/customers');
    const tbody = document.getElementById('recentCustomers');
    
    if (!customers?.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <i class="bi bi-info-circle text-muted me-2"></i>
                    لا يوجد عملاء حاليًا
                </td>
            </tr>`;
        return;
    }

    const recentCustomers = customers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    tbody.innerHTML = recentCustomers.map(customer => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-initial rounded-circle bg-light-primary me-2">
                        ${customer.name.charAt(0)}
                    </div>
                    <div>
                        <div class="fw-medium">${customer.name}</div>
                        <small class="text-muted">${formatDate(customer.createdAt)}</small>
                    </div>
                </div>
            </td>
            <td dir="ltr">${formatPhoneNumber(customer.phone)}</td>
            <td>${customer.address || '-'}</td>
            <td>
                <span class="badge ${customer.type === 'company' ? 'bg-info' : 'bg-primary'}">
                    ${customer.type === 'company' ? 'شركة' : 'فرد'}
                </span>
            </td>
        </tr>
    `).join('');
}

// Helper functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatPhoneNumber(phone) {
    return phone ? `+966 ${phone}` : '-';
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function showErrorMessage(message) {
    // Implement your error message display logic here
    console.error(message);
}

// Initialize with improved error handling
function initDashboard() {
    try {
        updateStatistics();
        initializeCustomersTable();

        // Refresh data every 30 seconds
        setInterval(() => {
            updateStatistics();
            const customers = fetchData('/customers').then(data => {
                if (data && customersTable) {
                    customersTable.clear().rows.add(data).draw();
                }
            });
        }, 30000);
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        showErrorMessage('فشل في تهيئة لوحة المعلومات');
    }
}

// Start the dashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);