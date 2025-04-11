const API_BASE_URL = window.SERVER_URI || "http://localhost:3000"; // Base URL for the backend server
const { jsPDF } = window.jspdf; // This line would fail without the library
// Display error messages as toast notifications
function showError(message, duration = 5000) {
  const toastContainer =
    document.getElementById("toast-container") || createToastContainer();

  // Create and configure toast element
  const toast = Object.assign(document.createElement("div"), {
    className: "toast toast-error",
    innerHTML: `
          <span>${message?.replace(/\n/g, "<br>") || "حدث خطأ غير معروف"}</span>
          <button class="toast-close" onclick="this.parentElement.remove()">×</button>
      `,
  });

  // Efficient DOM manipulation
  requestAnimationFrame(() => {
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  // Cleanup using single timeout
  const timeout = setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
    clearTimeout(timeout);
  }, duration);
}

// Helper function to create toast container if it doesn't exist
function createToastContainer() {
  // Check if container already exists
  const existingContainer = document.getElementById("toast-container");
  if (existingContainer) return existingContainer;

  // Create and configure container with enhanced attributes
  const container = Object.assign(document.createElement("div"), {
    id: "toast-container",
    className: "toast-container",
    role: "alert",
    "aria-live": "polite",
    "aria-atomic": "true",
  });

  // Set container styles for better positioning and stacking
  Object.assign(container.style, {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "9999",
    maxHeight: "100vh",
    overflowY: "auto",
    pointerEvents: "none", // Allow clicking through container
  });

  // Add container to DOM safely
  try {
    document.body.appendChild(container);
  } catch (error) {
    console.error("Failed to create toast container:", error);
    // Fallback to body if available, otherwise return null
    return document.querySelector(".toast-container") || null;
  }

  // Enable pointer events only for toast messages
  container.addEventListener("mouseover", () => {
    container.style.pointerEvents = "auto";
  });
  container.addEventListener("mouseleave", () => {
    container.style.pointerEvents = "none";
  });

  return container;
}

function clearError() {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  // Get all toast elements
  const toasts = toastContainer.querySelectorAll(".toast");

  // If no toasts, exit early
  if (!toasts.length) return;

  // Remove toasts with animation
  toasts.forEach((toast) => {
    toast.classList.remove("show");
    toast.addEventListener(
      "transitionend",
      () => {
        toast.remove();
      },
      { once: true }
    );
  });

  // Clean up container after all animations
  setTimeout(() => {
    if (toastContainer.children.length === 0) {
      toastContainer.innerHTML = "";
    }
  }, 300); // Match this with your CSS transition duration
}

// Load currencies from the database and populate the select element
async function loadCurrencies() {
  try {
    const response = await fetch(`${API_BASE_URL}/currencies`);
    if (!response.ok) {
      throw new Error("فشل في جلب العملات من قاعدة البيانات.");
    }
    const currencies = await response.json();

    if (currencies.length === 0) {
      throw new Error("لم يتم العثور على عملات في قاعدة البيانات.");
    }

    const currencySelect = document.getElementById("currency");
    currencySelect.innerHTML = "";

    currencies.forEach((currency) => {
      const option = document.createElement("option");
      option.value = currency.code;
      option.textContent = `${currency.name} (${currency.code})`;
      if (currency.code === "SAR") {
        option.selected = true;
      }
      currencySelect.appendChild(option);
    });

    changeCurrency();
  } catch (error) {
    showError(`خطأ أثناء جلب العملات: ${error.message}`);
    const fallbackCurrencies = [
      { code: "SAR", name: "ريال سعودي" },
      { code: "USD", name: "دولار أمريكي" },
      { code: "EUR", name: "يورو" },
      { code: "AED", name: "درهم إماراتي" },
    ];
    const currencySelect = document.getElementById("currency");
    currencySelect.innerHTML = "";
    fallbackCurrencies.forEach((currency) => {
      const option = document.createElement("option");
      option.value = currency.code;
      option.textContent = `${currency.name} (${currency.code})`;
      if (currency.code === "SAR") {
        option.selected = true;
      }
      currencySelect.appendChild(option);
    });
    changeCurrency();
  }
}

