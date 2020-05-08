var url = "";
var input = document.getElementById("url");
var reduce_button = document.getElementById("reduce-button");;
var copied_msg = document.getElementById("copied-msg");
var error_msg = document.getElementById("error-msg");
var urlr_link = document.getElementById("urlr-link");

reduce_button.textContent = browser.i18n.getMessage("reduceButton");
copied_msg.textContent = browser.i18n.getMessage("copiedMsg");
urlr_link.textContent = browser.i18n.getMessage("urlrLink");

function reduceURL(url) {
    fetch("https://urlr.me/reduce-link/" + encodeURIComponent(url))
        .then(response => response.json())
        .then(data => {
            if (!data.hasOwnProperty("error")) {
                input.style.display = "block";
                reduce_button.classList.add("disabled");
                input.value = "https://urlr.me/" + data.code;
                input.focus();
                input.select();

                navigator.clipboard.writeText(input.value).then(function() {
                    copied_msg.style.display = "block";
                  }, function() {
                    /* can't write to clipboard */
                  });
            }
            else {
                if (data.error === 0) {
                    error_msg.textContent = browser.i18n.getMessage("errorNotValid");
                }
                else if (data.error === 1) {
                    error_msg.textContent = browser.i18n.getMessage("errorTooShort");
                }
                error_msg.style.display = "block";
            }
        })
        .catch(err => {
            console.error(err)
        });
}

document.addEventListener("click", (e) => {
    if (e.target.id === "reduce-button") {
        browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
            let tab = tabs[0]; // Safe to assume there will only be one result
            reduceURL(tab.url);
        }, console.error);
    }
});