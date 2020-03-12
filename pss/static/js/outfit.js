let outfit;

function initializeOutfit(name) {
    name = encodeURIComponent(name.toLowerCase());
    let url = `outfit/?alias_lower=${name}&c:show=outfit_id,name,alias,member_count&c:join=outfit_member^list:1^inject_at:members^show:character_id(characters_online_status^on:character_id^inject_at:online^show:online_status,character^on:character_id^inject_at:name^show:name.first)&c:tree=start:members^list:1^field:online.online_status`;

    getJSON(url, (data) => {
        if (data.returned) {
            let rawOutfit = (data.outfit_list ?? [])[0]
            let onlineMembers = {};
            let members = rawOutfit.members ?? {};
            
            // Nice coalescing operator, no more unexpected stuffs
            // Now we can trust the data.
            Object.keys(members).forEach((world) => {
                if (world != 0) {
                    let onlineMembersRaw = members[world] ?? {};
                    onlineMembersRaw.forEach((member) => {
                        let memberId = member.character_id ?? "N/A";
                        let memberName = ((member.name ?? {}).name ?? {}).first ?? "N/A";
                        onlineMembers[memberId] = memberName;
                    });
                }
            });
            trackAllPlayers(onlineMembers);
        }
    });
}

function trackAllPlayers(onlineMembers) {
    console.log(onlineMembers);

}

function startSession(onlineMembers) {
    let webSocket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=s:supafarma");
    webSocket.onopen = function() {
        let deathsCommand = {
            service: "event",
            action: "subscribe",
            characters: Object.keys(onlineMembers),
            eventNames: ["Death"]
        };
        console.log(Object.keys(onlineMembers));
        console.log(deathsCommand);

        webSocket.send(JSON.stringify(deathsCommand));

        webSocket.onmessage = function(message) {
            message = JSON.parse(message.data);
            if (message.hasOwnProperty("payload")) {
                console.log("JUICE");
            } else {
                console.log(message);
            }
        };
    };
}
