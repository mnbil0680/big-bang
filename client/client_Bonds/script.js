const API = "http://localhost:3000";
function voucherSystem() {
  return {
    activeTab: "new",
    isPreview: false,
    newVoucher: {
      type: "صرف",
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
      receiptPrefix: "REC-",
      paymentPrefix: "PAY-",
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
      this.generateNewVoucherNumber();
      this.applyFilters();

      // تحديث الرسوم البيانية عند تغيير التبويب
      this.$watch("activeTab", (value) => {
        if (value === "reports") {
          this.$nextTick(() => {
            this.generateCharts();
          });
        }
      });
    },

    showMessage(message, type = "danger") {
      // Base classes for a fixed alert positioned at the top center
      const baseClass =
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded shadow-lg";
      // Tailwind classes for error or success messages
      const typeClass =
        type === "danger" ? "bg-red-500 text-white" : "bg-green-500 text-white";

      const alertDiv = document.createElement("div");
      alertDiv.className = `${baseClass} ${typeClass}`;
      alertDiv.textContent = message;

      // Append alert to the body
      document.body.appendChild(alertDiv);

      // Animate the alert sliding down into view using GSAP
      gsap.fromTo(
        alertDiv,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      // Remove the alert after 3 seconds with a fade-out animation
      setTimeout(() => {
        gsap.to(alertDiv, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => alertDiv.remove(),
        });
      }, 3000);
    },

    // تحميل البيانات من الخادم
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
      } catch (error) {
        console.error("Error loading data:", error);
        this.showMessage(
          "حدث خطأ أثناء تحميل البيانات. يرجى التحقق من اتصال الخادم.",
          "danger"
        );
      }
    },

    // حفظ السند
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

    // حذف سند
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

        // Remove the deleted voucher from the vouchers array
        this.vouchers = this.vouchers.filter((v) => v._id !== voucher._id);
        this.applyFilters();
        this.showMessage("تم حذف السند بنجاح", "success");
      } catch (error) {
        console.error("Error deleting voucher:", error);
        this.showMessage("حدث خطأ أثناء حذف السند: " + error.message, "danger");
      }
    },

    // حفظ الإعدادات
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

    // توليد رقم سند جديد
    generateNewVoucherNumber() {
      // If the voucher type is "صرف" (receipt), use the receipt prefix; otherwise (i.e. "قبض"), use the payment prefix.
      const prefix =
        this.newVoucher.type === "صرف"
          ? this.settings.receiptPrefix
          : this.settings.paymentPrefix;

      const date = new Date();
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");

      const typeVouchers = this.vouchers.filter(
        (v) => v.type === this.newVoucher.type
      );
      const count = typeVouchers.length + 1;

      this.newVoucher.voucherNumber = `${prefix}${year}${month}-${count
        .toString()
        .padStart(3, "0")}`;
    },

    // إعادة تعيين نموذج إدخال السند
    resetForm() {
      this.newVoucher = {
        type: "صرف",
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

    // معاينة السند
    previewVoucher() {
      this.previewVoucher = { ...this.newVoucher };
      this.isPreview = true;
    },

    // عرض سند محدد
    viewVoucher(voucher) {
      // Deep clone the voucher to avoid mutating the original object
      this.previewVoucher = JSON.parse(JSON.stringify(voucher));
      this.isPreview = true;
    },

    // طباعة سند محدد
    printVoucher(voucher) {
      this.previewVoucher = { ...voucher };
      this.printPreview();
    },

    // طباعة نافذة المعاينة
    printPreview() {
      const previewElem = document.getElementById("preview-voucher");
      if (!previewElem) {
        this.showMessage("لا يوجد محتوى للمعاينة للطباعة", "danger");
        return;
      }

      // Get the preview content
      const printContent = previewElem.innerHTML;

      // Build a full HTML document for printing
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

      // Open a new window for printing
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

    // طباعة القائمة الحالية
    printCurrentList() {
      // Check if a table exists before proceeding
      const tableElem = document.querySelector("table");
      if (!tableElem) {
        this.showMessage("لا يوجد جدول للطباعة", "danger");
        return;
      }
      // Clone the table for printing
      const table = tableElem.cloneNode(true);

      // Remove action buttons column (assumed to be the last cell in every row)
      const rows = table.querySelectorAll("tr");
      rows.forEach((row) => {
        const lastCell = row.lastElementChild;
        if (lastCell) {
          lastCell.remove();
        }
      });

      // Build the print content as a complete HTML document
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

      // Open a new window for printing so the original page stays intact
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

    // تصدير البيانات إلى Excel
    exportToExcel() {
      // تحضير البيانات للتصدير
      const data = this.filteredVouchers.map((v) => ({
        النوع: v.type === "صرف" ? "سند قبض" : "سند صرف", // adjust labels as desired
        "رقم السند": v.voucherNumber,
        التاريخ: v.date,
        "المستفيد/المورد": v.entity,
        المبلغ: v.amount,
        البيان: v.description,
        "طريقة الدفع": v.paymentMethod,
      }));

      // إنشاء ورقة عمل
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "السندات");

      // تصدير الملف
      const fileName = `سندات_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    },

    // تطبيق الفلاتر
    applyFilters() {
      let filtered = [...this.vouchers];
      console.log(this.filters);
      // فلترة حسب نوع السند
      if (this.filters.type) {
        filtered = filtered.filter((v) => v.type === this.filters.type);
      }

      // فلترة حسب التاريخ
      if (this.filters.fromDate) {
        filtered = filtered.filter((v) => v.date >= this.filters.fromDate);
      }

      if (this.filters.toDate) {
        filtered = filtered.filter((v) => v.date <= this.filters.toDate);
      }
      console.log(filtered);
      // فلترة حسب كلمة البحث
      if (this.filters.searchTerm) {
        const term = this.filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.voucherNumber.toLowerCase().includes(term) ||
            v.entity.toLowerCase().includes(term) ||
            v.description.toLowerCase().includes(term)
        );
      }

      // ترتيب السندات حسب التاريخ (الأحدث أولاً)
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

      this.filteredVouchers = filtered;
    },

    // مسح الفلاتر
    clearFilters() {
      this.filters = {
        type: "",
        fromDate: "",
        toDate: "",
        searchTerm: "",
      };

      this.applyFilters();
    },

    // إنشاء الرسوم البيانية
    generateCharts() {
      this.createVoucherTypeChart();
      this.createMonthlyChart();
      this.createPaymentMethodChart();
      this.createBalanceChart();
    },

    // إنشاء رسم بياني لتوزيع السندات حسب النوع
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

    // إنشاء رسم بياني للحركة الشهرية
    createMonthlyChart() {
      // تجميع البيانات حسب الشهر
      const monthlySummary = {};

      this.vouchers.forEach((voucher) => {
        const yearMonth = voucher.date.substring(0, 7); // YYYY-MM
        if (!monthlySummary[yearMonth]) {
          monthlySummary[yearMonth] = {
            receipts: 0,
            payments: 0,
          };
        }

        if (voucher.type === "صرف") {
          monthlySummary[yearMonth].receipts += parseFloat(voucher.amount);
        } else {
          monthlySummary[yearMonth].payments += parseFloat(voucher.amount);
        }
      });

      // تحويل البيانات إلى صيغة مناسبة للرسم البياني
      const months = Object.keys(monthlySummary).sort();
      const receiptData = months.map((month) => monthlySummary[month].receipts);
      const paymentData = months.map((month) => monthlySummary[month].payments);

      // تنسيق أسماء الأشهر للعرض
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

    // إنشاء رسم بياني لتوزيع السندات حسب طريقة الدفع
    createPaymentMethodChart() {
      // تجميع البيانات حسب طريقة الدفع
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

      // تعريف ألوان مخصصة
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

    // إنشاء رسم بياني للرصيد التراكمي
    createBalanceChart() {
      // ترتيب السندات حسب التاريخ
      const sortedVouchers = [...this.vouchers].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      // حساب الرصيد التراكمي
      let balance = 0;
      const balanceData = [];
      const dates = [];

      sortedVouchers.forEach((voucher) => {
        if (voucher.type === "صرف") {
          balance += parseFloat(voucher.amount);
        } else {
          balance -= parseFloat(voucher.amount);
        }

        balanceData.push(balance);
        dates.push(voucher.date);
      });

      // تنسيق التواريخ للعرض
      const labels = dates.map((date) => {
        return new Date(date).toLocaleDateString("ar-SA", {
          month: "short",
          day: "numeric",
        });
      });

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

    get receiptVouchers() {
      // Receipt vouchers are those with type "صرف"
      return this.vouchers.filter((v) => v.type === "صرف");
    },

    get paymentVouchers() {
      // Payment vouchers are those with type "قبض"
      return this.vouchers.filter((v) => v.type === "قبض");
    },

    // حساب إجمالي سندات القبض
    get totalReceipts() {
      return this.receiptVouchers.reduce(
        (sum, v) => sum + parseFloat(v.amount),
        0
      );
    },

    // حساب إجمالي سندات الصرف
    get totalPayments() {
      return this.paymentVouchers.reduce(
        (sum, v) => sum + parseFloat(v.amount),
        0
      );
    },

    // حساب صافي الرصيد
    get netBalance() {
      return this.totalReceipts - this.totalPayments;
    },

    // حساب إجمالي السندات المفلترة
    get filteredTotal() {
      return this.filteredVouchers.reduce((sum, v) => {
        const amount = parseFloat(v.amount);
        return sum + amount;
      }, 0);
    },

    // حساب إجمالي السندات للشهر الحالي
    get currentMonthTotal() {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      return this.vouchers
        .filter((v) => v.date.startsWith(yearMonth))
        .reduce((sum, v) => sum + parseFloat(v.amount), 0);
    },

    // حساب عدد السندات للشهر الحالي
    get currentMonthCount() {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      return this.vouchers.filter((v) => v.date.startsWith(yearMonth)).length;
    },

    // تنسيق التاريخ
    formatDate(dateStr) {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("ar-SA");
    },

    // تنسيق المبلغ مع العملة
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
