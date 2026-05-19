import {
  Configuration,
  FoldersApi,
  LinksApi,
} from 'urlr-js';

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const loginForm = document.getElementById('login-form');
  const apiKeyInput = document.getElementById('api-key');
  const loginButton = document.getElementById('login-button');
  const signupButton = document.getElementById('signup-button');

  const shortenForm = document.getElementById('shorten-form');
  const codeInput = document.getElementById('code');
  const folderSelect = document.getElementById('folders');
  const input = document.getElementById('url');
  const shortenButton = document.getElementById('shorten-button');
  const copiedMsg = document.getElementById('copied-msg');
  const errorMsg = document.getElementById('error-msg');

  const toolbar = document.getElementById('toolbar');
  const clearCacheButton = document.getElementById('clear-cache-button');
  const logoutButton = document.getElementById('logout-button');

  const CACHE_EXPIRATION_TIME = 3600000 * 24; // 24 hours in milliseconds

  // Initialization
  let token = localStorage.getItem('apiKey');
  const logged = Boolean(token);

  // Set translations
  setTranslations();

  // Init
  initContext(logged);

  function initContext(isLogged) {
    if (isLogged) {
      getFolders();
      toolbar.classList.remove('d-none');
      shortenForm.classList.remove('d-none');
      loginForm.classList.add('d-none');
    } else {
      apiKeyInput.value = '';

      toolbar.classList.add('d-none');
      shortenForm.classList.add('d-none');
      loginForm.classList.remove('d-none');
    }
  }

  // Add Event Listeners
  addEventListeners();

  // Functions
  function setTranslations() {
    apiKeyInput.placeholder = browser.i18n.getMessage('apiKeyInput');
    loginButton.textContent = browser.i18n.getMessage('loginButton');
    signupButton.textContent = browser.i18n.getMessage('signupButton');
    codeInput.placeholder = browser.i18n.getMessage('codeInput');
    shortenButton.textContent = browser.i18n.getMessage('shortenButton');
    copiedMsg.textContent = browser.i18n.getMessage('copiedMsg');
    clearCacheButton.title = browser.i18n.getMessage('clearCacheButton');
    logoutButton.title = browser.i18n.getMessage('logoutButton');
  }

  function addEventListeners() {
    loginButton.addEventListener('click', handleLogin);
    shortenButton.addEventListener('click', handleShorten);
    clearCacheButton.addEventListener('click', handleClearCache);
    logoutButton.addEventListener('click', handleLogout);

    const links = document.querySelectorAll('.browser-link');
    links.forEach((link) => {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        const url = this.href;
        chrome.tabs.create({ url });
      });
    });
  }

  async function handleLogin() {
    try {
      await saveApiKey(apiKeyInput.value);
      getFolders();
    } catch {
      showError('loginMsg');
    }
  }

  async function handleShorten() {
    try {
      const [tab] = await browser.tabs.query({ currentWindow: true, active: true });
      await shortenUrl(tab.url);
    } catch {
      showError('error');
    }
  }

  async function handleClearCache() {
    clearCache();
    await getFolders();
  }

  async function handleLogout() {
    localStorage.removeItem('apiKey');
    initContext(false);
  }

  async function saveApiKey(apiKey) {
    localStorage.setItem('apiKey', apiKey);
    initContext(true);
  }

  async function fetchApi(apiCall, ...args) {
    const apiKey = localStorage.getItem('apiKey');
    let configuration = new Configuration({
      apiKey: apiKey,
    });
    return await apiCall(configuration, ...args);
  }

  function getCachedData(key) {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
        return data;
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
    localStorage.removeItem('folders');
  }

  async function getFolders() {
    let data = getCachedData(`folders`);

    if (!data) {
      data = await fetchApi((config) => {
        const folderApi = new FoldersApi(config);
        return folderApi.folderList();
      });

      setCachedData(`folders`, data);
    }

    if (data.folders.length > 0) {
      updateSelect(
        folderSelect,
        data.folders,
        'name',
        browser.i18n.getMessage('selectFolder')
      );

      folderSelect.classList.remove('d-none');
    } else {
      folderSelect.classList.add('d-none');
    }
  }

  function updateSelect(selectElement, items, textKey, defaultOptionText) {
    selectElement.innerHTML = ''; // Clear previous options

    if (defaultOptionText) {
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = defaultOptionText;
      selectElement.appendChild(emptyOpt);
    }

    items.forEach((item) => {
      const opt = document.createElement('option');
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
    input.classList.remove('d-none');
    shortenButton.classList.add('disabled');
    folderSelect.classList.add('disabled');
    input.focus();
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
      copiedMsg.classList.remove('d-none');
    });
  }

  function showError(errorKey) {
    errorMsg.textContent = browser.i18n.getMessage(errorKey);
    errorMsg.classList.remove('d-none');
  }
});
