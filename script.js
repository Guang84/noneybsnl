document.addEventListener("DOMContentLoaded", () => {
  const messageEl = document.querySelector(".message");
  const progressEl = document.getElementById("progress");
  const progressText = document.getElementById("progressText");
  const errorBox = document.getElementById("errorNotification");
  const errorMessage = document.getElementById("errorMessage");
  const manualBtn = document.getElementById("manualRedirect");

  let messages = [];
  let redirects = [];

  async function init() {
    try {
      const [messagesRes, redirectsRes] = await Promise.all([
        fetch("messages.json"),
        fetch("redirects.json")
      ]);

      if (!messagesRes.ok || !redirectsRes.ok) {
        throw new Error("Unable to fetch required files.");
      }

      const messagesData = await messagesRes.json();
      const redirectsData = await redirectsRes.json();

      messages = messagesData.messages || [];
      redirects = redirectsData.redirects || [];

      showMessage();
      await simulateProgress();
      await attemptRedirects();

    } catch (err) {
      showError("An error occurred while loading. Please try again.");
      console.error(err);
    }
  }

  function showMessage() {
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    messageEl.textContent = randomMsg;
    messageEl.classList.add("active");
  }

  function simulateProgress() {
    return new Promise(resolve => {
      let percent = 0;
      const timer = setInterval(() => {
        percent += Math.random() * 6;
        if (percent >= 100) {
          percent = 100;
          clearInterval(timer);
          resolve();
        }
        progressEl.style.width = `${percent}%`;
        progressText.textContent = `${Math.floor(percent)}%`;
      }, 130);
    });
  }

  async function attemptRedirects() {
    for (let i = 0; i < redirects.length; i++) {
      const server = redirects[i];
      try {
        await delay(server.delay || 2000);
        window.location.href = server.url;
        return;
      } catch (e) {
        console.warn(`Failed to redirect to ${server.name}`, e);
      }
    }

    // If none worked
    showError("All servers are unreachable. Please try again later.");
    if (redirects[0]?.url) {
      manualBtn.href = redirects[0].url;
      manualBtn.classList.remove("hidden");
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function showError(msg) {
    progressEl.classList.add("error");
    errorMessage.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  init();
});
