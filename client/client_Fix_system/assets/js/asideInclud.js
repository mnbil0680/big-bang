fetch("aside.html")
  .then((response) => response.text())
  .then((data) => {
    let layouttext =
      document.getElementsByClassName("layout-container")[0].innerHTML;
    document.getElementsByClassName("layout-container")[0].innerHTML = data;
    document.getElementsByClassName("layout-container")[0].innerHTML +=
      layouttext; // Append the original content after the sidebar
    let toggleButton = document.getElementById("toggleSidebar");
    let icon = toggleButton.querySelector("i");
    let sidebar = document.querySelector(".sidebar");
    // Retrieve saved state from localStorage
    if (localStorage.getItem("sidebarCollapsed") === "true") {
      sidebar.classList.add("collapsed");
      icon.classList.remove("bi-list");
      icon.classList.add("bi-x");
    }
    // Toggle sidebar and save state to localStorage
    toggleButton.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");
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

    // Set active class on the correct sidebar item based on current URL
    let currentPage = window.location.pathname.split("/").pop(); // Get the current page filename
    let sidebarLinks = document.querySelectorAll(
      ".sidebar-nav .sidebar-item a"
    );
    console.log(currentPage); // Debugging line to check the current page
    console.log(sidebarLinks); // Debugging line to check sidebar links
    sidebarLinks.forEach((link) => {
      let linkHref = link.getAttribute("href");

      if (linkHref === currentPage) {
        link.parentElement.classList.add("active");
      } else {
        link.parentElement.classList.remove("active");
      }
    });
  });
