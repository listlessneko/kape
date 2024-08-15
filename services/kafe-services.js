const path = require('node:path');
const { Op, KafeItems } = require(path.join(__dirname, '..', 'db-objects.js'));

const KafeServices = {
  async checkKafeInventory(itemToCheck) {
    const item = await KafeItems.findOne({
      where: {
        [Op.or]: {
          item_id: itemToCheck,
          name: itemToCheck,
          value: itemToCheck
        }
      }
    });
    if (item) {
      return {
        item: item,
        inStock: true
      };
    }
    else {
      return false;
    }
  }
}

const test = await KafeServices.checkKafeInventory('drip-coffee');
console.log('test:', test);

module.exports = {
  KafeServices
}
