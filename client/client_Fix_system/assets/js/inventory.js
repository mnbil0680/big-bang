// Inventory Management JavaScript
import { fetchWithErrorHandling, showErrorMessage } from "./utils.js";
let currentEditId = null;

// API Base URL
const API_BASE_URL = "http://localhost:3000";
console.log("API URL:", API_BASE_URL);
// Constants
const REFRESH_INTERVAL = 300000; // 5 minutes
const CACHE_KEY = "inventory_data";
const CACHE_DURATION = 300000; // 5 minutes

// DOM Elements
const inventoryTable = document.getElementById("inventoryItemsTable");
const refreshTableBtn = document.getElementById("refreshTableBtn");
const loadingSpinner = document.createElement("div");

// Initialize loading spinner
loadingSpinner.className = "text-center my-4 d-none";
loadingSpinner.innerHTML = `
    <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">جاري التحميل...</span>
    </div>
`;
inventoryTable.parentNode.insertBefore(loadingSpinner, inventoryTable);

// Cache management
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
    JSON.stringify({
      data,
      timestamp: Date.now(),
    })
  );
}

// Fetch and display inventory data
async function fetchInventoryData(forceRefresh = false) {
  try {
    loadingSpinner.classList.remove("d-none");
    inventoryTable.classList.add("d-none");

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        updateInventoryTable(cachedData);
        updateStatistics(cachedData);
        return;
      }
    }

    const result = await fetchWithErrorHandling(`${API_BASE_URL}/inventory`);
    if (!result.success) {
      throw new Error(result.error);
    }

    const data = result.data;
    if (!Array.isArray(data)) {
      throw new Error("Invalid data format received from server");
    }
    console.log(data);
    if (data.length === 0) {
      showError("لا توجد عناصر في المخزون");
    } else {
      setCachedData(data);
      updateInventoryTable(data);
      updateStatistics(data);
    }
  } catch (error) {
    console.error("Error fetching inventory:", error);
    showErrorMessage("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى");

    // Try to use cached data as fallback
    const cachedData = getCachedData();
    if (cachedData) {
      updateInventoryTable(cachedData);
      updateStatistics(cachedData);
    }
  } finally {
    loadingSpinner.classList.add("d-none");
    inventoryTable.classList.remove("d-none");
  }
}

