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

let character = {};

function searchCharacter(name) {
    let url = `http://census.daybreakgames.com/s:supafarma/get/ps2/character/?name.first_lower=${name.toLowerCase()}&c:show=character_id,name.first,faction_id,times.creation_date,times.minutes_played,battle_rank.value,prestige_level&c:join=faction^inject_at:faction^show:code_tag,characters_stat_history^list:1^terms:stat_name=kills%27stat_name=deaths^show:stat_name%27all_time^inject_at:stats,characters_online_status^show:online_status^inject_at:online&c:tree=start:stats^field:stat_name`

    let request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            let response = JSON.parse(request.response);
            if (response.returned) {
                response = response.character_list[0]; // 
                character = {
                    name: response.name.first,
                    character_id: response.character_id,
                    faction: response.faction.code_tag,
                    faction_id: response.faction_id,
                    join_date: response.times.creation_date,
                    time_played: response.times.minutes_played,
                    level: response.battle_rank.value,
                    prestige: response.prestige_level,
                    "status": response.online.online_status,
                };

                try {
                    character.kills = response.stats.kills.all_time;
                    character.deaths = response.stats.deaths.all_time;
                    character.kd = character.kills/character.deaths;
                } catch(e) {
                    if (e instanceof TypeError) {
                        character.kills = "N/A";
                        character.deaths = "N/A";
                        character.kd = "N/A";
                    }
                }
            }
            // Callback to set insert values;
        }
    }
    request.open("GET", url);
    request.send(null);
}
// GET NAME, BATTLERANK, KD, FACTION, HEADSHOT, WEAPON, CLASSES
function sessionDataGatherer(payload) {
    console.log('o');

    if (payload.attacker_character_id == character.character_id) { // kill
        console.log({
            attacker: {
                name: character.name,
                level: character.level,
                kd: character.kd,
                faction: character.faction
            },
            victim: {
                name: 'find'
            }
        });
    }
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
                sessionDataGatherer(message.payload);
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
