let outfit;
let testList;
let sessionEvents = document.getElementById("main");

function initializeOutfit(name) {
    name = encodeURIComponent(name.toLowerCase());
    let url = `outfit/?alias_lower=${name}&c:show=outfit_id,name,alias,member_count&c:join=outfit_member^list:1^inject_at:members^show:character_id(characters_online_status^on:character_id^inject_at:online^show:online_status,character^on:character_id^inject_at:name^show:name.first)&c:tree=start:members^list:1^field:online.online_status`;

    getJSON(url, (data) => {
        if (data.returned) {
            let onlineMembers = {};
            let rawOutfit = (data.outfit_list ?? {})[0] ?? {};
            let members = rawOutfit.members ?? {};
            
            // Nice coalescing operator, no more unexpected stuffs
            // Now we can trust the data.
            Object.keys(members).forEach((world) => {
                // online status is determined by world. 0 is offline.
                // 17 would be emerald.
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
                displayOnlineMembers(onlineMembers);
                startSession(onlineMembers);
            }
            // for testing purposes
            testList = onlineMembers;
        }
    });
}

function displayOnlineMembers(onlineMembers) {
    let resultsDiv = document.getElementById("results");

    let name = document.createElement("div");
    name.textContent = "outfit name";
    resultsDiv.appendChild(name);

    let onlineCount = document.createElement("div");
    onlineCount.textContent = `${Object.keys(onlineMembers).length}`;
    resultsDiv.appendChild(onlineCount);

    Object.entries(onlineMembers).forEach(([memberId, member]) => {
        let playerDiv = document.createElement("div");
        playerDiv.className = "player";
        playerDiv.textContent = `${member}`;
        resultsDiv.appendChild(playerDiv);
    });
}

function display(gameEvent) {
    let div = document.createElement("div");
    div.className = `event ${gameEvent.eventName}`;
    div.textContent = gameEvent.body;
    let sessionEvents = document.getElementById("session");
    sessionEvents.insertBefore(div, sessionEvents.childNodes[0]);
}

function startSession(onlineMembers) {
    let results = document.getElementById("results");
    let session = document.getElementById("session");
    results.classList.add("visible");
    session.classList.add("visible");
    let webSocket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=s:supafarma");
    webSocket.onopen = function() {
        let deathsCommand = {
            service: "event",
            action: "subscribe",
            characters: Object.keys(onlineMembers),
            // Revieve expierence id?
            // Ammo expierence id?
            eventNames: [
                "Death",
                // # is one of the expierence ids in /expierence 
                // Currently down, I can't extract the ids!
                // "GainExpierence_expierence_id_#"
                "GainExperience"
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
            } else {
                console.log(message);
            }
        };
    };
}
