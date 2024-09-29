const { Op, Npcs } = require('../data/db-objects.js');
const { SearchServices } = require('./search-services.js');

const NpcServices = {
  async findNpc(npc) {
    try {
      const instance = await Npcs.findOne({
        where: {
          [Op.or]: [
            { npc_id: npc },
            { name: npc },
            { descriptive_name: npc },
          ]
        }
      });
      if (instance) {
        return instance;
      }
      else {
        return console.log('Npc Services: Npc not found.');
      }
    }
    catch (e) {
      console.error('Main - NpcServices.findNpc error:', e);
    }
  }
}

module.exports = {
  NpcServices
}
