const { Op } = require('../data/db-objects.js');
const { FormatServices } = require('./format-services.js');

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
        console.log('Get User - UserId:', userId);
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

  async fetchJunction(Cache, Database, key1, key2) {
    console.log('Fetch Junction - Key 1:', key1);
    console.log('Fetch Junction - Key 2:', key2);
    const compositeKey = FormatServices.generateCompositeKey(key1.id, key2.id);
     console.log('Fetch Junction - Composite Key:', compositeKey);

    if (Cache.has(compositeKey)) {
    console.log('Fetch Junction - Cache:', Cache.get(compositeKey));
      return Cache.get(compositeKey);
    }

    console.log('Fetch Junction - Database:', Database);

    const db = await Database.findOne({
      where: {
        composite_key: compositeKey
      }
    });

     console.log('Fetch Junction - db:', db);


    if (!db) {
      const field1 = key1.name;
      console.log('Fetch Junction - Key 1 Name:', key1.name);
      const field2 = key2.name;
      console.log('Fetch Junction - Key 2 Name:', key2.name);

      await Database.create({
        [field1]: key1.id,
        [field2]: key2.id
      });

    }
    const instance = await Database.findOne({
      where: {
        composite_key: compositeKey
      }
    });
    // console.log('Fetch Junction - New Instance:', instance);
    Cache.set(compositeKey, instance);


    const cachedInstance = Cache.get(compositeKey);
    // console.log('Fetch Junction - Cached Instance:', cachedInstance);
    return cachedInstance;

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
