fetch("navbar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("navbar").innerHTML = data;
    let toggleButton = document.getElementsByClassName("toggle-sidebar-sm")[0];
    let icon = toggleButton.querySelector("i");
    let sidebar = document.querySelector(".sidebar");
    // Toggle sidebar and save state to localStorage
    toggleButton.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");
      console.log(sidebar);
      let isCollapsed = sidebar.classList.contains("collapsed");

      localStorage.setItem("sidebarCollapsed", isCollapsed);

      if (isCollapsed) {
        icon.classList.remove("bi-list");
        icon.classList.add("bi-x");
      } else {
        icon.classList.remove("bi-x");
        icon.classList.add("bi-list");
      }
    });
  });
