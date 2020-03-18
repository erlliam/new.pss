// urls 
const baseUrl = "http://census.daybreakgames.com";
const apiUrl = baseUrl + "/s:supafarma/get/ps2/";
// html tags/nodes
let header;
let headerButton;
let main;
// stuff
let navVisible;

document.addEventListener("DOMContentLoaded", () => {
    header = document.getElementById("header");
    headerButton = document.getElementById("header-button");
    main = document.getElementById("main");

    initializeCookies();
    updateHeaderUI();

    headerButton.addEventListener("click", onHeaderButtonClick);

});

function initializeCookies() {
    let cookies = Object.fromEntries(
        document.cookie.split(";").map((entry) => {
            let [key, value] = entry.split("=", 2);
            // No cookies means value will be undefined
            // Trim can't be run on undefined, perhaps use error catching?
            if (value === undefined) {
                value = "";
            }
            return [key.trim(), value.trim()];
        })
    );

    if (cookies.hasOwnProperty("navVisible")) {
        navVisible = Number(cookies.navVisible);
    } else {
        document.cookie = "navVisible=1";
        navVisible = 1;
    }
}

function onHeaderButtonClick() {
    navVisible = Number(!navVisible);
    document.cookie = `navVisible=${navVisible}`;
    updateHeaderUI();
}

function updateHeaderUI() {
    header.classList.toggle("header-closed", !navVisible);
    main.classList.toggle("main-closed", !navVisible);
    headerButton.classList.toggle("header-button-closed", !navVisible);

    headerButton.textContent = navVisible ? "Minimize" : "Maximize";
}

function getJSON(url, callback) {
    let request = new Request(apiUrl + url);
    fetch(request).
        then((response) => {
            return response.json();
        }).
        then((data) => {
            callback(data);
        }).
        catch((error) => {
            console.log(error);
        });
}