// Validate client data before submission
function validateClientData(clientData) {
  const errors = [];

  if (!clientData.name || clientData.name.trim() === "") {
    errors.push("يرجى إدخال اسم العميل / الشركة.");
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!clientData.email || !emailRegex.test(clientData.email)) {
    errors.push("يرجى إدخال بريد إلكتروني صالح.");
  }

  const phoneRegex = /^\+?\d{10,15}$/;
  if (!clientData.phone || !phoneRegex.test(clientData.phone)) {
    errors.push("يرجى إدخال رقم هاتف صالح (10-15 رقمًا، يمكن أن يبدأ بـ +).");
  }

  return errors;
}

// Load logo
function loadLogo(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("company-logo").src = e.target.result;
      document.getElementById("company-logo").style.display = "block";
      document.querySelector(".logo-text").style.display = "none";
    };
    reader.readAsDataURL(file);
  }
}

// Load stamp
function loadStamp(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("company-stamp").src = e.target.result;
      document.getElementById("company-stamp").style.display = "block";
      document.querySelector(".stamp-text").style.display = "none";
    };
    reader.readAsDataURL(file);
  }
}

// Load partner logo
function loadPartnerLogo(event, partnerNumber) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const logo = document.getElementById(`partner-logo-${partnerNumber}`);
      logo.src = e.target.result;
      logo.style.display = "block";
      event.target.parentElement.querySelector(
        ".partner-logo-text"
      ).style.display = "none";
    };
    reader.readAsDataURL(file);
  }
}

// Update row total
function updateRowTotal(input) {
  const row = input.closest("tr");
  const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
  const price =
    parseFloat(row.querySelector(".price-input").value.replace(/,/g, "")) || 0;
  const tax = parseFloat(row.querySelector(".tax-input").value) || 0;

  const baseTotal = qty * price;
  const taxAmount = baseTotal * (tax / 100);
  const total = baseTotal + taxAmount;

  row.querySelector(".row-total").textContent = total.toLocaleString("ar-SA");
  updateTotals();
}

// Update totals
function updateTotals() {
  let baseTotal = 0;
  let taxTotal = 0;

  const rows = document.querySelectorAll(
    "#products-table-body tr:not([style*='display: none'])"
  );
  rows.forEach((row) => {
    const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
    const price =
      parseFloat(row.querySelector(".price-input").value.replace(/,/g, "")) ||
      0;
    const tax = parseFloat(row.querySelector(".tax-input").value) || 0;

    const rowBaseTotal = qty * price;
    const rowTaxAmount = rowBaseTotal * (tax / 100);

    baseTotal += rowBaseTotal;
    taxTotal += rowTaxAmount;
  });

  const specialDiscount =
    parseFloat(
      document.getElementById("special-discount").value.replace(/,/g, "")
    ) || 0;
  const afterDiscount = baseTotal - specialDiscount;
  const finalTotal = afterDiscount + taxTotal;

  document.getElementById("subtotal").textContent =
    baseTotal.toLocaleString("ar-SA");
  document.getElementById("after-discount").textContent =
    afterDiscount.toLocaleString("ar-SA");
  document.getElementById("vat").textContent = taxTotal.toLocaleString("ar-SA");
  document.getElementById("final-total").textContent =
    finalTotal.toLocaleString("ar-SA");
}
function formatPrice(input) {
  let value = input.value.replace(/[^\d.]/g, "");
  if (value) {
    value = parseFloat(value).toLocaleString("ar-SA");
    input.value = value;
  }
}
function addNewRow() {
  const tableBody = document.getElementById("products-table-body");
  const templateRow = document.getElementById("new-row-template");

  if (!tableBody || !templateRow) {
    showError("حدث خطأ أثناء إضافة صف جديد.");
    return;
  }

  // Clone the template row
  const newRow = templateRow.cloneNode(true);
  newRow.id = "";
  newRow.style.display = "";

  // Get the number of existing rows to update the row number
  const rowCount =
    tableBody.querySelectorAll("tr:not([style*='display: none'])").length + 1;
  newRow.querySelector(".row-number").innerHTML = `
    ${rowCount} <button class="delete-row-btn no-print" onclick="deleteRow(this)">حذف</button>
  `;

  // Attach event listeners for input changes
  newRow
    .querySelector(".qty-input")
    .addEventListener("input", () => updateRowTotal(newRow));
  newRow
    .querySelector(".price-input")
    .addEventListener("input", () => updateRowTotal(newRow));
  newRow
    .querySelector(".tax-input")
    .addEventListener("input", () => updateRowTotal(newRow));

  newRow.querySelector(".price-input").addEventListener("blur", function () {
    formatPrice(this);
    updateRowTotal(this);
  });
  newRow.querySelector(".qty-input").value = "1";
  newRow.querySelector(".price-input").value = "0";
  newRow.querySelector(".tax-input").value =
    document.getElementById("vat-percentage").textContent;

  // Append the new row to the table body
  tableBody.appendChild(newRow);

  // Update totals after adding the row
  updateTotals();
}

