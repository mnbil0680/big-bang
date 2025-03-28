document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar toggle
  document.querySelectorAll(".toggle-sidebar").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("active");
    });
  });

  // Sample data for filtering
  const requests = [
    {
      id: "#MR001",
      customer: "أحمد محمد",
      device: "مكيف سبليت",
      priority: "عالية",
      status: "قيد المعالجة",
      date: "2023-09-15",
      technician: "خالد العتيبي",
    },
    {
      id: "#MR002",
      customer: "سعيد عبدالله",
      device: "ثلاجة",
      priority: "متوسطة",
      status: "مكتمل",
      date: "2023-09-16",
      technician: "عمر سعيد",
    },
  ];

  function renderTable(data) {
    const tbody = document.getElementById("requestsTableBody");
    tbody.innerHTML = "";
    data.forEach((req) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                    <td>${req.id}</td>
                    <td>${req.customer}</td>
                    <td>${req.device}</td>
                    <td><span class="badge bg-${
                      req.priority === "عالية"
                        ? "danger"
                        : req.priority === "متوسطة"
                        ? "warning"
                        : "info"
                    }">${req.priority}</span></td>
                    <td><span class="badge bg-${
                      req.status === "مكتمل"
                        ? "success"
                        : req.status === "قيد المعالجة"
                        ? "warning"
                        : req.status === "جديد"
                        ? "info"
                        : "danger"
                    }">${req.status}</span></td>
                    <td>${req.date}</td>
                    <td>${req.technician}</td>
                    <td class="table-actions">
                        <button class="btn btn-sm btn-info" data-bs-toggle="tooltip" title="عرض التفاصيل" onclick="viewRequest('${
                          req.id
                        }')"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-sm btn-primary" data-bs-toggle="tooltip" title="تعديل" onclick="editRequest('${
                          req.id
                        }')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-danger" data-bs-toggle="tooltip" title="حذف" onclick="deleteRequest('${
                          req.id
                        }')"><i class="bi bi-trash"></i></button>
                    </td>
                `;
      tbody.appendChild(row);
    });
  }

  // Filter table
  function filterTable() {
    const status = document.getElementById("statusFilter").value;
    const priority = document.getElementById("priorityFilter").value;
    const date = document.getElementById("dateFilter").value;
    const search = document.getElementById("searchFilter").value.toLowerCase();

    const filtered = requests.filter((req) => {
      return (
        (!status || req.status === status) &&
        (!priority || req.priority === priority) &&
        (!date || req.date === date) &&
        (!search ||
          req.customer.toLowerCase().includes(search) ||
          req.id.toLowerCase().includes(search))
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

  // Initial render
  renderTable(requests);

  // Add request form submission
  document.getElementById("addRequestForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    try {
      const newRequest = {
        id: `#MR${String(requests.length + 1).padStart(3, "0")}`,
        customer: document.getElementById("customerName").value,
        device: document.getElementById("deviceType").value,
        priority: document.getElementById("priority").value,
        status: "جديد",
        date: new Date().toISOString().split("T")[0],
        technician: document.getElementById("technician").value || "غير محدد",
      };
      fetch("/api/maintenance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Request added:", data);
        })
        .catch((error) => {
          console.error("Error adding request:", error);
        });
      requests.push(newRequest);
      renderTable(requests);
      bootstrap.Modal.getInstance(
        document.getElementById("addMaintenanceRequestModal")
      ).hide();
      form.reset();
      form.classList.remove("was-validated");
    } catch (error) {
      console.error("Error adding request:", error);
    }
  });

  // Action functions (placeholders)
  window.viewRequest = (id) => alert(`عرض تفاصيل الطلب: ${id}`);
  window.editRequest = (id) => alert(`تعديل الطلب: ${id}`);
  window.deleteRequest = (id) => {
    if (confirm(`هل أنت متأكد من حذف الطلب ${id}؟`)) {
      const index = requests.findIndex((req) => req.id === id);
      if (index !== -1) {
        requests.splice(index, 1);
        renderTable(requests);
      }
    }
  };

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));
});
