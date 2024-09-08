const { Op } = require('../data/db-objects.js');

const SearchServices = {
  async fetch(Cache, Database, ...userIds) {
    const usersNotInCache = [];

    userIds.forEach(userId => {
      if (!Cache.has(userId)) {
        usersNotInCache.push(userId);
      }
    });

    //console.log('Get User - User Not In Cache:', usersNotInCache);

    if (usersNotInCache.length > 0) {
      const dbUsers = await Database.findAll({
        where: {
          user_id: {
            [Op.in]: usersNotInCache
          }
        }
      });

      //console.log('Get User - User In Database:', dbUsers);

      if (dbUsers.length > 0) {
        dbUsers.forEach(user => {
          //console.log('dbusers:', user);
          const userId = user.dataValues.user_id;

          if (!Cache.has(userId)) {
            Cache.set(userId, user);
          }
        });
      }

      await Promise.all(userIds.map(async (userId) => {
        const userExists = (dbUsers.some(user => user.dataValues.user_id === userId));

        //console.log('Get User - Database User Exists:', userExists);
        if (!userExists) {
          await Database.create({
            user_id: userId
          });
          const newUser = await Database.findOne({
            where: {
              user_id: userId
            }
          });
          Cache.set(userId, newUser);
        }
      }));
    }

    if (userIds.length === 1) {
      const cachedUser = Cache.get(userIds[0]);
      //console.log('Get User - Cached User:', cachedUser);
      return cachedUser;
    }
    const cachedUsers = userIds.map(userId => Cache.get(userId));
    return cachedUsers;

  },

  binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
      let middle = Math.floor(right / 2);

      if (arr[middle] === target) {
        return middle;
      }
      if (arr[middle] < target) {
        left = middle + 1;
      }
      else if (arr[middle] > target) {
        right = middle - 1;
      }
      return -1;
    }
  }
};

module.exports = {
  SearchServices
}
