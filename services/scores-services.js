const path = require('node:path');
const { Op, RPSScores } = require(path.join(__dirname, '..', 'data', 'db-objects.js'));
const { client } = require(path.join(__dirname, '..', 'client.js'));
const rpsScoresCache = client.rpsScoresCache;

const ScoresServices = {
  async getUsers(...userIds) {

    const usersNotInCache = [];

    userIds.forEach(userId => {
      if (!rpsScoresCache.has(userId)) {
        usersNotInCache.push(userId);
      }
    });

    console.log('ScoresServices - Users Not In Cache:', usersNotInCache);

    if (usersNotInCache.length > 0) {
      const dbUsers = await RPSScores.findAll({
        where: {
          user_id: {
            [Op.in]: usersNotInCache
          }
        }
      });

      console.log('ScoresServices - dbUsers:', dbUsers);

      dbUsers.forEach(user => {
        const userId = user.dataValues.user_id;

        if (!rpsScoresCache.has(userId)) {
          rpsScoresCache.set(userId, user);
        }
      });

      await Promise.all(userIds.map(async (userId) => {
        const userExists = dbUsers.some(user => user.dataValues.user_id === userId);
        console.log('ScoresServices - User:', userId);
        console.log('ScoresServices - User Exists:', userExists);

        if (!userExists) {
          await RPSScores.create({
              user_id: userId
          });
          const newUser = await RPSScores.findOne({
            where: {
              user_id: userId
            }
          });
          console.log('ScoresServices - New User:', newUser);
          rpsScoresCache.set(userId, newUser);
        }
      }));
    }

    if (userIds.length === 1) {
      return rpsScoresCache.get(userIds[0]);
    }
    const cachedUsers = userIds.map(userId => rpsScoresCache.get(userId));
    return cachedUsers;
  },

  async rpsGetAllUsers() {
  },

  async rpsVSKapé(victory, defeat, draw, userId) {
    const user = await this.getUsers(userId);

    const outcome = victory ? 'wins' : defeat ? 'losses' : 'draws';

    const prev_outcome = user[outcome];
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

  async rpsRivalsGetUsers(userId1, userId2) {
  },

  async rpsRivalTracking(userId1, userId2, outcome) {
  }
}

module.exports = {
  ScoresServices
}