// Delete row
function deleteRow(button) {
  if (confirm("هل أنت متأكد من حذف هذا الصف؟")) {
    button.closest("tr").remove();
    renumberRows();
    updateTotals();
  }
}

// Renumber rows
function renumberRows() {
  const rows = document.querySelectorAll(
    "#products-table-body tr:not([style*='display: none'])"
  );
  rows.forEach((row, index) => {
    const tdFirst = row.querySelector("td:first-child");
    tdFirst.innerHTML = `${
      index + 1
    } <button class="delete-row-btn no-print" onclick="deleteRow(this)">حذف</button>`;
  });
}

// Add condition
function addCondition() {
  const conditionsList = document.getElementById("conditions-list");
  const newCondition = document.createElement("li");
  newCondition.contentEditable = true;
  newCondition.textContent = "أدخل الشرط الجديد هنا...";
  conditionsList.appendChild(newCondition);
}

// Toggle edit mode
function toggleEditMode() {
  const inputs = document.querySelectorAll('input:not([type="file"])');
  inputs.forEach((input) => {
    input.readOnly = !input.readOnly;
    input.style.border = input.readOnly ? "none" : "1px solid #ddd";
    input.style.backgroundColor = input.readOnly ? "transparent" : "#fff";
  });
}

// Change currency
function changeCurrency() {
  const currencySelect = document.getElementById("currency");
  const selectedCurrency = currencySelect.value;
  const selectedOption = currencySelect.options[currencySelect.selectedIndex];
  const currencyName = selectedOption.textContent.split("(")[0].trim();
  document.getElementById("currency-display").textContent = currencyName;

  const firstCondition = document
    .getElementById("conditions-list")
    .querySelector("li");
  if (firstCondition) {
    const patterns = [
      /بالريال السعودي/i,
      /بالدولار الأمريكي/i,
      /باليورو/i,
      /بالدرهم الإماراتي/i,
      /بالجنيه الإسترليني/i,
      /بالين الياباني/i,
      /بدولار كندي/i,
      /بدولار أسترالي/i,
      /بفرنك سويسري/i,
      /بيوان صيني/i,
    ];

    let text = firstCondition.textContent;
    patterns.forEach((pattern) => {
      text = text.replace(pattern, `بال${currencyName}`);
    });
    firstCondition.textContent = text;
  }
}

// Update VAT rate
function updateVatRate(rate) {
  const vatPercentage = parseFloat(rate);
  if (!isNaN(vatPercentage) && vatPercentage >= 0) {
    document.getElementById("vat-percentage").textContent = vatPercentage;
    document
      .querySelectorAll(".tax-input")
      .forEach((input) => (input.value = vatPercentage));
    updateTotals();
  }
}

// Update watermark
function updateWatermark(text) {
  document.querySelector(".watermark").textContent = text || "نسخة للعميل";
}

