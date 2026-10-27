import { Configuration, FoldersApi, LinksApi } from "urlr-js";

document.addEventListener("DOMContentLoaded", async () => {
  // UI Elements
  const loginForm = document.getElementById("login-form");
  const apiKeyInput = document.getElementById("api-key");
  const loginButton = document.getElementById("login-button");
  const signupButton = document.getElementById("signup-button");

  const shortenForm = document.getElementById("shorten-form");
  const codeInput = document.getElementById("code");
  const folderSelect = document.getElementById("folders");
  const input = document.getElementById("url");
  const shortenButton = document.getElementById("shorten-button");
  const copiedMsg = document.getElementById("copied-msg");
  const errorMsg = document.getElementById("error-msg");

  const toolbar = document.getElementById("toolbar");
  const clearCacheButton = document.getElementById("clear-cache-button");
  const logoutButton = document.getElementById("logout-button");

  const CACHE_EXPIRATION_TIME = 3600000 * 24; // 24 hours in milliseconds

  // One-time migration of the API key from localStorage (<= 2.1.1)
  // to browser.storage.local.
  await migrateApiKey();

  // Initialization
  const logged = Boolean(await getApiKey());

  // Set translations
  setTranslations();

  // Init
  initContext(logged);
  if (logged) {
    getFolders().catch(() => showError("error"));
  }

  function initContext(isLogged) {
    hideMessages();

    if (isLogged) {
      toolbar.classList.remove("d-none");
      shortenForm.classList.remove("d-none");
      loginForm.classList.add("d-none");
    } else {
      apiKeyInput.value = "";

      toolbar.classList.add("d-none");
      shortenForm.classList.add("d-none");
      loginForm.classList.remove("d-none");
    }
  }

  // Add Event Listeners
  addEventListeners();

  // Functions
  function setTranslations() {
    apiKeyInput.placeholder = browser.i18n.getMessage("apiKeyInput");
    loginButton.textContent = browser.i18n.getMessage("loginButton");
    signupButton.textContent = browser.i18n.getMessage("signupButton");
    codeInput.placeholder = browser.i18n.getMessage("codeInput");
    shortenButton.textContent = browser.i18n.getMessage("shortenButton");
    copiedMsg.textContent = browser.i18n.getMessage("copiedMsg");
    clearCacheButton.title = browser.i18n.getMessage("clearCacheButton");
    logoutButton.title = browser.i18n.getMessage("logoutButton");

    document.querySelector("#clear-cache-button img").alt =
      browser.i18n.getMessage("clearCacheButton");
    document.querySelector("#logout-button img").alt =
      browser.i18n.getMessage("logoutButton");
  }

  function addEventListeners() {
    loginForm.addEventListener("submit", handleLogin);
    shortenButton.addEventListener("click", handleShorten);
    clearCacheButton.addEventListener("click", handleClearCache);
    logoutButton.addEventListener("click", handleLogout);

    const links = document.querySelectorAll(".browser-link");
    links.forEach((link) => {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        const url = this.href;
        browser.tabs.create({ url });
      });
    });
  }

  async function getApiKey() {
    const { apiKey } = await browser.storage.local.get("apiKey");
    return apiKey;
  }

  async function migrateApiKey() {
    const legacyApiKey = localStorage.getItem("apiKey");

    if (legacyApiKey) {
      const currentApiKey = await getApiKey();
      if (!currentApiKey) {
        await browser.storage.local.set({ apiKey: legacyApiKey });
      }
      localStorage.removeItem("apiKey");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    hideMessages();

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showError("loginMsg");
      return;
    }

    loginButton.disabled = true;

    try {
      await browser.storage.local.set({ apiKey });
      clearCache();
      await getFolders();
      initContext(true);
    } catch {
      await browser.storage.local.remove("apiKey");
      showError("loginMsg");
    } finally {
      loginButton.disabled = false;
    }
  }

  async function handleShorten() {
    hideMessages();
    shortenButton.disabled = true;

    try {
      const [tab] = await browser.tabs.query({
        currentWindow: true,
        active: true,
      });

      if (!/^https?:\/\//i.test(tab.url ?? "")) {
        showError("invalidUrl");
        return;
      }

      await shortenUrl(tab.url);
    } catch (error) {
      const detail = await getApiErrorMessage(error);
      if (detail) {
        showRawError(detail);
      } else {
        showError("error");
      }
    } finally {
      shortenButton.disabled = false;
    }
  }

  async function handleClearCache() {
    clearCache();
    await getFolders().catch(() => showError("error"));
  }

  function handleLogout() {
    browser.storage.local.remove("apiKey");
    clearCache();
    initContext(false);
  }

  async function fetchApi(apiCall, ...args) {
    const apiKey = await getApiKey();
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    return await apiCall(configuration, ...args);
  }

  function getCachedData(key) {
    const cached = localStorage.getItem(key);

    if (cached) {
      try {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
          return data;
        }
        localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key);
      }
    }

    return null;
  }

  function setCachedData(key, data) {
    const cached = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(cached));
  }

  function clearCache() {
    localStorage.removeItem("folders");
  }

  async function getFolders() {
    let data = getCachedData("folders");

    if (!data) {
      data = await fetchApi((config) => {
        const folderApi = new FoldersApi(config);
        return folderApi.folderList();
      });

      setCachedData("folders", data);
    }

    if (data.folders.length > 0) {
      updateSelect(
        folderSelect,
        data.folders,
        "name",
        browser.i18n.getMessage("selectFolder"),
      );

      folderSelect.classList.remove("d-none");
    } else {
      folderSelect.classList.add("d-none");
    }
  }

  function updateSelect(selectElement, items, textKey, defaultOptionText) {
    selectElement.innerHTML = ""; // Clear previous options

    if (defaultOptionText) {
      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.textContent = defaultOptionText;
      selectElement.appendChild(emptyOpt);
    }

    items.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id.toString();
      opt.textContent = item[textKey];
      selectElement.appendChild(opt);
    });
  }

  async function shortenUrl(url) {
    const data = await fetchApi((config) => {
      const linkApi = new LinksApi(config);
      const linkCreateRequest = {
        url,
      };

      if (folderSelect.value) {
        linkCreateRequest.folderId = folderSelect.value;
      }

      if (codeInput.value) {
        linkCreateRequest.code = codeInput.value;
      }

      return linkApi.linkCreate({ linkCreateRequest });
    });
    displayShortenedUrl(data);
  }

  function displayShortenedUrl(data) {
    input.value = `${data.domain}/${data.code}`;
    input.classList.remove("d-none");
    input.focus();
    input.select();
    copyToClipboard(input.value);
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => copiedMsg.classList.remove("d-none"))
      .catch(() => {
        // Clipboard API failed (e.g. permission denied): the URL stays
        // selected so the user can still copy it manually.
        input.select();
      });
  }

  function hideMessages() {
    copiedMsg.classList.add("d-none");
    errorMsg.classList.add("d-none");
  }

  function showError(errorKey) {
    showRawError(browser.i18n.getMessage(errorKey));
  }

  function showRawError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove("d-none");
  }

  async function getApiErrorMessage(error) {
    if (!error.response) {
      return null;
    }

    try {
      const body = await error.response.json();
      if (typeof body.detail === "string") {
        return body.detail;
      }
    } catch {
      // Body is not JSON: fall back to the generic error message.
    }

    return null;
  }
});
