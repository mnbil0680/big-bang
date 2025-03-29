const API = "http://localhost:3000";
let technicianIdToDelete = null;
function showMessage(message, type = "danger") {
  // Bootstrap alert classes
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg`;
  alertDiv.style.zIndex = 5050; // Ensure it's above other elements
  alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  // Append to body
  document.body.appendChild(alertDiv);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    let bsAlert = new bootstrap.Alert(alertDiv);
    bsAlert.close();
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
  // ----- ADD TECHNICIAN FORM FUNCTIONALITY -----
  // Form fields based on schema field names
  const employeeIdInput = document.getElementById("employeeId");
  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("phone");
  const phoneFeedback = document.getElementById("phoneFeedback");
  const employeeIdFeedback = document.getElementById("employeeIdFeedback");
  const addTechnicianForm = document.getElementById("addTechnicianForm");

  // Specializations handling
  const selectElem = document.getElementById("specializationSelect");
  const customContainer = document.getElementById(
    "customSpecializationContainer"
  );
  const customInput = document.getElementById("customSpecialization");
  const addCustomBtn = document.getElementById("addCustomSpecializationBtn");
  const selectedList = document.getElementById("selectedSpecializationsList");
  const selectedSpecializations = [];
  const editForm = document.getElementById("editTechnicianForm");

  selectElem.addEventListener("change", () => {
    const value = selectElem.value;
    if (!value) return;
    if (value === "أخرى") {
      customContainer.style.display = "block";
    } else {
      if (!selectedSpecializations.includes(value)) {
        selectedSpecializations.push(value);
        updateSelectedList();
      }
      selectElem.value = "";
      customContainer.style.display = "none";
    }
  });

  addCustomBtn.addEventListener("click", () => {
    const customValue = customInput.value.trim();
    if (customValue && !selectedSpecializations.includes(customValue)) {
      selectedSpecializations.push(customValue);
      updateSelectedList();
      customInput.value = "";
      customContainer.style.display = "none";
      selectElem.value = "";
    } else if (customValue) {
      showMessage("التخصص موجود بالفعل", "warning");
    } else {
      showMessage("يرجى إدخال تخصص صحيح", "warning");
    }
  });

  function updateSelectedList() {
    selectedList.innerHTML = "";
    selectedSpecializations.forEach((spec, index) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = spec;
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-sm btn-danger";
      removeBtn.textContent = "حذف";
      removeBtn.addEventListener("click", () => {
        selectedSpecializations.splice(index, 1);
        updateSelectedList();
      });
      li.appendChild(removeBtn);
      selectedList.appendChild(li);
    });
  }

  // Fetch existing technicians to auto-generate a unique employeeId.
  let technicians = [];
  try {
    const res = await fetch(API + "/technicians");
    if (res.ok) {
      technicians = await res.json();
    }
  } catch (err) {
    console.error("Error fetching technicians:", err);
  }

  // Auto-generate employeeId (assumes IDs are like "#T001")
  let maxNum = 0;
  technicians.forEach((tech) => {
    // Remove non-digits and convert to number
    const num = parseInt(tech.employeeId.replace(/[^0-9]/g, ""));
    if (num > maxNum) maxNum = num;
  });
  const newEmployeeId = "#T" + String(maxNum + 1).padStart(3, "0");
  employeeIdInput.value = newEmployeeId;

  // Form submission with validations and API call
  addTechnicianForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate phone number format: expected format "+,CountryCode,Number"
    const phone = phoneInput.value.trim();
    // Regex: starts with "+", then 1-3 digits for country code, then 7-12 digits for number
    const phoneRegex = /^\+?[1-9]\d{0,2}[ ]?\d{8,13}$/;
    if (!phoneRegex.test(phone)) {
      phoneInput.classList.add("is-invalid");
      phoneFeedback.textContent =
        "يرجى إدخال رقم هاتف صحيح بالتنسيق: +,CountryCode,Number";
      return;
    } else {
      phoneInput.classList.remove("is-invalid");
    }

    // Check if employeeId already exists
    if (technicians.some((t) => t.employeeId === employeeIdInput.value)) {
      employeeIdInput.classList.add("is-invalid");
      employeeIdFeedback.textContent = "رقم الموظف موجود بالفعل";
      return;
    } else {
      employeeIdInput.classList.remove("is-invalid");
    }

    // Gather new technician data matching the schema
    const newTechnician = {
      employeeId: employeeIdInput.value,
      name: nameInput.value.trim(),
      specialization: [...selectedSpecializations],
      phone: phone,
    };

    try {
      const res = await fetch(API + "/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTechnician),
      });
      if (!res.ok) {
        throw new Error("Failed to add technician");
      }
      const data = await res.json();
      console.log("Technician added:", data);

      // Reset form fields
      addTechnicianForm.reset();
      selectedSpecializations.length = 0;
      updateSelectedList();

      // Update technicians array and generate next employeeId
      technicians.push(data);
      maxNum++;
      employeeIdInput.value = "#T" + String(maxNum + 1).padStart(3, "0");

      const modalElement = document.getElementById("addTechnicianModal");
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      } else {
        new bootstrap.Modal(modalElement).hide();
      }
      // Refresh the technicians table after adding a new technician
      loadTechnicians();
    } catch (error) {
      showMessage("Error adding technician: " + error.message, "danger");
    }
  });

  // ----- POPULATE TECHNICIANS TABLE -----
  async function loadTechnicians() {
    const techniciansTableBody = document.querySelector(
      "#techniciansTable tbody"
    );
    try {
      const res = await fetch(API + "/technicians");
      if (!res.ok) {
        throw new Error("Failed to fetch technicians");
      }
      const technicians = await res.json();
      techniciansTableBody.innerHTML = "";
      technicians.forEach((tech) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${tech.employeeId}</td>
          <td>${tech.name}</td>
          <td>${tech.specialization ? tech.specialization.join(", ") : ""}</td>
          <td>${tech.phone}</td>
          <td>${tech.isAvailable ? "متاح" : "غير متاح"}</td>
          <td>
            <button class="btn btn-sm btn-info" onclick="viewTechnician('${
              tech._id
            }')">عرض</button>
            <button class="btn btn-sm btn-primary" onclick="editTechnician('${
              tech._id
            }')">تعديل</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTechnician('${
              tech._id
            }')">حذف</button>
          </td>
        `;
        techniciansTableBody.appendChild(row);
      });
    } catch (error) {
      showMessage("Error fetching technicians: " + error.message, "danger");
      techniciansTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">حدث خطأ أثناء تحميل الفنيين.</td></tr>`;
    }
  }

  // Add event listener to add specialization
  document
    .getElementById("addSpecializationBtn")
    .addEventListener("click", () => {
      console.log("Adding specialization...");
      const selectElement = document.getElementById("editSpecialization");
      const selectedValue = selectElement.value;
      if (selectedValue) addSpecializationToList(selectedValue);
    });

  // Save updated technician details
  document
    .getElementById("saveEditTechBtn")
    .addEventListener("click", async function () {
      if (!window.currentTech) {
        showMessage("لم يتم تحميل بيانات الفني.", "danger");
        return;
      }
      // التحقق من صحة نموذج التعديل
      const editForm = document.getElementById("editTechnicianForm");
      if (!editForm.checkValidity()) {
        editForm.classList.add("was-validated");
        return;
      }
      // جمع التخصصات المختارة من القائمة
      const selectedSpecializations = [
        ...document.getElementById("selectedSpecializations").children,
      ].map((li) => li.textContent.replace("إزالة", "").trim());

      // دمج الحقول المحدثة في كائن الفني
      const updatedTech = {
        ...window.currentTech,
        name: document.getElementById("editName").value.trim(),
        phone: document.getElementById("editPhone").value.trim(),
        isAvailable: document.getElementById("editStatus").value === "active",
        specialization: selectedSpecializations,
      };

      try {
        const res = await fetch(API + "/technicians/" + updatedTech._id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTech),
        });
        if (!res.ok) {
          throw new Error("فشل في تحديث بيانات الفني");
        }
        const data = await res.json();
        showMessage("تم تحديث بيانات الفني بنجاح", "success");

        // إخفاء النافذة المنبثقة للتعديل
        const editModalElement = document.getElementById("editTechnicianModal");
        const modalInstance = bootstrap.Modal.getInstance(editModalElement);
        if (modalInstance) {
          modalInstance.hide();
        } else {
          new bootstrap.Modal(editModalElement).hide();
        }

        // تحديث جدول الفنيين (نفترض وجود دالة loadTechnicians)
        loadTechnicians();

        // مسح الكائن العالمي
        window.currentTech = null;
      } catch (error) {
        showMessage("خطأ في تحديث بيانات الفني: " + error.message, "danger");
        console.error("خطأ في تحديث بيانات الفني:", error);
      }
    });
  document.getElementById("confirmDelete").addEventListener("click", () => {
    console.log("Deleting technician with ID:", technicianIdToDelete);
    if (!technicianIdToDelete) return;
    fetch(API + "/technicians/" + technicianIdToDelete, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete technician");
        }
        return res.json();
      })
      .then(() => {
        showMessage("تم حذف الفني بنجاح", "success"); // Use Bootstrap toast
        location.reload();
      })
      .catch((error) => {
        console.error("Error deleting technician:", error);
        showMessage("حدث خطأ أثناء الحذف", "danger");
      });

    // Hide the modal after confirming
    let deleteModalElement = document.getElementById("deleteModal");
    let deleteModal = bootstrap.Modal.getInstance(deleteModalElement);
    deleteModal.hide();
  });
  // Initial load of technicians
  loadTechnicians();
});