// Export to PDF with Arabic support
async function exportToPDF() {
  const printControls = document.querySelector(".print-controls");
  const container = document.querySelector(".container");

  try {
    // Hide controls and show loading indicator
    printControls.style.display = "none";
    document.body.style.cursor = "wait";

    // Optimize canvas rendering
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false, // Disable logging for better performance
      allowTaint: false,
      imageTimeout: 15000, // 15 seconds timeout for images
      removeContainer: true, // Clean up temporary elements
      letterRendering: true, // Better text quality
    });

    // Initialize jsPDF with optimal settings
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true, // Enable compression
      precision: 16, // Higher precision for better text positioning
    });

    // Configure PDF settings
    pdf.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    pdf.setFont("Amiri");
    pdf.setLanguage("ar");
    pdf.setR2L(true);

    // Calculate dimensions with better precision
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    // Convert canvas to high-quality JPEG
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // Calculate number of pages needed
    const totalPages = Math.ceil(contentHeight / (pageHeight - 2 * margin));

    // Add pages with content
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const position = -i * (pageHeight - 2 * margin);

      pdf.addImage(
        imgData,
        "JPEG",
        margin,
        position + margin,
        contentWidth,
        contentHeight,
        undefined,
        "FAST" // Use fast image processing
      );

      // Add page number if multiple pages
      if (totalPages > 1) {
        pdf.setFontSize(8);
        pdf.text(`${i + 1} / ${totalPages}`, pageWidth / 2, pageHeight - 5, {
          align: "center",
        });
      }
    }

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `عرض_سعر_${timestamp}.pdf`;

    // Save PDF with optimized settings
    pdf.save(filename, { returnPromise: true });

    // Show success message
    showSuccess("تم تصدير PDF بنجاح!");
  } catch (error) {
    console.error("PDF Export Error:", error);
    showError(`فشل تصدير PDF: ${error.message}`);
  } finally {
    // Restore UI state
    printControls.style.display = "flex";
    document.body.style.cursor = "default";
  }
}

