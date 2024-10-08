const { Op, KafeItems } = require('../data/db-objects.js');

const KafeServices = {
  async findItem(itemToCheck) {
    try {
      const item = await KafeItems.findOne({
        where: {
          [Op.or]: [
            { id: itemToCheck },
            { name: itemToCheck },
            { value: itemToCheck }
          ]
        }
      });
      if (item) {
        return item;
      }
      else {
        return;
      }
    }
    catch (e) {
      console.error('Main - KafeServices.findItem error:', e);
    }
  }
}

module.exports = {
  KafeServices
}
