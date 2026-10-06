let currentSecret = "";

function renderSimpleQRCode(text, container) {
  const encodedText = encodeURIComponent(text);
  const img = document.createElement("img");
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodedText}`;
  img.alt = "QR Code para Autenticador";
  img.style.width = "180px";
  img.style.height = "180px";
  container.innerHTML = "";
  container.appendChild(img);
}

// Alternância de abas
const tabBtnCreate = document.getElementById("tab-btn-create");
const tabBtnImport = document.getElementById("tab-btn-import");
const paneCreate = document.getElementById("pane-create");
const paneImport = document.getElementById("pane-import");

tabBtnCreate.addEventListener("click", () => {
  tabBtnCreate.classList.add("active");
  tabBtnImport.classList.remove("active");
  paneCreate.classList.add("active");
  paneImport.classList.remove("active");
});

tabBtnImport.addEventListener("click", () => {
  tabBtnImport.classList.add("active");
  tabBtnCreate.classList.remove("active");
  paneImport.classList.add("active");
  paneCreate.classList.remove("active");
  document.getElementById("import-secret-input").focus();
});

// Inicialização da aba de criação
async function initSetup() {
  const data = await chrome.storage.local.get(["totpSecret"]);

  if (data.totpSecret) {
    currentSecret = data.totpSecret;
  } else {
    currentSecret = generateBase32Secret(16);
  }

  document.getElementById("secret-text").innerText = currentSecret;

  const otpUri = `otpauth://totp/AuthBlocker:User?secret=${currentSecret}&issuer=AuthBlocker`;
  renderSimpleQRCode(otpUri, document.getElementById("qrcode-container"));
}

// Confirmação via aba Gerar / Atual
document
  .getElementById("verify-btn-create")
  .addEventListener("click", async () => {
    const input = document.getElementById("token-input-create");
    const token = input.value.trim();
    const errorMsg = document.getElementById("error-create");

    const isValid = await verifyTOTP(token, currentSecret);

    if (isValid) {
      await chrome.storage.local.set({
        totpSecret: currentSecret,
        isConfigured: true,
      });
      alert("Autenticador ativado com sucesso!");
      window.close();
    } else {
      errorMsg.style.display = "block";
      input.value = "";
      input.focus();
    }
  });

// Confirmação via aba Importar Chave
document
  .getElementById("verify-btn-import")
  .addEventListener("click", async () => {
    const secretInput = document.getElementById("import-secret-input");
    const tokenInput = document.getElementById("token-input-import");
    const errorMsg = document.getElementById("error-import");

    const rawSecret = secretInput.value
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    const token = tokenInput.value.trim();

    errorMsg.style.display = "none";

    if (!rawSecret) {
      errorMsg.textContent = "Por favor, informe a chave secreta.";
      errorMsg.style.display = "block";
      return;
    }

    try {
      const isValid = await verifyTOTP(token, rawSecret);

      if (isValid) {
        await chrome.storage.local.set({
          totpSecret: rawSecret,
          isConfigured: true,
        });
        alert("Chave sincronizada com sucesso!");
        window.close();
      } else {
        errorMsg.textContent = "Código de 6 dígitos inválido para esta chave.";
        errorMsg.style.display = "block";
        tokenInput.value = "";
        tokenInput.focus();
      }
    } catch (err) {
      errorMsg.textContent = "Chave secreta inválida (deve ser Base32).";
      errorMsg.style.display = "block";
    }
  });

initSetup();
