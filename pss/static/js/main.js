const baseUrl = "http://census.daybreakgames.com";
const apiUrl = baseUrl + "/s:supafarma/get/ps2/";
let visible;

document.addEventListener("DOMContentLoaded", () => {
    // Strager big brain
    let allCookies = Object.fromEntries(
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
    if ("nav_state" in allCookies) {
        visible = parseInt(allCookies.nav_state) ?
                  true :
                  false;
    } else {
        document.cookie = "nav_state=1";
        visible = true;
    }

    let header = document.getElementById("header");
    let main = document.getElementById("main");
    let minimize = document.getElementById("nav-min");
    // Handle nav_state=0 cookie, navbar is hidden
    if (!visible) {
        header.classList.toggle("header-nav");
        main.classList.toggle("main-nav");
        minimize.classList.toggle("minimize-nav");
        minimize.textContent = "Maximize";
    }

    minimize.addEventListener("click", () => {
        header.classList.toggle("header-nav");
        main.classList.toggle("main-nav");
        minimize.classList.toggle("minimize-nav");

        visible = !visible;
        if (visible) {
            minimize.textContent = "Minimize";
            document.cookie = "nav_state=1";
        } else {
            minimize.textContent = "Maximize";
            document.cookie = "nav_state=0";
        }
    });
});

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
