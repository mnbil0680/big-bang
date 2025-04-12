// dashboard.js
const API_BASE_URL = window.SERVER_URI || "http://localhost:3000";

// Utility function to fetch data
async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

// Initialize dashboard
async function initializeDashboard() {
  await Promise.all([
    updateCounters(),
    updateCharts(),
    updateRequestsByStatus(),
    updateRequestsByPriority(),
    updateLatestMaintenanceRequests(),
    updateTopTechnicians(),
    updateInventoryAlerts(),
  ]);
}

// Update counters (Maintenance Requests, Installation Requests, Customers, Total Revenue)
async function updateCounters() {
  // Maintenance Requests
  const maintenanceOrders = await fetchData("/orders?type=صيانة");
  if (maintenanceOrders) {
    document.getElementById("maintenanceRequestsCounter").textContent =
      maintenanceOrders.length;
  }

  // Installation Requests
  const installationOrders = await fetchData("/orders?type=تركيب");
  if (installationOrders) {
    document.getElementById("installationRequestsCounter").textContent =
      installationOrders.length;
  }

  // Total Customers
  const customers = await fetchData("/customers");
  if (customers) {
    document.getElementById("customersCounter").textContent = customers.length;
  }

  // Total Revenue
  const allOrders = await fetchData("/orders?status=مكتمل");
  if (allOrders) {
    const totalRevenue = allOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );
    document.getElementById(
      "totalRevenueCounter"
    ).textContent = `${totalRevenue.toLocaleString()} ريال`;
  }
}

// Update charts (Requests Trend and Requests Distribution)
async function updateCharts() {
  // Requests Trend Chart (Line Chart)
  const orders = await fetchData("/orders");
  if (orders) {
    const monthlyData = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });

    const labels = Object.keys(monthlyData).sort();
    const data = labels.map((label) => monthlyData[label]);

    new ApexCharts(document.querySelector("#requestsChart"), {
      chart: {
        type: "line",
        height: 350,
      },
      series: [
        {
          name: "الطلبات",
          data,
        },
      ],
      xaxis: {
        categories: labels,
      },
      title: {
        text: "تطور الطلبات الشهرية",
        align: "center",
      },
    }).render();
  }

  // Requests Distribution Chart (Donut Chart)
  const maintenanceCount = (await fetchData("/orders?type=صيانة"))?.length || 0;
  const installationCount =
    (await fetchData("/orders?type=تركيب"))?.length || 0;

  new ApexCharts(document.querySelector("#requestsDistributionChart"), {
    chart: {
      type: "donut",
      height: 350,
    },
    series: [maintenanceCount, installationCount],
    labels: ["صيانة", "تر=تركيب"],
    title: {
      text: "توزيع الطلبات حسب النوع",
      align: "center",
    },
  }).render();
}

// Update Requests by Status
async function updateRequestsByStatus() {
  const orders = await fetchData("/orders");
  if (orders) {
    const statusCounts = {
      جديد: 0,
      "قيد المعالجة": 0,
      مكتمل: 0,
      ملغي: 0,
    };

    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    Object.keys(statusCounts).forEach((status) => {
      const element = document.querySelector(
        `#requestsByStatus [data-status="${status}"]`
      );
      if (element) element.textContent = statusCounts[status];
    });
  }
}

// Update Requests by Priority
async function updateRequestsByPriority() {
  const orders = await fetchData("/orders");
  if (orders) {
    const priorityCounts = {
      عالية: 0,
      متوسطة: 0,
      منخفضة: 0,
    };

    orders.forEach((order) => {
      priorityCounts[order.priority] =
        (priorityCounts[order.priority] || 0) + 1;
    });

    Object.keys(priorityCounts).forEach((priority) => {
      const element = document.querySelector(
        `#requestsByPriority [data-priority="${priority}"]`
      );
      if (element) element.textContent = priorityCounts[priority];
    });
  }
}

// Update Latest Maintenance Requests Table
async function updateLatestMaintenanceRequests() {
  const orders = await fetchData("/orders?type=صيانة&limit=5&sort=-createdAt");
  const customers = await fetchData("/customers");
  const tableBody = document.getElementById("latestMaintenanceRequestsTable");

  if (orders && customers) {
    tableBody.innerHTML = "";
    orders.forEach((order) => {
      const customer = customers.find(
        (c) => c._id === order.customerId.toString()
      );
      const row = `
        <tr>
          <td>${order.orderId}</td>
          <td>${customer ? customer.name : "غير معروف"}</td>
          <td>${order.deviceType}</td>
          <td><span class="badge bg-${
            {
              جديد: "primary",
              "قيد المعالجة": "warning",
              مكتمل: "success",
              ملغي: "danger",
            }[order.status]
          }">${order.status}</span></td>
          <td>${new Date(order.createdAt).toLocaleDateString("ar-SA")}</td>
          <td>
            <a href="maintenance-requests.html?id=${
              order._id
            }" class="btn btn-sm btn-outline-primary">عرض</a>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }
}

// Update Top Technicians
async function updateTopTechnicians() {
  const technicians = await fetchData(
    "/technicians?limit=3&sort=-assignments.length"
  );
  const container = document.getElementById("topTechniciansContainer");

  if (technicians) {
    container.innerHTML = "";
    technicians.forEach((technician) => {
      const card = `
        <div class="col-md-12 mb-3">
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0 me-3">
              <div class="avatar bg-primary-light text-primary">
                <i class="bi bi-person"></i>
              </div>
            </div>
            <div class="flex-grow-1">
              <h6 class="mb-1">${technician.name}</h6>
              <small class="text-muted">التخصص: ${
                technician.specialization.join(", ") || "غير محدد"
              }</small><br>
              <small class="text-muted">عدد المهام: ${
                technician.assignments.length
              }</small>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", card);
    });
  }
}

// Update Inventory Alerts
async function updateInventoryAlerts() {
  const inventory = await fetchData(
    "/inventory?quantity[lte]=10&sort=quantity"
  );
  const alertsList = document.getElementById("inventoryAlertsList");

  if (inventory) {
    alertsList.innerHTML = "";
    inventory.forEach((item) => {
      const status = item.quantity === 0 ? "نفذت" : "منخفض";
      const progress = (item.quantity / 10) * 100; // Assuming 10 as threshold for simplicity
      const alert = `
        <div class="list-group-item p-3">
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0 me-3">
              <div class="avatar bg-${
                status === "نفذت" ? "danger" : "warning"
              }-light text-${status === "نفذت" ? "danger" : "warning"}">
                <i class="bi bi-exclamation-${
                  status === "نفذت" ? "triangle" : "circle"
                }"></i>
              </div>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-1">${item.name}</h6>
                <span class="badge bg-${
                  status === "نفذت" ? "danger" : "warning"
                }">${status}</span>
              </div>
              <div class="progress mt-1" style="height: 5px">
                <div class="progress-bar bg-${
                  status === "نفذت" ? "danger" : "warning"
                }" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <div class="d-flex justify-content-between align-items-center mt-1">
                <small class="text-muted">الكمية: ${item.quantity}</small>
                <small class="text-muted">الحد الأدنى: 10</small>
              </div>
            </div>
          </div>
        </div>
      `;
      alertsList.insertAdjacentHTML("beforeend", alert);
    });
  }
}

// Run initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeDashboard);
