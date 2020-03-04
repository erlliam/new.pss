document.addEventListener("DOMContentLoaded", function(event) {
    let minimize = document.getElementById("nav-min");
    minimize.addEventListener("click", navLogic);
    let sessionButton = document.getElementById("session-button");
    sessionButton.addEventListener("click", characterSession);
});

let visible = true;

function navLogic() {
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

function characterIdToName(characterId) {
    console.log('1');
    xhttp = new XMLHttpRequest();
    xhttp.open("GET",
    `http://census.daybreakgames.com/s:supafarma/get/ps2/character/?character_id=${characterId}&c:show=name.first,faction_id,battle_rank.value`);
    xhttp.send();
    xhttp.onload = function() {
        let characterObject = JSON.parse(xhttp.response);
        characterObject.character_list

        console.log(characterObject);
    }
}

characterIdToName('5428013610465154849');


function characterSession() {
    let webSocket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=s:supafarma");
    webSocket.onopen = function(event) {
        let characterId = 1
        let killsCommand = {
            service: "event",
            action: "subscribe",
            characters: [characterId.toString()],
            eventNames: ["Death"]
        };
        let allDeathsEmerald = {
            "service": "event",
            "action": "subscribe",
            "characters": ["all"],
            "eventNames": ["Death"],
            "worlds": ["17"],
            "logicalAndCharactersWithWorlds": true
        };
        let reviveCommand = {
            service: "event",
            action: "subscribe",
            characters: [characterId.toString()],
            eventNames: ["GainExpierence_expierence_id_4"] /* find expierence
            id for revives/ammo/etc/cool stuff
            */
        };
        webSocket.send(JSON.stringify(allDeathsEmerald));

        webSocket.onmessage = function(message) {
            message = JSON.parse(message.data)
            if (message.hasOwnProperty("payload")) {
                console.log(message.payload);
            }
        }
        /*
        {"payload": {
            "attacker_character_id":"5428873824227609601",
            "attacker_fire_mode_id":"664",
            "attacker_loadout_id":"17",
            "attacker_vehicle_id":"0",
            "attacker_weapon_id":"432",
            "character_id":"5428920856031044721","character_loadout_id":"6",
            "event_name":"Death",
            "is_headshot":"0",
            "timestamp":"1583291265",
            "world_id":"17",
            "zone_id":"4"},
            "service":"event",
            "type":"serviceMessage"
        }
        */
    }
}
