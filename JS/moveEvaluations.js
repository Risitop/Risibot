Risibot.prototype.choseMove = function() {

  if (!this.pokemon || !this.ennemy)
    return -1;
    
  if (this.pokemon.name != this.room.myPokemon[0].name) {
      this.currentTurn -= 1;
      return -1;
  }

  var dmgComputation = this.AI.getMaxDamageTaken(this.pokemon, this.ennemy);
  var dmgTaken = dmgComputation[4];
  var movesInterests = dmgComputation.slice(0, 4);

  for (var i = 0; i < movesInterests.length; i++) {
      var ennemySlice = this.room.battle.yourSide.active[0].hp;
      movesInterests[i] = Math.min(100, parseInt(100 * movesInterests[i] / ennemySlice));
  }

  for (var moveType in this.moves) {
    for (var j = 0; j < this.moves[moveType].length; j++) {
      var move = this.moves[moveType][j][0];
      var k = this.moves[moveType][j][1];
      if (movesInterests[k - 1]) {
        if (move.priority > 1)
          movesInterests[k - 1] = this.AI.evalPriorityMove(move, movesInterests[k - 1], dmgTaken);
        if (this.AI.isBoostAttack(move))
          movesInterests[k - 1] = this.AI.evalBoostAttack(move, movesInterests[k - 1], dmgTaken);
      }
      switch (moveType) {
        case 'status':
          movesInterests[k - 1] = this.AI.evalStatus(move, dmgTaken);
          break;
        case 'traps':
          movesInterests[k - 1] = this.AI.evalTraps(move, dmgTaken);
          break;
        case 'heal':
          movesInterests[k - 1] = this.AI.evalHeal(move, dmgTaken);
          break;
        case 'spin':
          movesInterests[k - 1] = this.AI.evalSpin(move, dmgTaken);
          break;
        case 'seeds':
          movesInterests[k - 1] = this.AI.evalSeeds(move, dmgTaken);
          break;
        case 'defog':
          movesInterests[k - 1] = this.AI.evalDefog(move, dmgTaken);
          break;
        case 'roar':
          movesInterests[k - 1] = this.AI.evalRoar(move, dmgTaken);
          break;
        case 'painSplit':
          movesInterests[k - 1] = this.AI.evalPainSplit(move, dmgTaken);
          break;
        case 'boost':
          movesInterests[k - 1] = this.AI.evalBoostMove(move, dmgTaken);
          break;
        case 'fakeOut':
          movesInterests[k - 1] = this.AI.evalFakeOut(move, dmgTaken);
          break;
      }
      console.log("Risibot: choseMove: Move " + move.name + ".");
    }
  }
  // We delete disabled moves (scarf, disable...)
  var disabledMoves = [1, 1, 1, 1];
  for (var j = 0; j < this.buttonsMoves.length; j++) {
    if (this.buttonsMoves[j])
      disabledMoves[this.buttonsMoves[j].value - 1] = 0;
  }
  // We erase the NaN and disabled moves
  for (j = 0; j < 4; j++) {
    movesInterests[j] = ((disabledMoves[j] || movesInterests[j] == NaN) ? 0 : movesInterests[j]);
  }
  console.log("Risibot: choseMove: " + movesInterests);
  var choice = getMaxIndex(movesInterests);
  return choice;
};

PokeyI.prototype.evalStatus = function(move, dmgTaken) { // Is this status move worth it ?
  //If we can't status the ennemy then no
  if (this.bot.ennemy.status != "" ||
    (move.status == "par" && this.hasType(this.bot.ennemy, "Electric")) ||
    (move.status == "brn" && this.hasType(this.bot.ennemy, "Fire")) ||
    (move.baseType == "Grass" && this.hasType(this.bot.ennemy, "Grass")) ||
    (move.baseType == "Electric" && this.hasType(this.bot.ennemy, "Ground")) ||
    (move.baseType == "tox" && this.hasType(this.bot.ennemy, "Steel")) ||
    (move.status == "tox" && this.hasType(this.bot.ennemy, "Poison")) ||
    (move.status == "par" && this.hasAbility(this.bot.ennemy, "Limber")) ||
    (move.status == "brn" && this.hasAbility(this.bot.ennemy, "Water Veil")) ||
    (this.hasAbility(this.bot.ennemy, "Magic Bounce")) ||
    (this.hasAbility(this.bot.ennemy, "Synchronize")) ||
    (this.bot.room.battle.yourSide.sideConditions.safeguard)) {
    return 0;
  }
  //Using getStatusInterest to rate the impotance of a given status (the importance is lowered
  //if the ennemy can remove the status
  var isAnnoying = this.getStatusInterest(move.status) / ((this.canCure(this.bot.ennemy)) ? 2 : 1);
  return parseInt(((isAnnoying + 1) * 30)); //1 is low priority, 90 is very high one.
};

