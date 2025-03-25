const API_BASE_URL = "http://localhost:3000";
let currentData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// Fetch data from API
async function fetchData() {
    try {
        const response = await fetch(`${API_BASE_URL}/vouchers`);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        currentData = data;
        renderTable(currentPage);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error loading data. Please try again.');
    }
}

// Render table with data
function renderTable(page) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedData = currentData.slice(start, end);

    paginatedData.forEach(voucher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${voucher.voucherNumber}</td>
            <td>${new Date(voucher.date).toLocaleDateString()}</td>
            <td>${voucher.type === 'receipt' ? 'Receipt' : 'Payment'}</td>
            <td>${voucher.entity}</td>
            <td>${formatCurrency(voucher.amount)}</td>
            <td>${voucher.description}</td>
            <td class="actions">
                <button onclick="editVoucher('${voucher._id}')" class="action-btn edit">
                    <span class="material-icons">edit</span>
                </button>
                <button onclick="deleteVoucher('${voucher._id}')" class="action-btn delete">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    renderPagination();
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR'
    }).format(amount);
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('page-btn');
        if (i === currentPage) button.classList.add('active');
        button.onclick = () => {
            currentPage = i;
            renderTable(currentPage);
        };
        pagination.appendChild(button);
    }
}

// Edit voucher
async function editVoucher(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/vouchers/${id}`);
        const voucher = await response.json();
        
        // Populate modal with voucher data
        document.getElementById('editVoucherNumber').value = voucher.voucherNumber;
        document.getElementById('editDate').value = voucher.date;
        document.getElementById('editEntity').value = voucher.entity;
        document.getElementById('editAmount').value = voucher.amount;
        document.getElementById('editDescription').value = voucher.description;

        // Show modal
        document.getElementById('editModal').style.display = 'flex';

        // Handle form submission
        document.getElementById('editForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateVoucher(id);
        };
    } catch (error) {
        console.error('Error loading voucher:', error);
        alert('Error loading voucher details');
    }
}

// Update voucher
async function updateVoucher(id) {
    try {
        const updatedData = {
            date: document.getElementById('editDate').value,
            entity: document.getElementById('editEntity').value,
            amount: document.getElementById('editAmount').value,
            description: document.getElementById('editDescription').value
        };

        await fetch(`${API_BASE_URL}/vouchers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        document.getElementById('editModal').style.display = 'none';
        await fetchData();
    } catch (error) {
        console.error('Error updating voucher:', error);
        alert('Error updating voucher');
    }
}

// Delete voucher
async function deleteVoucher(id) {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
        await fetch(`${API_BASE_URL}/vouchers/${id}`, {
            method: 'DELETE'
        });
        await fetchData();
    } catch (error) {
        console.error('Error deleting voucher:', error);
        alert('Error deleting voucher');
    }
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredData = currentData.filter(voucher => 
        voucher.voucherNumber.toLowerCase().includes(searchTerm) ||
        voucher.entity.toLowerCase().includes(searchTerm) ||
        voucher.description.toLowerCase().includes(searchTerm)
    );
    currentData = filteredData;
    currentPage = 1;
    renderTable(currentPage);
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', fetchData);

// Close modal
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});

// Initialize
document.addEventListener('DOMContentLoaded', fetchData);

// Add these functions to your existing pp.js file

// Show Add New Voucher Modal
document.getElementById('addNewBtn').addEventListener('click', () => {
    // Set default date to today
    document.getElementById('newDate').value = new Date().toISOString().split('T')[0];
    
    // Generate a new voucher number (you might want to fetch this from the server)
    const prefix = document.getElementById('newType').value === 'receipt' ? 'REC' : 'PAY';
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    document.getElementById('newVoucherNumber').value = `${prefix}${year}${month}-${random}`;
    
    // Show modal
    document.getElementById('addModal').style.display = 'flex';
});

// Handle payment method change to show/hide conditional fields
document.getElementById('newPaymentMethod').addEventListener('change', (e) => {
    const method = e.target.value;
    document.getElementById('checkFields').style.display = method === 'check' ? 'block' : 'none';
    document.getElementById('transferFields').style.display = method === 'transfer' ? 'block' : 'none';
});

// Handle voucher type change to update voucher number
document.getElementById('newType').addEventListener('change', (e) => {
    const prefix = e.target.value === 'receipt' ? 'REC' : 'PAY';
    const currentNumber = document.getElementById('newVoucherNumber').value;
    const suffix = currentNumber.split('-')[1] || '001';
    
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    document.getElementById('newVoucherNumber').value = `${prefix}${year}${month}-${suffix}`;
});

