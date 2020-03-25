let outfit;
let onlineMembers;
let testList;

let sessionButton = document.getElementById("session-button");
let outfitInfo = document.getElementById("outfit-info");
let outfitPlayers = document.getElementById("outfit-players");
let sessionEvents = document.getElementById("session-events");
let session = false;

let webSocket;

sessionButton.addEventListener("click", () => {
    session = !session;
    sessionButton.classList.toggle("session-on", session);
    sessionButton.textContent = session ? "End session" : "Start session";

    if (session) {
        startSession(onlineMembers);
    } else {
        endSession(onlineMembers);
    }
});

function initializeOutfit(name) {
    name = encodeURIComponent(name.toLowerCase());
    let url = `outfit/?alias_lower=${name}&c:show=outfit_id,name,alias,member_count&c:join=outfit_member^list:1^inject_at:members^show:character_id(characters_online_status^on:character_id^inject_at:online^show:online_status,character^on:character_id^inject_at:name^show:name.first)&c:tree=start:members^list:1^field:online.online_status`;

    getJSON(url, (data) => {
        if (data.returned) {
            onlineMembers = {};
            let rawOutfit = (data.outfit_list ?? {})[0] ?? {};
            let outfitName = rawOutfit.name ?? "Name not found";
            let members = rawOutfit.members ?? {};

            Object.keys(members).forEach((world) => {
                if (world != 0) {
                    let onlineMembersRaw = members[world] ?? [];
                    onlineMembersRaw.forEach((member) => {
                        let memberId = member.character_id ?? "N/A";
                        let memberName = ((member.name ?? {}).name ?? {}).first ?? "N/A";
                        onlineMembers[memberId] = memberName;
                    });
                }
            });
            if (Object.keys(onlineMembers).length >= 2) {
                displayOnlineMembers(outfitName, onlineMembers);
            }
        }
    });
}

function displayOnlineMembers(outfitName, onlineMembers) {
    let results = document.getElementById("results");
    let session = document.getElementById("session");
    results.classList.add("visible");
    session.classList.add("visible");

    let name = document.createElement("div");
    name.className = "outfit-name";
    name.textContent = outfitName;

    let onlineCount = document.createElement("div");
    onlineCount.className = "online-count";
    onlineCount.textContent = `Players Online: ${Object.keys(onlineMembers).length}`;

    outfitInfo.appendChild(name);
    outfitInfo.appendChild(onlineCount);

    Object.entries(onlineMembers).forEach(([memberId, member]) => {
        let playerDiv = document.createElement("div");
        playerDiv.className = "player";
        playerDiv.textContent = `${member}`;
        outfitPlayers.appendChild(playerDiv);
    });
}

function display(gameEvent) {
    let div = document.createElement("div");
    div.className = `event ${gameEvent.eventName}`;
    div.textContent = gameEvent.body;
    sessionEvents.insertBefore(div, sessionEvents.childNodes[0]);
}

function startSession() {
    webSocket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=s:supafarma");
    webSocket.onopen = function() {
        let deathsCommand = {
            service: "event",
            action: "subscribe",
            characters: Object.keys(onlineMembers),
            eventNames: [
                "Death"
                // "GainExpierence_expierence_id_#" can't use the api to get
                // revive or ammo id... what can I do
            ]
        };

        webSocket.send(JSON.stringify(deathsCommand));

        webSocket.onmessage = function(message) {
            message = JSON.parse(message.data);
            if (message.hasOwnProperty("payload")) {
                let eventName = message.payload.event_name;
                if (eventName == "Death") {
                    // attacker might be a string, and we need to use interger
                    // to check for hasOwnProperty()
                    let attacker = message.payload.attacker_character_id;
                    let victim = message.payload.character_id
                    if (onlineMembers.hasOwnProperty(attacker)) {
                        display({
                            eventName: "kill",
                            body: `${onlineMembers[attacker]} got a kill.`
                        });
                    } else {
                        display({
                            eventName: "death",
                            body: `${onlineMembers[victim]} was killed.`
                        });
                    }
                } else if (eventName == "GainExperience") {
                    let characterId = message.payload.character_id;
                    let otherId = message.payload.other_id;
                    let expId = message.payload.expierence_id;
                    if (onlineMembers.hasOwnProperty(characterId)) {
                        if (expId == "12") {
                            display({
                                eventName: "revive",
                                body: `${onlineMembers[characterId]} revived a player`
                            });
                        }
                    }
                }
            }
        };
    };
}

function endSession() {
    webSocket.close();
}
