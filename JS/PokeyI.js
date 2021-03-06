PokeyI = function(bot) {

	this.bot = bot;
};

BattleRoles = {

	'sweeperAtk': 0,
	'sweeperSpa': 1,

	'wallDef': 2,
	'wallSpd': 3,

	'pivotOff': 4,
	'pivotDef': 5,

	'wallbreakOff': 6,
	'wallbreakDef': 7
};

PokeyI.prototype.hasType = function(pokemon, type) {//Returns if a pokemon has a given type
	for (var i = 0; i < pokemon.types.length; i++) {//Goes through the types of the pokemon
		if (pokemon.types[i] == type)
			return true;
	}
	return false;
};

PokeyI.prototype.getBulk = function(pokemon) {//Evaluate the potential bulk of a pokemon based on its stats
	return (this.getStat(pokemon, 'hp') / 2 +
			Math.max(this.getStat(pokemon, 'def'), this.getStat(pokemon, 'spd')) / 2);
};

PokeyI.prototype.getDanger = function(attacker, defender) {

	if (!attacker || !defender)
		return 0;

	var atkType; // We first try to determine what kind of attacker ennemy is.
	atkType = (this.getStat(attacker, 'atk') >= this.getStat(attacker, 'spa')) ? 'atk' : 'spa';

	//=====================================================
	var potentialO = (this.getStat(attacker, 'spe') / 2 / (attacker.status == 'par' ? 4 : 1) + 
					  this.getStat(attacker, atkType) / 2 / ((attacker.status == 'brn' && atkType == 'atk') ? 2 : 1));
	if (attacker.status == 'slp')
		potentialO /= 3;

	var increased = false;
	for (var i = 0; i < attacker.types.length; i++) { // We calculate the type effectiveness
		w = Math.max(this.getWeaknesses(defender)[attacker.types[i]], 0.5);
		if (w > 1 || !increased) {
			potentialO *= w;
			increased = true;
		}
	}

	var potentialD = (this.getStat(defender, 'hp') / 1.5 + // We calculate a defensive power
					  ((atkType == 'atk') ? this.getStat(defender, 'def') : this.getStat(defender, 'spd')) / 2);

	console.log("PokeyI: getDanger: Ennemy power : " + potentialO);
	console.log("PokeyI: getDanger: Ally power : " + potentialD);

	return potentialO / potentialD;
};

PokeyI.prototype.getMultiplicator = function(pokemon, stat) {
	if (pokemon.boosts[stat] > 0)
		return 1.0 + 0.5 * pokemon.boosts[stat];
	else if (pokemon.boosts[stat] < 0)
		switch (pokemon.boosts[stat]) {
			case -1:
				return 0.67;
      		case -2:
        		return 0.5;
      		case -3:
       			 return 0.4;
      		case -4:
       			 return 0.33;
     		 case -5:
       			 return 0.29;
      		case -6:
        		return 0.25;
	}
	return 1.0;
};

