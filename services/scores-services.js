const { Op, JankenStats, UserNpcJankenStats, FateScores } = require('../data/db-objects.js');
const { SearchServices } = require('../services/search-services.js');
const { FormatServices } = require('../services/format-services.js');
const { client } = require('../client.js');
const jankenStatsCache = client.jankenStatsCache;
const userNpcJankenStatsCache = client.userNpcJankenStatsCache;
const fateScoresCache = client.fateScoresCache;

const ScoresServices = {
  async getJankenStats(userId) {
    return await SearchServices.fetch(jankenStatsCache, JankenStats, userId);
  },

  async getUserNpcJankenStats(key1, key2) {
    console.log('Get Janken Stats -  Key 1:', key1);
    console.log('Get Janken Stats -  Key 2:', key2);
    return await SearchServices.fetchJunction(userNpcJankenStatsCache, UserNpcJankenStats, key1, key2);
  },

  async calculateJankenResults(results) {
    //console.log('Calculate Janken Results -  Stats:', results);
    //console.log('Calculate Janken Results -  Key 1:', results.key1);
    //console.log('Calculate Janken Results -  Key 2:', results.key2);
    let compositeKey = FormatServices.generateCompositeKey(results.key1.id, results.key2.id);
    console.log('Calculate Janken Results - Composite Key:', compositeKey);
    let userNpcJankenStatsInstance = userNpcJankenStatsCache.get(compositeKey);
     console.log('Tracking Orders - User Npc Janken Stats Instance Cache:', userNpcJankenStatsInstance);

    if (!userNpcJankenStatsInstance) {
      userNpcJankenStatsInstance = await this.getUserNpcJankenStats(results.key1, results.key2);
       console.log('Calculate Janken Results - User Npc Janken Stats Instance Database:', userNpcJankenStatsInstance);
    }

    const userJankenStatsInstance = await this.getJankenStats(results.key1.id);


    const outcome = results.victory ? 'wins' : results.defeat ? 'losses' : 'draws';
    const prev_outcome_keyName = 'prev_' + outcome;
    const prev_outcome = userNpcJankenStatsInstance[outcome];
    console.log('Calculate Janken Results -  Previous Outcome:', prev_outcome);

    const weapon = results.weapon;
    const prev_weapon_keyName = 'prev_' + weapon;
    const prev_weapon = userNpcJankenStatsInstance[weapon];

    const prev_weapon_outcome_keyName = `prev_${weapon}_${outcome}`;
    const weapon_outcome = `${weapon}_${outcome}`;
    const prev_weapon_outcome = userNpcJankenStatsInstance[weapon_outcome];
    userNpcJankenStatsInstance[weapon_outcome] += 1;
    userJankenStatsInstance[weapon_outcome] += 1;

    const prev_energy_spent = userNpcJankenStatsInstance.energy_spent;
    userNpcJankenStatsInstance.energy_spent += results.energy_consumed;
    userJankenStatsInstance.energy_spent += results.energy_consumed;

    const prev_fortune = userNpcJankenStatsInstance.fortune;
    userNpcJankenStatsInstance.fortune += results.rewards.credits;
    userJankenStatsInstance.fortune += results.rewards.credits;

    await userNpcJankenStatsInstance.save();
    userNpcJankenStatsCache.set(results.user_id, userNpcJankenStatsInstance);
    await userJankenStatsInstance.save();
    jankenStatsCache.set(results.user_id, userNpcJankenStatsInstance);
    return {
      ...userNpcJankenStatsInstance.get({ plain: true }),
      [prev_outcome_keyName]: prev_outcome,
      [prev_weapon_keyName]: prev_weapon,
      [prev_weapon_outcome_keyName]: prev_weapon_outcome,
      prev_energy_spent,
      prev_fortune,
    }
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
