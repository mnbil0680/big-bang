document.addEventListener('DOMContentLoaded', () => {
    // API base URL
    const API_URL = 'http://localhost:3000';

    // Fetch and display customers
    async function fetchCustomers() {
        const loadingSpinner = document.getElementById('customers-loading');
        const tableBody = document.querySelector('#customers-table tbody');
        
        try {
            loadingSpinner.classList.remove('d-none');
            const response = await fetch(`${API_URL}/customers`);
            const customers = await response.json();
            
            tableBody.innerHTML = customers.map(customer => `
                <tr>
                    <td>${customer.name || '-'}</td>
                    <td>${customer.phone || '-'}</td>
                    <td>${customer.address || '-'}</td>
                    <td>${customer.email || '-'}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error fetching customers:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">حدث خطأ أثناء تحميل البيانات</td></tr>';
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    }

    // Fetch and display inventory
    async function fetchInventory() {
        const loadingSpinner = document.getElementById('inventory-loading');
        const tableBody = document.querySelector('#inventory-table tbody');
        
        try {
            loadingSpinner.classList.remove('d-none');
            const response = await fetch(`${API_URL}/inventory`);
            const inventory = await response.json();
            
            tableBody.innerHTML = inventory.map(item => `
                <tr>
                    <td>${item.name || '-'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${item.price ? `${item.price} ريال` : '-'}</td>
                    <td>${item.quantity > 0 ? 'متوفر' : 'غير متوفر'}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error fetching inventory:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">حدث خطأ أثناء تحميل البيانات</td></tr>';
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    }

    // Fetch and display technicians
    async function fetchTechnicians() {
        const loadingSpinner = document.getElementById('technicians-loading');
        const tableBody = document.querySelector('#technicians-table tbody');
        
        try {
            loadingSpinner.classList.remove('d-none');
            const response = await fetch(`${API_URL}/technicians`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch technicians');
            }

            const technicians = result.data || [];
            
            if (technicians.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد فنيين</td></tr>';
                return;
            }

            tableBody.innerHTML = technicians.map(tech => {
                const statusClass = tech.isAvailable ? 'bg-success' : 'bg-warning';
                const statusText = tech.isAvailable ? 'متاح' : 'مشغول';

                return `
                <tr>
                    <td>${tech.name || '-'}</td>
                    <td>${Array.isArray(tech.specialization) ? tech.specialization.join(', ') : tech.specialization || '-'}</td>
                    <td>${tech.phone || '-'}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                </tr>`;
            }).join('');

        } catch (error) {
            console.error('Error fetching technicians:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">حدث خطأ أثناء تحميل البيانات</td></tr>';
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    }

    // Initial data fetch
    // After fetchTechnicians function and before the initial data fetch
    
    // Fetch and display orders
    async function fetchOrders() {
        const loadingSpinner = document.getElementById('orders-loading');
        const tableBody = document.querySelector('#orders-table tbody');
        
        try {
            loadingSpinner.classList.remove('d-none');
            const response = await fetch(`${API_URL}/orders`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch orders');
            }

            const orders = result.data || [];
            
            if (orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد طلبات</td></tr>';
                return;
            }

            tableBody.innerHTML = orders.map(order => {
                const statusClass = getStatusClass(order.status);
                const statusText = getStatusText(order.status);
                const orderDate = new Date(order.createdAt).toLocaleDateString('ar-SA');

                return `
                <tr>
                    <td>${order.orderId || '-'}</td>
                    <td>${order.customerId?.name || '-'}</td>
                    <td>${order.type === 'maintenance' ? 'صيانة' : 'تركيب'}</td>
                    <td>${order.technician?.name || '-'}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>${order.totalAmount?.toFixed(2) || 0} ريال</td>
                    <td>${orderDate}</td>
                </tr>`;
            }).join('');

        } catch (error) {
            console.error('Error fetching orders:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">حدث خطأ أثناء تحميل البيانات</td></tr>';
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    }

    // Helper functions for order status
    function getStatusClass(status) {
        const classes = {
            'pending': 'bg-warning',
            'in-progress': 'bg-primary',
            'completed': 'bg-success',
            'cancelled': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    function getStatusText(status) {
        const texts = {
            'pending': 'قيد الانتظار',
            'in-progress': 'قيد التنفيذ',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        };
        return texts[status] || 'غير معروف';
    }

    // Update initial data fetch
    fetchCustomers();
    fetchInventory();
    fetchTechnicians();
    fetchOrders();
});