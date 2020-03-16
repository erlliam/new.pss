// urls 
const baseUrl = "http://census.daybreakgames.com";
const apiUrl = baseUrl + "/s:supafarma/get/ps2/";
// html tags/nodes
let header;
let headerButton;
let main;
// stuff
let cookies = {};
let headerButtonText = {
    0: "Maximize",
    1: "Minimize"
};

document.addEventListener("DOMContentLoaded", () => {
    header = document.getElementById("header");
    headerButton = document.getElementById("header-button");
    main = document.getElementById("main");

    initializeCookies();
    initializeNavbar();

    headerButton.addEventListener("click", navbarLogic);

});

function initializeCookies() {
    cookies = Object.fromEntries(
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

    if (!cookies.hasOwnProperty("navState")) {
        document.cookie = "navState=1";
    }
}

function initializeNavbar() {
    if (!Number(cookies.navState)) {
        header.classList.toggle("header-closed");
        main.classList.toggle("main-closed");
        headerButton.classList.toggle("header-button-closed");
        headerButton.textContent = "Maximize";
    }
}

function navbarLogic() {
    cookies.navState = Number(!cookies.navState);
    document.cookie = `navState=${Number(cookies.navState)}`

    header.classList.toggle("header-closed");
    main.classList.toggle("main-closed");
    headerButton.classList.toggle("header-button-closed");

    headerButton.textContent = headerButtonText[cookies.navState];
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