PokeyI.prototype.getStatusInterest = function(s) { //Rates the importance of giving the status s to a pokemon
  switch (s) {
    case 'par': //The faster it is, the better it is to paralyze
      if (this.bot.ennemy.baseStats["spe"] > 120 || this.bot.ennemy.item == "Choice Scarf")
        return 2;
      if (this.bot.ennemy.baseStats["spe"] > 100)
        return 1;
      return 0;
    case 'tox': //The highest stalling potential the ennemy has the better it is to poison
      var wallCoef = this.getPotentialWall(this.bot.ennemy);
      return ((wallCoef >= 20) ? 2 : (wallCoef >= 15) ? 1 : 0);
    case 'brn': //Checks the attack stat to determine if we should burn
      if (this.bot.ennemy.baseStats["atk"] > 120 || this.bot.ennemy.item == "Choice Band")
        return 2;
      if (this.bot.ennemy.baseStats["atk"] > 100)
        return 1;
      return 0;
    case 'slp': //Always good.
      return (this.getSleepClause()) ? 0 : 2;
  }
  return 0;
};

PokeyI.prototype.getSleepClause = function() {
  for (var i = 0; i < this.bot.room.battle.yourSide.pokemon.length; i++) {
    if (this.bot.room.battle.yourSide.pokemon[i].status == "slp")
      return true;
  }
  return false;
};

PokeyI.prototype.isBoostAttack = function(move) {
  return ( (!move.secondary) ? false : (!move.secondary.self) ? false : (!move.secondary.self.boosts) ? false : true );
};

PokeyI.prototype.evalSpin = function(move, dmgTaken) { // Is this spin worth it ?

  if ((jQuery.isEmptyObject(this.bot.room.battle.mySide.sideConditions) && !this.bot.pokemon.volatiles.leechseed) ||
    this.hasType(this.bot.ennemy, "Ghost")) {
    return 0;
  }
  return 90;
};

PokeyI.prototype.evalTraps = function(move, dmgTaken) { //Is it woth it to throw entry hazards in the way ?
  //If we are at risk to dying then no
  if (this.getXHKO(this.bot.pokemon, this.bot.enemy) == 1 || this.hasAbility(this.bot.ennemy, "Magic Bounce"))
    return 0;
  
  var ennemies = this.getNotFainted(this.bot.room.battle.yourSide.pokemon);
  if (ennemies.length == 0)
    return 0;

  switch (move.id) {
    case "stealthrock":
      if (!this.bot.room.battle.yourSide.sideConditions.stealthrock)
        return 85;
      break;
    case "spikes": //can be worth it to place a few layers of spikes
      if (!this.bot.room.battle.yourSide.sideConditions.spikes)
        var spikes = this.bot.room.battle.mySide.sideConditions.spikes;
      var spikesLayers = ((spikes) ? spikes[2] : 0);
      return ((spikesLayers == 0) ? 75 : (spikesLayers == 1) ? 50 : (spikesLayers == 2) ? 25 : 0);
      break;
    case "stickyweb":
      if (!this.bot.room.battle.yourSide.sideConditions.stickyweb)
        return 85;
      break;
  }
  console.log("Risibot: evalTraps: Entry hazards are already set.");
  return 0;
};

PokeyI.prototype.getXHKO = function(defPoke, offPoke) {

  var dmg = this.getMaxDamageTaken(defPoke)[4];
  var extraDmg = 0;

  extraDmg += (defPoke.status == "brn") ? 12 : 0;
  extraDmg += (defPoke.status == "psn" || defPoke.status == "tox") ? 12 : 0; // Todo: toxic tracker
  extraDmg += (defPoke.volatiles.leechseed) ? 12 : 0;
  extraDmg -= (defPoke.item == "leftovers") ? 6 : 0;
  var hp = parseInt(defPoke.hp / defPoke.maxhp * 100);
  
  return Math.max(1, Math.ceil(hp / (dmg + extraDmg)));
};