PokeyI.prototype.getWeaknesses = function(poke) { //Takes a fullPokemon for argument
  //Returns a dictionnary of the pokemon weaknesses

	var id = poke.speciesid;
	if (!id)
		id = normalizeString(poke.species.toLowerCase());
	var ab = [""];
	var init = ["Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying",
    "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock",
    "Steel", "Water", "powder", "par", "psn", "tox", "brn", "trapped"];

	for (var i in exports.BattlePokedex[id].abilities)//Goes through the abilities of the pokemon
		ab.push(exports.BattlePokedex[id].abilities[i]);

	var weaknesses = {};

	for (var i = 0; i < init.length; i++)//Initializes the weaknesses to a 1.0 multiplier
		weaknesses[init[i]] = 1.0;

	for (var i = 0; i < poke.types.length; i++) {//Goes through the pokemon's types
		t = poke.types[i];
		for (var j in exports.BattleTypeChart[t]['damageTaken']) {//Goes through all the types
			switch (exports.BattleTypeChart[t]['damageTaken'][j]) {//Gets the weakness of the type t to the type j
				case 1://Translates the Showdown weakness chart into a damage multiplier
          			weaknesses[j] *= 2.0;//If it's a weakness
          			break;
        		case 2:
          			weaknesses[j] *= 0.5;//A resistance
          			break;
        		case 3:
          			weaknesses[j] *= 0.0;//An immunity
          			break;
			}
		}
	}

	for (var i = 0; i < ab.length; i++) {//Adjust the weaknesses in regard of the possible abilities of the pokemon
		if (ab[i] == "Dry Skin") {
			weaknesses["Fire"] *= 1.25;
      		weaknesses["Water"] = 0.0;
    	} 
		else if (ab[i] == "Filter" || ab[i] == "Solid Rock") {
      		for (var j in exports.BattleTypeChart[t]['damageTaken']) {
        		if (weaknesses[j] == 2.0 || weaknesses == 4.0) {
          			weaknesses[j] *= 0.75;
        		}
     	 	}
    	} 
		else if (ab[i] == "Flash Fire") {
      		weaknesses["Fire"] = 0.0;
    	} 
		else if (ab[i] == "HeatProof") {
      		weaknesses["Fire"] *= 0.5;
    	} 
		else if (ab[i] == "Levitate") {
      		weaknesses["Ground"] = 0.0;
    	} 
		else if (ab[i] == "Thick Fat") {
      		weaknesses["Fire"] *= 0.5;
      		weaknesses["Ice"] *= 0.5;
    	} 
		else if (ab[i] == "Volt Absorb" || ab[i] == "Lightningrod" || ab[i] == "Motor Drive") {
      		weaknesses["Electric"] = 0.0;
      		weaknesses["par"] = 0.0;
    	} 
		else if (ab[i] == "Water Absorb" || ab[i] == "Storm Drain") {
      		weaknesses["Water"] = 0.0;
    	} 
		else if (ab[i] == "Wonder Guard") {
      		for (var j in exports.BattleTypeChart[t]['damageTaken']) {
        		if (weaknesses[j] != 2.0 && weaknesses != 4.0) {
          			weaknesses[j] = 0.0;
        		}
      		}
    	} 
		else if (ab[i] == "Sap Sipper") {
			weaknesses["Grass"] = 0.0;
      		weaknesses["powder"] = 0.0;
    	} 
		else if (ab[i] == "Poison Heal") {
      		weaknesses["tox"] = 0.0;
      		weaknesses["psn"] = 0.0;
   		}
	}

	return weaknesses;
};

PokeyI.prototype.evalSwitch = function(pokemon) {//A lot of work to be done down there
	var coef = 100.0;
	var weaknesses = this.getWeaknesses(pokemon);
	for (var i = 0; i < this.bot.ennemy.types; i++)
		coef *= (1.0 / weaknesses[this.bot.ennemy[i]]);
};

PokeyI.prototype.getExpectedRole = function(pokemon) {//Work in progress as we say
	// val in BattleRoles
	potentialRoles = [];

	return potentialRoles;
};

PokeyI.prototype.distance = function(a, b) {
	return Math.sqrt(a * a + b * b);
};

