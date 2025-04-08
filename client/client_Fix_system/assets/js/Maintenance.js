const API = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar toggle (existing code)
  document.querySelectorAll(".toggle-sidebar").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("active");
    });
  });

  // Fix 1: Make export buttons available in global window scope
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
      // Get all cells (both th and td)
      const cols = row.querySelectorAll("th, td");
      cols.forEach((col) => {
        // Get only text content, not HTML
        rowData.push('"' + col.innerText.replace(/"/g, '""') + '"');
      });
      csv.push(rowData.join(","));
    });

    // Create CSV file blob and trigger download
    const csvFile = new Blob([csv.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    filename = filename ? filename + ".csv" : "export.csv";

    // Create download link
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;

    // Create object URL for the blob
    if (window.navigator.msSaveOrOpenBlob) {
      // For IE
      window.navigator.msSaveOrOpenBlob(csvFile, filename);
    } else {
      // For other browsers
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
  // Fix 3: Properly attach event handlers to export buttons
  const setupExportButtons = () => {
    const exportButtons = document.querySelectorAll("[data-export]");
    console.log("Export buttons found:", exportButtons.length);

    exportButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Export button clicked:", btn);
        const exportType = btn.getAttribute("data-export");
        console.log("Export type:", exportType);

        // Fix 4: Use the correct table ID
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

    // Setup export buttons after table is rendered
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
        <td>${req.requestNumber || "N/A"}</td>
        <td>${req.customerId?.name || "غير متوفر"}</td>
        <td>${req.deviceType || "غير متوفر"}</td>
        <td><span class="badge bg-${
          req.priority === "عالية"
            ? "danger"
            : req.priority === "متوسطة"
            ? "warning"
            : "info"
        }">${req.priority || "غير محدد"}</span></td>
        <td><span class="badge bg-${
          req.status === "مكتمل"
            ? "success"
            : req.status === "قيد المعالجة"
            ? "warning"
            : req.status === "جديد"
            ? "info"
            : "danger"
        }">${req.status || "غير محدد"}</span></td>
        <td>${new Date(req.createdDate).toLocaleString("ar-EG")}</td>
        <td>${req.technicianId?.name || "غير معين"}</td>
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
  {
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
  }
  // --- End Customer Search Setup ---
  // --- Technician Search Setup ---
  {
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
    const technicianIdInput = document.getElementById("technicianId");

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
        const option = document.createElement("div");
        option.className = "dropdown-item";
        option.textContent = technician.name;
        option.dataset.technicianId = technician._id;
        option.addEventListener("click", () => {
          technicianSearchInput.value = technician.name;
          technicianIdInput.value = technician._id;
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
  }
  // --- End Technician Search Setup ---
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

  // Rest of your code remains the same...
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
        const newRequest = {
          requestNumber: `#MR${String(requests.length + 1).padStart(3, "0")}`,
          // Use selected IDs from the hidden fields
          customerId: document.getElementById("customerId").value,
          deviceType: document.getElementById("deviceType").value,
          priority: document.getElementById("priority").value,
          description: document.getElementById("description").value,
          status: "جديد",
          date: new Date().toISOString().split("T")[0],
          technicianId:
            document.getElementById("technicianId").value || "غير محدد",
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
      } catch (error) {
        console.error("Error adding orders request:", error);
      }
    });

  // --- Make action functions global ---
  window.viewRequest = async (id) => {
    try {
      // Fetch the orders request with populated references
      const res = await fetch(API + "/orders/" + id);
      if (!res.ok) throw new Error("فشل في جلب بيانات الطلب");
      const data = await res.json();

      // Populate modal fields with fetched data
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
        data.technicianId ? data.technicianId.name : "غير معين";
      document.getElementById("requestDescription").textContent =
        data.description || "لا يوجد";
      document.getElementById("requestEstimatedCost").textContent =
        data.estimatedCost ? data.estimatedCost + " ريال" : "غير محدد";
      document.getElementById("requestCompletionDate").textContent =
        data.completionDate
          ? new Date(data.completionDate).toLocaleString("ar-EG")
          : "غير محدد";

      // Populate Parts Used list
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

      // Populate Notes list
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

      // Show the modal
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
