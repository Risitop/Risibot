function FullPokemon(pokemonGeneral, pokemonPerso) {
  // Used to represent pokemon

  this.accurate = 0.0;
  // in [0;1], represents how sure we are about pokemon's profile
  // = 1.0 if it's our pokemon (we know everything about it)
  // = 0.0 if we don't know ennemy profile at all
  // intermediate values will depend on deductions bot did (soon...)

  this.abilities = pokemonGeneral.abilities; // {0:ab1, 1:ab2, H:ab3}
  this.ability = pokemonGeneral.ability; // "" or "Current ability"
  this.baseAbility = pokemonGeneral.baseAbility; // "" or "Base ability"
  this.types = pokemonGeneral.types; // {0:"Normal", 1:"Psychic"}
  this.name = pokemonGeneral.name; // Weezing the Monstah

  this.baseSpecies = pokemonGeneral.baseSpecies; // Only for mega
  this.species = pokemonGeneral.species; // Weezing
  this.speciesid = pokemonGeneral.speciesid; // weezing -> pokedex id
  this.forme = pokemonGeneral.forme; // Mega etc
  this.formeLetter = pokemonGeneral.formeLetter; // Uknown ?
  this.formeid = pokemonGeneral.formeid; // ?
  this.num = pokemonGeneral.num; // XY pokedex num

  this.baseStats = pokemonGeneral.baseStats; // Smogon stats
  this.ev = {
    "hp": 0,
    "atk": 0,
    "def": 0,
    "spa": 0,
    "spd": 0,
    "spe": 0
  }; // ev repartition
  this.stats = {
    "hp": 0,
    "atk": 0,
    "def": 0,
    "spa": 0,
    "spd": 0,
    "spe": 0
  }; // estimation of stats
  this.level = pokemonGeneral.level;
  this.percenthp = (pokemonGeneral.hp == 1000) ? 100 : pokemonGeneral.hp; // HP in percentage
  this.maxhp = this.getMaxHP(); // Max hp with 31 iv and 0 ev
  this.hp = maxhp * percenthp / 100; // Estimation of current hp
  this.boosts = pokemonGeneral.boosts; // {atk:3, def:3, spe:-3}
  this.status = pokemonGeneral.status; // "brn", "psn"...
  this.statusStage = pokemonGeneral.statusStage; // ???
  this.volatiles = pokemonGeneral.volatiles; // leechseed, confusion....

  this.item = pokemonGeneral.item; // "" or "Leftovers"
  this.moveTrack = pokemonGeneral.moveTrack; // [ ["move1", ppused], ["move2", ppused] ... ]
  this.moves = pokemonGeneral.moves; // [ "move1", "move2", ... ]
  this.movestatuses = pokemonGeneral.movestatuses; // ?

  this.lastmove = pokemonGeneral.lastmove; // "lastmove" (id)
  this.slot = pokemonGeneral.slot; // slot in the team
  this.fainted = pokemonGeneral.fainted; // bool
  this.zerohp = pokemonGeneral.zerohp; // bool
  this.turnstatuses = pokemonGeneral.turnstatuses; // ?

  this.gender = pokemonGeneral.gender; // "" or "m" or "f"
  this.heightm = pokemonGeneral.heightm; // number
  this.weightkg = pokemonGeneral.weightkg; // number

  if (pokemonPerso) {
    this.moves = pokemonPerso.moves;
    this.active = pokemonPerso.active;
    this.baseAbility = pokemonPerso.baseAbility;
    this.gender = pokemonPerso.gender;
    this.hp = pokemonPerso.hp;
    this.maxhp = pokemonPerso.maxhp;
    this.item = pokemonPerso.item;
    this.stats = pokemonPerso.stats;
    this.status = pokemonPerso.status;
    this.species = pokemonPerso.species;
    this.percenthp = parseInt(this.hp / this.maxhp * 100);

    this.accurate = 1.0;
  }
}

FullPokemon.prototype.getMaxHP = function() {
  return Math.floor((31 + 2 * this.baseStats["hp"] + Math.floor(this.ev["hp"] / 4.0)) * this.level / 100.0 + 10 + this.level);
};

FullPokemon.prototype.getStat = function(stat) { //updates the value of a given stat
  return Math.floor(Math.floor(31 + 2 * this.baseStats[stat] + Math.floor(this.ev[stat] / 4.0) * this.level / 100.0 + 5) * 1.0); //replace the 1.0 with the nature
};
