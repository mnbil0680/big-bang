const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : window.SERVER_URI;
function voucherSystem() {
  return {
    activeTab: "new",
    isPreview: false,
    newVoucher: {
      // Default type changed to "قبض" to represent receipts.
      type: "قبض",
      voucherNumber: "",
      date: new Date().toISOString().split("T")[0],
      entity: "",
      amount: "",
      amountInWords: "",
      description: "",
      paymentMethod: "",
      checkNumber: "",
      checkDate: "",
      bank: "",
      transferNumber: "",
    },
    previewVoucher: {},
    vouchers: [],
    filteredVouchers: [],
    settings: {
      companyName: "شركة نموذجية",
      companyLogo: "",
      address: "المدينة - الشارع - رقم المبنى",
      phone: "966555555555+",
      email: "info@example.com",
      currency: "ريال",
      receiptPrefix: "REC-", // Prefix used for receipts (قبض)
      paymentPrefix: "PAY-", // Prefix used for payments (صرف)
      receiverSignature: "",
      accountantSignature: "",
    },
    filters: {
      type: "",
      fromDate: "",
      toDate: "",
      searchTerm: "",
    },
    charts: {},
    tabs: [
      { id: "new", name: "سند جديد", icon: "🧾" },
      { id: "list", name: "قائمة السندات", icon: "📋" },
      { id: "reports", name: "التقارير", icon: "📊" },
      { id: "settings", name: "الإعدادات", icon: "⚙️" },
    ],

    init() {
      this.loadData();
      this.applyFilters();

      // Update charts when active tab changes
      this.$watch("activeTab", (value) => {
        if (value === "reports") {
          this.$nextTick(() => {
            this.generateCharts();
          });
        }
      });
    },

    showMessage(message, type = "danger") {
      const baseClass =
        "fixed top-4 left-0 transform right-0 z-50 p-4 rounded shadow-lg mx-auto max-w-md";
      const typeClass =
        type === "danger" ? "bg-red-500 text-white" : "bg-green-500 text-white";

      const alertDiv = document.createElement("div");
      alertDiv.className = `${baseClass} ${typeClass}`;
      alertDiv.textContent = message;

      document.body.appendChild(alertDiv);

      gsap.fromTo(
        alertDiv,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      setTimeout(() => {
        gsap.to(alertDiv, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => alertDiv.remove(),
        });
      }, 3000);
    },

    // Load data from the server
    async loadData() {
      try {
        // Load settings
        const settingsResponse = await fetch(API + "/settings");
        if (!settingsResponse.ok) {
          throw new Error("Failed to load settings");
        }
        const settings = await settingsResponse.json();
        if (settings && Object.keys(settings).length > 0) {
          this.settings = settings;
        }

        // Load vouchers
        const vouchersResponse = await fetch(API + "/vouchers");
        if (!vouchersResponse.ok) {
          throw new Error("Failed to load vouchers");
        }
        const vouchers = await vouchersResponse.json();
        this.vouchers = vouchers;
        this.filteredVouchers = [...vouchers];
        this.applyFilters();
        this.generateNewVoucherNumber();
      } catch (error) {
        console.error("Error loading data:", error);
        this.showMessage(
          "حدث خطأ أثناء تحميل البيانات. يرجى التحقق من اتصال الخادم.",
          "danger"
        );
      }
    },

    // Save a voucher
    async saveVoucher() {
      try {
        const response = await fetch(API + "/vouchers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.newVoucher),
        });

        if (!response.ok) {
          throw new Error("Failed to save voucher");
        }

        const savedVoucher = await response.json();
        this.vouchers.push(savedVoucher);
        this.applyFilters();
        this.resetForm();
        this.activeTab = "list";
        this.showMessage("تم حفظ السند بنجاح", "success");
      } catch (error) {
        console.error("Error saving voucher:", error);
        this.showMessage("حدث خطأ أثناء حفظ السند", "danger");
      }
    },

    // Delete a voucher
    async deleteVoucher(voucher) {
      if (!confirm("هل أنت متأكد من حذف هذا السند؟")) return;
      try {
        const response = await fetch(`${API}/vouchers/${voucher._id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "فشل في حذف السند");
        }

        this.vouchers = this.vouchers.filter((v) => v._id !== voucher._id);
        this.applyFilters();
        this.showMessage("تم حذف السند بنجاح", "success");
      } catch (error) {
        console.error("Error deleting voucher:", error);
        this.showMessage("حدث خطأ أثناء حذف السند: " + error.message, "danger");
      }
    },

    // Save settings
    async saveSettings() {
      try {
        const response = await fetch(API + "/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.settings),
        });

        if (!response.ok) {
          throw new Error("Failed to save settings");
        }

        await response.json();
        this.showMessage("تم حفظ الإعدادات بنجاح", "success");
      } catch (error) {
        console.error("Error saving settings:", error);
        this.showMessage("حدث خطأ أثناء حفظ الإعدادات", "danger");
      }
    },

    generateNewVoucherNumber() {
      // Determine the prefix based on the voucher type
      const prefix =
        this.newVoucher.type === "قبض"
          ? this.settings.receiptPrefix
          : this.settings.paymentPrefix;

      // Get the current date components
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");

      // Filter vouchers of the same type
      const typeVouchers = this.vouchers.filter(
        (v) => v.type === this.newVoucher.type
      );

      // Generate a sequential counter (1-based index)
      const count = typeVouchers.length + 1;

      // Create a base voucher number with the format: PREFIX-YYYYMMDD-COUNT
      const baseVoucherNumber = `${prefix}${year}${month}${day}-${count
        .toString()
        .padStart(3, "0")}`;

      // Ensure the voucher number is unique by appending a timestamp if necessary
      let uniqueVoucherNumber = baseVoucherNumber;
      let timestampSuffix = 0;

      while (
        this.vouchers.some((v) => v.voucherNumber === uniqueVoucherNumber)
      ) {
        // If the voucher number already exists, append a timestamp suffix
        timestampSuffix++;
        uniqueVoucherNumber = `${baseVoucherNumber}-${timestampSuffix}`;
      }

      // Assign the unique voucher number
      this.newVoucher.voucherNumber = uniqueVoucherNumber;
    },

    // Reset the voucher form
    resetForm() {
      this.newVoucher = {
        type: "قبض", // Reset to "قبض" (Receipt)
        voucherNumber: "",
        date: new Date().toISOString().split("T")[0],
        entity: "",
        amount: "",
        amountInWords: "",
        description: "",
        paymentMethod: "",
        checkNumber: "",
        checkDate: "",
        bank: "",
        transferNumber: "",
      };
      this.generateNewVoucherNumber();
    },

    // Preview voucher
    previewVoucher() {
      this.previewVoucher = { ...this.newVoucher };
      this.isPreview = true;
    },

    // View a specific voucher
    viewVoucher(voucher) {
      this.previewVoucher = JSON.parse(JSON.stringify(voucher));
      this.isPreview = true;
    },

    // Print a voucher
    printVoucher(voucher) {
      this.previewVoucher = { ...voucher };
      this.printPreview();
    },

    // Print the preview window
    printPreview() {
      const previewElem = document.getElementById("preview-voucher");
      if (!previewElem) {
        this.showMessage("لا يوجد محتوى للمعاينة للطباعة", "danger");
        return;
      }

      const printContent = previewElem.innerHTML;

      const printHTML = `
        <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>طباعة المعاينة</title>
            <style>
              @media print {
                body { padding: 20px; }
                .voucher-print { width: 100%; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 8px; text-align: right; }
                th { background-color: #f0f0f0; }
              }
              body {
                font-family: sans-serif;
              }
              .print-container {
                margin: 20px;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
              }
              .print-header h1 {
                font-size: 24px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="print-header">
                <h1>${this.settings.companyName}</h1>
                <p>${this.settings.address}</p>
                <p>هاتف: ${this.settings.phone} | ${this.settings.email}</p>
              </div>
              <div class="voucher-print">
                ${printContent}
              </div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        this.showMessage("تعذر فتح نافذة الطباعة.", "danger");
      }
    },

    // Print the current voucher list
    printCurrentList() {
      const tableElem = document.querySelector("table");
      if (!tableElem) {
        this.showMessage("لا يوجد جدول للطباعة", "danger");
        return;
      }
      const table = tableElem.cloneNode(true);

      const rows = table.querySelectorAll("tr");
      rows.forEach((row) => {
        const lastCell = row.lastElementChild;
        if (lastCell) {
          lastCell.remove();
        }
      });

      const printContent = `
        <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>طباعة قائمة السندات</title>
            <style>
              @media print {
                body { padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 8px; text-align: right; }
                th { background-color: #f0f0f0; }
              }
              body {
                font-family: sans-serif;
              }
              .print-container {
                margin: 20px;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
              }
              .print-header h1 {
                font-size: 24px;
                font-weight: bold;
              }
              .print-header h2 {
                font-size: 18px;
                margin: 10px 0;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="print-header">
                <h1>${this.settings.companyName}</h1>
                <h2>قائمة السندات</h2>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")}</p>
              </div>
              ${table.outerHTML}
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        this.showMessage("تعذر فتح نافذة الطباعة.", "danger");
      }
    },

    // Export data to Excel
    exportToExcel() {
      const data = this.filteredVouchers.map((v) => ({
        // Map voucher type to the appropriate label
        النوع: v.type === "قبض" ? "سند قبض" : "سند صرف",
        "رقم السند": v.voucherNumber,
        التاريخ: v.date,
        "المستفيد/المورد": v.entity,
        المبلغ: v.amount,
        البيان: v.description,
        "طريقة الدفع": v.paymentMethod,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "السندات");
      const fileName = `سندات_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    },

    // Apply filters to the vouchers list
    applyFilters() {
      let filtered = [...this.vouchers];
      console.log(this.filters);
      if (this.filters.type) {
        filtered = filtered.filter((v) => v.type === this.filters.type);
      }
      if (this.filters.fromDate) {
        filtered = filtered.filter((v) => v.date >= this.filters.fromDate);
      }
      if (this.filters.toDate) {
        filtered = filtered.filter((v) => v.date <= this.filters.toDate);
      }
      console.log(filtered);
      if (this.filters.searchTerm) {
        const term = this.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.voucherNumber.toLowerCase().includes(term) ||
            v.entity.toLowerCase().includes(term) ||
            v.description.toLowerCase().includes(term)
        );
      }
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.filteredVouchers = filtered;
    },

    // Clear all filters
    clearFilters() {
      this.filters = {
        type: "",
        fromDate: "",
        toDate: "",
        searchTerm: "",
      };
      this.applyFilters();
    },

    // Generate all charts
    generateCharts() {
      this.createVoucherTypeChart();
      this.createMonthlyChart();
      this.createPaymentMethodChart();
      this.createBalanceChart();
    },

    // Create a pie chart for voucher types
    createVoucherTypeChart() {
      const receiptTotal = this.receiptVouchers.reduce(
        (sum, v) => sum + parseFloat(v.amount),
        0
      );
      const paymentTotal = this.paymentVouchers.reduce(
        (sum, v) => sum + parseFloat(v.amount),
        0
      );
      const ctx = document.getElementById("voucherTypeChart").getContext("2d");
      if (this.charts.voucherTypeChart) {
        this.charts.voucherTypeChart.destroy();
      }
      this.charts.voucherTypeChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: ["سندات القبض", "سندات الصرف"],
          datasets: [
            {
              data: [receiptTotal, paymentTotal],
              backgroundColor: [
                "rgba(54, 162, 235, 0.6)",
                "rgba(75, 192, 192, 0.6)",
              ],
              borderColor: ["rgba(54, 162, 235, 1)", "rgba(75, 192, 192, 1)"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    },

    // Create a bar chart for monthly activity
    createMonthlyChart() {
      const monthlySummary = {};
      this.vouchers.forEach((voucher) => {
        const yearMonth = voucher.date.substring(0, 7); // YYYY-MM
        if (!monthlySummary[yearMonth]) {
          monthlySummary[yearMonth] = {
            receipts: 0,
            payments: 0,
          };
        }
        if (voucher.type === "قبض") {
          monthlySummary[yearMonth].receipts += parseFloat(voucher.amount);
        } else if (voucher.type === "صرف") {
          monthlySummary[yearMonth].payments += parseFloat(voucher.amount);
        }
      });
      const months = Object.keys(monthlySummary).sort();
      const receiptData = months.map((month) => monthlySummary[month].receipts);
      const paymentData = months.map((month) => monthlySummary[month].payments);
      const labels = months.map((month) => {
        const date = new Date(month + "-01");
        return date.toLocaleDateString("ar-SA", {
          month: "short",
          year: "numeric",
        });
      });
      const ctx = document.getElementById("monthlyChart").getContext("2d");
      if (this.charts.monthlyChart) {
        this.charts.monthlyChart.destroy();
      }
      this.charts.monthlyChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "سندات القبض",
              data: receiptData,
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
            {
              label: "سندات الصرف",
              data: paymentData,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: false,
            },
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    },

    // Create a doughnut chart for payment methods
    createPaymentMethodChart() {
      const methodSummary = {};
      this.vouchers.forEach((voucher) => {
        const method = voucher.paymentMethod || "غير محدد";
        if (!methodSummary[method]) {
          methodSummary[method] = 0;
        }
        methodSummary[method] += parseFloat(voucher.amount);
      });
      const methods = Object.keys(methodSummary);
      const data = methods.map((method) => methodSummary[method]);
      const backgroundColor = [
        "rgba(54, 162, 235, 0.6)",
        "rgba(75, 192, 192, 0.6)",
        "rgba(255, 206, 86, 0.6)",
        "rgba(153, 102, 255, 0.6)",
        "rgba(255, 159, 64, 0.6)",
      ];
      const borderColor = backgroundColor.map((color) =>
        color.replace("0.6", "1")
      );
      const ctx = document
        .getElementById("paymentMethodChart")
        .getContext("2d");
      if (this.charts.paymentMethodChart) {
        this.charts.paymentMethodChart.destroy();
      }
      this.charts.paymentMethodChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: methods,
          datasets: [
            {
              data: data,
              backgroundColor: backgroundColor.slice(0, methods.length),
              borderColor: borderColor.slice(0, methods.length),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
            },
          },
        },
      });
    },

    // Create a line chart for cumulative balance
    createBalanceChart() {
      const sortedVouchers = [...this.vouchers].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      let balance = 0;
      const balanceData = [];
      const dates = [];
      sortedVouchers.forEach((voucher) => {
        if (voucher.type === "قبض") {
          balance += parseFloat(voucher.amount);
        } else if (voucher.type === "صرف") {
          balance -= parseFloat(voucher.amount);
        }
        balanceData.push(balance);
        dates.push(voucher.date);
      });
      const labels = dates.map((date) =>
        new Date(date).toLocaleDateString("ar-SA", {
          month: "short",
          day: "numeric",
        })
      );
      const ctx = document.getElementById("balanceChart").getContext("2d");
      if (this.charts.balanceChart) {
        this.charts.balanceChart.destroy();
      }
      this.charts.balanceChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "الرصيد",
              data: balanceData,
              backgroundColor: "rgba(153, 102, 255, 0.2)",
              borderColor: "rgba(153, 102, 255, 1)",
              borderWidth: 2,
              fill: true,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
            },
          },
        },
      });
    },

    // Getters for vouchers based on type
    get receiptVouchers() {
      // Receipts are now vouchers with type "قبض"
      return this.vouchers.filter((v) => v.type === "قبض");
    },

    get paymentVouchers() {
      // Payments are now vouchers with type "صرف"
      return this.vouchers.filter((v) => v.type === "صرف");
    },

    // Total receipts amount
    get totalReceipts() {
      return this.receiptVouchers.reduce(
        (sum, v) => sum + parseFloat(v.amount),
        0
      );
    },

    // Total payments amount
    get totalPayments() {
      return this.paymentVouchers.reduce(
        (sum, v) => sum + parseFloat(v.amount),
        0
      );
    },

    // Net balance calculation
    get netBalance() {
      return this.totalReceipts - this.totalPayments;
    },

    // Total of filtered vouchers
    get filteredTotal() {
      return this.filteredVouchers.reduce((sum, v) => {
        const amount = parseFloat(v.amount);
        return sum + amount;
      }, 0);
    },

    // Total amount for the current month
    get currentMonthTotal() {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      return this.vouchers
        .filter((v) => v.date.startsWith(yearMonth))
        .reduce((sum, v) => sum + parseFloat(v.amount), 0);
    },

    // Count of vouchers for the current month
    get currentMonthCount() {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      return this.vouchers.filter((v) => v.date.startsWith(yearMonth)).length;
    },

    // Format a date string
    formatDate(dateStr) {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("ar-SA");
    },

    // Format amount with currency
    formatCurrency(amount) {
      if (!amount) return "0 " + this.settings.currency;
      return (
        parseFloat(amount).toLocaleString("ar-SA") +
        " " +
        this.settings.currency
      );
    },
  };
}
