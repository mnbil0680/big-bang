export async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // Clone the response so we can read it twice if needed.
      const clonedResponse = response.clone();
      let errorMsg = response.statusText;
      try {
        const errorData = await clonedResponse.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        errorMsg = await response.text();
      }
      return { success: false, error: errorMsg || "An error occurred" };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function showErrorMessage(message) {
  // Create the alert element using Bootstrap classes
  const alertDiv = document.createElement("div");
  alertDiv.className =
    "alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3";
  alertDiv.style.zIndex = 1050; // Ensure it appears above other elements
  alertDiv.textContent = message;

  // Append alert to the body (or a specific container if needed)
  document.body.appendChild(alertDiv);

  // Use GSAP to animate the alert sliding down into view
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
      onComplete: () => {
        alertDiv.remove();
      },
    });
  }, 3000);
}