PokeyI.prototype.getPotentialWall = function(pokemon) { // Can pokemon be a good wall ?

	//// STATS 1 - 16

	var def = this.getStat(pokemon, 'def');
	var spd = this.getStat(pokemon, 'spd');
	var hp = this.getStat(pokemon, 'hp');

	//If the pokemon can burn we ignore its def else we look at its weaker defensive stat
	var minDef = ((this.canBurn(pokemon)) ? spd : Math.min(def, spd));
	
	//We rate its defenses and health 1 is pretty bad, 4 is excellent
	var coefD = (minDef <= 60) ? 1 : (minDef <= 80) ? 2 : (minDef <= 100) ? 3 : 4;
	var coefH = (hp <= 60) ? 1 : (hp <= 80) ? 2 : (hp <= 100) ? 3 : 4;
	
	//After analyzing its stats we give the pokemon a grade. 1 is very bad, 16 is excellent
	var coefStats = coefD * coefH;

	//Now we look at its weaknesses
	//WeaknessToInt rates the overall weaknesses of the pokemon. 1 is the worst, 9 is excellent
	
	var worseWeaknessGrade = - 15.5;
	var coefWeak = parseInt((this.weaknessToInt(pokemon) - worseWeaknessGrade) / 30 * 8) + 1;

	//Now we rate the movepool of our pokemon

	var coefMoves = 1.0;
	coefMoves += this.canHeal(pokemon); //We rate the healing possibilities separately and add the grade here
	if (this.canCure(pokemon)) //Can our pokemon remove its statuses
		coefMoves += 0.5;
	//Some key abilities for stallers
	if (this.hasAbility(pokemon, "Prankster"))
		coefMoves += 8;
	if (this.hasAbility(pokemon, "Gale Wings"))
		coefMoves += 4;
	if (this.hasAbility(pokemon, "Poison Heal"))
		coefMoves += 8;
	if (this.hasAbility(pokemon, "Magic Bounce"))
		coefMoves += 5;
	if (this.canSetupDef(pokemon, (def > spd) ? 'spd' : 'def'))//Can the pokemon boosts its weaker stat
		coefMoves += 2;
	
	//We rate the sustain of the pokemon separately and add it to the final moves grade
	coefMoves += this.passiveHeal(pokemon);

	//Well rounded pokemons who don't exceed in any stat but can setup to become godlike (Crocune-like...)
	if (minDef > 100 && hp >= 100 && this.canBurn(pokemon) && this.canSetupDef(pokemon, 'spd'))
		coefMoves += 3;
	else if (!this.canHeal(pokemon))
		return 0;

	//Final grade is the sum of all the sub grades
	return coefStats + coefWeak + parseInt(coefMoves);
};

PokeyI.prototype.weaknessToInt = function(pokemon) { // average : 0.58
	var types = this.getWeaknesses(pokemon);
	var typeDef = 0;
	//This list contains the most common attack types among those of the top tier sweepers
	var badWeaknesses = ["Fighting", "Water", "Ground", "Fire", "Dark", "Electric", "Ice", "Fly"];
	var dontTest = ["powder", "tox", "brn", "psn", "trapped", "par"];//We've no interest in those
	for (w in types) {
		if (dontTest.includes(w)) {}
		else {
			var coef = ((types[w] == 0.0) ? 4.0 : (types[w] <= 0.25) ? 2.0 : (types[w] <= 0.5) ? 1.0 : (types[w] <= 2) ? -2 : (types[w] <= 4) ? -4 : 0.0);
			typeDef += coef * (badWeaknesses.includes(w) ? 1.5 : 1.0);
		}
	}
	return typeDef;
}

PokeyI.prototype.canHeal = function(pokemon) { //Rates the healing capabilities of a pokemon
	//Formatting in order to use the BattleLearnSets
	var name = pokemon.species.toLowerCase();
	if (pokemon.baseSpecies)
		name = pokemon.baseSpecies.toLowerCase();

  	if (!BattleLearnsets[name])//Checks if the BattleLearnSet is accessible
		return false;

	var healMax = 0;//The healing grade
	for (var move in BattleLearnsets[name].learnset) {//Goes through the moves learned by the pokemon
    	switch (move) {
      		case 'roost':
      		case 'recover':
      		case 'slackoff':
      		case 'softboiled':
      		case 'milkdrink':
      		case 'synthesis':
      		case 'morningsun':
      		case 'moonlight':
      		case 'healorder':
      		 	 return 2;
      		case 'wish':
       			 healMax = 1.5;
      		case 'painsplit':
       			healMax = (healMax > 1) ? healMax : 1;
		}
  	}
  	return healMax;
};