// Function to view technician details in a modal
function viewTechnician(id) {
  fetch(API + "/technicians/" + id)
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch technician details");
      }
      return res.json();
    })
    .then((data) => {
      // Build HTML with technician details. Adjust as needed.
      const detailsHtml = `
          <strong>رقم الموظف:</strong> ${data.employeeId}<br>
          <strong>الاسم:</strong> ${data.name}<br>
          <strong>التخصص:</strong> ${
            data.specialization ? data.specialization.join(", ") : "غير محدد"
          }<br>
          <strong>رقم الهاتف:</strong> ${data.phone}<br>
          <strong>متاح:</strong> ${data.isAvailable ? "نعم" : "لا"}<br>
        `;
      document.getElementById("viewTechnicianDetails").innerHTML = detailsHtml;

      // Show the view modal
      const viewModalElement = document.getElementById("viewTechnicianModal");
      const viewModal = new bootstrap.Modal(viewModalElement);
      viewModal.show();
    })
    .catch((err) => {
      console.error("Error fetching technician details:", err);
    });
}

// Global technician object
window.currentTech = null;

// Predefined list of available specializations
const availableSpecializations = [
  "كهرباء",
  "سباكة",
  "مكيفات",
  "نجارة",
  "دهانات",
];

function editTechnician(id) {
  fetch(API + "/technicians/" + id)
    .then((res) => {
      if (!res.ok) {
        throw new Error("فشل في جلب بيانات الفني");
      }
      return res.json();
    })
    .then((data) => {
      window.currentTech = data;
      // Fill the edit form with technician data
      document.getElementById("editTechId").value = data._id;
      document.getElementById("editName").value = data.name;
      document.getElementById("editPhone").value = data.phone;
      document.getElementById("editStatus").value = data.isAvailable
        ? "active"
        : "inactive";

      loadSpecializations(data.specialization || []);

      const editModalElement = document.getElementById("editTechnicianModal");
      const editModal = new bootstrap.Modal(editModalElement);
      editModal.show();
    })
    .catch((err) => {
      showMessage("خطأ في جلب بيانات الفني: " + err.message, "danger");
      console.error("خطأ في جلب بيانات الفني للتعديل:", err);
    });
}
// Function to load specialization options and populate selected list
function loadSpecializations(selectedSpecializationsArray) {
  const selectElement = document.getElementById("editSpecialization");
  const selectedList = document.getElementById("selectedSpecializations");
  // Clear existing options and list
  selectElement.innerHTML = "";
  selectedList.innerHTML = "";
  // Populate select with available specializations
  availableSpecializations.forEach((spec) => {
    const option = document.createElement("option");
    option.value = spec;
    option.textContent = spec;
    selectElement.appendChild(option);
  });
  // Add "Other" option
  const otherOption = document.createElement("option");
  otherOption.value = "أخرى";
  otherOption.textContent = "أخرى";
  selectElement.appendChild(otherOption);

  // Remove any existing custom input container
  const existingCustomContainer = document.getElementById(
    "editCustomSpecializationContainer"
  );
  if (existingCustomContainer) {
    existingCustomContainer.remove();
  }

  // Add event listener to show custom input if "أخرى" is selected
  selectElement.addEventListener("change", handleEditSpecializationChange);

  // Add already selected specializations to list
  selectedSpecializationsArray.forEach((spec) => addSpecializationToList(spec));
}

