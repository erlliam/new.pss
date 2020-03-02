import urllib.request
import json

service_id = 'supafarma'
base_url = f'http://census.daybreakgames.com/s:{service_id}/get/ps2:v2/'
get_all_url = """character/?name.first_lower={}&c:show=character_id,name.first,faction_id,times.creation_date,times.minutes_played,battle_rank.value,prestige_level&c:join=faction^inject_at:faction^show:code_tag,characters_stat_history^list:1^terms:stat_name=kills'stat_name=deaths^show:stat_name'all_time^inject_at:stats,characters_online_status^show:online_status^inject_at:online&c:tree=start:stats^field:stat_name"""


class Character():
    def __init__(self, char_id, name, faction_id, faction, join_date,
                 time_played, level, prestige, status, kills, deaths):
        self.char_id = char_id
        self.name = name
        self.faction_id = faction_id
        self.faction = faction
        self.join_date = join_date
        self.time_played = time_played
        self.level = level
        self.prestige = prestige
        self.status = status
        self.kills = kills
        self.deaths = deaths
        self.kd_ratio = int(kills)/int(deaths)
        print(self.kd_ratio)


def get_character(name):
    result = urllib.request.urlopen(base_url+get_all_url.format(name))
    result = json.load(result)
    result_found = result.get('returned')

    if result_found:
        result = result['character_list'][0]

        char_id = result.get('character_id')
        name = result.get('name').get('first')
        faction_id = result.get('faction_id')
        faction = result.get('faction').get('code_tag')
        join_date = result.get('times').get('creation_date')
        time_played = result.get('times').get('minutes_played')
        level = result.get('battle_rank').get('value')
        prestige = result.get('prestige_level')
        status = result.get('online').get('online_status')
        kills = result.get('stats').get('kills').get('all_time')
        deaths = result.get('stats').get('deaths').get('all_time')

        return Character(char_id, name, faction_id, faction, join_date,
                         time_played, level, prestige, status, kills, deaths)
    return False