PokeyI.prototype.canBurn = function(pokemon) { //Checks if a pokemon can burn its ennemy
    //Formatting in order to use the BattleLearnSet
    var name = pokemon.species.toLowerCase();
    if (pokemon.baseSpecies)
        name = pokemon.baseSpecies.toLowerCase();
    
    if (pokemon.moveTrack) {
      for (var i = 0; i < pokemon.moveTrack.length; i++) {
         switch (move) {
            case 'sacredfire':
            case 'scald':
            case 'willowisp':
            case 'steameruption':
            case 'iceburn':
            case 'inferno':
            case 'lavaplume':
                return 1;
        }
      }
    }

    if (!BattleLearnsets[name])//Checks if the BattleLearnSet is accessible
        return false;

    for (var move in BattleLearnsets[name].learnset) {
        switch (move) {
            case 'sacredfire':
            case 'scald':
            case 'willowisp':
            case 'steameruption':
            case 'iceburn':
            case 'inferno':
            case 'lavaplume':
                return 0.5;
        }
    }
    return 0;
};

PokeyI.prototype.canParalyze= function(pokemon) { //Checks if a pokemon can burn its ennemy
    //Formatting in order to use the BattleLearnSet
    var name = pokemon.species.toLowerCase();
    if (pokemon.baseSpecies)
        name = pokemon.baseSpecies.toLowerCase();
    
    if (pokemon.moveTrack) {
      for (var i = 0; i < pokemon.moveTrack.length; i++) {
         switch (move) {
            case 'bodyslam':
            case 'bounce':
            case 'discharge':
            case 'dragonbreath':
            case 'forcepalm':
            case 'freezeshock':
            case 'glare':
            case 'lick':
            case 'nuzzle':
            case 'spark':
            case 'stunspore':
            case 'thunder':
            case 'thunderwave':
            case 'zapcannon':
                return 1;
        }
      }
    }

    if (!BattleLearnsets[name])//Checks if the BattleLearnSet is accessible
        return false;

    for (var move in BattleLearnsets[name].learnset) {
        switch (move) {
            case 'bodyslam':
            case 'bounce':
            case 'discharge':
            case 'dragonbreath':
            case 'forcepalm':
            case 'freezeshock':
            case 'glare':
            case 'lick':
            case 'nuzzle':
            case 'spark':
            case 'stunspore':
            case 'thunder':
            case 'thunderwave':
            case 'zapcannon':
                return 0.5;
        }
    }
    return 0;
};

PokeyI.prototype.canCure = function(pokemon) { // Checks if the pokemon can remove its statuses
    //Formatting in order to use the BattleLearnSet
    var name = pokemon.species.toLowerCase();
    if (pokemon.baseSpecies)
        name = pokemon.baseSpecies.toLowerCase();
        
    if (pokemon.moveTrack) {
      switch (move) {
            case 'healbell':
            case 'aromatherapy':
                return 1;
        }
    }

    if (!BattleLearnsets[name])//Checks if the BattleLearnSet is accessible
        return false;

    for (var move in BattleLearnsets[name].learnset) {
        switch (move) {
            case 'healbell':
            case 'aromatherapy':
                return 0.5;
        }
    }
    return false || this.hasAbility(pokemon, "Natural Cure") || this.hasAbility(pokemon, "Shed Skin");
};

PokeyI.prototype.passiveHeal = function(pokemon) {//Rates if a pokemon can passively heal itself
	//Formatting in order to use the BattleLearnSet
	var name = pokemon.species.toLowerCase();
	if (pokemon.baseSpecies)
	name = pokemon.baseSpecies.toLowerCase();

	if (!BattleLearnsets[name])//Checks if the BattleLearnSet is accessible
		return false;

	for (var move in BattleLearnsets[name].learnset) {
		switch (move) {
			case 'aquaring':
			case 'leechseed':
			case 'ingrain':
				return 1;
		}
	}
	return 0;
};