function handleEditSpecializationChange() {
  const selectElement = document.getElementById("editSpecialization");
  if (selectElement.value === "أخرى") {
    // If not already present, add custom input container
    if (!document.getElementById("editCustomSpecializationContainer")) {
      const container = document.createElement("div");
      container.id = "editCustomSpecializationContainer";
      container.className = "mt-2";
      container.innerHTML = `
          <input type="text" id="editCustomSpecialization" class="form-control" placeholder="أدخل تخصص مخصص" />
          <button type="button" class="btn btn-secondary mt-2" id="addEditCustomSpecializationBtn">إضافة التخصص المخصص</button>
        `;
      selectElement.parentElement.appendChild(container);
      document
        .getElementById("addEditCustomSpecializationBtn")
        .addEventListener("click", () => {
          const customValue = document
            .getElementById("editCustomSpecialization")
            .value.trim();
          if (customValue) {
            addSpecializationToList(customValue);
            document.getElementById("editCustomSpecialization").value = "";
          }
        });
    }
  }
}

// Function to add a specialization to the selected list in the edit modal
function addSpecializationToList(spec) {
  const selectedList = document.getElementById("selectedSpecializations");
  // Check if the specialization already exists in the list
  if (
    [...selectedList.children].some(
      (li) => li.childNodes[0].nodeValue.trim() === spec
    )
  ) {
    showMessage("التخصص موجود بالفعل", "warning");
    return;
  }
  const li = document.createElement("li");
  li.className =
    "list-group-item d-flex justify-content-between align-items-center";
  li.textContent = spec;

  // Add a remove button to the list item
  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-danger btn-sm";
  removeBtn.textContent = "إزالة";
  removeBtn.onclick = () => li.remove();

  li.appendChild(removeBtn);
  selectedList.appendChild(li);
}
function deleteTechnician(id) {
  technicianIdToDelete = id;
  let deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  deleteModal.show();
}
