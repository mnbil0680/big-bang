import { fetchWithErrorHandling, showErrorMessage } from "./utils.js";
const API = "http://localhost:3000";
// Existing global variables
let requests = [];

let currentPage = 1; // Track the current page globally
// Function to change the current page
window.changePage = (page) => {
  currentPage = page; // Update the global currentPage variable
  renderTable(requests); // Re-render the table with the new page
};
function renderTable(data) {
  const itemsPerPage = 5; // Number of items per page
  const totalPages = Math.ceil(data.length / itemsPerPage); // Total number of pages

  // Helper function to render a single page
  function renderPage(page) {
    const tbody = document.getElementById("requestsTableBody");
    tbody.innerHTML = ""; // Clear the table body

    // Calculate the start and end indices for the current page
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const pageData = data.slice(startIndex, endIndex);

    // Render rows for the current page
    pageData.forEach((req) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${req.orderId || "N/A"}</td>
        <td>${req.customerId?.name || "غير متوفر"}</td>
        <td>${req.deviceType || "غير متوفر"}</td>
        <td>
          <span class="badge bg-${
            req.priority === "عالية"
              ? "danger"
              : req.priority === "متوسطة"
              ? "warning"
              : "info"
          }">
            ${req.priority || "غير محدد"}
          </span>
        </td>
        <td>
          <span class="badge bg-${
            req.status === "مكتمل"
              ? "success"
              : req.status === "قيد المعالجة"
              ? "warning"
              : req.status === "جديد"
              ? "info"
              : "danger"
          }">
            ${req.status || "غير محدد"}
          </span>
        </td>
        <td>${new Date(req.createdAt).toLocaleString("ar-EG")}</td>
        <td>${
          req.technicians
            ? req.technicians.map((t) => t.name).join(", ")
            : "غير معين"
        }</td>
        <td class="table-actions">
          <button class="btn btn-sm btn-info" data-bs-toggle="tooltip" title="عرض التفاصيل" onclick="viewRequest('${
            req._id
          }')"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-primary" data-bs-toggle="tooltip" title="تعديل" onclick="editRequest('${
            req._id
          }')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" data-bs-toggle="tooltip" title="حذف" onclick="deleteRequest('${
            req._id
          }')"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Reinitialize tooltips after rendering the table
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));

    // Update pagination controls
    updatePagination(totalPages, page);
  }

  // Update pagination controls dynamically
  function updatePagination(totalPages, currentPage) {
    const pagination = document.querySelector(".pagination");
    pagination.innerHTML = ""; // Clear existing pagination

    // Add "Previous" button
    const prevButton = document.createElement("li");
    prevButton.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevButton.innerHTML = `<a class="page-link" href="#" onclick="changePage(${
      currentPage - 1
    })">السابق</a>`;
    pagination.appendChild(prevButton);

    // Add page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageItem = document.createElement("li");
      pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
      pageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
      pagination.appendChild(pageItem);
    }

    // Add "Next" button
    const nextButton = document.createElement("li");
    nextButton.className = `page-item ${
      currentPage === totalPages ? "disabled" : ""
    }`;
    nextButton.innerHTML = `<a class="page-link" href="#" onclick="changePage(${
      currentPage + 1
    })">التالي</a>`;
    pagination.appendChild(nextButton);
  }

  // Initial render for the first page
  renderPage(currentPage);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar toggle (existing code)
  document.querySelectorAll(".toggle-sidebar").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("active");
    });
  });

  // Export & Print functions
  window.printTable = function (tableID) {
    const table = document.getElementById(tableID);
    if (!table) {
      console.error("Table not found:", tableID);
      return;
    }
    // Create a new window for printing
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Table</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css" />
          <style>
            body { margin: 20px; direction: rtl; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background-color: #f8f9fa; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2 class="text-center mb-4">طلبات الصيانة</h2>
          ${table.outerHTML}
          <div class="text-center mt-4 no-print">
            <button onclick="window.print();" class="btn btn-primary">طباعة</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  window.exportTableToExcel = function (tableID, filename = "") {
    const table = document.getElementById(tableID);
    if (!table) {
      console.error("Table not found:", tableID);
      return;
    }
    let csv = [];
    const rows = table.querySelectorAll("tr");
    // Loop through each row
    rows.forEach((row) => {
      let rowData = [];
      // Get both th and td contents
      const cols = row.querySelectorAll("th, td");
      cols.forEach((col) => {
        rowData.push('"' + col.innerText.replace(/"/g, '""') + '"');
      });
      csv.push(rowData.join(","));
    });
    // Create CSV file blob and trigger download
    const csvFile = new Blob([csv.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    filename = filename ? filename + ".csv" : "export.csv";
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(csvFile, filename);
    } else {
      downloadLink.href = window.URL.createObjectURL(csvFile);
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(downloadLink.href);
      }, 100);
    }
  };

  // Attach export button events
  const setupExportButtons = () => {
    const exportButtons = document.querySelectorAll("[data-export]");
    console.log("Export buttons found:", exportButtons.length);
    exportButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const exportType = btn.getAttribute("data-export");
        if (exportType === "excel") {
          window.exportTableToExcel(
            "maintenanceRequestsTable",
            "maintenance_requests"
          );
        } else if (exportType === "print") {
          window.printTable("maintenanceRequestsTable");
        }
      });
    });
  };

  // Fetch maintenance requests from the API and render the table
  try {
    const res = await fetch(API + "/orders");
    if (!res.ok) throw new Error("Failed to fetch orders requests");
    requests = await res.json();
    renderTable(requests);
    setupExportButtons();
  } catch (error) {
    console.error("Error fetching orders requests:", error);
  }
  console.log(requests);

  // --- Customer Search Setup ---
  let customers = [];
  try {
    const response = await fetch(API + "/customers");
    if (!response.ok) throw new Error("Failed to fetch customers");
    customers = await response.json();
  } catch (error) {
    console.error("Error loading customers:", error);
  }
  const customerSearchInput = document.getElementById("customerSearchInput");
  const customerDropdown = document.getElementById("customerDropdown");
  const customerIdInput = document.getElementById("customerId");
  function renderCustomerOptions(filtered) {
    customerDropdown.innerHTML = "";
    if (filtered.length === 0) {
      const noOption = document.createElement("div");
      noOption.className = "dropdown-item disabled";
      noOption.textContent = "لا يوجد نتائج";
      customerDropdown.appendChild(noOption);
      return;
    }
    filtered.forEach((customer) => {
      const option = document.createElement("div");
      option.className = "dropdown-item";
      option.textContent = customer.name;
      option.dataset.customerId = customer._id;
      option.addEventListener("click", () => {
        customerSearchInput.value = customer.name;
        customerIdInput.value = customer._id;
        customerDropdown.style.display = "none";
      });
      customerDropdown.appendChild(option);
    });
    customerDropdown.style.display = "block";
  }
  customerSearchInput.addEventListener("input", () => {
    const searchTerm = customerSearchInput.value.trim().toLowerCase();
    if (searchTerm === "") {
      customerDropdown.style.display = "none";
      return;
    }
    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm)
    );
    renderCustomerOptions(filtered);
  });
  document.addEventListener("click", (e) => {
    if (
      !customerSearchInput.contains(e.target) &&
      !customerDropdown.contains(e.target)
    ) {
      customerDropdown.style.display = "none";
    }
  });
  // --- End Customer Search Setup ---

  // --- Technician Search Setup (Multi-select) ---
  let technicians = [];
  try {
    const response = await fetch(API + "/technicians");
    if (!response.ok) throw new Error("Failed to fetch technicians");
    technicians = await response.json();
  } catch (error) {
    console.error("Error loading technicians:", error);
  }
  const technicianSearchInput = document.getElementById(
    "technicianSearchInput"
  );
  const technicianDropdown = document.getElementById("technicianDropdown");
  const selectedTechniciansContainer = document.getElementById(
    "selectedTechnicians"
  );
  let selectedTechnicians = [];
  function renderSelectedTechnicians() {
    selectedTechniciansContainer.innerHTML = "";
    selectedTechnicians.forEach((tech) => {
      const badge = document.createElement("span");
      badge.className =
        "badge bg-primary d-flex align-items-center gap-1 me-1 mb-1";
      badge.innerHTML = `${tech.name} <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Remove"></button>`;
      badge.querySelector("button").addEventListener("click", () => {
        selectedTechnicians = selectedTechnicians.filter(
          (t) => t._id !== tech._id
        );
        renderSelectedTechnicians();
      });
      selectedTechniciansContainer.appendChild(badge);
    });
  }
  function renderTechnicianOptions(filtered) {
    technicianDropdown.innerHTML = "";
    if (filtered.length === 0) {
      const noOption = document.createElement("div");
      noOption.className = "dropdown-item disabled";
      noOption.textContent = "لا يوجد نتائج";
      technicianDropdown.appendChild(noOption);
      return;
    }
    filtered.forEach((technician) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "dropdown-item text-start";
      option.textContent = technician.name;
      option.addEventListener("click", () => {
        if (!selectedTechnicians.find((t) => t._id === technician._id)) {
          selectedTechnicians.push(technician);
          renderSelectedTechnicians();
        }
        technicianSearchInput.value = "";
        technicianDropdown.style.display = "none";
      });
      technicianDropdown.appendChild(option);
    });
    technicianDropdown.style.display = "block";
  }
  technicianSearchInput.addEventListener("input", () => {
    const searchTerm = technicianSearchInput.value.trim().toLowerCase();
    if (searchTerm === "") {
      technicianDropdown.style.display = "none";
      return;
    }
    const filtered = technicians.filter((technician) =>
      technician.name.toLowerCase().includes(searchTerm)
    );
    renderTechnicianOptions(filtered);
  });
  document.addEventListener("click", (e) => {
    if (
      !technicianSearchInput.contains(e.target) &&
      !technicianDropdown.contains(e.target)
    ) {
      technicianDropdown.style.display = "none";
    }
  });
  // --- End Technician Search Setup ---

  // --- Inventory Items Multi-select Setup ---
  let inventoryItems = [];
  try {
    const response = await fetch(API + "/inventory");
    if (!response.ok) throw new Error("Failed to fetch inventory items");
    inventoryItems = await response.json();
  } catch (error) {
    console.error("Error loading inventory items:", error);
  }
  const inventorySearchInput = document.getElementById("inventorySearchInput");
  const inventoryDropdown = document.getElementById("inventoryDropdown");
  const selectedInventoryContainer = document.getElementById(
    "selectedInventoryItems"
  );
  let selectedInventory = [];

  function renderSelectedInventoryItems() {
    selectedInventoryContainer.innerHTML = "";
    selectedInventory.forEach((item) => {
      const container = document.createElement("div");
      container.className =
        "d-flex align-items-center gap-2 mb-1 border p-1 rounded";
      container.innerHTML = `
          <span>${item.name}</span>
          <button type="button" class="btn btn-sm btn-outline-secondary btn-decrease">-</button>
          <input type="number" class="form-control form-control-sm quantity-input" style="width: 100px;" value="${item.selectedQuantity}" min="1" max="${item.quantity}">
          <button type="button" class="btn btn-sm btn-outline-secondary btn-increase">+</button>
          <span>(متاح: ${item.quantity})</span>
          <button type="button" class="btn btn-sm btn-danger btn-remove">&times;</button>
        `;

      // Decrease quantity button
      container.querySelector(".btn-decrease").addEventListener("click", () => {
        let newVal = parseInt(container.querySelector(".quantity-input").value);
        if (newVal > 1) {
          newVal--;
          container.querySelector(".quantity-input").value = newVal;
          item.selectedQuantity = newVal;
        }
      });
      // Increase quantity button
      container.querySelector(".btn-increase").addEventListener("click", () => {
        let newVal = parseInt(container.querySelector(".quantity-input").value);
        if (newVal < item.quantity) {
          newVal++;
          container.querySelector(".quantity-input").value = newVal;
          item.selectedQuantity = newVal;
        }
      });
      // Manual input handler
      container
        .querySelector(".quantity-input")
        .addEventListener("input", (e) => {
          let val = parseInt(e.target.value);
          if (isNaN(val) || val < 1) {
            e.target.value = 1;
            item.selectedQuantity = 1;
          } else if (val > item.quantity) {
            e.target.value = item.quantity;
            item.selectedQuantity = item.quantity;
          } else {
            item.selectedQuantity = val;
          }
        });
      // Remove button
      container.querySelector(".btn-remove").addEventListener("click", () => {
        selectedInventory = selectedInventory.filter((i) => i._id !== item._id);
        renderSelectedInventoryItems();
      });
      selectedInventoryContainer.appendChild(container);
    });
  }

  function renderInventoryDropdown(filtered) {
    inventoryDropdown.innerHTML = "";
    if (filtered.length === 0) {
      const noOption = document.createElement("div");
      noOption.className = "dropdown-item disabled";
      noOption.textContent = "لا يوجد نتائج";
      inventoryDropdown.appendChild(noOption);
      return;
    }
    filtered.forEach((item) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "dropdown-item text-start";
      option.textContent = item.name;
      option.addEventListener("click", () => {
        // Add item if not already selected, with default selectedQuantity = 1
        if (!selectedInventory.find((i) => i._id === item._id)) {
          selectedInventory.push({ ...item, selectedQuantity: 1 });
          renderSelectedInventoryItems();
        }
        inventorySearchInput.value = "";
        inventoryDropdown.style.display = "none";
      });
      inventoryDropdown.appendChild(option);
    });
    inventoryDropdown.style.display = "block";
  }

  inventorySearchInput.addEventListener("input", () => {
    const searchTerm = inventorySearchInput.value.trim().toLowerCase();
    if (searchTerm === "") {
      inventoryDropdown.style.display = "none";
      return;
    }
    const filtered = inventoryItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );
    renderInventoryDropdown(filtered);
  });
  document.addEventListener("click", (e) => {
    if (
      !inventorySearchInput.contains(e.target) &&
      !inventoryDropdown.contains(e.target)
    ) {
      inventoryDropdown.style.display = "none";
    }
  });

  // --- End Inventory Items Setup ---

  function isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // --- Filter Table Functionality ---
  function filterTable() {
    const status = document.getElementById("statusFilter").value;
    const priority = document.getElementById("priorityFilter").value;
    const date = document.getElementById("dateFilter").value;
    const search = document.getElementById("searchFilter").value.toLowerCase();
    const filtered = requests.filter((req) => {
      const d1 = new Date(req.createdDate);
      const d2 = date ? new Date(date) : null;
      return (
        (!status || req.status === status) &&
        (!priority || req.priority === priority) &&
        (!date || isSameDay(d1, d2)) &&
        (!search ||
          (req.customerId &&
            req.customerId.name.toLowerCase().includes(search)) ||
          (req.requestNumber &&
            req.requestNumber.toLowerCase().includes(search)))
      );
    });
    renderTable(filtered);
  }
  document
    .getElementById("statusFilter")
    .addEventListener("change", filterTable);
  document
    .getElementById("priorityFilter")
    .addEventListener("change", filterTable);
  document.getElementById("dateFilter").addEventListener("change", filterTable);
  document
    .getElementById("searchFilter")
    .addEventListener("input", filterTable);
  document.getElementById("searchBtn").addEventListener("click", filterTable);

  // Initial render of table
  renderTable(requests);

  // --- Add Maintenance Request Form Submission ---
  document
    .getElementById("addRequestForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      try {
        console.log(selectedTechnicians);
        console.log(selectedInventory);
        // and we include selected inventory items as "items" (each with itemId, quantity, price).
        const newRequest = {
          orderId: `#MR${String(
            requests.reduce((val, item) => {
              const numericPart = item.orderId.replace("#MR", "");
              // Ensure the numeric part is parsed as an integer
              const parsedValue = parseInt(numericPart, 10);
              return isNaN(parsedValue) ? val : Math.max(val, parsedValue);
            }, 0) + 1
          ).padStart(4, "0")}`,
          type: "صيانة",
          customerId: document.getElementById("customerId").value,
          priority: document.getElementById("priority").value,
          deviceType: document.getElementById("deviceType").value,
          description: document.getElementById("description").value,
          status: "جديد",
          date: new Date().toISOString().split("T")[0],
          technicians:
            selectedTechnicians.length > 0
              ? selectedTechnicians.map((t) => t._id)
              : [],
          items:
            selectedInventory.length > 0
              ? selectedInventory.map((item) => ({
                  itemId: item._id,
                  quantity: item.selectedQuantity,
                  price: item.price,
                }))
              : [],
          totalPrice:
            typeof selectedInventory !== "undefined" &&
            selectedInventory.length > 0
              ? selectedInventory.reduce(
                  (total, item) => total + item.price * item.selectedQuantity,
                  0
                )
              : 0,
        };
        const res = await fetch(API + "/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRequest),
        });
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        console.log("Maintenance request added:", data);
        requests.push(data);
        renderTable(requests);
        // Reset the form and hide the modal
        bootstrap.Modal.getInstance(
          document.getElementById("addMaintenanceRequestModal")
        ).hide();
        form.reset();
        form.classList.remove("was-validated");
        // Clear selected technicians and inventory
        if (typeof selectedTechnicians !== "undefined") {
          selectedTechnicians = [];
          document.getElementById("selectedTechnicians").innerHTML = "";
        }
        if (typeof selectedInventory !== "undefined") {
          selectedInventory = [];
          document.getElementById("selectedInventoryItems").innerHTML = "";
        }
      } catch (error) {
        console.error("Error adding orders request:", error);
      }
    });

  window.viewRequest = async (id) => {
    try {
      const res = await fetch(API + "/orders/" + id);
      if (!res.ok) throw new Error("فشل في جلب بيانات الطلب");
      const data = await res.json();

      // Set badge classes based on priority and status
      const priorityBadgeClass =
        {
          عالية: "bg-danger",
          متوسطة: "bg-warning",
          منخفضة: "bg-success",
        }[data.priority] || "bg-secondary";

      const statusBadgeClass =
        {
          جديد: "bg-info",
          "قيد المعالجة": "bg-primary",
          مكتمل: "bg-success",
          ملغي: "bg-secondary",
        }[data.status] || "bg-secondary";

      // Basic information
      document.getElementById("requestNumber").textContent =
        data.orderId || "N/A";
      document.getElementById("requestCustomer").textContent = data.customerId
        ? data.customerId.name
        : "غير متوفر";
      document.getElementById("requestDeviceType").textContent =
        data.deviceType || "غير محدد";

      // Apply styled badges for priority and status
      document.getElementById(
        "requestPriority"
      ).innerHTML = `<span class="badge ${priorityBadgeClass}">${
        data.priority || "غير محدد"
      }</span>`;
      document.getElementById(
        "requestStatus"
      ).innerHTML = `<span class="badge ${statusBadgeClass}">${
        data.status || "غير محدد"
      }</span>`;

      // Format dates with nice display
      document.getElementById("requestCreatedDate").textContent = data.createdAt
        ? new Date(data.createdAt).toLocaleString("ar-EG")
        : "غير محدد";
      document.getElementById("requestCompletionDate").innerHTML =
        data.completionDate
          ? `<i class="fas fa-check-circle me-1 text-success"></i> ${new Date(
              data.completionDate
            ).toLocaleString("ar-EG")}`
          : '<span class="text-muted"><i class="fas fa-hourglass-half me-1"></i> قيد الإنتظار</span>';

      // Add a new field for scheduled date if not exists
      const dlRow = document.querySelector(
        "#viewRequestModal .modal-body dl.row"
      );
      if (!document.getElementById("requestScheduledDate")) {
        const dtScheduled = document.createElement("dt");
        dtScheduled.className = "col-sm-4";
        dtScheduled.textContent = "الموعد المجدول:";

        const ddScheduled = document.createElement("dd");
        ddScheduled.className = "col-sm-8";
        ddScheduled.id = "requestScheduledDate";

        // Find the createdDate dt and insert after it
        const createdDateDt = Array.from(dlRow.querySelectorAll("dt")).find(
          (dt) => dt.textContent.includes("تاريخ الإنشاء")
        );
        if (createdDateDt) {
          const createdDateDd = createdDateDt.nextElementSibling;
          dlRow.insertBefore(dtScheduled, createdDateDd.nextElementSibling);
          dlRow.insertBefore(
            ddScheduled,
            createdDateDd.nextElementSibling.nextElementSibling
          );
        } else {
          // If not found, append to the end
          dlRow.appendChild(dtScheduled);
          dlRow.appendChild(ddScheduled);
        }
      }

      // Set scheduled date value
      document.getElementById("requestScheduledDate").innerHTML =
        data.scheduledDate
          ? `<i class="fas fa-calendar-alt me-1"></i> ${new Date(
              data.scheduledDate
            ).toLocaleString("ar-EG")}`
          : "غير محدد";

      // Add payment status if not exists
      if (!document.getElementById("requestPaymentStatus")) {
        const dtPayment = document.createElement("dt");
        dtPayment.className = "col-sm-4";
        dtPayment.textContent = "حالة الدفع:";

        const ddPayment = document.createElement("dd");
        ddPayment.className = "col-sm-8";
        ddPayment.id = "requestPaymentStatus";

        // Find the status dt and insert after it
        const statusDt = Array.from(dlRow.querySelectorAll("dt")).find((dt) =>
          dt.textContent.includes("الحالة")
        );
        if (statusDt) {
          const statusDd = statusDt.nextElementSibling;
          dlRow.insertBefore(dtPayment, statusDd.nextElementSibling);
          dlRow.insertBefore(
            ddPayment,
            statusDd.nextElementSibling.nextElementSibling
          );
        } else {
          // If not found, append to the end
          dlRow.appendChild(dtPayment);
          dlRow.appendChild(ddPayment);
        }
      }

      // Set payment status value with badge
      const paymentStatusBadgeClass =
        {
          معلق: "bg-warning",
          جزئى: "bg-info",
          مكتمل: "bg-success",
        }[data.paymentStatus] || "bg-secondary";

      document.getElementById(
        "requestPaymentStatus"
      ).innerHTML = `<span class="badge ${paymentStatusBadgeClass}">${
        data.paymentStatus || "غير محدد"
      }</span>`;

      // Add order type if not exists
      if (!document.getElementById("requestType")) {
        const dtType = document.createElement("dt");
        dtType.className = "col-sm-4";
        dtType.textContent = "نوع الطلب:";

        const ddType = document.createElement("dd");
        ddType.className = "col-sm-8";
        ddType.id = "requestType";

        // Insert after device type
        const deviceTypeDt = Array.from(dlRow.querySelectorAll("dt")).find(
          (dt) => dt.textContent.includes("نوع الجهاز")
        );
        if (deviceTypeDt) {
          const deviceTypeDd = deviceTypeDt.nextElementSibling;
          dlRow.insertBefore(dtType, deviceTypeDd.nextElementSibling);
          dlRow.insertBefore(
            ddType,
            deviceTypeDd.nextElementSibling.nextElementSibling
          );
        } else {
          // If not found, append to the end
          dlRow.appendChild(dtType);
          dlRow.appendChild(ddType);
        }
      }

      // Set order type with badge
      document.getElementById("requestType").innerHTML = `<span class="badge ${
        data.type === "صيانة" ? "bg-info" : "bg-primary"
      }">${data.type || "غير محدد"}</span>`;

      // Update technicians display
      document.getElementById("requestTechnician").innerHTML =
        data.technicians && data.technicians.length > 0
          ? data.technicians
              .map(
                (t) =>
                  `<span class="badge bg-light text-dark border me-1 mb-1"><i class="fas fa-user-cog me-1"></i>${t.name}</span>`
              )
              .join("")
          : '<span class="text-muted">غير معين</span>';

      // Add total price if not exists
      if (!document.getElementById("requestTotalPrice")) {
        const dtTotal = document.createElement("dt");
        dtTotal.className = "col-sm-4";
        dtTotal.textContent = "السعر الإجمالي:";

        const ddTotal = document.createElement("dd");
        ddTotal.className = "col-sm-8";
        ddTotal.id = "requestTotalPrice";

        // Insert after estimated cost
        const estimatedCostDt = Array.from(dlRow.querySelectorAll("dt")).find(
          (dt) => dt.textContent.includes("التكلفة المقدرة")
        );
        if (estimatedCostDt) {
          const estimatedCostDd = estimatedCostDt.nextElementSibling;
          dlRow.insertBefore(dtTotal, estimatedCostDd.nextElementSibling);
          dlRow.insertBefore(
            ddTotal,
            estimatedCostDd.nextElementSibling.nextElementSibling
          );
        } else {
          // If not found, append to the end
          dlRow.appendChild(dtTotal);
          dlRow.appendChild(ddTotal);
        }
      }

      // Set total price value
      document.getElementById("requestTotalPrice").textContent = data.totalPrice
        ? data.totalPrice.toLocaleString() + " ريال"
        : "غير محدد";

      // Update estimated cost
      document.getElementById("requestEstimatedCost").textContent =
        data.estimatedCost
          ? data.estimatedCost.toLocaleString() + " ريال"
          : "غير محدد";

      // Format description with styling
      document.getElementById("requestDescription").innerHTML = data.description
        ? `<div class="p-2 bg-light border-start border-3 border-primary rounded">${data.description}</div>`
        : '<span class="text-muted">لا يوجد</span>';

      // Update parts used with a table
      let partsHtml = "";
      if (data.items && data.items.length > 0) {
        partsHtml =
          '<div class="table-responsive mt-2"><table class="table table-sm table-bordered">';
        partsHtml +=
          '<thead class="table-light"><tr><th>اسم القطعة</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>';
        data.items.forEach((item) => {
          const itemTotal = item.quantity * item.price;
          partsHtml += `<tr>
            <td>${item.itemId ? item.itemId.name : "غير معروف"}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toLocaleString()} ريال</td>
            <td>${itemTotal.toLocaleString()} ريال</td>
          </tr>`;
        });
        partsHtml += "</tbody></table></div>";
      } else {
        partsHtml = '<span class="text-muted">لا يوجد</span>';
      }
      document.getElementById("requestPartsUsed").innerHTML = partsHtml;

      // Update notes with styling
      document.getElementById("requestNotes").innerHTML = data.notes
        ? `<div class="p-2 bg-light border-start border-3 border-success rounded">${data.notes}</div>`
        : '<span class="text-muted">لا يوجد</span>';

      // Show the modal
      const modalEl = document.getElementById("viewRequestModal");
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    } catch (error) {
      console.error("Error fetching orders request:", error);
      alert("حدث خطأ أثناء جلب تفاصيل الطلب: " + error.message);
    }
  };
  window.deleteRequest = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
      try {
        const res = await fetch(API + "/orders/" + id, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete orders request");
        await res.json();
        requests = requests.filter((req) => req._id !== id);
        renderTable(requests);
        console.log(`Maintenance request ${id} deleted successfully`);
      } catch (error) {
        console.error("Error deleting orders request:", error);
      }
    }
  };
  window.editRequest = async (id) => {
    console.log(id);
    try {
      // First fetch the current order data
      const res = await fetch(API + "/orders/" + id);
      if (!res.ok) throw new Error("فشل في جلب بيانات الطلب");
      const data = await res.json();

      // Create edit modal HTML
      const modalHTML = `
        <div class="modal fade" id="editRequestModal" tabindex="-1" aria-labelledby="editRequestModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="editRequestModalLabel">تعديل الطلب #${
                  data.orderId
                }</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
              </div>
              <div class="modal-body">
                <form id="editRequestForm">
                  <div class="row g-3">
                    <!-- Basic Information -->
                    <div class="col-md-6">
                      <label for="editDeviceType" class="form-label">نوع الجهاز</label>
                      <input type="text" class="form-control" id="editDeviceType" value="${
                        data.deviceType || ""
                      }" required>
                    </div>
                    <div class="col-md-6">
                      <label for="editPriority" class="form-label">الأولوية</label>
                      <select class="form-select" id="editPriority" required>
                        <option value="عالية" ${
                          data.priority === "عالية" ? "selected" : ""
                        }>عالية</option>
                        <option value="متوسطة" ${
                          data.priority === "متوسطة" ? "selected" : ""
                        }>متوسطة</option>
                        <option value="منخفضة" ${
                          data.priority === "منخفضة" ? "selected" : ""
                        }>منخفضة</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="editStatus" class="form-label">الحالة</label>
                      <select class="form-select" id="editStatus" required>
                        <option value="جديد" ${
                          data.status === "جديد" ? "selected" : ""
                        }>جديد</option>
                        <option value="قيد المعالجة" ${
                          data.status === "قيد المعالجة" ? "selected" : ""
                        }>قيد المعالجة</option>
                        <option value="مكتمل" ${
                          data.status === "مكتمل" ? "selected" : ""
                        }>مكتمل</option>
                        <option value="ملغي" ${
                          data.status === "ملغي" ? "selected" : ""
                        }>ملغي</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="editType" class="form-label">نوع الطلب</label>
                      <select class="form-select" id="editType" required>
                        <option value="صيانة" ${
                          data.type === "صيانة" ? "selected" : ""
                        }>صيانة</option>
                        <option value="تركيب" ${
                          data.type === "تركيب" ? "selected" : ""
                        }>تركيب</option>
                      </select>
                    </div>
                    <!-- Financial Info -->
                    <div class="col-md-6">
                      <label for="editEstimatedCost" class="form-label">التكلفة المقدرة</label>
                      <div class="input-group">
                        <input type="number" class="form-control" id="editEstimatedCost" value="${
                          data.estimatedCost || 0
                        }" min="0">
                        <span class="input-group-text">ريال</span>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="editTotalPrice" class="form-label">السعر الإجمالي</label>
                      <div class="input-group">
                        <input type="number" class="form-control" id="editTotalPrice" value="${
                          data.totalPrice || 0
                        }" min="0" required>
                        <span class="input-group-text">ريال</span>
                      </div>
                    </div>
                    <!-- Dates -->
                    <div class="col-md-6">
                      <label for="editScheduledDate" class="form-label">الموعد المجدول</label>
                      <input type="datetime-local" class="form-control" id="editScheduledDate" 
                        value="${
                          data.scheduledDate
                            ? new Date(data.scheduledDate)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }">
                    </div>
                    <div class="col-md-6">
                      <label for="editCompletionDate" class="form-label">تاريخ الإكمال</label>
                      <input type="datetime-local" class="form-control" id="editCompletionDate" 
                        value="${
                          data.completionDate
                            ? new Date(data.completionDate)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }">
                    </div>
                    <!-- Payment Status -->
                    <div class="col-md-6">
                      <label for="editPaymentStatus" class="form-label">حالة الدفع</label>
                      <select class="form-select" id="editPaymentStatus" required>
                        <option value="معلق" ${
                          data.paymentStatus === "معلق" ? "selected" : ""
                        }>معلق</option>
                        <option value="جزئى" ${
                          data.paymentStatus === "جزئى" ? "selected" : ""
                        }>جزئى</option>
                        <option value="مكتمل" ${
                          data.paymentStatus === "مكتمل" ? "selected" : ""
                        }>مكتمل</option>
                      </select>
                    </div>
                    <!-- Description and Notes -->
                    <div class="col-12">
                      <label for="editDescription" class="form-label">الوصف</label>
                      <textarea class="form-control" id="editDescription" rows="3">${
                        data.description || ""
                      }</textarea>
                    </div>
                    <div class="col-12">
                      <label for="editNotes" class="form-label">الملاحظات</label>
                      <textarea class="form-control" id="editNotes" rows="3">${
                        data.notes || ""
                      }</textarea>
                    </div>
                    <!-- Items Section -->
                    <div class="col-12">
                      <h5>العناصر</h5>
                      <div id="editItemsContainer">
                        ${data.items
                          .map(
                            (item, index) => `
                          <div class="row align-items-center mb-2">
                            <div class="col-md-8">
                              <label class="form-label">${
                                item.itemId.name || "عنصر غير معروف"
                              }</label>
                            </div>
                            <div class="col-md-4">
                              <input type="number" class="form-control" id="editItemQuantity-${index}" value="${
                              item.quantity
                            }" min="1" required>
                            </div>
                          </div>
                        `
                          )
                          .join("")}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                <button type="button" class="btn btn-primary" id="saveEditRequest">حفظ التغييرات</button>
              </div>
            </div>
          </div>
        </div>`;
      // Add modal to document if it doesn't exist
      let modalElement = document.getElementById("editRequestModal");
      if (modalElement) {
        modalElement.remove();
      }
      document.body.insertAdjacentHTML("beforeend", modalHTML);

      // Initialize the modal
      const modal = new bootstrap.Modal(
        document.getElementById("editRequestModal")
      );
      modal.show();

      // Handle form submission
      document
        .getElementById("saveEditRequest")
        .addEventListener("click", async () => {
          try {
            // Gather form data
            const updatedOrder = {
              deviceType: document.getElementById("editDeviceType").value,
              priority: document.getElementById("editPriority").value,
              status: document.getElementById("editStatus").value,
              type: document.getElementById("editType").value,
              estimatedCost:
                parseFloat(
                  document.getElementById("editEstimatedCost").value
                ) || 0,
              totalPrice:
                parseFloat(document.getElementById("editTotalPrice").value) ||
                0,
              paymentStatus: document.getElementById("editPaymentStatus").value,
              description: document.getElementById("editDescription").value,
              notes: document.getElementById("editNotes").value,
              items: data.items.map((item, index) => ({
                itemId: item.itemId._id || item.itemId,
                quantity: parseInt(
                  document.getElementById(`editItemQuantity-${index}`).value,
                  10
                ),
                price: item.price,
              })),
            };

            // Add dates if they have values
            const scheduledDate =
              document.getElementById("editScheduledDate").value;
            if (scheduledDate) {
              updatedOrder.scheduledDate = new Date(scheduledDate);
            }
            const completionDate =
              document.getElementById("editCompletionDate").value;
            if (completionDate) {
              updatedOrder.completionDate = new Date(completionDate);
            }

            // Preserve fields that aren't editable in the form
            updatedOrder.orderId = data.orderId;
            updatedOrder.customerId = data.customerId;

            // Ensure technicians array contains only valid ObjectId strings
            updatedOrder.technicians = data.technicians.map((tech) =>
              typeof tech === "object" ? tech._id : tech
            );

            // Send update request
            const updateRes = await fetch(`${API}/orders/${id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updatedOrder),
            });

            if (!updateRes.ok) {
              const errorData = await updateRes.json();
              throw new Error(
                `فشل في تحديث الطلب: ${
                  errorData.message || updateRes.statusText
                }`
              );
            }

            // Hide modal and show success message
            modal.hide();
            showErrorMessage("تم تحديث الطلب بنجاح", true);

            // Refresh the orders table or view if needed
            if (typeof loadOrders === "function") {
              loadOrders();
            }
            renderTable(requests);
          } catch (error) {
            console.error("Error updating order:", error);
            showErrorMessage(`حدث خطأ أثناء تحديث الطلب: ${error.message}`);
          }
        });
    } catch (error) {
      console.error("Error initiating edit:", error);
      showErrorMessage(`حدث خطأ أثناء تحضير نموذج التعديل: ${error.message}`);
    }
  };
});