PokeyI.prototype.canSetupDef = function(pokemon, type) {//Checks if a pokemon can learn viable defensive setup moves
	//Formatting in order to use the BattleLearnSet
	var name = pokemon.species.toLowerCase();
	if (pokemon.baseSpecies)
		name = pokemon.baseSpecies.toLowerCase();

	if (!BattleLearnsets[name])//Checks if the BattleLearnSet is accessible 
		return false;

	for (var move in BattleLearnsets[name].learnset) {
		switch (move) {
      		case 'cottonguard':
        		if (type == 'def')
          			return true;
        	break;
      		case 'bulkup':
        		if (type == 'def')
          			return true;
        	break;
      		case 'irondefense':
        		if (type == 'def')
          			return true;
        	break;
      		case 'curse':
        		if (type == 'def')
          			return true;
        	break;
      		case 'coil':
        		if (type == 'def')
          			return true;
        	break;
      		case 'barrier':
        		if (type == 'def')
          			return true;
        	break;
      		case 'calmmind':
        		if (type == 'spd')
          			return true;
        	break;
      		case 'acidarmor':
        		if (type == 'spd')
          			return true;
        	break;
      		case 'cosmicpower':
        		return true;
      		case 'stockpile':
        		return true;
		}
	}
	return false;
};

PokeyI.prototype.getStat = function(pokemon, stat) {//Returns the given base stat of a pokemon
  return pokemon.baseStats[stat];
};


PokeyI.prototype.hasAbility = function(pokemon, ab) {//Checks if a pokemon or its mega-evolution has a given ability
	var hasAb = false;
  
	var isMega = false;//Checks if the pokemon is a mega-evolution
	if (pokemon.forme == "Mega")
		isMega = true;
  
	var name = pokemon.species.toLowerCase();//formatting
	if (pokemon.baseSpecies)
		name = pokemon.baseSpecies.toLowerCase();
    
	if (isMega)//formatting for mega-evolutions
		name = name + "mega";

	if (!BattlePokedex[name])//Checks if the Pokedex is accessible
		return false;

	for (var a in BattlePokedex[name].abilities)//Goes through the abilities of the pokemon
		if (BattlePokedex[name].abilities[a] == ab)
			hasAb = true;
  
	if (!isMega) {
		name = name + "mega";
      
		if (!BattlePokedex[name])//Checks if the pokemon has a mega-evolution
      	return hasAb;
    
		for (var a in BattlePokedex[name].abilities)//Goes through the abilities of the pokemon
			if (BattlePokedex[name].abilities[a] == ab)
				hasAb = true;
	}
	return hasAb;
};

PokeyI.prototype.getSetDistance = function(pkPerso, pkCal) { //Calculates the distance between two given sets
	var d = Math.pow(pkPerso.maxhp - pkCal.maxHP, 2);
	for (stat in pkPerso.stats) {
		switch (stat) {
      		case 'atk':
        		d += Math.pow(pkPerso.stats.atk - pkCal.rawStats.at, 2);
        	break;
      		case 'def':
        		d += Math.pow(pkPerso.stats.def - pkCal.rawStats.df, 2);
        	break;
      		case 'spa':
        		d += Math.pow(pkPerso.stats.spa - pkCal.rawStats.sa, 2);
        	break;
      		case 'spd':
        		d += Math.pow(pkPerso.stats.spd - pkCal.rawStats.sd, 2);
        	break;
      		case 'spe':
        		d += Math.pow(pkPerso.stats.spe - pkCal.rawStats.sp, 2);
        	break;
    	}
  	}
	return Math.sqrt(d);
};

/////////////////////// UNSAFE ZONE ////////////////////////////////////
//I'm not touching this

PokeyI.prototype.isFaster = function(p1, p2) { // NOT TESTED
    s1 = (p1.stats) ? p1.stats.spe : (p1.baseStats) ? p1.baseStats.spe : -1;
    s2 = (p1.stats) ? p1.stats.spe : (p1.baseStats) ? p1.baseStats.spe : -1;
    if (s1 == -1 || s2 == -1)
        return false;    
    return s1 > s2;
}
