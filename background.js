const DEFAULT_SITES = [
  "youtube.com",
  "instagram.com",
  "reddit.com",
  "x.com",
  "twitter.com",
];

const WHITELIST_HOSTS = ["music.youtube.com"];

function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `stats_${year}-${month}-${day}`;
}

async function recordAttempt(domain) {
  try {
    const todayKey = getTodayKey();
    const data = await chrome.storage.local.get(todayKey);
    const dailyStats = data[todayKey] || {};

    if (!dailyStats[domain]) {
      dailyStats[domain] = { attempts: 0, unlocks: 0 };
    }
    dailyStats[domain].attempts += 1;

    await chrome.storage.local.set({ [todayKey]: dailyStats });
  } catch (err) {
    console.error("Erro ao registrar tentativa:", err);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const data = await chrome.storage.local.get([
      "blockedDomains",
      "unlockMinutes",
      "isConfigured",
    ]);

    if (!data.blockedDomains) {
      await chrome.storage.local.set({ blockedDomains: DEFAULT_SITES });
    }
    if (!data.unlockMinutes) {
      await chrome.storage.local.set({ unlockMinutes: 15 });
    }
    if (!data.isConfigured) {
      chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") });
    }
  } catch (err) {
    console.error("Erro na inicialização:", err);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Pega a URL do evento de mudança ou da aba diretamente
  const currentUrl = changeInfo.url || tab.url;

  // Ignora se não houver URL ou se não for página HTTP/HTTPS
  if (!currentUrl || !currentUrl.startsWith("http")) {
    return;
  }

  // Evita re-interceptar páginas da própria extensão
  const extensionPrefix = chrome.runtime.getURL("");
  if (currentUrl.startsWith(extensionPrefix)) {
    return;
  }

  try {
    const parsedUrl = new URL(currentUrl);
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

    // 1. Ignora exceções (como music.youtube.com)
    if (
      WHITELIST_HOSTS.some((w) => hostname === w || hostname.endsWith("." + w))
    ) {
      return;
    }

    // 2. Busca lista de bloqueio
    const { blockedDomains = DEFAULT_SITES } =
      await chrome.storage.local.get("blockedDomains");

    const matchedDomain = blockedDomains.find(
      (domain) => hostname === domain || hostname.endsWith("." + domain),
    );

    if (matchedDomain) {
      const sessionKey = `unlock_${matchedDomain}`;
      const sessionData = await chrome.storage.local.get(sessionKey);
      const unlockedUntil = sessionData[sessionKey];

      const isStillUnlocked = unlockedUntil && Date.now() < unlockedUntil;

      if (!isStillUnlocked) {
        // Registra a tentativa
        await recordAttempt(matchedDomain);

        const blockedPageUrl = chrome.runtime.getURL(
          `blocked.html?domain=${encodeURIComponent(matchedDomain)}&target=${encodeURIComponent(currentUrl)}`,
        );
        chrome.tabs.update(tabId, { url: blockedPageUrl });
      }
    }
  } catch (err) {
    console.error("Erro ao processar aba:", err);
  }
});