PokeyI.prototype.evalHeal = function(move, dmgTaken) { //Returns the priority of using a healing move

  var k = this.getXHKO(this.bot.pokemon, this.bot.ennemy);
  var hp = this.bot.pokemon.hp;
  if (this.isFaster(this.bot.ennemy, this.bot.pokemon)) // If ennemy is faster, we can use one less move
    k -= 1;

  if (k == 0) { // We will die before having done anything
    if (dmgTaken > 65) { // Healing will not change anything
      return 10;
    } else if (dmgTaken > 40) {
      if (this.bot.ennemy.status != "" && this.bot.ennemy.status != "par") { //If he has a status
        return 50; //Tempo
      } else {
          return 10;
      }
    }
    return 29;
  } else if (k == 1) { // We can only use one move before dying
    if (dmgTaken > 65) { // Healing will not change anything
      return 10;
    } else if (dmgTaken > 40) {
      if (this.bot.ennemy.status != "" && this.bot.ennemy.status != "par") { //If he has a status
        return 100; //Tempo
      } else {
        return 29; //Sacrifice
      }
    } else { // Time to heal !
      return 100;
    }
  } else if (k == 2) {
    //If we take less than 65% damage we have a few turns left, we can wait before healing
    if (hp < 50) { //If we are low life
      if (dmgTaken < 65) { //If the ennemy doesn't hit hard
        return 100; //We heal
      } else { //If he hits like a truck
        if (this.bot.ennemy.status != "" && this.bot.ennemy.status != "par") { //If he has a status
          return 100; //Tempo
        } else {
          return 29; //Sacrifice
        }
      }
    } else {
        return 10;
    }
  } else {
    return ((hp < 30) ? 100 : (hp < 50) ? 80 : (hp < 75) ? 30 : 0);
  }
};

PokeyI.prototype.evalSeeds = function(move, dmgTaken) {

  if (this.bot.ennemy.volatiles.leechseed || this.hasType(this.bot.ennemy, "Grass") ||
    this.hasAbility(this.bot.ennemy, "Magic Bounce") || this.hasAbility(this.bot.ennemy, "Sap Sipper")) {
    return 0;
  }

  var d = this.getDanger(this.bot.ennemy, this.bot.pokemon); //the advantage the ennemy has on us
  if (d < 0.3) // Ennemy could switch
    return 20;
  if (d < 0.8) // Ennemy will probably not switch
    return 60;
  if (d < 1.5) // It's crucial to survive
    return 80;
  return 0; // ABORT MISSION
};

PokeyI.prototype.evalDefog = function(move, dmgTaken) {

  if (jQuery.isEmptyObject(this.bot.room.battle.mySide.sideConditions))
    return 0;
    
  var allies = this.getNotFainted(this.bot.room.battle.mySide.pokemon);
  var ennemies = this.getNotFainted(this.bot.room.battle.yourSide.pokemon);

  var indic = 0;
  for (var condition in this.bot.room.battle.mySide.sideConditions) {
    var c = this.bot.room.battle.mySide.sideConditions[condition][0];
    switch (c) {
      case 'toxicspikes':
      case 'spikes':
        indic += 1 * this.getGroundedPokemon(allies).length; // 0 - 6
        break;
      case 'stickyweb':
        indic += 2 * this.getGroundedPokemon(allies).length; // 0 - 12
      case 'stealthrock':
        indic += this.getStealthRockPressure(allies); // 0 - 12;
        break;
      case 'reflect':
      case 'safeguard':
      case 'lightscreen':
        indic -= 8;
        break;
    }
  }
  for (var condition in this.bot.room.battle.yourSide.sideConditions) {
    var c = this.bot.room.battle.yourSide.sideConditions[condition][0];
    switch (c) {
      case 'toxicspikes':
       case 'spikes':
        indic -= 1 * this.getGroundedPokemon(ennemies).length;
        break;
      case 'stickyweb':
        indic -= 2 * this.getGroundedPokemon(ennemies).length;
      case 'stealthrock':
        indic -= this.getStealthRockPressure(ennemies);
        break;
        break;
      case 'reflect':
      case 'safeguard':
      case 'lightscreen':
        indic += 8;
        break;
    }
  }

  if (indic < 0) // Terrain is advantageous for the bot
    return 0;
  else if (indic >= 0 && indic <= 4) {//ALLONS A LOURDES
    var d = ennemies.length - allies.length;
    var coin = Math.random();
    var threshold;
    if (d > 0) // Ennemies are more numerous
        threshold = 0.33;
    else if (d == 0) // Team are same-sized
        threshold = 0.50;
    else // We have more pokemons
        threshold = 0.67;
    return ( (Math.random() < threshold) ? 86 : 0 );
  } else {
      return 86;
  }
};
PokeyI.prototype.getNotFainted = function(team) {
    var g = [];
    for (var i = 0; i < team.length; i++) {
        if (!team[i].fainted)
            g.push(team[i]);
    }
    return g;
}

