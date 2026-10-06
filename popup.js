const defaultSites = [
  "youtube.com",
  "instagram.com",
  "reddit.com",
  "x.com",
  "twitter.com",
];

function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `stats_${year}-${month}-${day}`;
}

function cleanDomain(input) {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/^www\./, "");
  domain = domain.split("/")[0];
  domain = domain.split("?")[0];
  return domain;
}

async function loadData() {
  const todayKey = getTodayKey();
  const data = await chrome.storage.local.get([
    "blockedDomains",
    "unlockMinutes",
    "isConfigured",
    todayKey,
  ]);

  if (!data.isConfigured) {
    chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") });
  }

  const domains = data.blockedDomains || defaultSites;
  const minutes = data.unlockMinutes || 15;
  const stats = data[todayKey] || {};

  document.getElementById("unlock-duration").value = minutes;
  renderList(domains, stats);
}

function renderList(domains, stats) {
  const listEl = document.getElementById("site-list");
  listEl.innerHTML = "";

  if (domains.length === 0) {
    listEl.innerHTML = '<li class="empty-state">Nenhum site bloqueado.</li>';
    return;
  }

  domains.forEach((domain) => {
    const itemStats = stats[domain] || { attempts: 0, unlocks: 0 };

    const li = document.createElement("li");
    li.className = "site-item";

    const infoDiv = document.createElement("div");
    infoDiv.className = "site-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "site-name";
    nameSpan.textContent = domain;

    const statsSpan = document.createElement("div");
    statsSpan.className = "site-stats";
    statsSpan.innerHTML = `
      <span class="stat-badge" title="Tentativas de acesso hoje">🚫 ${itemStats.attempts} ${itemStats.attempts === 1 ? "tentativa" : "tentativas"}</span>
      <span>•</span>
      <span class="stat-badge" title="Desbloqueios com 2FA hoje">🔓 ${itemStats.unlocks} ${itemStats.unlocks === 1 ? "desbloqueio" : "desbloqueios"}</span>
    `;

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(statsSpan);

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove";
    removeBtn.innerHTML = "&times;";
    removeBtn.title = "Remover site";
    removeBtn.addEventListener("click", () => openDeleteModal(domain));

    li.appendChild(infoDiv);
    li.appendChild(removeBtn);
    listEl.appendChild(li);
  });
}

async function addDomain() {
  const input = document.getElementById("new-domain");
  const rawValue = input.value;
  const domain = cleanDomain(rawValue);

  if (!domain) return;

  const data = await chrome.storage.local.get(["blockedDomains"]);
  const domains = data.blockedDomains || defaultSites;

  if (!domains.includes(domain)) {
    domains.push(domain);
    await chrome.storage.local.set({ blockedDomains: domains });
    await loadData();
  }

  input.value = "";
}

function openDeleteModal(domain) {
  pendingDomainToDelete = domain;
  document.getElementById("modal-domain-name").textContent = domain;
  document.getElementById("modal-token-input").value = "";
  document.getElementById("modal-error-msg").style.display = "none";
  document.getElementById("confirm-modal").style.display = "flex";
  document.getElementById("modal-token-input").focus();
}

function closeDeleteModal() {
  pendingDomainToDelete = null;
  document.getElementById("confirm-modal").style.display = "none";
}

async function handleConfirmDelete() {
  const token = document.getElementById("modal-token-input").value.trim();
  const errorEl = document.getElementById("modal-error-msg");

  const data = await chrome.storage.local.get(["totpSecret", "blockedDomains"]);
  const secret = data.totpSecret;

  if (!secret) {
    alert("Chave 2FA não configurada.");
    return;
  }

  const isValid = await verifyTOTP(token, secret);

  if (isValid) {
    const domains = (data.blockedDomains || defaultSites).filter(
      (d) => d !== pendingDomainToDelete,
    );
    await chrome.storage.local.set({ blockedDomains: domains });
    await loadData();
    closeDeleteModal();
  } else {
    errorEl.style.display = "block";
    document.getElementById("modal-token-input").value = "";
    document.getElementById("modal-token-input").focus();
  }
}

// Event Listeners
document.getElementById("btn-add").addEventListener("click", addDomain);
document.getElementById("new-domain").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addDomain();
});

document
  .getElementById("unlock-duration")
  .addEventListener("change", async (e) => {
    const minutes = parseInt(e.target.value, 10);
    await chrome.storage.local.set({ unlockMinutes: minutes });
  });

document.getElementById("btn-open-setup").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") });
});

document
  .getElementById("btn-modal-cancel")
  .addEventListener("click", closeDeleteModal);
document
  .getElementById("btn-modal-confirm")
  .addEventListener("click", handleConfirmDelete);
document
  .getElementById("modal-token-input")
  .addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleConfirmDelete();
  });

loadData();
