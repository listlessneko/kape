//const path = require('node:path');
//const modelafe-items'))(Sequelize);
//const Sequelize = require('sequelize');

async function populateItems(KafeItems, items) {
  try {
    const allItems = items.categories.flatMap(category => category.types.flatMap(type => type.items));
    await KafeItems.bulkCreate(allItems, {
      updateOnDuplucate: ['name', 'value', 'description', 'cost', 'uses', 'category', 'type']
    });
    //for (const category of items.categories) {
    //  for (const drink of category.drinks) {
    //    await KafeItems.upsert({
    //      name: drink.name,
    //      value: drink.value,
    //      description: drink.description,
    //      cost: drink.cost,
    //    });
    //  }
    //}
    console.log(`'Kafe Items' upserted.`);
  }
  catch (error) {
    console.log(`'Kafe Items' failed to completely upsert: ${error}`)
  } 
}

module.exports = {
  populateItems
}
