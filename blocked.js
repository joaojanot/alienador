const urlParams = new URLSearchParams(window.location.search);
const targetUrl = urlParams.get("target");
const targetDomain = urlParams.get("domain");

const domainLabel = document.getElementById("domain-label");
const tokenInput = document.getElementById("token-input");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-msg");
const cancelBtn = document.getElementById("cancel-btn");

if (targetDomain) {
  domainLabel.textContent = targetDomain;
}

cancelBtn.addEventListener("click", () => {
  window.location.href = "chrome://newtab";
});

function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `stats_${year}-${month}-${day}`;
}

async function recordUnlock(domain) {
  const todayKey = getTodayKey();
  const data = await chrome.storage.local.get(todayKey);
  const dailyStats = data[todayKey] || {};

  if (!dailyStats[domain]) {
    dailyStats[domain] = { attempts: 0, unlocks: 0 };
  }
  dailyStats[domain].unlocks += 1;

  await chrome.storage.local.set({ [todayKey]: dailyStats });
}

async function handleUnlock() {
  const token = tokenInput.value.trim();
  errorMsg.style.display = "none";

  const data = await chrome.storage.local.get(["totpSecret", "unlockMinutes"]);
  const secret = data.totpSecret;
  const minutes = data.unlockMinutes || 15;

  if (!secret) {
    alert(
      "Chave do autenticador não encontrada. Configure o 2FA nas opções da extensão.",
    );
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Verificando...";

  const isValid = await verifyTOTP(token, secret);

  if (isValid) {
    // 1. Registra o desbloqueio com sucesso
    await recordUnlock(targetDomain);

    // 2. Salva o tempo de liberação da sessão
    const expiresAt = Date.now() + minutes * 60 * 1000;
    const sessionKey = `unlock_${targetDomain}`;
    await chrome.storage.local.set({ [sessionKey]: expiresAt });

    // 3. Redireciona
    window.location.href = targetUrl || `https://${targetDomain}`;
  } else {
    submitBtn.disabled = false;
    submitBtn.textContent = "Liberar Acesso";
    errorMsg.style.display = "block";
    tokenInput.value = "";
    tokenInput.focus();
  }
}

submitBtn.addEventListener("click", handleUnlock);
tokenInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleUnlock();
});
