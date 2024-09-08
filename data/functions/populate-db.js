async function populateItems(KafeItems, items) {
  try {
    const allItems = items.categories.flatMap(category => category.types.flatMap(type => type.items));
    await KafeItems.bulkCreate(allItems, {
      updateOnDuplucate: ['name', 'value', 'description', 'content', 'cost', 'energy_replen', 'uses', 'category', 'type']
    });
    console.log(`'Kafe Items' upserted.`);
  }
  catch (error) {
    console.log(`'Kafe Items' failed to completely upsert: ${error}`)
  } 
}

async function populateLevels(UserLevels, levels) {
  try {
    const allLevels = levels.map(level => level);
    await UserLevels.bulkCreate(allLevels, {
      updateOnDuplucate: ['level', 'experience']
    });
    console.log(`'User Levels' upserted.`);
  }
  catch (error) {
    console.log(`'User Levels' failed to completely upsert: ${error}`)
  } 
}


module.exports = {
  populateItems,
  populateLevels
}