// Save quotation to database (original functionality)
async function saveQuotationToDB() {
  try {
    clearError();

    // 1. Collect and Validate Client Data
    const clientData = {
      name: document.getElementById("client-name").innerText.trim(),
      email: document.getElementById("client-email").innerText.trim(),
      address: {
        street:
          document
            .getElementById("client-address")
            .innerText.split("،")[0]
            ?.trim() || "",
        city:
          document
            .getElementById("client-address")
            .innerText.split("،")[1]
            ?.trim() || "",
      },
      phone: document
        .getElementById("client-phone")
        .innerText.trim()
        .replace(/[^0-9+]/g, ""),
      taxNumber: document.getElementById("client-taxNumber").innerText.trim(),
    };

    const validationErrors = validateClientData(clientData);
    if (validationErrors.length > 0) {
      showError(validationErrors.join("\n"));
      return;
    }

    let clientId;
    const existingClient = await fetch(
      `${API_BASE_URL}/clients?email=${encodeURIComponent(clientData.email)}`
    );
    if (!existingClient.ok) throw new Error("فشل في التحقق من وجود العميل.");
    const clients = await existingClient.json();
    if (clients.length > 0) {
      clientId = clients[0]._id;
    } else {
      const clientResponse = await fetch(`${API_BASE_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
      if (!clientResponse.ok) {
        const errorData = await clientResponse.json();
        const errorMessage = errorData.message || "فشل في إضافة العميل.";
        throw new Error(errorMessage);
      }
      const client = await clientResponse.json();
      clientId = client._id;
    }

    // 2. Save Products
    const productIds = [];
    const rows = document.querySelectorAll(
      "#products-table-body tr:not([style*='display: none'])"
    );
    if (rows.length === 0) {
      showError("يرجى إضافة منتج واحد على الأقل.");
      return;
    }
    for (const row of rows) {
      const productData = {
        productCode: row.cells[1].innerText.trim(),
        productTitle: row.cells[2].innerText.split("\n")[0]?.trim() || "",
        productDescription:
          row.cells[2].querySelector(".item-details")?.innerText.trim() || "",
        productPrice:
          parseFloat(
            row.querySelector(".price-input").value.replace(/,/g, "")
          ) || 0,
      };

      if (!productData.productCode) {
        showError("يرجى إدخال رمز المنتج لجميع المنتجات.");
        return;
      }
      if (!productData.productTitle) {
        showError("يرجى إدخال عنوان المنتج لجميع المنتجات.");
        return;
      }

      const productResponse = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.message || "فشل في إضافة المنتج.");
      }
      const product = await productResponse.json();
      productIds.push(product._id);
    }

    // 3. Save Rules
    const ruleIds = [];
    const conditions = document
      .getElementById("conditions-list")
      .querySelectorAll("li");
    for (const condition of conditions) {
      const ruleData = {
        title: condition.innerText.slice(0, 30).trim(),
        description: condition.innerText.trim(),
        category: "general",
        isActive: true,
      };

      if (!ruleData.title || !ruleData.description) continue;

      const ruleResponse = await fetch(`${API_BASE_URL}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      });
      if (!ruleResponse.ok) {
        const errorData = await ruleResponse.json();
        throw new Error(errorData.message || "فشل في إضافة الشرط.");
      }
      const rule = await ruleResponse.json();
      ruleIds.push(rule._id);
    }

    // 4. Save Show (Quotation)
    const showData = {
      clientId,
      rules: ruleIds,
      products: productIds,
      title: document.getElementById("quote-number").innerText.trim(),
      status: "draft",
    };

    const showResponse = await fetch(`${API_BASE_URL}/shows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(showData),
    });
    if (!showResponse.ok) {
      const errorData = await showResponse.json();
      throw new Error(errorData.message || "فشل في حفظ عرض السعر.");
    }
    const show = await showResponse.json();

    alert(`تم حفظ عرض السعر بنجاح! رقم العرض: ${show.title}`);
  } catch (error) {
    console.error("Error saving quotation:", error);
    let errorMessage = "حدث خطأ أثناء حفظ عرض السعر: ";
    if (error.message.includes("client validation failed")) {
      if (error.message.includes("phone: Invalid phone number format")) {
        errorMessage +=
          "رقم الهاتف غير صالح. يجب أن يحتوي على 10-15 رقمًا (يمكن أن يبدأ بـ +).";
      } else if (error.message.includes("name: Validator failed")) {
        errorMessage += "يرجى إدخال اسم العميل / الشركة.";
      } else if (error.message.includes("email")) {
        errorMessage += "يرجى إدخال بريد إلكتروني صالح.";
      } else {
        errorMessage += error.message;
      }
    } else {
      errorMessage += error.message;
    }
    showError(errorMessage);
  }
}
// Save quotation as JSON (new functionality)
function saveQuotationAsJSON() {
  try {
    clearError();

    // 1. Collect Client Data
    const clientData = {
      name: document.getElementById("client-name").innerText.trim(),
      email: document.getElementById("client-email").innerText.trim(),
      address: document.getElementById("client-address").innerText.trim(),
      phone: document
        .getElementById("client-phone")
        .innerText.trim()
        .replace(/[^0-9+]/g, ""),
      taxNumber: document.getElementById("client-taxNumber").innerText.trim(),
      contact: document.getElementById("client-contact").innerText.trim(),
    };

    const validationErrors = validateClientData(clientData);
    if (validationErrors.length > 0) {
      showError(validationErrors.join("\n"));
      return;
    }

    // 2. Collect Quotation Details
    const quoteNumber = document
      .getElementById("quote-number")
      .innerText.trim();
    const quoteDate = document.getElementById("quote-date").innerText.trim();

    // 3. Collect Products
    const products = [];
    const rows = document.querySelectorAll(
      "#products-table-body tr:not([style*='display: none'])"
    );
    if (rows.length === 0) {
      showError("يرجى إضافة منتج واحد على الأقل.");
      return;
    }
    for (const row of rows) {
      const product = {
        productCode: row.cells[1].innerText.trim(),
        productTitle: row.cells[2].innerText.split("\n")[0]?.trim() || "",
        productDescription:
          row.cells[2].querySelector(".item-details")?.innerText.trim() || "",
        quantity: parseFloat(row.querySelector(".qty-input").value) || 0,
        price:
          parseFloat(
            row.querySelector(".price-input").value.replace(/,/g, "")
          ) || 0,
        tax: parseFloat(row.querySelector(".tax-input").value) || 0,
        total:
          parseFloat(
            row.querySelector(".row-total").innerText.replace(/,/g, "")
          ) || 0,
      };

      if (!product.productCode) {
        showError("يرجى إدخال رمز المنتج لجميع المنتجات.");
        return;
      }
      if (!product.productTitle) {
        showError("يرجى إدخال عنوان المنتج لجميع المنتجات.");
        return;
      }

      products.push(product);
    }

    // 4. Collect Totals
    const totals = {
      subtotal:
        parseFloat(
          document.getElementById("subtotal").innerText.replace(/,/g, "")
        ) || 0,
      specialDiscount:
        parseFloat(
          document.getElementById("special-discount").value.replace(/,/g, "")
        ) || 0,
      afterDiscount:
        parseFloat(
          document.getElementById("after-discount").innerText.replace(/,/g, "")
        ) || 0,
      vat:
        parseFloat(
          document.getElementById("vat").innerText.replace(/,/g, "")
        ) || 0,
      finalTotal:
        parseFloat(
          document.getElementById("final-total").innerText.replace(/,/g, "")
        ) || 0,
      currency: document.getElementById("currency-display").innerText.trim(),
    };

    // 5. Collect Conditions
    const conditions = [];
    const conditionElements = document
      .getElementById("conditions-list")
      .querySelectorAll("li");
    for (const condition of conditionElements) {
      const text = condition.innerText.trim();
      if (text && text !== "أدخل الشرط الجديد هنا...") {
        conditions.push(text);
      }
    }

    // 6. Collect Additional Data (Company Info, Signature, etc.)
    const companyInfo = {
      name: document.querySelector(".company-header h2").innerText.trim(),
      address: document
        .querySelector(".company-header p:nth-child(2)")
        .innerText.trim(),
      phone: document
        .querySelector(".company-header p:nth-child(3)")
        .innerText.trim(),
      email: document
        .querySelector(".company-header p:nth-child(4)")
        .innerText.trim(),
      taxNumber: document
        .querySelector(".company-header p:nth-child(5)")
        .innerText.trim(),
    };

    const signature = {
      providerName: document
        .querySelector(".signature p:nth-child(2) span")
        .innerText.trim(),
      position: document
        .querySelector(".signature p:nth-child(3) span")
        .innerText.trim(),
      date: document
        .querySelector(".signature p:nth-child(5) span")
        .innerText.trim(),
    };

    // 7. Construct the Quotation Object
    const quotation = {
      quoteNumber,
      quoteDate,
      clientInfo: clientData,
      products,
      totals,
      conditions,
      companyInfo,
      signature,
      watermark: document.querySelector(".watermark").innerText.trim(),
      vatRate: parseFloat(document.getElementById("vat-rate").value) || 15,
    };

    // 8. Convert to JSON and Trigger Download
    const jsonString = JSON.stringify(quotation, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Quotation_${quoteNumber}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`تم حفظ عرض السعر بنجاح كـ JSON! (${link.download})`);
  } catch (error) {
    console.error("Error saving quotation as JSON:", error);
    showError(`حدث خطأ أثناء حفظ عرض السعر كـ JSON: ${error.message}`);
  }
}

// Load quotation
function loadQuotation() {
  document.getElementById("import-quotation").click();
}

// Import quotation file
function importQuotationFile(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const quotationData = JSON.parse(e.target.result);
        loadQuotationData(quotationData);
      } catch (error) {
        showError("خطأ في تحميل الملف: " + error.message);
      }
    };
    reader.readAsText(file);
  }
}

// Load quotation data from JSON
function loadQuotationData(data) {
  try {
    // Load Client Information
    document.getElementById("client-name").innerText = data.clientInfo.name;
    document.getElementById("client-email").innerText = data.clientInfo.email;
    document.getElementById("client-address").innerText =
      data.clientInfo.address;
    document.getElementById("client-phone").innerText = data.clientInfo.phone;
    document.getElementById("client-taxNumber").innerText =
      data.clientInfo.taxNumber;
    document.getElementById("client-contact").innerText =
      data.clientInfo.contact;

    // Load Quotation Details
    document.getElementById("quote-number").innerText = data.quoteNumber;
    document.getElementById("quote-date").innerText = data.quoteDate;

    // Load Products
    const tableBody = document.getElementById("products-table-body");
    tableBody.innerHTML = ""; // Clear existing rows

    data.products.forEach((product, index) => {
      const newRow = document.createElement("tr");

      newRow.innerHTML = `
        <td class="row-number">${
          index + 1
        } <button class="delete-row-btn no-print" onclick="deleteRow(this)">حذف</button></td>
        <td contenteditable="true">${product.productCode}</td>
        <td contenteditable="true">
          ${product.productTitle}
          <div class="item-details">${product.productDescription}</div>
        </td>
        <td><input type="number" class="qty-input" value="${
          product.quantity
        }" min="0" oninput="updateRowTotal(this)" /></td>
        <td><input type="text" class="price-input" value="${
          product.price
        }" oninput="updateRowTotal(this)" /></td>
        <td><input type="number" class="tax-input" value="${
          product.tax
        }" min="0" max="100" oninput="updateRowTotal(this)" /></td>
        <td class="row-total">${product.total.toLocaleString("ar-SA")}</td>
      `;

      tableBody.appendChild(newRow);
    });

    // Load Totals
    document.getElementById("subtotal").textContent =
      data.totals.subtotal.toLocaleString("ar-SA");
    document.getElementById("special-discount").value =
      data.totals.specialDiscount;
    document.getElementById("after-discount").textContent =
      data.totals.afterDiscount.toLocaleString("ar-SA");
    document.getElementById("vat").textContent =
      data.totals.vat.toLocaleString("ar-SA");
    document.getElementById("final-total").textContent =
      data.totals.finalTotal.toLocaleString("ar-SA");

    // Load Currency
    document.getElementById("currency-display").textContent =
      data.totals.currency;

    // Load Conditions
    const conditionsList = document.getElementById("conditions-list");
    conditionsList.innerHTML = "";
    data.conditions.forEach((condition) => {
      const li = document.createElement("li");
      li.textContent = condition;
      li.contentEditable = true;
      conditionsList.appendChild(li);
    });

    // Load Company Information
    document.querySelector(".company-header h2").innerText =
      data.companyInfo.name;
    document.querySelector(".company-header p:nth-child(2)").innerText =
      data.companyInfo.address;
    document.querySelector(".company-header p:nth-child(3)").innerText =
      data.companyInfo.phone;
    document.querySelector(".company-header p:nth-child(4)").innerText =
      data.companyInfo.email;
    document.querySelector(".company-header p:nth-child(5)").innerText =
      data.companyInfo.taxNumber;

    // Load Signature
    document.querySelector(".signature p:nth-child(2) span").innerText =
      data.signature.providerName;
    document.querySelector(".signature p:nth-child(3) span").innerText =
      data.signature.position;
    document.querySelector(".signature p:nth-child(5) span").innerText =
      data.signature.date;

    // Load Watermark
    document.querySelector(".watermark").innerText = data.watermark;

    // Load VAT Rate
    document.getElementById("vat-rate").value = data.vatRate;
    updateVatRate(data.vatRate);

    showSuccess("تم تحميل عرض السعر بنجاح!");
  } catch (error) {
    console.error("Error loading quotation data:", error);
    showError("حدث خطأ أثناء تحميل عرض السعر.");
  }
}

// Helper function to show success messages (add this if not already present)
function showSuccess(message) {
  const toastContainer = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = "toast toast-success";
  toast.innerHTML = `
    <span>${message.replace(/\n/g, "<br>")}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Reset form