// Update table with inventory data
function updateInventoryTable(data) {
  const tbody =
    inventoryTable.querySelector("tbody") || inventoryTable.createTBody();
  tbody.innerHTML = "";
  console.log(data);
  console.log(inventoryTable);
  if (!data || data.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">لا توجد عناصر في المخزون</td>
            </tr>
        `;
    return;
  }

  data.forEach((item) => {
    const row = tbody.insertRow();
    row.innerHTML = `
          <td>${item.itemId || "-"}</td>
          <td>${item.name || "-"}</td>
          <td>${item.category || "-"}</td>
          <td>${item.price ? `${item.price} ريال` : "-"}</td>
          <td>
            <span class="badge ${getQuantityBadgeClass(item.quantity)}">
              ${item.quantity || 0}
            </span>
          </td>
          <td>${item.supplier || "-"}</td>
          <td>
            <button class="btn btn-warning btn-sm edit-item" data-id="${
              item._id
            }">تعديل</button>
            <button class="btn btn-danger btn-sm delete-item" data-id="${
              item._id
            }">حذف</button>
          </td>
        `;

    // Edit button: prevent row click and call editItem() with correct _id
    const editBtn = row.querySelector(".edit-item");
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editItem(item._id);
    });

    // Delete button: prevent row click and call deleteItem() with correct _id
    const deleteBtn = row.querySelector(".delete-item");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
        deleteItem(item._id);
      }
    });
  });
}

async function editItem(id) {
  try {
    const result = await fetchWithErrorHandling(
      `${API_BASE_URL}/inventory/${id}`
    );
    if (result.success) {
      const item = result.data;
      // Populate the form with the item's current values
      document.getElementById("itemId").value = item.itemId || "";
      document.getElementById("itemName").value = item.name || "";
      document.getElementById("itemCategory").value = item.category || "";
      document.getElementById("itemPrice").value = item.price || "";
      document.getElementById("itemQuantity").value = item.quantity || "";
      document.getElementById("itemMinQuantity").value =
        item.itemMinQuantity || "";
      document.getElementById("itemSupplier").value = item.supplier || "";

      // Change modal title to indicate editing mode
      document.getElementById("addItemModalLabel").textContent =
        "تعديل عنصر المخزون";

      // Set the currentEditId to the item's _id
      currentEditId = id;

      // Show the modal without resetting the form (since we're editing)
      const addItemModalEl = document.getElementById("addItemModal");
      const modalInstance =
        bootstrap.Modal.getInstance(addItemModalEl) ||
        new bootstrap.Modal(addItemModalEl);
      modalInstance.show();
    } else {
      showErrorMessage("فشل جلب تفاصيل العنصر: " + result.error);
    }
  } catch (error) {
    showErrorMessage("حدث خطأ أثناء محاولة تعديل العنصر.");
  }
}

async function deleteItem(id) {
  try {
    const result = await fetchWithErrorHandling(
      `${API_BASE_URL}/inventory/${id}`,
      {
        method: "DELETE",
      }
    );
    if (result.success) {
      fetchInventoryData(true);
    } else {
      showErrorMessage("فشل حذف العنصر: " + result.error);
    }
  } catch (error) {
    showErrorMessage("حدث خطأ أثناء محاولة حذف العنصر.");
  }
}

// Update statistics using data from API
function updateStatistics(data) {
  // Total items count
  const totalItems = data.length;

  // Low stock: items where quantity > 0 and less than the minimum quantity (if provided)
  const lowStockCount = data.filter(
    (item) =>
      item.quantity > 0 &&
      item.itemMinQuantity &&
      item.quantity < item.itemMinQuantity
  ).length;

  // Out of stock: items with no quantity or zero quantity
  const outOfStockCount = data.filter(
    (item) => !item.quantity || item.quantity <= 0
  ).length;

  // Inventory value: Sum of (price * quantity) for each item
  const inventoryValue = data.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Update DOM elements (ensure your HTML has these IDs)
  document.getElementById("totalItems").textContent = totalItems;
  document.getElementById("lowStockCount").textContent = lowStockCount;
  document.getElementById("outOfStockCount").textContent = outOfStockCount;
  document.getElementById("inventoryValue").textContent =
    inventoryValue.toLocaleString("ar-EG") + " ريال";
}

// Get appropriate badge class based on quantity
function getQuantityBadgeClass(quantity) {
  if (quantity <= 0) return "bg-danger";
  if (quantity <= 10) return "bg-warning";
  return "bg-success";
}

// Show error message in the table body
function showError(message) {
  const tbody =
    inventoryTable.querySelector("tbody") || inventoryTable.createTBody();
  tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>${message}
            </td>
        </tr>
    `;
}

