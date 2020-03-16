// urls 
const baseUrl = "http://census.daybreakgames.com";
const apiUrl = baseUrl + "/s:supafarma/get/ps2/";
// html tags/nodes
let header;
let headerButton;
let main;
// stuff
let cookies = {};
let navbarVisible;

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
    if ("navState" in cookies) {
        navbarVisible = parseInt(cookies.nav_state) ?
                  true :
                  false;
    } else {
        // cookie doesn't exist.
        document.cookie = "navState=1";
        navbarVisible = true;
    }
}

function initializeNavbar() {
    if (!navbarVisible) {
        header.classList.toggle("header-closed");
        main.classList.toggle("main-closed");
        headerButton.classList.toggle("header-button-closed");
        headerButton.textContent = "Maximize";
    }
}

function navbarLogic() {
    navbarVisible = !navbarVisible;
    document.cookie = `navState=${Number(navbarVisible)}`

    header.classList.toggle("header-closed");
    main.classList.toggle("main-closed");
    headerButton.classList.toggle("header-button-closed");

    // array with navbar state text? no more if statement
    // just use navbarvisible as a number..
    if (navbarVisible) {
        headerButton.textContent = "Minimize";
    } else {
        headerButton.textContent = "Maximize";
    }
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
