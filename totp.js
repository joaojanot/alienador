// Utilitários para decodificação e geração de Base32
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32ToBuffer(base32) {
  const clean = base32.toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) throw new Error("Caractere Base32 inválido: " + clean[i]);
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return new Uint8Array(bytes);
}

// Gera uma chave secreta aleatória de 16 caracteres em Base32
function generateBase32Secret(length = 16) {
  let secret = "";
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % BASE32_CHARS.length];
  }
  return secret;
}

// Gera o código de 6 dígitos para uma fatia de tempo específica
async function generateHOTP(secretBase32, counter) {
  const keyBytes = base32ToBuffer(secretBase32);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // O contador TOTP é um inteiro de 64 bits (big-endian)
  counterView.setUint32(4, counter, false);

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, counterBuffer);
  const hashBytes = new Uint8Array(signature);

  // Truncamento dinâmico (RFC 4226)
  const offset = hashBytes[hashBytes.length - 1] & 0x0f;
  const binary =
    ((hashBytes[offset] & 0x7f) << 24) |
    ((hashBytes[offset + 1] & 0xff) << 16) |
    ((hashBytes[offset + 2] & 0xff) << 8) |
    (hashBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

// Valida o código digitado com tolerância de ±1 ciclo (±30 segundos)
async function verifyTOTP(token, secretBase32) {
  if (!token || token.length !== 6) return false;

  const epochSeconds = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(epochSeconds / 30);

  // Testa o passo anterior, o atual e o próximo para compensar pequenos desvios de relógio
  for (let stepOffset = -1; stepOffset <= 1; stepOffset++) {
    const expectedToken = await generateHOTP(
      secretBase32,
      currentStep + stepOffset,
    );
    if (token === expectedToken) {
      return true;
    }
  }
  return false;
}
