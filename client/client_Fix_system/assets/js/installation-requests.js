document.getElementById("currentYear").textContent = new Date().getFullYear();

// Check login status
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("jwt")) {
    document.getElementById("userMenu").style.display = "flex";
    document.getElementById("authButtons").style.display = "none";
  } else {
    document.getElementById("userMenu").style.display = "none";
    document.getElementById("authButtons").style.display = "flex";
  }
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("jwt");
    location.reload();
  });

  // Modal handling
  const loginModal = document.getElementById("loginDialog");
  const signupModal = document.getElementById("signupDialog");
  const overlay = document.querySelector(".modal-overlay");

  function showModal(modal) {
    modal.style.display = "block";
    overlay.style.display = "block";
    gsap.fromTo(
      modal,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
    );
  }

  function closeModal(modal) {
    gsap.to(modal, {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        modal.style.display = "none";
        overlay.style.display = "none";
      },
    });
  }

  document
    .getElementById("loginBtn")
    .addEventListener("click", () => showModal(loginModal));
  document
    .getElementById("closeLoginBtn")
    .addEventListener("click", () => closeModal(loginModal));
  document
    .getElementById("signupBtn")
    .addEventListener("click", () => showModal(signupModal));
  document
    .getElementById("closeSignupBtn")
    .addEventListener("click", () => closeModal(signupModal));
  overlay.addEventListener("click", () => {
    if (loginModal.style.display === "block") closeModal(loginModal);
    if (signupModal.style.display === "block") closeModal(signupModal);
  });

  // Login form submission
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.status === 401) {
        alert("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }
      if (!response.ok) throw new Error("Login failed");
      const data = await response.json();
      localStorage.setItem("jwt", data.token);
      alert("تم تسجيل الدخول بنجاح");
      closeModal(loginModal);
      location.reload();
    } catch (error) {
      console.error(error);
      alert("فشل تسجيل الدخول، يرجى المحاولة مرة أخرى");
    }
  });

  // Signup form submission
  document
    .getElementById("signupForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      const username = document.getElementById("signupUsername").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;
      try {
        const response = await fetch("/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        if (!response.ok) throw new Error("Signup failed");
        const data = await response.json();
        alert("تم إنشاء الحساب بنجاح، يرجى تسجيل الدخول");
        closeModal(signupModal);
      } catch (error) {
        console.error(error);
        alert("فشل إنشاء الحساب، يرجى المحاولة مرة أخرى");
      }
    });

  // Counter animation
  document.querySelectorAll(".counter-value").forEach((counter) => {
    const target = +counter.getAttribute("data-target");
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.textContent = Math.ceil(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };
    updateCounter();
  });

  // Chart initialization
  var lineOptions = {
    series: [
      {
        name: "طلبات الصيانة",
        data: [30, 40, 35, 50, 49, 60, 70, 91, 125],
      },
      {
        name: "طلبات التركيب",
        data: [20, 30, 25, 40, 39, 50, 60, 71, 85],
      },
    ],
    chart: { height: 300, type: "line", zoom: { enabled: false } },
    stroke: { curve: "smooth" },
    title: { text: "تطور الطلبات", align: "right" },
    xaxis: {
      categories: [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
      ],
    },
  };
  var lineChart = new ApexCharts(
    document.querySelector("#requestsChart"),
    lineOptions
  );
  lineChart.render();

  var pieOptions = {
    series: [28, 15],
    chart: { height: 300, type: "pie" },
    labels: ["طلبات الصيانة", "طلبات التركيب"],
    title: { text: "توزيع الطلبات حسب النوع", align: "right" },
  };
  var pieChart = new ApexCharts(
    document.querySelector("#requestsDistributionChart"),
    pieOptions
  );
  pieChart.render();

  // Sidebar toggle
  document.querySelectorAll(".toggle-sidebar").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("active");
    });
  });
});
