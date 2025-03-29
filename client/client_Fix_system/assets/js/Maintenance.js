const API = "http://localhost:3000";
fetch("http://localhost:3000/maintenance")
  .then((response) => response.json())
  .then((data) => console.log(data)) // Debugging
  .catch((error) => console.error("Fetch error:", error));
document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar toggle
  document.querySelectorAll(".toggle-sidebar").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("active");
    });
  });

  let requests = [];
  Z;

  // Fetch maintenance requests from the API and render the table
  try {
    const res = await fetch(API + "/maintenance");
    if (!res.ok) {
      throw new Error("Failed to fetch maintenance requests");
    }
    requests = await res.json();
    renderTable(requests);
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
  }

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

  // Initial render in case the API returns no data (or delays)
  renderTable(requests);

  // Add maintenance request form submission
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
          // Generate an ID or let your server assign one
          id: `#MR${String(requests.length + 1).padStart(3, "0")}`,
          customer: document.getElementById("customerName").value,
          device: document.getElementById("deviceType").value,
          priority: document.getElementById("priority").value,
          status: "جديد",
          date: new Date().toISOString().split("T")[0],
          technician: document.getElementById("technician").value || "غير محدد",
        };

        const res = await fetch(API + "/maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRequest),
        });
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await res.json();
        console.log("Maintenance request added:", data);
        // Optionally update the local table data based on the response
        requests.push(data);
        renderTable(requests);

        // Reset the form and hide the modal
        bootstrap.Modal.getInstance(
          document.getElementById("addMaintenanceRequestModal")
        ).hide();
        form.reset();
        form.classList.remove("was-validated");
      } catch (error) {
        console.error("Error adding maintenance request:", error);
      }
    });

  // Action functions using the API with async/await
  window.viewRequest = async (id) => {
    try {
      const res = await fetch(API + "/maintenance/" + id);
      if (!res.ok) {
        throw new Error("Request not found");
      }
      const data = await res.json();
      // Display details (for example, in a modal)
      alert("تفاصيل الطلب:\n" + JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error fetching maintenance request:", error);
    }
  };

  window.editRequest = async (id) => {
    try {
      // Fetch current data
      const res = await fetch(API + "/maintenance/" + id);
      if (!res.ok) {
        throw new Error("Request not found");
      }
      const data = await res.json();
      // For simplicity, we use prompt; you can replace this with a proper modal form
      const newStatus = prompt("تحديث الحالة:", data.status);
      if (newStatus) {
        const updatedRequest = { ...data, status: newStatus };
        const putRes = await fetch(API + "/maintenance/" + id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRequest),
        });
        if (!putRes.ok) {
          throw new Error("Failed to update maintenance request");
        }
        const updatedData = await putRes.json();
        console.log("Maintenance request updated:", updatedData);
        // Update local table data accordingly
        const index = requests.findIndex((req) => req.id === id);
        if (index !== -1) {
          requests[index] = updatedData;
          renderTable(requests);
        }
      }
    } catch (error) {
      console.error("Error updating maintenance request:", error);
    }
  };

  window.deleteRequest = async (id) => {
    if (confirm(`هل أنت متأكد من حذف الطلب ${id}؟`)) {
      try {
        const res = await fetch(API + "/maintenance/" + id, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error("Failed to delete maintenance request");
        }
        await res.json();
        // Remove the deleted request from the local array and re-render the table
        requests = requests.filter((req) => req.id !== id);
        renderTable(requests);
        console.log(`Maintenance request ${id} deleted successfully`);
      } catch (error) {
        console.error("Error deleting maintenance request:", error);
      }
    }
  };

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));
});
