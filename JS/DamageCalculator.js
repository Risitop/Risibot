PokeyI.prototype.getMaxDamageTaken = function(pokemon) {
	// Returns [avg1, avg2, avg3, avg4, dmgTaken]
	// where avgi is the average percentage dealt to the ennemy by our i-th move.
	// and dmgTaken is the maximum damage dealt to our pokemon by the ennemy's one.

	var name = checkExeptions(pokemon.species);
	var setName;
	for (setName in setdex[name])
		if (setName)
			break;

	setName = name + " (" + setName + ")";//Formats the set's name
	var myPkm = new PokemonCalc(setName);//Create a formatted pokemon for the damage calculator
	if (!myPkm)
		return [-1, -1];
	
	//Updates the stats with those of our pokemon
	myPkm.maxHP = pokemon.maxhp;
	myPkm.curHP = pokemon.hp;
	myPkm.rawStats.at = pokemon.stats.atk;
	myPkm.rawStats.df = pokemon.stats.def;
	myPkm.rawStats.sa = pokemon.stats.spa;
	myPkm.rawStats.sd = pokemon.stats.spd;
	myPkm.rawStats.sp = pokemon.stats.spe;

	myPkm.status = statusConvert(pokemon.stats.spe);//Formats the status
	myPkm.item = BattleItems[pokemon.item];//Gets and formats the item

	myPkm.ability = BattleAbilities[pokemon.baseAbility].name;//formats the ability
	this.applyBoosts(myPkm, pokemon);//Transfers eventual boosts

	for (var i = 0; i < pokemon.moves.length; i++) {//Goes through our moves
		var m = Moves[BattleMovedex[pokemon.moves[i]].name];//Formats the ith move
		if (m) {//Checks for exceptions and assigns the move
			m.bp = getBpException(BattleMovedex[pokemon.moves[i]].name);
			myPkm.moves[i] = m;
		} else
			myPkm.moves[i] = Moves["(No Move)"];
	}

	// We look for the maximum amount of damage we can take

	var maxiDmg = [0, 0, 0, 0, 0];
	var f = new Field();
	var ennemyName = checkExeptions(this.bot.ennemy.species);//Gets the name of the opponent's pokemon
	for (var set in setdex[ennemyName]) {//Goes through its possible sets

		setName = ennemyName + " (" + set + ")";//formats the set's name
		var ennemyPkm = new PokemonCalc(setName);//Creates a pokemon with the appropriate set

		var dmg = calculateAllMoves(ennemyPkm, myPkm, f);/*a 2*4*16 array containing the dmg of the moves 
                                                       for each variance level of both pokemons */
    
		for (var i = 0; i < dmg[1].length; i++) { //Goes through the damage that the ennemy can deal us
			if (dmg[0][i].damage[15] > maxiDmg[4]) // false if it does not exist
				maxiDmg[4] = dmg[0][i].damage[15];//Contains the maximum damage we can possibly take
		}

		for (var i = 0; i < dmg[0].length; i++) { //Goes trough the damage dealt to the ennemy
			if (dmg[1][i].damage[7] > maxiDmg[i] && ennemyPkm.level == 100) { // false if it does not exist
				maxiDmg[i] = dmg[1][i].damage[7];//Contains the average damage dealt to the ennemy by our ith move
            			}
		}
	}

	for (var i = 0; i < pokemon.moves.length; i++) {//Corner cases
		switch (pokemon.moves[i]) {
			case "sonicboom":
				maxiDmg[i] = 20;
				break;
			case "dragonrage":
				maxiDmg[i] = 40;
				break;
			case "seismictoss":
			case "nightshade":
				maxiDmg[i] = pokemon.level;
				break;
			case "finalgambit":
				maxiDmg[i] = pokemon.maxhp;
				break;
		}
		//Transforms the values in life loss percentage
		maxiDmg[i] = parseInt(100 * maxiDmg[i] / this.bot.ennemy.maxhp);
		//Refines the calculation by taking into account critical hits
		maxiDmg[i] = parseInt(maxiDmg[i] * (15 / 16) + maxiDmg[i] * (1 / 16) * ((myPkm.ability == "Sniper") ? 2 : 1.5)); // E(X) with critical
	}
	//Transforms the value in life loss percentage
	maxiDmg[4] = parseInt(maxiDmg[4] / this.bot.pokemon.maxhp * 100);
	//Takes into account critical hits
	maxiDmg[4] = parseInt(maxiDmg[4] * (15 / 16) + maxiDmg[4] * (1 / 16) * ((this.hasAbility(this.bot.ennemy, "Sniper")) ? 2 : 1.5)); // E(X) with critical

	for (var i = 0; i < 4; i++) {// 100 - remaining hp
		maxiDmg[i] = 100 - Math.max(0, this.bot.ennemy.hp - maxiDmg[i]);
	}

	return maxiDmg;
};

statusConvert = function(st) { //Formats Showdown's statuses for the Damage Calculator

switch (status) {
	case "brn":
		return "Burned";
	case "psn":
		return "Poisoned";
	case "tox":
		return "Badly Poisoned";
	case "slp":
		return "Asleep";
	case "frz":
		return "Frozen";
}
return "Healthy";
};

getBpException = function(moveName) {//Calculate the base power of some special attacks
	
var bp = Moves[moveName].bp;

switch (moveName) {
	case "Low Kick":
	case "Grass Knot":
		w = this.bot.ennemy.weightkg;
		bp = (w < 10) ? 20 : (w < 25) ? 40 : (w < 50) ? 60 : (w < 100) ? 80 : (w < 200) ? 100 : 120;
		break;
	case "Heavy Slam":
		r = this.bot.pokemon.weightkg / this.bot.ennemy.weightkg;
		bp = (r > 1 / 2) ? 40 : (r > 1 / 3) ? 60 : (r > 1 / 4) ? 80 : (r > 1 / 5) ? 100 : 120;
		break;
	case "Gyro Ball":
		ennemySpeed = parseInt((31 + 2 * this.bot.ennemy.baseStats.spe) * this.bot.ennemy.level / 100 + 5);
		bp = 25 * (ennemySpeed / this.bot.pokemon.stats.spe);
		break;
	case "Facade":
		bp = 70 * ((this.bot.pokemon.status == "") ? 1 : 2);
		break;
	case "Return":
		bp = 102;
		break;
	case "Frustration":
		bp = 102;
		break;
}
return bp;
};

PokeyI.prototype.applyBoosts = function(pkmCalc, pkm) { //Converts the Showdown's representation into the Dmg Calc one
for (var b in pkmCalc.boosts) {
	switch (b) {
		case "at":
			pkmCalc.at = (!pkm.boosts.atk) ? 0 : pkm.boosts.atk;
			break;
		case "df":
			pkmCalc.df = (!pkm.boosts.def) ? 0 : pkm.boosts.def;
			break;
		case "sa":
			pkmCalc.sa = (!pkm.boosts.spa) ? 0 : pkm.boosts.spa;
			break;
		case "sd":
			pkmCalc.sd = (!pkm.boosts.spd) ? 0 : pkm.boosts.spd;
			break;
		case "sp":
			pkmCalc.sp = (!pkm.boosts.spe) ? 0 : pkm.boosts.spe;
			break;
	}
}
};
