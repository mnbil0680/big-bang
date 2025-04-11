const API = window.SERVER_URI || "http://localhost:3000";

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

  let requests = [];
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

  function renderTable(data) {
    const tbody = document.getElementById("requestsTableBody");
    tbody.innerHTML = "";
    data.forEach((req) => {
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
        <td>${
          req.items ? req.items.map((item) => item.name).join(", ") : "لا يوجد"
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

    // Reinitialize tooltips after table render
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));
  }

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

  // --- Make action functions global ---
  window.viewRequest = async (id) => {
    try {
      const res = await fetch(API + "/orders/" + id);
      if (!res.ok) throw new Error("فشل في جلب بيانات الطلب");
      const data = await res.json();
      document.getElementById("requestNumber").textContent =
        data.requestNumber || "N/A";
      document.getElementById("requestCustomer").textContent = data.customerId
        ? data.customerId.name
        : "غير متوفر";
      document.getElementById("requestDeviceType").textContent =
        data.deviceType || "غير محدد";
      document.getElementById("requestPriority").textContent =
        data.priority || "غير محدد";
      document.getElementById("requestStatus").textContent =
        data.status || "غير محدد";
      document.getElementById("requestCreatedDate").textContent =
        data.createdDate
          ? new Date(data.createdDate).toLocaleString("ar-EG")
          : "غير محدد";
      document.getElementById("requestTechnician").textContent =
        data.technicians
          ? data.technicians.map((t) => t.name).join(", ")
          : "غير معين";
      document.getElementById("requestDescription").textContent =
        data.description || "لا يوجد";
      document.getElementById("requestEstimatedCost").textContent =
        data.estimatedCost ? data.estimatedCost + " ريال" : "غير محدد";
      document.getElementById("requestCompletionDate").textContent =
        data.completionDate
          ? new Date(data.completionDate).toLocaleString("ar-EG")
          : "غير محدد";

      let partsHtml = "";
      if (data.partsUsed && data.partsUsed.length > 0) {
        partsHtml = "<ul>";
        data.partsUsed.forEach((part) => {
          partsHtml += `<li>${
            part.partId ? part.partId.name : "غير معروف"
          } - الكمية: ${part.quantity}</li>`;
        });
        partsHtml += "</ul>";
      } else {
        partsHtml = "لا يوجد";
      }
      document.getElementById("requestPartsUsed").innerHTML = partsHtml;

      let notesHtml = "";
      if (data.notes && data.notes.length > 0) {
        notesHtml = "<ul>";
        data.notes.forEach((note) => {
          notesHtml += `<li>${
            note.content
          } <small class="text-muted">(${new Date(
            note.createdAt
          ).toLocaleString("ar-EG")})</small></li>`;
        });
        notesHtml += "</ul>";
      } else {
        notesHtml = "لا يوجد";
      }
      document.getElementById("requestNotes").innerHTML = notesHtml;

      const modalEl = document.getElementById("viewRequestModal");
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    } catch (error) {
      console.error("Error fetching orders request:", error);
      alert("حدث خطأ أثناء جلب تفاصيل الطلب: " + error.message);
    }
  };

  window.editRequest = async (id) => {
    try {
      const res = await fetch(API + "/orders/" + id);
      if (!res.ok) throw new Error("Request not found");
      const data = await res.json();
      const newStatus = prompt("تحديث الحالة:", data.status);
      if (newStatus) {
        const updatedRequest = { ...data, status: newStatus };
        const putRes = await fetch(API + "/orders/" + id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRequest),
        });
        if (!putRes.ok) throw new Error("Failed to update orders request");
        const updatedData = await putRes.json();
        console.log("Maintenance request updated:", updatedData);
        const index = requests.findIndex((req) => req._id === id);
        if (index !== -1) {
          requests[index] = updatedData;
          renderTable(requests);
        }
      }
    } catch (error) {
      console.error("Error updating orders request:", error);
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
});
