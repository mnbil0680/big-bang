const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : window.SERVER_URI;

// Bootstrap alert message function (Arabic)
function showMessage(message, type = "danger") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top shadow`;
  alertDiv.role = "alert";
  // Set inline styles to center the alert and give some margin from the top
  alertDiv.style.width = "50%";
  alertDiv.style.left = "50%";
  alertDiv.style.transform = "translateX(-50%)";
  alertDiv.style.marginTop = "1rem";
  alertDiv.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
  document.body.appendChild(alertDiv);

  // Optionally, auto-dismiss after 3 seconds:
  setTimeout(() => {
    let bsAlert = new bootstrap.Alert(alertDiv);
    bsAlert.close();
  }, 3000);
}

// -----------------------
// Cache Utilities (optional)
// -----------------------
const CACHE_KEY = "customers_data";
const CACHE_DURATION = 300000; // 5 minutes

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
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

// -----------------------
// Generate Customer ID Dynamically
// -----------------------
async function generateCustomerId() {
  let customers = getCachedData();
  if (!customers) {
    try {
      const res = await fetch(API + "/customers");
      if (res.ok) {
        customers = await res.json();
        setCachedData(customers);
      } else {
        customers = [];
      }
    } catch (err) {
      console.error("Error fetching customers for ID generation:", err);
      customers = [];
    }
  }
  let maxNum = 0;
  customers.forEach((c) => {
    if (c.customerId) {
      // Remove any non-digit characters; assume format "Cxxx"
      const num = parseInt(c.customerId.replace(/\D/g, ""));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  return "C" + String(maxNum + 1).padStart(3, "0");
}

// -----------------------
// Initialize Customers DataTable
// -----------------------
let customersTable;
async function initializeCustomersTable(forceRefresh = false) {
  if (!forceRefresh) {
    const cachedData = getCachedData();
    if (cachedData) {
      initializeTable(cachedData);
      return;
    }
  }
  try {
    const res = await fetch(API + "/customers");
    if (!res.ok) throw new Error("فشل في جلب بيانات العملاء");
    const customers = await res.json();
    setCachedData(customers);
    initializeTable(customers);
  } catch (error) {
    showMessage("حدث خطأ أثناء تحميل العملاء: " + error.message, "danger");
  }
}

function initializeTable(customers) {
  if (customersTable) {
    customersTable.destroy();
  }
  customersTable = new DataTable("#customersTable", {
    data: customers,
    searching: true,
    columns: [
      {
        data: null,
        title: "اسم العميل",
        className: "align-middle",
        render: function (data) {
          return `
            <div class="d-flex align-items-center gap-3">
              <div class="customer-avatar rounded-circle d-flex align-items-center justify-content-center">
                ${data.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h6 class="mb-0">${data.name}</h6>
                <small class="text-muted">${new Date(
                  data.createdAt
                ).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}</small>
              </div>
            </div>
          `;
        },
      },
      {
        data: "phone",
        title: "رقم الجوال",
        className: "align-middle text-center",
        render: function (data) {
          // Schema expects phone in format "966XXXXXXXXX" (12 digits)
          return `<span class="phone-number" dir="ltr">+${data}</span>`;
        },
      },
      {
        data: "address",
        title: "العنوان",
        className: "align-middle",
        render: function (data) {
          if (!data) {
            return `<span class="text-muted"><i class="bi bi-dash-circle"></i> لا يوجد عنوان</span>`;
          }
          return data;
        },
      },
      {
        data: "type",
        title: "نوع العميل",
        className: "align-middle text-center",
        render: function (data) {
          return data === "company"
            ? `<span class="badge bg-warning">شركة</span>`
            : `<span class="badge bg-primary">فرد</span>`;
        },
      },
      {
        data: null,
        title: "الإجراءات",
        className: "align-middle text-center",
        orderable: false,
        render: function (data) {
          return `
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-sm btn-info" onclick="viewCustomer('${data._id}')">عرض</button>
              <button class="btn btn-sm btn-primary" onclick="editCustomer('${data._id}')">تعديل</button>
              <button class="btn btn-sm btn-danger" onclick="confirmDeleteCustomer('${data._id}', '${data.name}')">حذف</button>
            </div>
          `;
        },
      },
    ],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json",
    },
    dom:
      '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
      '<"row"<"col-sm-12"tr>>' +
      '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
    order: [[0, "asc"]],
    pageLength: 10,
    responsive: true,
    autoWidth: false,
  });
}

// -----------------------
// Update Customer Statistics
// -----------------------
async function updateCustomerStatistics() {
  try {
    const res = await fetch(API + "/customers");
    if (!res.ok) throw new Error("Failed to fetch customers");
    const customers = await res.json();

    // Total customers
    const total = customers.length;

    // New customers (using current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newCustomers = customers.filter((c) => {
      const created = new Date(c.createdAt);
      return (
        created.getFullYear() === currentYear &&
        created.getMonth() === currentMonth
      );
    }).length;

    // Individual and company counts
    const individualCount = customers.filter(
      (c) => c.type === "individual"
    ).length;
    const companyCount = customers.filter((c) => c.type === "company").length;

    document.getElementById("customerCount").textContent = total;
    document.getElementById("newCustomerCount").textContent = newCustomers;
    document.getElementById("individualCustomerCount").textContent =
      individualCount;
    document.getElementById("companyCustomerCount").textContent = companyCount;
  } catch (error) {
    console.error("Error updating customer statistics:", error);
  }
}

// -----------------------
// Add Customer Modal Behavior
// -----------------------
document
  .getElementById("saveCustomerBtn")
  .addEventListener("click", async () => {
    const addForm = document.getElementById("addCustomerForm");
    if (!addForm.checkValidity()) {
      addForm.classList.add("was-validated");
      return;
    }
    // Generate customerId dynamically
    const customerId = await generateCustomerId();
    // Get phone input; ensure it starts with "966"
    let phone = document.getElementById("customerPhone").value.trim();
    phone = "966" + phone; // Assuming the input only contains the 9 digits

    const newCustomer = {
      customerId,
      name: document.getElementById("customerName").value.trim(),
      phone: phone,
      email: document.getElementById("customerEmail").value.trim(),
      address: document.getElementById("customerAddress").value.trim(),
      type: document.getElementById("customerType").value,
      companyDetails:
        document.getElementById("customerType").value === "company"
          ? {
              registrationNumber:
                document.getElementById("companyRegNumber")?.value.trim() || "",
            }
          : undefined,
      notes: document.getElementById("customerNotes").value.trim(),
      isActive: true,
    };

    try {
      const res = await fetch(API + "/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error("فشل في إضافة العميل");
      await res.json();
      showMessage("تم إضافة العميل بنجاح", "success");
      addForm.reset();
      addForm.classList.remove("was-validated");
      const modalEl = document.getElementById("addCustomerModal");
      bootstrap.Modal.getInstance(modalEl)?.hide();
      initializeCustomersTable(true);
      updateCustomerStatistics();
    } catch (error) {
      showMessage("خطأ أثناء إضافة العميل: " + error.message, "danger");
    }
  });

// -----------------------
// View Customer Modal Behavior
// -----------------------
function viewCustomer(id) {
  fetch(API + "/customers/" + id)
    .then((res) => {
      if (!res.ok) throw new Error("فشل في جلب تفاصيل العميل");
      return res.json();
    })
    .then((data) => {
      document.getElementById("viewCustomerId").textContent =
        data.customerId || data._id;
      document.getElementById("viewCustomerName").textContent = data.name;
      document.getElementById("viewCustomerPhone").textContent = data.phone;
      document.getElementById("viewCustomerEmail").innerHTML = data.email
        ? `<a href="mailto:${data.email}">${data.email}</a>`
        : "";
      document.getElementById("viewCustomerAddress").textContent = data.address;
      document.getElementById("viewCustomerType").innerHTML =
        data.type === "company"
          ? `<span class="badge bg-warning">شركة</span>`
          : `<span class="badge bg-primary">فرد</span>`;
      const viewModalEl = document.getElementById("viewCustomerModal");
      const viewModal = new bootstrap.Modal(viewModalEl);
      viewModal.show();
    })
    .catch((error) => {
      showMessage("خطأ في جلب تفاصيل العميل: " + error.message, "danger");
    });
}

// -----------------------
// Edit Customer Modal Behavior
// -----------------------
window.currentCustomer = null;
function editCustomer(id) {
  fetch(API + "/customers/" + id)
    .then((res) => {
      if (!res.ok) throw new Error("فشل في جلب بيانات العميل");
      return res.json();
    })
    .then((data) => {
      window.currentCustomer = data;
      document.getElementById("editCustomerId").value = data._id;
      document.getElementById("editCustomerName").value = data.name;
      // Remove the "+966" prefix when filling the edit form phone field
      document.getElementById("editCustomerPhone").value = data.phone
        .toString()
        .slice(3);
      document.getElementById("editCustomerEmail").value = data.email || "";
      document.getElementById("editCustomerAddress").value = data.address;
      document.getElementById("editCustomerType").value = data.type || "";
      if (data.type === "company") {
        document
          .querySelector(".edit-company-field")
          .classList.remove("d-none");
        document.getElementById("editCompanyRegNumber").value =
          data.companyDetails?.registrationNumber || "";
      } else {
        document.querySelector(".edit-company-field").classList.add("d-none");
      }
      document.getElementById("editCustomerNotes").value = data.notes || "";
      const editModalEl = document.getElementById("editCustomerModal");
      const editModal = new bootstrap.Modal(editModalEl);
      editModal.show();
    })
    .catch((error) => {
      showMessage("خطأ في جلب بيانات العميل: " + error.message, "danger");
    });
}

document
  .getElementById("updateCustomerBtn")
  .addEventListener("click", async () => {
    const editForm = document.getElementById("editCustomerForm");
    if (!editForm.checkValidity()) {
      editForm.classList.add("was-validated");
      return;
    }

    const updatedCustomer = {
      _id: document.getElementById("editCustomerId").value,
      customerId: window.currentCustomer.customerId,
      name: document.getElementById("editCustomerName").value.trim(),
      phone: "966" + document.getElementById("editCustomerPhone").value.trim(),
      email: document.getElementById("editCustomerEmail").value.trim(),
      address: document.getElementById("editCustomerAddress").value.trim(),
      type: document.getElementById("editCustomerType").value,
      companyDetails:
        document.getElementById("editCustomerType").value === "company"
          ? {
              registrationNumber: document
                .getElementById("editCompanyRegNumber")
                .value.trim(),
            }
          : undefined,
      notes: document.getElementById("editCustomerNotes").value.trim(),
    };

    try {
      const res = await fetch(API + "/customers/" + updatedCustomer._id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomer),
      });
      if (!res.ok) throw new Error("فشل في تحديث بيانات العميل");
      await res.json();
      showMessage("تم تحديث بيانات العميل بنجاح", "success");
      const editModalEl = document.getElementById("editCustomerModal");
      bootstrap.Modal.getInstance(editModalEl)?.hide();
      initializeCustomersTable(true);
      window.currentCustomer = null;
    } catch (error) {
      showMessage("خطأ في تحديث بيانات العميل: " + error.message, "danger");
    }
  });

// -----------------------
// Delete Customer Modal Behavior
// -----------------------
function confirmDeleteCustomer(id, name) {
  document.getElementById("deleteCustomerId").value = id;
  document.getElementById("deleteCustomerName").textContent = name;
  const deleteModalEl = document.getElementById("deleteCustomerModal");
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  deleteModal.show();
}

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async () => {
    const id = document.getElementById("deleteCustomerId").value;
    try {
      const res = await fetch(API + "/customers/" + id, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل في حذف العميل");
      await res.json();
      showMessage("تم حذف العميل بنجاح", "success");
      const deleteModalEl = document.getElementById("deleteCustomerModal");
      bootstrap.Modal.getInstance(deleteModalEl)?.hide();
      initializeCustomersTable(true);
      updateCustomerStatistics();
    } catch (error) {
      showMessage("خطأ في حذف العميل: " + error.message, "danger");
    }
  });

// -----------------------
// Initialization
// -----------------------
document.addEventListener("DOMContentLoaded", () => {
  initializeCustomersTable(true);
  updateCustomerStatistics();
  // Handle company field display in addCustomerForm
  const customerTypeSelect = document.getElementById("customerType");
  customerTypeSelect.addEventListener("change", () => {
    const companyField = document.querySelector(".company-field");
    if (customerTypeSelect.value === "company") {
      companyField.classList.remove("d-none");
    } else {
      companyField.classList.add("d-none");
    }
  });
  // Listen for input changes in the search field and update global search.
  const searchInput = document.getElementById("searchCustomer");
  searchInput.addEventListener("input", function () {
    customersTable.search(this.value).draw();
  });
  // Listen for changes in the customer type filter.
  const typeFilter = document.getElementById("customerTypeFilter");
  typeFilter.addEventListener("change", function () {
    const selectedType = this.value;
    // Assuming the "نوع العميل" is in column index 3 of the DataTable.
    if (!selectedType) {
      customersTable.column(3).search("").draw();
    } else {
      // Search for the exact type text (e.g., "فرد" or "شركة").
      customersTable.column(3).search(selectedType).draw();
    }
  });
});

async function generateCustomerId() {
  let customers = getCachedData();
  if (!customers) {
    try {
      const res = await fetch(API + "/customers");
      if (res.ok) {
        customers = await res.json();
        setCachedData(customers);
      } else {
        customers = [];
      }
    } catch (err) {
      console.error("Error fetching customers for ID generation:", err);
      customers = [];
    }
  }
  let maxNum = 0;
  customers.forEach((c) => {
    if (c.customerId) {
      // Remove any non-digit characters; assume format "Cxxx"
      const num = parseInt(c.customerId.replace(/\D/g, ""));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  return "C" + String(maxNum + 1).padStart(3, "0");
}

async function updateCustomerStatistics() {
  try {
    const res = await fetch(API + "/customers");
    if (!res.ok) throw new Error("Failed to fetch customers");
    const customers = await res.json();

    // Total customers
    const total = customers.length;

    // New customers (assuming createdAt field exists and using the current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newCustomers = customers.filter((c) => {
      const created = new Date(c.createdAt);
      return (
        created.getFullYear() === currentYear &&
        created.getMonth() === currentMonth
      );
    }).length;

    // Individual and company customers
    const individualCount = customers.filter(
      (c) => c.type === "individual"
    ).length;
    const companyCount = customers.filter((c) => c.type === "company").length;

    // Update DOM elements
    document.getElementById("customerCount").textContent = total;
    document.getElementById("newCustomerCount").textContent = newCustomers;
    document.getElementById("individualCustomerCount").textContent =
      individualCount;
    document.getElementById("companyCustomerCount").textContent = companyCount;
  } catch (error) {
    console.error("Error updating customer statistics:", error);
  }
}
