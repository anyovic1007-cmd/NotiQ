const responseConsole = document.getElementById("response-console");
const healthStatus = document.getElementById("health-status");
const refreshHealthButton = document.getElementById("refresh-health");
const inappForm = document.getElementById("inapp-form");
const emailForm = document.getElementById("email-form");
const lookupForm = document.getElementById("lookup-form");
const notificationsList = document.getElementById("notifications-list");
const notificationsEmpty = document.getElementById("notifications-empty");

const formatJson = (value) => JSON.stringify(value, null, 2);

const writeConsole = (label, payload) => {
  responseConsole.textContent = `${label}\n${formatJson(payload)}`;
};

const setHealthState = (text, variant) => {
  healthStatus.textContent = text;
  healthStatus.classList.remove("status-ok", "status-error");

  if (variant) {
    healthStatus.classList.add(variant);
  }
};

const readForm = (form) => Object.fromEntries(new FormData(form).entries());

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.payload = payload;
    error.status = response.status;
    throw error;
  }

  return payload;
};

const renderNotifications = (notifications) => {
  notificationsList.innerHTML = "";
  notificationsEmpty.classList.toggle("hidden", notifications.length > 0);

  for (const notification of notifications) {
    const card = document.createElement("article");
    card.className = "notification-card";

    const createdAt = notification.created_at
      ? new Date(notification.created_at).toLocaleString()
      : "Unknown time";

    card.innerHTML = `
      <div class="notification-meta">
        <span>${notification.type}</span>
        <span>${notification.status}</span>
        <span>${createdAt}</span>
      </div>
      <h3>${notification.title}</h3>
      <p>${notification.body}</p>
      <button type="button" data-id="${notification.id}">Mark as read</button>
    `;

    const button = card.querySelector("button");
    button.disabled = notification.status === "read";
    button.textContent = notification.status === "read" ? "Already read" : "Mark as read";
    button.addEventListener("click", async () => {
      try {
        const payload = await requestJson(`/notify/${notification.id}/read`, {
          method: "PATCH"
        });

        writeConsole("PATCH /notify/:id/read", payload);
        await loadNotifications(lookupForm.elements.userId.value);
      } catch (error) {
        writeConsole("PATCH /notify/:id/read failed", error.payload || { error: error.message });
      }
    });

    notificationsList.appendChild(card);
  }
};

const loadNotifications = async (userId) => {
  const payload = await requestJson(`/notify/${encodeURIComponent(userId)}`);
  writeConsole("GET /notify/:userId", payload);
  renderNotifications(payload.data || []);
};

const refreshHealth = async () => {
  setHealthState("Checking...", "");

  try {
    const payload = await requestJson("/health");
    setHealthState(payload.data.status.toUpperCase(), "status-ok");
    writeConsole("GET /health", payload);
  } catch (error) {
    setHealthState("ERROR", "status-error");
    writeConsole("GET /health failed", error.payload || { error: error.message });
  }
};

refreshHealthButton.addEventListener("click", refreshHealth);

inappForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await requestJson("/notify/inapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(readForm(inappForm))
    });

    writeConsole("POST /notify/inapp", payload);
    lookupForm.elements.userId.value = inappForm.elements.userId.value;
    await loadNotifications(inappForm.elements.userId.value);
  } catch (error) {
    writeConsole("POST /notify/inapp failed", error.payload || { error: error.message });
  }
});

emailForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await requestJson("/notify/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(readForm(emailForm))
    });

    writeConsole("POST /notify/email", payload);
    lookupForm.elements.userId.value = emailForm.elements.userId.value;
    await loadNotifications(emailForm.elements.userId.value);
  } catch (error) {
    writeConsole("POST /notify/email failed", error.payload || { error: error.message });
  }
});

lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await loadNotifications(lookupForm.elements.userId.value);
  } catch (error) {
    renderNotifications([]);
    writeConsole("GET /notify/:userId failed", error.payload || { error: error.message });
  }
});

refreshHealth();
