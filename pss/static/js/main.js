document.addEventListener("DOMContentLoaded", function(event) {
    let minimize = document.getElementById("nav-min");
    minimize.addEventListener("click", minimizeNav);
});

let visible = true;

function minimizeNav() {
    let minimize = document.getElementById("nav-min");
    let header = document.getElementById("header");
    let main = document.getElementById("main");

    if (visible) {
        header.style.width = "0px";
        header.style.padding = "0px";
        main.style.marginLeft = "0px";
        minimize.style.position = "fixed";
        minimize.style.marginLeft = "30px";
        minimize.innerHTML = "Maximize";
        visible = false;
    } else {
        header.style.width = "200px";
        header.style.padding = "0 20px 20px 20px";
        main.style.marginLeft = "240px";
        minimize.style.position = "static";
        minimize.style.marginLeft = "auto";
        minimize.innerHTML = "Minimize";
        visible = true;
    }
}
