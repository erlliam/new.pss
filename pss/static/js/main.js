// urls 
const baseUrl = "http://census.daybreakgames.com";
const apiUrl = baseUrl + "/s:supafarma/get/ps2/";
// html tags/nodes
let header;
let headerButton;
let main;
// stuff
let localStorage = window.localStorage;
let navVisible;

document.addEventListener("DOMContentLoaded", () => {
    header = document.getElementById("header");
    headerButton = document.getElementById("header-button");
    main = document.getElementById("main");

    initializeLocalStorage()
    updateHeaderUI();

    headerButton.addEventListener("click", onHeaderButtonClick);
});

function initializeLocalStorage() {
    navVisible = (localStorage.getItem("navVisible")
                  ?? "true") === "true";
}

function onHeaderButtonClick() {
    navVisible = !navVisible;
    localStorage.setItem("navVisible", navVisible);

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