// Show item details in modal
function showItemDetails(item) {
  document.getElementById("viewItemId").textContent = item.itemId || "-";
  document.getElementById("viewItemName").textContent = item.name || "-";
  document.getElementById("viewItemCategory").textContent =
    item.category || "-";
  document.getElementById("viewItemSupplier").textContent =
    item.supplier || "-";
  document.getElementById("viewItemPrice").textContent = item.price
    ? `${item.price} ريال`
    : "-";

  // Update stock level
  const stockLevel = document.getElementById("viewStockLevel");
  const progressBar = document.querySelector(".progress-bar");
  const percentage = Math.min(Math.max((item.quantity / 100) * 100, 0), 100);

  stockLevel.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
  progressBar.className = `progress-bar ${getProgressBarClass(percentage)}`;

  // Show movement history if available
  const historyBody = document.getElementById("stockMovementHistory");
  historyBody.innerHTML = "";

  if (item.movements && item.movements.length > 0) {
    item.movements.forEach((movement) => {
      const row = historyBody.insertRow();
      row.innerHTML = `
                <td>${new Date(movement.date).toLocaleDateString("ar-SA")}</td>
                <td>${movement.type === "in" ? "وارد" : "صادر"}</td>
                <td>${movement.quantity}</td>
                <td>${movement.userId || "-"}</td>
                <td>${movement.notes || "-"}</td>
            `;
    });
  } else {
    historyBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">لا يوجد سجل حركة</td>
            </tr>
        `;
  }

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("viewItemModal"));
  modal.show();
}

// Get progress bar class based on percentage
function getProgressBarClass(percentage) {
  if (percentage <= 25) return "bg-danger";
  if (percentage <= 50) return "bg-warning";
  return "bg-success";
}

// Event Listeners
refreshTableBtn.addEventListener("click", () => fetchInventoryData(true));

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  fetchInventoryData();
  // Auto-refresh every 5 minutes
  setInterval(fetchInventoryData, REFRESH_INTERVAL);
});

// Save button event listener: updates if editing, adds if not
// Save button event listener: updates if editing, adds if not
document
  .getElementById("saveItemBtn")
  .addEventListener("click", async function () {
    const addItemForm = document.getElementById("addItemForm");

    // Validate the form using Bootstrap's validation
    if (!addItemForm.checkValidity()) {
      addItemForm.classList.add("was-validated");
      return;
    }

    // Collect form data
    const itemIdInput = document.getElementById("itemId").value.trim();
    const itemName = document.getElementById("itemName").value.trim();
    const itemCategory = document.getElementById("itemCategory").value;
    const itemPrice = parseFloat(document.getElementById("itemPrice").value);
    const itemQuantity = parseInt(
      document.getElementById("itemQuantity").value
    );
    const itemMinQuantity = parseInt(
      document.getElementById("itemMinQuantity").value
    );
    const itemSupplier = document.getElementById("itemSupplier").value.trim();

    // Build the item object
    const itemData = {
      itemId: itemIdInput,
      name: itemName,
      category: itemCategory,
      price: itemPrice,
      quantity: itemQuantity,
      itemMinQuantity: itemMinQuantity,
      supplier: itemSupplier,
    };

    let result;
    // Check if we're in edit mode
    if (currentEditId) {
      // Include the currentEditId in the body since your API uses the body for update
      itemData._id = currentEditId;
      // Update existing item
      result = await fetchWithErrorHandling(
        `${API_BASE_URL}/inventory/${currentEditId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemData),
        }
      );
    } else {
      // Add new item
      result = await fetchWithErrorHandling(`${API_BASE_URL}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });
    }

    if (result.success) {
      // Clear the form and reset validation state
      addItemForm.reset();
      addItemForm.classList.remove("was-validated");

      // Hide the modal (using Bootstrap's modal API)
      const addItemModalEl = document.getElementById("addItemModal");
      const modalInstance =
        bootstrap.Modal.getInstance(addItemModalEl) ||
        new bootstrap.Modal(addItemModalEl);
      modalInstance.hide();

      // Reset edit mode
      currentEditId = null;
      document.getElementById("addItemModalLabel").textContent =
        "إضافة عنصر مخزون جديد";

      // Refresh inventory data
      fetchInventoryData(true);
    } else {
      // Display error message
      const actionText = currentEditId ? "تعديل" : "إضافة";
      showErrorMessage(`فشل ${actionText} العنصر: ${result.error}`);
    }
  });

// When clicking the "إضافة عنصر جديد" button (modal trigger), reset form only if triggered by user
const addItemModalEl = document.getElementById("addItemModal");
addItemModalEl.addEventListener("show.bs.modal", function (event) {
  // If event.relatedTarget exists, it means the modal was triggered by a button click
  if (event.relatedTarget) {
    currentEditId = null;
    document.getElementById("addItemModalLabel").textContent =
      "إضافة عنصر مخزون جديد";
    const addItemForm = document.getElementById("addItemForm");
    addItemForm.reset();
    addItemForm.classList.remove("was-validated");
  }
});
