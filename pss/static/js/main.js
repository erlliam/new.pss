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

    header.classList.toggle("header-nav");
    main.classList.toggle("main-nav");
    minimize.classList.toggle("minimize-nav");
    visible = !visible; // Big brain by strager
    if (visible) {
        minimize.innerHTML = "Minimize";
    } else {
        minimize.innerHTML = "Maximize";
    }
}

let apiUrl = "http://census.daybreakgames.com/s:supafarma/get/ps2/";


function getJSON(url, callback) {
/* OLD CODE
    let request = new XMLHttpRequest();
    request.open("GET", url);
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback(request);
        }
    };
    request.send();
*/
    let request = new Request(apiUrl + url);

    fetch(request)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            callback(data); // return json, only way I know how is callback function
        });

}


let character = { // I reuse the data in here throughout the app so I declare it here
};


function initializeCharacter(name) {
    let url = `character/?name.first_lower=${encodeURIComponent(name.toLowerCase())}&c:show=character_id,name.first,faction_id,times.creation_date,times.minutes_played,battle_rank.value,prestige_level&c:join=faction^inject_at:faction^show:code_tag,characters_stat_history^list:1^terms:stat_name=kills%27stat_name=deaths^show:stat_name%27all_time^inject_at:stats,characters_online_status^show:online_status^inject_at:online&c:tree=start:stats^field:stat_name`
    // let data = getJSON(url); is this ever possible with asynchronous programming
    getJSON(url, function(data) { // wish I could just retrieve the json without a function here
        if (data.returned) {
            let rawCharacter = data.character_list[0];
            character = {
                exists: true,
                name: rawCharacter.name.first,
                character_id: rawCharacter.character_id,
                faction: rawCharacter.faction.code_tag,
                faction_id: rawCharacter.faction_id,
                join_date: rawCharacter.times.creation_date,
                time_played: rawCharacter.times.minutes_played,
                level: rawCharacter.battle_rank.value,
                prestige: rawCharacter.prestige_level,
                "status": (parseInt(rawCharacter.online.online_status) ? "Online" : "Offline"),
            };

            try {
                character.kills = rawCharacter.stats.kills.all_time;
                character.deaths = rawCharacter.stats.deaths.all_time;
                character.kd = character.kills/character.deaths;
            } catch(error) {
                if (error instanceof TypeError) {
                    character.kills = "N/A";
                    character.deaths = "N/A";
                    character.kd = "N/A";
                }
            }
        }
        populateResultsDiv();
    });
}


function populateResultsDiv() {
    let results = document.getElementById("results");
    let children = results.children;

    for (let stat in character) { // char has more keys than results has children, ineffecient?
        let child = children.namedItem(stat);
        if (child) {
            child.innerHTML += character[stat];
        }
    }
}

// GET NAME, BATTLERANK, KD, FACTION, HEADSHOT, WEAPON, CLASSES

function gatherKillData(payload) {
    return
}

function makeKillElement(attacker, victim) {
    // ooooo
}

function startSession() {
    let webSocket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=s:supafarma");

    webSocket.onopen = function() {
        let deathsCommand = {
            service: "event",
            action: "subscribe",
            characters: [character.character_id],
            eventNames: ["Death"]
        }

        webSocket.send(JSON.stringify(deathsCommand));

        webSocket.onmessage = function(message) {
            message = JSON.parse(message.data);
            if (message.hasOwnProperty("payload")) {
                gatherKillData(message.payload);
            } else {
                console.log(message);
            }
        }
    }
}


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
            message = JSON.parse(message.data);
            if (message.hasOwnProperty("payload")) {
                message = message.payload;
                let attacker = message.attacker_character_id;
                let died = message.character_id;
                console.log(attacker, died);
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