function resetForm() {
  if (confirm("هل أنت متأكد من إنشاء عرض سعر جديد؟")) {
    const today = new Date();
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    document.getElementById(
      "quote-number"
    ).innerText = `Q-${today.getFullYear()}-${randomNumber}`;
    document.getElementById("quote-date").innerText = today.toLocaleDateString(
      "ar-SA",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    document.getElementById("client-name").innerText = "";
    document.getElementById("client-address").innerText = "";
    document.getElementById("client-taxNumber").innerText = "";
    document.getElementById("client-contact").innerText = "";
    document.getElementById("client-phone").innerText = "";
    document.getElementById("client-email").innerText = "";
    document.getElementById("products-table-body").innerHTML = "";
    document.getElementById("conditions-list").innerHTML = "";
    document.getElementById("special-discount").value = 0;
    document.getElementById("currency").selectedIndex = 0;
    document.getElementById("currency-display").textContent = "ريال سعودي";
    addNewRow();
    updateTotals();
    clearError();
  }
}

// Initialize form
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  document.getElementById("quote-date").innerText = today.toLocaleDateString(
    "ar-SA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  document.getElementById(
    "quote-number"
  ).innerText = `Q-${today.getFullYear()}-${randomNumber}`;
  addNewRow();
  updateTotals();
  loadCurrencies();
});
