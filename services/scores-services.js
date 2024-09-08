const { Op, RPSScores, FateScores } = require('../data/db-objects.js');
const { SearchServices } = require('../services/search-services.js');
const { client } = require('../client.js');
const rpsScoresCache = client.rpsScoresCache;
const fateScoresCache = client.fateScoresCache;

const ScoresServices = {
  async getRpsScores(...userIds) {
    return await SearchServices.fetch(rpsScoresCache, RPSScores, ...userIds);
  },

  async oldrpsVsKapé(victory, defeat, draw, userId) {
    const user = await this.getRpsScores(userId);
    console.log('rpsVsKapé: user', user);
    console.log('rpsVsKapé: user', user.dataValues);
    console.log('rpsVsKapé: user', user.losses);

    const outcome = victory ? 'wins' : defeat ? 'losses' : 'draws';

    const prev_outcome = user[outcome];
    console.log('rpsVsKapé: prev_outcome', prev_outcome);
    user[outcome] += 1;
    await user.save();
    rpsScoresCache.set(userId, user);
    return {
      user_id: userId,
      prev_outcome,
      current_wins: user.wins,
      current_losses: user.losses,
      current_draws: user.draws
    }
  },

  async rpsVsKapé(score) {
    const user = await this.getRpsScores(score.user_id);
    //user.battles += 1;

    const outcome = score.victory ? 'wins' : score.defeat ? 'losses' : 'draws';
    const prev_outcome_keyName = 'prev_' + outcome;
    const prev_outcome = user[outcome];
    console.log('rpsVsKapé: prev_outcome', prev_outcome);
    //user[outcome] += 1;

    const weapon = score.weapon;
    const prev_weapon_keyName = 'prev_' + weapon;
    const prev_weapon = user[weapon];
    //user[weapon] += 1;

    const prev_weapon_outcome_keyName = `prev_${weapon}_${outcome}`;
    const weapon_outcome = `${weapon}_${outcome}`;
    const prev_weapon_outcome = user[weapon_outcome];
    user[weapon_outcome] += 1;

    const prev_energy_spent = user.energy_spent;
    user.energy_spent += score.energy_consumed;

    const prev_fortune = user.fortune;
    user.fortune += score.reward;

    await user.save();
    rpsScoresCache.set(score.user_id, user);
    return {
      user_id: score.user_id,
      battles: user.battles,
      [prev_outcome_keyName]: prev_outcome,
      current_wins: user.wins,
      current_losses: user.losses,
      current_draws: user.draws,
      [prev_weapon_keyName]: prev_weapon,
      [prev_weapon_outcome_keyName]: prev_weapon_outcome,
      current_rock: user.rock,
      current_rock_w: user.rock_wins,
      current_rock_l: user.rock_losses,
      current_rock_d: user.rock_draws,
      current_paper: user.paper,
      current_paper_w: user.paper_wins,
      current_paper_l: user.paper_losses,
      current_paper_d: user.paper_draws,
      current_scissors: user.scissors,
      current_scissors_w: user.scissors_wins,
      current_scissors_l: user.scissors_losses,
      current_scissors_d: user.scissors_draws,
      prev_energy_spent,
      energy_spent: user.energy_spent,
      prev_fortune,
      fortune: user.fortune
    }
  },

  async rpsRivalsGetUsers(userId1, userId2) {
    // for each user, create a new record of scores per associated user id
  },

  async rpsRivalTracking(userId1, userId2, outcome) {
  },

  async getFateScores(...userIds) {
    return await SearchServices.fetch(fateScoresCache, FateScores, ...userIds);
  },

  async fateScoreTracking(fate) {
    const user = await this.getFateScores(fate.user_id);
    //user.trials_with_fate += 1;

    const side = fate.side;
    const prev_side_keyName = 'prev_' + side;
    const prev_side = user[side];
    //user[side] += 1;

    const outcome = fate.ultra_rare_plus ? 'ultra_rare_plus' : fate.lucky ? 'lucky' : 'unlucky';

    let prev_outcome_side_keyName = ''; 
    let lucky_side = '';
    let unlucky_side = '';
    let ultra_lucky_side = '';
    let prev_lucky_side = null;
    let prev_unlucky_side = null;
    let prev_ultra_lucky_side = null;

    let coin = fate.coin || null;
    let prev_coin_keyName = '';
    let prev_coin = null;
    let prev_fortune = user.fortune;

    if (outcome !== 'ultra_rare_plus') {
      if (outcome === 'lucky') {
        console.log('Fate Scores Tracking - Lucky Outcome:', outcome);
        lucky_side = 'lucky_' + side;
        prev_lucky_side = user[lucky_side];
        console.log('Fate Scores Tracking - Prev Lucky Side Stat:', prev_lucky_side);
        user[lucky_side] += 1;

        prev_coin_keyName = 'prev_' + coin;
        prev_coin = user[coin];
        console.log('Fate Scores Tracking - Prev Coin Stat:', prev_coin);
        user[coin] += 1;

        value = fate.value;
        //user.fortune += value;
      }
      else {
        console.log('Fate Scores Tracking - Unlucky Outcome:', outcome);
        unlucky_side = 'unlucky_' + side;
        prev_unlucky_side = user[unlucky_side];
        user[unlucky_side] += 1;

        prev_coin_keyName = 'prev_coin';
        prev_coin = null;
      }
    }

    else if (outcome === 'ultra_rare_plus') {
      console.log('Fate Scores Tracking - Ultra Rare Plus Outcome:', outcome);
      ultra_lucky_side = 'ultra_lucky_' + side;
      console.log('Fate Scores Tracking - Ultra Lucky Side:', ultra_lucky_side);
      prev_ultra_lucky_side = user[ultra_lucky_side];
      console.log('Fate Scores Tracking - Prev Ultra Lucky Side:', prev_ultra_lucky_side);
      user[ultra_lucky_side] += 1;

      user[outcome] += 1;
      prev_coin_keyName = 'prev_' + coin;
      prev_coin = user[coin];
      user[coin] += 1;
    }


    prev_outcome_side_keyName = prev_lucky_side !== null 
      ? 'prev_' + lucky_side : prev_unlucky_side !== null 
      ? 'prev_' + unlucky_side : 'prev_' + ultra_lucky_side;
    //prev_outcome_side_keyName = 'prev_outcome_side';
    const prev_outcome_keyName = 'prev_' + outcome;
    const prev_outcome = user[outcome];
    //user[outcome] += 1;

    await user.save();
    fateScoresCache.set(fate.user_id, user);
    return {
      user_id: fate.user_id,
      trials_with_fate: user.trials_with_fate,
      outcome, // current outcome
      [prev_outcome_keyName]: prev_outcome, // previous stat for this outcome
      lucky: user.lucky,
      unlucky: user.unlucky,
      ultra_rare_plus: user.ultra_rare_plus,
      side, // current side
      [prev_side_keyName]: prev_side, // previous stat for this side
      heads: user.heads,
      tails: user.tails,
      [prev_outcome_side_keyName]: prev_lucky_side ?? prev_unlucky_side ?? prev_ultra_lucky_side, // previous stat for this outcome and side
      lucky_heads: user.lucky_heads,
      unlucky_heads: user.unlucky_heads,
      ultra_lucky_heads: user.ultra_lucky_heads,
      lucky_tails: user.lucky_tails,
      unlucky_tails: user.unlucky_tails,
      ultra_lucky_tails: user.ultra_lucky_tails,
      coin: coin || null,
      [prev_coin_keyName]: prev_coin, // previous coin if coin obtained this fate
      one_credit: user.one_credit,
      fifty_parts: user.fifty_parts,
      twenty_five_parts: user.twenty_five_parts,
      prev_fortune, // previous fortune amount
      fortune: user.fortune
    };
  },
}

module.exports = {
  ScoresServices
}
