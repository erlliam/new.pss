const loadoutList = {
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
};
let characterId;

async function getCharacter(name) {
    let url = `character/?name.first_lower=${encodeURIComponent(name.toLowerCase())}&c:show=character_id,name.first,faction_id,times.creation_date,times.minutes_played,battle_rank.value,prestige_level&c:join=faction^inject_at:faction^show:code_tag,characters_stat_history^list:1^terms:stat_name=kills%27stat_name=deaths^show:stat_name%27all_time^inject_at:stats,characters_online_status^show:online_status^inject_at:online&c:tree=start:stats^field:stat_name`;

    let response = await fetch(apiUrl + url)
    let json = await response.json();

    if (json.returned) {
        let rawChar = (json.character_list  ?? [])[0] ?? {};

        let character = {
            exists: true,
            name: (rawChar.name ?? {}).first ?? "N/A",
            character_id: rawChar.character_id ?? "N/A",
            faction: (rawChar.faction ?? {}).code_tag ?? "N/A",
            faction_id: rawChar.faction_id ?? "N/A",
            join_date: ((rawChar.times ?? {}).creation_date ?? "").split(" ")[0],
            time_played: (parseInt(((rawChar.times ?? {}).minutes_played ?? 0))/60)
                         .toFixed(1) + "h",
            level: (rawChar.battle_rank ?? {}).value ?? "N/A",
            prestige: rawChar.prestige_level ?? "N/A",
            "status": parseInt((rawChar.online ?? {}).online_status ?? 0)
                      ? "Online" :
                      "Offline",
            kills: ((rawChar.stats ?? {}).kills ?? {}).all_time ?? 0,
            deaths: ((rawChar.stats ?? {}).deaths ?? {}).all_time ?? 0,
        }
        character.kd = (character.kills/character.deaths).toFixed(1);

        characterId = character.character_id;
        return character;
    } else {
        return {exists: false};
    }
}

function updateSearchUI(character) {
    let results = document.getElementById("results");
    let session = document.getElementById("session");
    results.classList.add("visible");

    if (character.exists) {
        session.classList.add("visible");

        let children = results.children;
        for (let stat in character) {
            let child = children.namedItem(stat);
            if (child) {
                child.textContent += character[stat];
            }
        }
    } else {
        results.textContent = "character not found";
    }
}

function searchForCharacter(name) {
    getCharacter(name).then((character) => {
        updateSearchUI(character);
    });
}

const sessionButton = document.getElementById("session-button");
let sessionActive = false;

sessionButton.addEventListener("click", onSessionButtonClicked);

function onSessionButtonClicked() {
    if (sessionActive) {
        endSession();
    } else {
        startSession();
    }

    sessionActive = !sessionActive;
    updateSessionButtonUI();
}

function updateSessionButtonUI() {
    sessionButton.classList.toggle("session-on", sessionActive);
    sessionButton.textContent = sessionActive ? "End session" : "Start session";
}

function startSession() {
    session = {
        kills: 0,
        deaths: 0,
        timeContainer: new Date(0),
        timeElapsed: 0,
        timeInterval: handleTimeUI()
    };
    
    let webSocket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=s:supafarma")

    webSocket.onopen = () => {
        let deathsCommand = {
            service: "event",
            action: "subscribe",
            characters: [characterId],
            eventNames: ["Death"]
        };
        webSocket.send(JSON.stringify(deathsCommand));
    };

    webSocket.onmessage = (message) => {
        message = JSON.parse(message.data);
        if (message.hasOwnProperty("payload")) {
            onKillEvent(message.payload);
        }
    };

    session.webSocket = webSocket;
}

function endSession() {
    session.webSocket.close();
    clearInterval(session.timeInterval);
}

function onKillEvent(payload) {
            console.log("test");
    getKillData(payload).then((killData) => {
        updateSessionUI(killData);
    });
}

let timeElement = document.getElementById("session-time");
let kpmElement = document.getElementById("session-kpm");

function handleTimeUI() {
    // is  this bad code?
    return setInterval(() => {
        session.timeElapsed += 1000;
        session.timeContainer.setTime(session.timeElapsed);

        let timeString = session.timeContainer.toUTCString().split(" ")[4];
        let minutesElapsed = session.timeContainer.getTime() / 1000 / 60;

        let kpm = (session.kills / minutesElapsed).toFixed(1);
        
        timeElement.textContent = `Time: ${timeString}`;
        kpmElement.textContent = `KPM: ${kpm}`;

    }, 1000);
}

async function getKillData(payload) {
    let eventResult, enemyCharacterId, enemyLoadoutId;
    if (payload.attacker_character_id == characterId) {
        enemyCharacterId = payload.character_id;
        enemyLoadoutId = payload.character_loadout_id;
        eventResult = "kill"
        session.kills += 1
    } else {
        enemyCharacterId = payload.attacker_character_id;
        enemyLoadoutId = payload.attacker_loadout_id;
        eventResult = "death"
        session.deaths += 1
    }

    let enemyUrl = apiUrl + `character/?character_id=${enemyCharacterId}&c:show=character_id,name.first,battle_rank.value,prestige_level&c:join=characters_stat_history^list:1^terms:stat_name=kills'stat_name=deaths^show:stat_name'all_time^inject_at:stats&c:tree=start:stats^field:stat_name`;
    let weaponUrl = apiUrl + `item/?item_id=${payload.attacker_weapon_id}&c:show=name.en`;

    // Potentially use Promise.all() here?
    let enemy = await fetch(enemyUrl);
    let weapon = await fetch(weaponUrl);

    let enemyJson = await enemy.json();
    let weaponJson = await weapon.json();

    let enemyData = (enemyJson.character_list ?? [])[0] ?? {};
    let kills = ((enemyData.stats ?? {}).kills ?? {}).all_time ?? 0;
    let deaths = ((enemyData.stats ?? {}).deaths ?? {}).all_time ?? 0;

    let weaponData = (weaponJson.item_list ?? [])[0] ?? {};

    // potentially use a list if we aren't going to format using key name
    let killData = {
        eventResult: eventResult,
        name: (enemyData.name ?? {}).first ?? "N/A",
        level: (enemyData.battle_rank ?? {}).value ?? "N/A",
        prestige: enemyData.prestige_level ?? "N/A",
        kd: (kills / deaths).toFixed(1),
        loadout: loadoutList[enemyLoadoutId].substring(0,
                 loadoutList[enemyLoadoutId].indexOf(" ")),
        faction: loadoutList[enemyLoadoutId].substring(
                 loadoutList[enemyLoadoutId].indexOf(" ") + 1),
        weaponName: (weaponData.name ?? {}).en ?? "N/A"
    }
    
    console.log(killData);

    return killData
}

const kdElement = document.getElementById("session-kd");
const sessionEvents = document.getElementById("session-events");

function updateSessionUI(killData) {
    let div = document.createElement("div");
    div.className = `${killData.eventResult} event`;
    div.textContent = Object.values(killData).join(", ");

    sessionEvents.insertBefore(div, sessionEvents.childNodes[0]);

    let kd = (session.kills
              / session.deaths === 0 ? 1 : session.deaths).toFixed(1);

    kdElement.textContent = `Kills: ${session.kills},
                             Deaths: ${session.deaths}, KD: ${kd}`;
}
