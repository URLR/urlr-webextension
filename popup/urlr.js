import { Configuration, AuthentificationApi, LinkApi } from 'urlr-js';

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const loginForm = document.getElementById('login-form');
  const reduceForm = document.getElementById('reduce-form');
  const input = document.getElementById('url');
  const inputUsername = document.getElementById('username');
  const inputPassword = document.getElementById('password');
  const loginButton = document.getElementById('login-button');
  const reduceButton = document.getElementById('reduce-button');
  const copiedMsg = document.getElementById('copied-msg');
  const loginMsg = document.getElementById('login-msg');
  const errorMsg = document.getElementById('error-msg');

  // Translations

  inputUsername.placeholder = browser.i18n.getMessage('usernameInput');
  inputPassword.placeholder = browser.i18n.getMessage('passwordInput');
  loginButton.textContent = browser.i18n.getMessage('loginButton');
  reduceButton.textContent = browser.i18n.getMessage('reduceButton');
  copiedMsg.textContent = browser.i18n.getMessage('copiedMsg');

  // Check is the user is logged

  let token = localStorage.getItem('token');
  if (!token) {
    loginForm.style.display = 'block';
  } else {
    reduceForm.style.display = 'block';
  }

  // Functions

  function getToken(username, password) {
    const authentificationApi = new AuthentificationApi();
    authentificationApi.authentification({
      authentificationRequest: {
        username,
        password,
      },
    }).then((data) => {
      localStorage.setItem('token', data.token);

      reduceForm.style.display = 'block';
      loginForm.style.display = 'none';
    }).catch(() => {
      // error
      loginMsg.textContent = browser.i18n.getMessage('loginMsg');
      loginMsg.style.display = 'block';
    });
  }

  function reduceURL(url) {
    token = localStorage.getItem('token');
    const configuration = new Configuration({ accessToken: token });

    const linkApi = new LinkApi(configuration);
    linkApi.reduceLink({
      reduceLinkRequest: {
        url,
        team: '3', // todo: let choose team
      },
    }).then((data) => {
      input.style.display = 'block';
      reduceButton.classList.add('disabled');
      input.value = `${data.domain}/${data.urlCode}`;
      input.focus();
      input.select();

      navigator.clipboard.writeText(input.value).then(() => {
        copiedMsg.style.display = 'block';
      });
    }).catch(() => {
      errorMsg.textContent = browser.i18n.getMessage('error');
      errorMsg.style.display = 'block';
    });
  }

  // Click events

  document.addEventListener('click', (e) => {
    if (e.target.id === 'reduce-button') {
      browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        const tab = tabs[0]; // Safe to assume there will only be one result
        reduceURL(tab.url);
      });
    } else if (e.target.id === 'login-button') {
      // Get values of fields
      const username = inputUsername.value;
      const password = inputPassword.value;
      getToken(username, password);
    }
  });
});
