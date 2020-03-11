document.addEventListener("DOMContentLoaded", () => {
    let allCookies = Object.fromEntries(document.cookie.split(";").map((entry) => { // strager big brain
        let [key, value] = entry.split("=", 2);
        if (value === undefined) { // no cookies, value will be undefined
                                   // cant use trim on undefined
            value = "";
        }
        return [key.trim(), value.trim()];
    }));
    let visible;
    if ("nav_state" in allCookies) {
        visible = 
        visible = (parseInt(allCookies.nav_state)) ?
        true :
        false;
    } else {
        document.cookie = "nav_state=1";
        visible = true;
    }

    let header = document.getElementById("header");
    let main = document.getElementById("main");
    let minimize = document.getElementById("nav-min");
    let sessionButton = document.getElementById("session-button");

    if (!visible) { // initialize navbar incase cookie says not visible
        header.classList.toggle("header-nav");
        main.classList.toggle("main-nav");
        minimize.classList.toggle("minimize-nav");
        minimize.textContent = "Maximize";
    }

    minimize.addEventListener("click", () => {
        header.classList.toggle("header-nav");
        main.classList.toggle("main-nav");
        minimize.classList.toggle("minimize-nav");

        visible = !visible; // Only works if visible is true at start
        if (visible) {
            minimize.textContent = "Minimize";
            document.cookie = "nav_state=1";
        } else {
            minimize.textContent = "Maximize";
            document.cookie = "nav_state=0";
        }
    });

    sessionButton.addEventListener("click", () => {
        startSession();
    });
});

let baseUrl = "http://census.daybreakgames.com";
let apiUrl = baseUrl + "/s:supafarma/get/ps2/";


function getJSON(url, callback) {
    let request = new Request(apiUrl + url);
    fetch(request)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            callback(data);
        }).catch((error) => {
            console.log(error);
        });
}

let character = {
};

function initializeCharacter(name) {
    name = encodeURIComponent(name.toLowerCase());
    let url = `character/?name.first_lower=${name}&c:show=character_id,name.first,faction_id,times.creation_date,times.minutes_played,battle_rank.value,prestige_level&c:join=faction^inject_at:faction^show:code_tag,characters_stat_history^list:1^terms:stat_name=kills%27stat_name=deaths^show:stat_name%27all_time^inject_at:stats,characters_online_status^show:online_status^inject_at:online&c:tree=start:stats^field:stat_name`;
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
                // 2014-06-13 09:36:33.0 -> 2014-06-13
                join_date: (rawCharacter.times.creation_date).split(" ")[0],
                time_played:
                    (rawCharacter.times.minutes_played/60).toFixed(1) + "h",
                level: rawCharacter.battle_rank.value,
                prestige: rawCharacter.prestige_level,
                "status": (parseInt(rawCharacter.online.online_status) ?
                "Online" :
                "Offline"),
                sess_kills: 0,
                sess_deaths: 0
            };

            try {
                character.kills = rawCharacter.stats.kills.all_time;
                character.deaths = rawCharacter.stats.deaths.all_time;
                character.kd = (character.kills/character.deaths).toFixed(1);
            } catch(error) {
                if (error instanceof TypeError) {
                    character.kills = "N/A";
                    character.deaths = "N/A";
                    character.kd = "N/A";
                }
            }

            populateResultsDiv();
        } else {
            console.log("Not found, handle this..");
        }
    });

}


function populateResultsDiv() {
    let results = document.getElementById("results");
    results.style.display = "block";
    let session = document.getElementById("session");
    session.style.display = "block";
    let children = results.children;


    for (let stat in character) { // char has more keys than results has children, ineffecient?
        let child = children.namedItem(stat);
        if (child) {
            child.textContent += character[stat];
        }
    }
}

// GET NAME, BATTLERANK, KD, HEADSHOT, WEAPON, CLASSES combined w fac
let loadoutList = {
    "1": "NC Infiltrator",
    "3": "NC Light Assault",
    "4": "NC Medic",
    "5": "NC Engineer",
    "6": "NC Heavy Assault",
    "7": "NC MAX",
    "8": "TR Infiltrator",
    "10": "TR Light Assault",
    "11": "TR Medic",
    "12": "TR Engineer",
    "13": "TR Heavy Assault",
    "14": "TR MAX",
    "15": "VS Infiltrator",
    "17": "VS Light Assault",
    "18": "VS Medic",
    "19": "VS Engineer",
    "20": "VS Heavy Assault",
    "21": "VS MAX"
}

function displayKillData(killData) {
/*
killData = {
    br: "44"
    eventResult: "death"
    kd: 0.6921100917431192
    loadout: "VS Engineer"
    name: "Refdanon"
    prestige: "0"
    weapImgUrl: "/files/ps2/images/static/89158.png"
    weapName: "VE-LR Obelisk"
}
*/
    let session = document.getElementById("session-events");
    let div = document.createElement("div");
    div.className = killData.eventResult
    div.textContent = Object.values(killData).join(", ");

    session.insertBefore(div, session.childNodes[0]);
    
    console.log(`Kills: ${character.sess_kills}, Deaths:${character.sess_deaths}`);
    console.log(killData);
}

function handleKillData(payload) {
    let eventResult;
    let enemyCharacterId;
    let enemyLoadoutId;
    let weaponId = payload.attacker_weapon_id
    if (payload.attacker_character_id == character.character_id) {
        enemyCharacterId = payload.character_id;
        enemyLoadoutId = payload.character_loadout_id;
        eventResult = "kill";
        character.sess_kills += 1;
    } else {
        enemyCharacterId = payload.attacker_character_id;
        enemyLoadoutId = payload.attacker_loadout_id;
        eventResult = "death";
        character.sess_deaths += 1;
    }

    let characterUrl = `character/?character_id=${enemyCharacterId}&c:show=character_id,name.first,battle_rank.value,prestige_level&c:join=characters_stat_history^list:1^terms:stat_name=kills'stat_name=deaths^show:stat_name'all_time^inject_at:stats&c:tree=start:stats^field:stat_name`;
    let weapUrl = `item/?item_id=${payload.attacker_weapon_id}&c:show=name.en,image_path`;

    let killData = {
        eventResult: eventResult, // killed or got killedb
        loadout: loadoutList[enemyLoadoutId]
    };

    getJSON(characterUrl, function(data) {
        if (data.returned) {
            let rawChar = data.character_list[0];
            killData.name = rawChar.name.first;
            killData.br = rawChar.battle_rank.value;
            killData.prestige = rawChar.prestige_level;
            killData.kd = (rawChar.stats.kills.all_time/rawChar.stats.deaths.all_time).toFixed(1);
        }
        getJSON(weapUrl, function(data) {
            if (data.returned) {
                let rawWeapon = data.item_list[0];
                killData.weapName = rawWeapon.name.en;
                killData.weapImgUrl = baseUrl+rawWeapon.image_path;
                displayKillData(killData);
            }
        });
    });
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
                handleKillData(message.payload); // um, make data appear on session div
            } else {
                console.log("run");
            }
        }
    }
}
