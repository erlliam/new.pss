let character;
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
};
// Script in body executed by flask templates
let sessionEvents = document.getElementById("session-events");
let sessionButton = document.getElementById("session-button");
let timeElement = document.getElementById("session-time");
let kdElement = document.getElementById("session-kd");
let kpmElement = document.getElementById("session-kpm");
let session = false;
let sessionKills;
let sessionDeaths;
let timeElapsed;
let timeInterval;
let timeContainer;
let webSocket;

sessionButton.addEventListener("click", () => {
    session = !session;
    sessionButton.classList.toggle("session-on", session);
    sessionButton.textContent = session ? "End session" : "Start session";

    if (session) {
        startSession();
    } else {
        endSession();
    }
});

function initializeCharacter(name) {
    name = encodeURIComponent(name.toLowerCase());
    let url = `character/?name.first_lower=${name}&c:show=character_id,name.first,faction_id,times.creation_date,times.minutes_played,battle_rank.value,prestige_level&c:join=faction^inject_at:faction^show:code_tag,characters_stat_history^list:1^terms:stat_name=kills%27stat_name=deaths^show:stat_name%27all_time^inject_at:stats,characters_online_status^show:online_status^inject_at:online&c:tree=start:stats^field:stat_name`;
    getJSON(url, (data) => {
        if (data.returned) {
            let rawChar = (data.character_list ?? [])[0] ?? {};
            character = {
                exists: true,
                name: (rawChar.name ?? {}).first ?? "N/A",
                character_id: rawChar.character_id ?? "N/A",
                faction: (rawChar.faction ?? {}).code_tag ?? "N/A",
                faction_id: rawChar.faction_id ?? "N/A",
                // 2014-06-13 09:36:33.0 -> 2014-06-13
                join_date: ((rawChar.times ?? {}).creation_date ?? "").split(" ")[0],
                // Parse string
                time_played: (parseInt(((rawChar.times ?? {}).minutes_played ?? 0))/60)
                             .toFixed(1) + "h",
                level: (rawChar.battle_rank ?? {}).value ?? "N/A",
                prestige: rawChar.prestige_level ?? "N/A",
                "status": parseInt((rawChar.online ?? {}).online_status ?? 0)
                          ? "Online" :
                          "Offline",
                kills: ((rawChar.stats ?? {}).kills ?? {}).all_time ?? 0,
                deaths: ((rawChar.stats ?? {}).deaths ?? {}).all_time ?? 0,
                sessKills: 0,
                sessDeaths: 0

            };
            character.kd = (character.kills/character.deaths).toFixed(1);
            populateResultsDiv();
        } else {
            let request = new Request("/flash");
            let body = {
                message: "User was not found. Check the name."
            };

            fetch(request, {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify(body)
            })
            // .then() Handle error??
        }
    });

}

function populateResultsDiv() {
    let results = document.getElementById("results");
    let session = document.getElementById("session");
    results.classList.add("visible");
    session.classList.add("visible");
    let children = results.children;

    // character has more keys than results has children, is this ineffecient?
    for (let stat in character) {
        let child = children.namedItem(stat);
        if (child) {
            child.textContent += character[stat];
        }
    }
}

function startSession() {
    timeContainer = new Date(0);
    timeElapsed = 0;
    sessionKills = 0;
    sessionDeaths = 0;

    timeElement.textContent = "Time: 00:00:00";
    kpmElement.textContent = "KPM: 0.0";

    timeInterval = setInterval(() => {
        timeElapsed += 1000;
        timeContainer.setTime(timeElapsed);
        displayTime();

    }, 1000);

    webSocket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=s:supafarma");

    webSocket.onopen = () => {
        let deathsCommand = {
            service: "event",
            action: "subscribe",
            characters: [character.character_id],
            eventNames: ["Death"]
        };

        webSocket.send(JSON.stringify(deathsCommand));

        webSocket.onmessage = (message) => {
            message = JSON.parse(message.data);
            if (message.hasOwnProperty("payload")) {
                handleKillData(message.payload);
            }
        };
    };
}

function displayTime(sessionTime) {
    let timeString = timeContainer.toUTCString().split(" ")[4]
    timeElement.textContent = `Time: ${timeString}`;

    let minutesElapsed = timeContainer.getTime()/1000/60;
    let kpm = (sessionKills/minutesElapsed).toFixed(1);;
    kpmElement.textContent = `KPM: ${kpm}`;
}

function endSession() {
    webSocket.close();
    clearInterval(timeInterval);
}

function handleKillData(payload) {
    let eventResult, enemyCharacterId, enemyLoadoutId;

    if (payload.attacker_character_id == character.character_id) {
        eventResult = "kill";
        sessionKills += 1;

        enemyCharacterId = payload.character_id;
        enemyLoadoutId = payload.character_loadout_id;
    } else {
        eventResult = "death";
        sessionDeaths += 1;

        enemyCharacterId = payload.attacker_character_id;
        enemyLoadoutId = payload.attacker_loadout_id;
    }

    let enemyCharacterUrl = `character/?character_id=${enemyCharacterId}&c:show=character_id,name.first,battle_rank.value,prestige_level&c:join=characters_stat_history^list:1^terms:stat_name=kills'stat_name=deaths^show:stat_name'all_time^inject_at:stats&c:tree=start:stats^field:stat_name`;
    let weapUrl = `item/?item_id=${payload.attacker_weapon_id}&c:show=name.en`;

    let killData = {
        eventResult: eventResult,
        loadout: loadoutList[enemyLoadoutId]
    };

    // TODO Convert these things to check is the object exists properly..
    getJSON(enemyCharacterUrl, (data) => {
        // returned can be 0 or > 0 
        // perhaps we don't care what returned is, as we already handle the data not existing.
        if (data.returned) {
            let rawChar = (data.character_list ?? [])[0] ?? {};
            let kills = ((rawChar.stats ?? {}).kills ?? {}).all_time ?? 0;
            let deaths = ((rawChar.stats ?? {}).deaths ?? {}).all_time ?? 0;
            killData.name = (rawChar.name ?? {}).first ?? "N/A";
            killData.level = (rawChar.battle_rank ?? {}).value ?? "N/A";
            killData.prestige = rawChar.prestige_level ?? "N/A";
            killData.kd = (kills/deaths).toFixed(1);
        }
        getJSON(weapUrl, (data) => {
            if (data.returned) {
                let rawWeapon = (data.item_list ?? [])[0] ?? {};
                killData.weapName = (rawWeapon.name ?? {}).en ?? "N/A";
                displayKillData(killData);
            } else {
                killData.weapName = "API Problems";
                displayKillData(killData);
            }
        });
    });
}

function displayKillData(killData) {
    let div = document.createElement("div");
    div.className = `${killData.eventResult} event`;
    let killDataString = 
    div.textContent = Object.values(killData).join(", ");

    sessionEvents.insertBefore(div, sessionEvents.childNodes[0]);

    let kd = (sessionKills/sessionDeaths).toFixed(1);
    kd = isFinite(kd) ? kd : sessionKills;

    kdElement.textContent = `Kills: ${sessionKills},
                             Deaths:${sessionDeaths}, KD: ${kd}`;
}
