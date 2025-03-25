// Main script file for the Management System

// Utility functions
const utils = {
    // Show loading overlay
    showLoading: () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('show');
    },

    // Hide loading overlay
    hideLoading: () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('show');
    },

    // Show toast notification
    showToast: (message, type = 'info') => {
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast show bg-${type}`;
        toast.innerHTML = `
            <div class="toast-body">
                ${message}
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // Format date to locale string
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('ar-SA');
    },

    // Validate form inputs
    validateForm: (formElement) => {
        let isValid = true;
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        });

        return isValid;
    }
};

// Sidebar functionality
const sidebar = {
    init: () => {
        const toggleBtns = document.querySelectorAll('.toggle-sidebar');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', sidebar.toggle);
        });

        // Handle responsive sidebar
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                document.querySelector('.sidebar').classList.remove('collapsed');
            }
        });
    },

    toggle: () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
    }
};

// Notifications handling
const notifications = {
    init: () => {
        notifications.loadNotifications();
        // Add notification badge to all bell icons
        const bellIcons = document.querySelectorAll('#notificationsDropdown');
        bellIcons.forEach(icon => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-danger notification-badge';
            badge.style.display = 'none';
            badge.style.position = 'absolute';
            badge.style.top = '-5px';
            badge.style.right = '-5px';
            icon.appendChild(badge);
        });
        // Refresh notifications every 5 minutes
        setInterval(notifications.loadNotifications, 300000);
    },

    loadNotifications: async () => {
        try {
            const response = await fetch('http://localhost:3000/api/notifications');
            const data = await response.json();
            notifications.updateBadge(data.length);
            notifications.renderNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
            notifications.updateBadge(0);
        }
    },

    updateBadge: (count) => {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    },

    renderNotifications: (notifications) => {
        const container = document.querySelector('.notifications-list');
        if (!container) return;

        container.innerHTML = notifications.map(notif => `
            <li>
                <a class="dropdown-item" href="#">
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0">
                            <i class="bi ${notif.icon} text-${notif.type}"></i>
                        </div>
                        <div class="flex-grow-1 ms-2">
                            <p class="mb-0">${notif.message}</p>
                            <small class="text-muted">${utils.formatDate(notif.date)}</small>
                        </div>
                    </div>
                </a>
            </li>
        `).join('');
    }
};

// DataTable initialization and configuration
const dataTable = {
    init: (tableId, options = {}) => {
        const defaultOptions = {
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
            },
            responsive: true,
            dom: 'Bfrtip',
            buttons: [
                'excel',
                'pdf',
                'print'
            ]
        };

        return new DataTable(`#${tableId}`, { ...defaultOptions, ...options });
    }
};

// Form handling
const forms = {
    init: () => {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', forms.handleSubmit);
        });
    },

    handleSubmit: async (event) => {
        event.preventDefault();
        const form = event.target;

        if (!utils.validateForm(form)) {
            utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'danger');
            return;
        }

        utils.showLoading();

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: form.method,
                body: formData
            });

            if (!response.ok) throw new Error('حدث خطأ في معالجة الطلب');

            const data = await response.json();
            utils.showToast(data.message || 'تم حفظ البيانات بنجاح', 'success');
            
            // Reset form and close modal if exists
            form.reset();
            const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
            if (modal) modal.hide();

            // Refresh data table if exists
            const table = document.querySelector('.datatable');
            if (table) {
                const dt = DataTable.getInstance(table);
                if (dt) dt.ajax.reload();
            }
        } catch (error) {
            console.error('Form submission error:', error);
            utils.showToast(error.message, 'danger');
        } finally {
            utils.hideLoading();
        }
    }
};

// Initialize all components
document.addEventListener('DOMContentLoaded', () => {
    sidebar.init();
    notifications.init();
    forms.init();

    // Initialize DataTables if they exist
    const tables = document.querySelectorAll('.datatable');
    tables.forEach(table => {
        dataTable.init(table.id);
    });

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });

    // Hide loading overlay
    utils.hideLoading();
});

// Export modules for potential use in other scripts
export { utils, sidebar, notifications, dataTable, forms };