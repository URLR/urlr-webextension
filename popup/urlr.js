var url = "";
var input = document.getElementById("url");
var copied_msg = document.getElementById("copied-msg");
var error_msg = document.getElementById("error-msg");

function reduceURL(url) {
    fetch("https://urlr.me/reduce-link/" + encodeURIComponent(url))
        .then(response => response.json())
        .then(data => {
            if (!data.hasOwnProperty('error')) {
                input.style.display = "block";
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
                error_msg.style.display = "block";
            }
        })
        .catch(err => {
            console.error(err)
        });
}

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("button")) {
        browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
            let tab = tabs[0]; // Safe to assume there will only be one result
            reduceURL(tab.url);
        }, console.error);
    }
});