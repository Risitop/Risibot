BattleTiers = {
	"PU": 0,
	"NU": 1,
	"RU": 2,
	"UU": 3,
	"OU": 4,
	"Uber": 5,
	"AG": 6
}

getRoom = function() {
	url = window.location.href;
	while (url[0] != 'b') {
		url = url.slice(1);
	}
	return app.rooms[url];
};

getMaxIndex = function(tab) {
	iM = 0;
	for (i = 1; i < tab.length; i++) {
		if (tab[i] > tab[iM])
			iM = i;
	}
	return iM;
};

normalizeString = function(str) {
	newStr = "";
	for (var i = 0; i < str.length; i++) {
		if (str[i] != '-' && str[i] != "'" && str[i] != "." && str[i] != " ")
			newStr += str[i];
	}
	return newStr.toLowerCase()
}

getTop20Walls = function(tier) { // getTop20Walls("UU", "def")
	var top20 = [];
	for (var k = 0; k < 20; k++)
		top20.push([0, 0]);

	for (p in exports.BattlePokedex) {
		
		if (p == "missingno") {
			return top20;
		}
		
		pokemon = exports.BattlePokedex[p];
		
		value = getPotentialWall(pokemon);
		for (var i = 0; i < 20; i++) {
			if (isAllowedIn(pokemon, tier) && top20[i][1] < value) {
				top20.splice(i, 0, [p, value]);
				top20 = top20.slice(0, -1);
				break;
			}			
		}
	}
}

isAllowedIn = function (pokemon, tier) {
	return BattleTiers[pokemon.tier] <= BattleTiers[tier];
}

String.prototype.replaceAt = function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}

getStatValue = function(stat, nature, base, iv, ev, lvl) {
	v = iv + 2 * base + Math.floor(ev / 4);
	v *= lvl / 100 + 5;
	v = Math.floor(v);
	if (BattleNatures[nature][plus] == stat)
		v *= 1.1;
	else if (BattleNatures[nature][minus] == stat)
		v *= 0.9;
	
	return Math.floor(v);
}


countTab = function(t, e) {
    var n = 0;
    for (var i = 0; i < t.length; i++) {
        n += (t[i] == e) ? 1 : 0;
    }
    return n;
};