PokeyI.prototype.getGroundedPokemon = function(team) {
    var g = [];
    for (var i = 0; i < team.length; i++) {
        if (this.getWeaknesses(team[i]).Ground > 0)
            g.push(team[i]);
    }
    return g;
}

PokeyI.prototype.getStealthRockPressure = function(team) { // Full neutral : 6, 12 if there is a double weakness
    var coef = 1.0; // 
    for (var i = 0; i < team.length; i++) {
        if(this.getWeaknesses(team[i])["Rock"] == 0)
            coef *= 1 ;
        else if(this.getWeaknesses(team[i])["Rock"] < 0.5)
            coef *= 1.1;
        else if(this.getWeaknesses(team[i])["Rock"] < 1)
            coef *= 1.25;
        else if(this.getWeaknesses(team[i])["Rock"] < 1.5)
            coef *= 1.5;
        else if(this.getWeaknesses(team[i])["Rock"] < 2)
            coef *= 1.75;
        else if(this.getWeaknesses(team[i])["Rock"] < 3)
            coef *= 2;
        else if(this.getWeaknesses(team[i])["Rock"] < 4)
            coef *= 3;
        else
            coef *= 4;
    }
    return Math.min(12, Math.ceil((coef / team.length) * 3));
}

PokeyI.prototype.evalRoar = function(move, dmgTaken) {

  if (this.hasAbility(this.bot.ennemy, "Magic Bounce"))
    return 0;

  coefTerrain = 0;
  for (c in this.bot.room.battle.yourSide.sideConditions) {
    switch (c) {
      case 'stealthrock': // Will damage and destabilize
      case 'spikes':
      case 'toxicspikes':
      case 'reflect': // Will temporize
      case 'lightscreen':
      case 'safeguard':
        coefTerrain += 1.0;
    }
  }  
  var ennemiesInPocket = this.getNotFainted(this.bot.room.battle.yourSide.pokemon).slice(1);
  if (ennemiesInPocket.length == 0)
    return 0;
  
  if (this.getStealthRockPressure(ennemiesInPocket) == 12 && this.bot.room.battle.yourSide.sideConditions.stealthrock)
      coefTerrain += 4;
  
  var coefBoosts = 0;
  for (b in this.bot.ennemy.boosts) {
    if (b != 'evasion')
      coefBoosts += 2*(this.bot.ennemy.boosts[b]);
  }
    
  if (dmgTaken > this.bot.pokemon.hp) { // We will die
      return ( (coefBoosts > 0) ? 92 : 29 );
  }
  
  var coef = coefTerrain + coefBoosts;
  return Math.min(92, parseInt( (coef/4) * 63 + 29 )); // OBSCURITEEEEEEEEE HAAAAAAN

};

PokeyI.prototype.evalFakeOut = function(dmg, dmgMoves, dmgTaken) {
    if (this.bot.pokemon.lastmove != "") {
        return 0;
    }
    var numberOfLethalMoves = countTab(dmgMoves, 100);
    if (this.isFaster(this.bot.pokemon, this.bot.ennemy)) {
        if (numberOfLethalMoves && dmg < 100) {
            return 0;
        }    
    }
    return 100;
};

PokeyI.prototype.evalPriorityMove = function(move, dmgMove, dmgTaken) {
  if (dmgMove == 100 || dmgTaken >= this.bot.pokemon.hp) { // If it's enough to kill the ennemy or if we are in danger
      return 100 + move.priority;
  } 
  return dmgMove;
};