// Handle Add Voucher Form Submission
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const paymentMethod = document.getElementById('newPaymentMethod').value;
    
    const voucherData = {
        type: document.getElementById('newType').value,
        voucherNumber: document.getElementById('newVoucherNumber').value,
        date: document.getElementById('newDate').value,
        entity: document.getElementById('newEntity').value,
        amount: document.getElementById('newAmount').value,
        amountInWords: document.getElementById('newAmountInWords').value,
        description: document.getElementById('newDescription').value,
        paymentMethod: paymentMethod
    };
    
    // Add conditional fields based on payment method
    if (paymentMethod === 'check') {
        voucherData.checkNumber = document.getElementById('newCheckNumber').value;
        voucherData.checkDate = document.getElementById('newCheckDate').value;
        voucherData.bank = document.getElementById('newBank').value;
    } else if (paymentMethod === 'transfer') {
        voucherData.transferNumber = document.getElementById('newTransferNumber').value;
        voucherData.bank = document.getElementById('newTransferBank').value;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/vouchers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(voucherData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add voucher');
        }
        
        // Close modal and refresh data
        document.getElementById('addModal').style.display = 'none';
        document.getElementById('addForm').reset();
        await fetchData();
        
        // Show success message
        alert('Voucher added successfully!');
    } catch (error) {
        console.error('Error adding voucher:', error);
        alert('Error adding voucher. Please try again.');
    }
});

// Close modals when clicking cancel buttons
document.querySelectorAll('.btn-cancel').forEach(button => {
    button.addEventListener('click', () => {
        const modalId = button.dataset.modal || 'editModal';
        document.getElementById(modalId).style.display = 'none';
    });
});

// Close modals when clicking X
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        const modalId = closeBtn.dataset.modal || 'editModal';
        document.getElementById(modalId).style.display = 'none';
    });
});

// Add this code to handle tab switching

// Get all nav items
const navItems = document.querySelectorAll('.nav-item');

// Add click event listener to each nav item
navItems.forEach(item => {
    item.addEventListener('click', function() {
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked nav item
        this.classList.add('active');
        
        // Get the section to show
        const section = this.dataset.section;
        
        // Update section title
        document.getElementById('section-title').textContent = 
            section.charAt(0).toUpperCase() + section.slice(1);
        
        // Handle section content
        if (section === 'settings') {
            // Hide voucher table and show settings form
            document.querySelector('.table-container').style.display = 'none';
            
            // Create settings form if it doesn't exist
            if (!document.getElementById('settings-container')) {
                createSettingsUI();
            } else {
                document.getElementById('settings-container').style.display = 'block';
            }
        } else {
            // Show voucher table and hide settings
            document.querySelector('.table-container').style.display = 'block';
            
            if (document.getElementById('settings-container')) {
                document.getElementById('settings-container').style.display = 'none';
            }
            
            // Refresh data when switching to vouchers tab
            if (section === 'vouchers') {
                fetchData();
            }
        }
    });
});

// Function to create settings UI
function createSettingsUI() {
    const settingsContainer = document.createElement('div');
    settingsContainer.id = 'settings-container';
    settingsContainer.className = 'settings-container';
    
    settingsContainer.innerHTML = `
        <div class="settings-card">
            <h3>Company Information</h3>
            <form id="settingsForm">
                <div class="form-group">
                    <label>Company Name:</label>
                    <input type="text" id="companyName" required>
                </div>
                <div class="form-group">
                    <label>Address:</label>
                    <input type="text" id="address">
                </div>
                <div class="form-group">
                    <label>Phone:</label>
                    <input type="text" id="phone">
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="email">
                </div>
                
                <h3>Voucher Settings</h3>
                <div class="form-group">
                    <label>Receipt Prefix:</label>
                    <input type="text" id="receiptPrefix" placeholder="REC">
                </div>
                <div class="form-group">
                    <label>Payment Prefix:</label>
                    <input type="text" id="paymentPrefix" placeholder="PAY">
                </div>
                <div class="form-group">
                    <label>Currency:</label>
                    <input type="text" id="currency" placeholder="SAR">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-save">Save Settings</button>
                </div>
            </form>
        </div>
    `;
    
    // Add after the main-content's first child (the header)
    document.querySelector('.main-content').insertBefore(
        settingsContainer, 
        document.querySelector('.table-container')
    );
    
    // Load settings
    loadSettings();
    
    // Add event listener for settings form
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
}

// Function to load settings
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (!response.ok) {
            throw new Error('Failed to load settings');
        }
        const settings = await response.json();
        
        if (settings) {
            document.getElementById('companyName').value = settings.companyName || '';
            document.getElementById('address').value = settings.address || '';
            document.getElementById('phone').value = settings.phone || '';
            document.getElementById('email').value = settings.email || '';
            document.getElementById('receiptPrefix').value = settings.receiptPrefix || 'REC';
            document.getElementById('paymentPrefix').value = settings.paymentPrefix || 'PAY';
            document.getElementById('currency').value = settings.currency || 'SAR';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        // Don't show alert here, just log the error
    }
}

// Function to save settings
async function saveSettings(e) {
    e.preventDefault();
    
    const settings = {
        companyName: document.getElementById('companyName').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        receiptPrefix: document.getElementById('receiptPrefix').value,
        paymentPrefix: document.getElementById('paymentPrefix').value,
        currency: document.getElementById('currency').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT', // Using PUT instead of POST for updates
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            alert('Settings saved successfully!');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings. Please try again.');
    }
}