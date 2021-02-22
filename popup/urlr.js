// Vars

const BASE_URL = "https://preprod.urlr.me/";
const API_BASE_URL = BASE_URL + "api/";

// UI Elements

var login_form = document.getElementById("login-form");
var reduce_form = document.getElementById("reduce-form");
var input = document.getElementById("url");
var input_username = document.getElementById("username");
var input_password = document.getElementById("password");
var login_button = document.getElementById("login-button");
var reduce_button = document.getElementById("reduce-button");
var copied_msg = document.getElementById("copied-msg");
var error_msg = document.getElementById("error-msg");
var urlr_link = document.getElementById("urlr-link");

// Translations

input_username.placeholder = browser.i18n.getMessage("usernameInput");
input_password.placeholder = browser.i18n.getMessage("passwordInput");
login_button.textContent = browser.i18n.getMessage("loginButton");
reduce_button.textContent = browser.i18n.getMessage("reduceButton");
copied_msg.textContent = browser.i18n.getMessage("copiedMsg");
urlr_link.textContent = browser.i18n.getMessage("urlrLink");

// Verify is the user is connected
var token = "";
browser.storage.local.get(["token"]).then(function (result) {
    if (result.token !== undefined) {
        token = result.token;
        reduce_form.style.display = "block";
    }
    else {
        login_form.style.display = "block";
    }
});

// Functions

function getToken(username, password) {
    var myHeaders = new Headers({
        "Content-Type": "application/json"
    });
    var myInit = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({
            username: username,
            password: password
        })
    };
    fetch(API_BASE_URL + "login_check", myInit)
        .then(response => response.json())
        .then(data => {
            // Set local storage with correct token
            browser.storage.local.set({"token": data["token"]});
            token = data["token"];
            return true;
        })
        .catch(err => {
            console.error(err);
        });
}

function reduceURL(url) {
    locale = browser.i18n.getUILanguage();

    var myHeaders = new Headers({
        "Content-Type": "application/json",
        "Content-Language": locale,
        "Authorization": "Bearer " + token
    });
    var myInit = {
        method: "GET",
        headers: myHeaders
    };
    fetch(API_BASE_URL + "r/" + encodeURIComponent(url), myInit)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.code === 200) {
                input.style.display = "block";
                reduce_button.classList.add("disabled");
                input.value = BASE_URL + data.url_code;
                input.focus();
                input.select();

                navigator.clipboard.writeText(input.value).then(function() {
                    copied_msg.style.display = "block";
                }, function() {
                    /* Can't write to clipboard */
                })
            }
            else if (data.code === 400) {
                if (data.error === 0) {
                    error_msg.textContent = browser.i18n.getMessage("errorNotValid");
                }
                else if (data.error === 1) {
                    error_msg.textContent = browser.i18n.getMessage("errorIsSpam");
                }
                else if (data.error === 2) {
                    error_msg.textContent = browser.i18n.getMessage("errorLimitExceeded");
                }
                error_msg.style.display = "block";
            }
            else if (data.code === 401) {
                // Refresh the token
                // Need to re-login or save credentials?
            }
            else {
                error_msg.textContent = browser.i18n.getMessage("errorUnknown");
                error_msg.style.display = "block";
            }
        })
        .catch(err => {
            console.error(err);
        });
}

// Click events

document.addEventListener("click", (e) => {
    if (e.target.id === "reduce-button") {
        browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
            let tab = tabs[0]; // Safe to assume there will only be one result
            reduceURL(tab.url);
        }, console.error);
    }
    else if (e.target.id === "login-button") {
        // Get values of fields
        const username = input_username.value;
        const password = input_password.value;
        getToken(username, password);

        reduce_form.style.display = "block";
        login_form.style.display = "none";
    }
});