PokeyI.prototype.evalBoostMove = function(move, dmgTaken) {
  
  if (!move.secondary.self)
    return 0;
  //Can I set up myself ?
  var k = this.getXHKO(this.bot.pokemon, this.bot.ennemy);
  
  if (k < 2)
      return 0;
  
  //If yes
  for (var b in move.secondary.self.boosts) {
      var coef = this.getMultiplicator(this.bot.pokemon, b);
      if (coef == 4)
          return 0;
      switch (b) {
          case 'spe':
              if (this.canParalyze(this.bot.ennemy) >= 0.5)//no darkness
                  return 0;
              return ( (this.bot.room.myPokemon[0].stats.spe * coef < 438) ? 91 : dmgMove );
          case 'atk':
              if (this.canBurn(this.bot.ennemy) >= 0.5)
                  return 0;
              return ( (this.bot.room.myPokemon[0].stats.atk * coef < 800) ? 91 : dmgMove );
          case 'spa':
              return ( (this.bot.room.myPokemon[0].stats.spa * coef < 800) ? 91 : dmgMove );
          case 'def':
              return ( (this.bot.room.myPokemon[0].stats.def * coef < 800) ? 91 : dmgMove );
          case 'spd':
              return ( (this.bot.room.myPokemon[0].stats.spd * coef < 800) ? 91 : dmgMove );
      }
  }
  return 0;
};

PokeyI.prototype.evalBoostAttack = function(move, dmgMove, dmgTaken) {
  //Can I set up myself ?
  var k = this.getXHKO(this.bot.pokemon, this.bot.ennemy);
  
  if (k < 3)
      return dmgMove;
  
  //If yes
  for (var b in move.boosts) {
      var coef = this.getMultiplicator(this.bot.pokemon, b);
      if (coef == 4)
          return dmgMove;
      switch (b) {
          case 'spe':
              if (this.canParalyze(this.bot.ennemy) >= 0.5)//no darkness
                  return dmgMove;
              return ( (this.bot.room.myPokemon[0].stats.spe * coef < 438) ? 89 : dmgMove );
          case 'atk':
              if (this.canBurn(this.bot.ennemy) >= 0.5)
                  return dmgMove;
              return ( (this.bot.room.myPokemon[0].stats.atk * coef < 800) ? 89 : dmgMove );
          case 'spa':
              return ( (this.bot.room.myPokemon[0].stats.spa * coef < 800) ? 89 : dmgMove );
          case 'def':
              return ( (this.bot.room.myPokemon[0].stats.def * coef < 800) ? 89 : dmgMove );
          case 'spd':
              return ( (this.bot.room.myPokemon[0].stats.spd * coef < 800) ? 89 : dmgMove );
      }
  }
  return 0;
};

/////////////////// UNSSAFE ZONE //////////////////////////////////////

PokeyI.prototype.evalPainSplit = function(move, dmgTaken) { // NOT TESTED NOW

  expectedDamage = this.getMaxDamageTaken(this.bot.pokemon, this.bot.ennemy)[1];
  ennemyHP = parseInt((parseInt(31 + 2 * this.bot.ennemy.baseStats * this.bot.ennemy.level / 100) + 10 + this.bot.ennemy.level) * this.bot.ennemy.hp / 100);

  if (this.isFaster(this.bot.pokemon, this.bot.ennemy)) { // If I should hit first
    newHP = parseInt((ennemyHP + this.bot.pokemon.hp) / 2); // Hp after pain split

    if (newHP < this.bot.pokemon.hp) // We will lose HP
      return 0;

    if (newHP < expectedDamage) { // We will probably die
      ratio = (this.bot.pokemon.hp / this.bot.pokemon.maxhp);
      return (ratio < 0.25) ? 100 : (ratio < 0.5) ? 50 : 0;
    }

    return (newHP / this.bot.pokemon.hp) * 100;
  }

  // If I will hit in second

  expectedHP = this.bot.pokemon.hp - expectedDamage;
  if (expectedHp < 0) // We will die before having done anything
    return 150; // FINAL GAMBIT

  newHP = parseInt((ennemyHP + expectedHP) / 2);

  if (newHP < expectedHP) // We will lose HP
    return 0;

  return (newHP / expectedHP) * 100;
};
