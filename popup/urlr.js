import {
  Configuration,
  AccessTokensApi,
  TeamsApi,
  FoldersApi,
  LinksApi,
} from 'urlr-js';

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const loginForm = document.getElementById('login-form');
  const inputUsername = document.getElementById('username');
  const inputPassword = document.getElementById('password');
  const loginButton = document.getElementById('login-button');
  const signupButton = document.getElementById('signup-button');

  const shortenForm = document.getElementById('shorten-form');
  const codeInput = document.getElementById('code');
  const teamSelect = document.getElementById('teams');
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
  let token = localStorage.getItem('token');
  const logged = Boolean(token);

  // Set translations
  setTranslations();

  // Init
  initContext(logged);

  function initContext(isLogged) {
    if (isLogged) {
      getTeams();

      toolbar.classList.remove('d-none');
      shortenForm.classList.remove('d-none');
      loginForm.classList.add('d-none');
    } else {
      inputUsername.value = '';
      inputPassword.value = '';

      toolbar.classList.add('d-none');
      shortenForm.classList.add('d-none');
      loginForm.classList.remove('d-none');
    }
  }

  // Add Event Listeners
  addEventListeners();

  // Functions
  function setTranslations() {
    inputUsername.placeholder = browser.i18n.getMessage('usernameInput');
    inputPassword.placeholder = browser.i18n.getMessage('passwordInput');
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
    teamSelect.addEventListener('change', () => getFolders(teamSelect.value));
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
    const username = inputUsername.value;
    const password = inputPassword.value;
    try {
      await getToken(username, password);
      getTeams();
    } catch (error) {
      showError('loginMsg');
    }
  }

  async function handleShorten() {
    try {
      const [tab] = await browser.tabs.query({ currentWindow: true, active: true });
      await shortenUrl(tab.url);
    } catch (error) {
      showError('error');
    }
  }

  async function handleClearCache() {
    clearCache();
    await getTeams();
  }

  async function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    initContext(false);
  }

  async function getToken(username, password) {
    const accessTokensApi = new AccessTokensApi();
    const data = await accessTokensApi.createAccessToken({
      createAccessTokenRequest: { username, password },
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    initContext(true);
  }

  async function getNewToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const accessTokensApi = new AccessTokensApi();
      const data = await accessTokensApi.refreshAccessToken({
        refreshAccessTokenRequest: { refreshToken },
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
    } else {
      await handleLogout();
    }
  }

  async function fetchWithRetry(apiCall, ...args) {
    token = localStorage.getItem('token');
    let configuration = new Configuration({ accessToken: token });
    try {
      return await apiCall(configuration, ...args);
    } catch (error) {
      if (error.name === 'ResponseError') {
        await getNewToken();
        token = localStorage.getItem('token');
        configuration = new Configuration({ accessToken: token });
        return apiCall(configuration, ...args);
      }
      throw error;
    }
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
    localStorage.removeItem('teams');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('folders_')) {
        localStorage.removeItem(key);
      }
    }
  }

  async function getTeams() {
    let data = getCachedData('teams');
    if (!data) {
      data = await fetchWithRetry((config) => {
        const teamApi = new TeamsApi(config);
        return teamApi.getTeams();
      });
      setCachedData('teams', data);
    }
    updateSelect(teamSelect, data.teams, 'name');
    getFolders(teamSelect.value); // Load folders for the first team
  }

  async function getFolders(teamId) {
    let data = getCachedData(`folders_${teamId}`);
    if (!data) {
      data = await fetchWithRetry((config) => {
        const folderApi = new FoldersApi(config);
        return folderApi.getFolders({ teamId });
      });
      setCachedData(`folders_${teamId}`, data);
    }
    if (data.folders.length > 0) {
      updateSelect(folderSelect, data.folders, 'name', browser.i18n.getMessage('selectFolder'));
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
    const data = await fetchWithRetry((config) => {
      const linkApi = new LinksApi(config);
      const createLinkRequest = {
        url,
        teamId: teamSelect.value,
      };

      if (folderSelect.value) {
        createLinkRequest.folderId = folderSelect.value;
      }

      if (codeInput.value) {
        createLinkRequest.code = codeInput.value;
      }

      return linkApi.createLink({ createLinkRequest });
    });
    displayShortenedUrl(data);
  }

  function displayShortenedUrl(data) {
    input.value = `${data.domain}/${data.code}`;
    input.classList.remove('d-none');
    shortenButton.classList.add('disabled');
    teamSelect.classList.add('disabled');
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
