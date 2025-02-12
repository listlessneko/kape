export async function populateSupplies(Supplies, supplies) {
  try {
    const allSupplies = supplies.categories.flatMap(category => category.groups.flatMap(group => group.items));
    await Supplies.bulkCreate(allSupplies, {
      updateOnDuplucate: [ 'name', 'value', 'type', 'description', 'cost', 'amount', 'max_amount' ]
    });
    console.log(`[LOG] 'Supplies' populated.`);
  }
  catch (error) {
    console.error(`[ERROR] 'Supplies' failed to completely upsert: ${error.message} ${error.stack}`)
    if (error.errors) {
      error.errors.forEach(err => {
        console.error('Validation error:', err.message);
      });
    }
  } 
}

//export async function populateKapé(KapéItems, kapéItems) {
//  try {
//    const allItems = kapéItems.categories.flatMap(category => category.types.flatMap(type => type.items));
//    const allSupplies = kapéBaristaSupplies.categories.flatMap(category => category.groups.flatMap(group => group.items));
//    for (const item of allItems) {
//      if (item.prepared === false) {
//        if (item.name === 'Pour-over Coffee') {
//          item.modifications = [];
//          const coffeeBeans = allSupplies.find(supply => supply.group === 'coffee beans');
//          for (const coffeeBean of coffeeBeans) {
//            ...item,
//
//          }
//        }
//      }
//    }
//    try {
//      await KapéItems.bulkCreate(allItems, {
//        updateOnDuplucate: ['id', 'name', 'value', 'description', 'content', 'cost', 'energy_replen', 'uses', 'supplies_required', 'category', 'type']
//      });
//      console.log(`[LOG] 'Kafe Items' populated.`);
//    } catch (error) {
//      console.error(error);
//    }
//  }
//  catch (error) {
//    console.error(`[ERROR] 'Kafe Items' failed to completely upsert: ${error.message} ${error.stack}`);
//  } 
//}

export async function populateItems(KafeItems, kafeItems) {
  try {
    const allItems = kafeItems.categories.flatMap(category => category.types.flatMap(type => type.items));
    try {
      await KafeItems.bulkCreate(allItems, {
        updateOnDuplucate: ['id', 'name', 'value', 'description', 'content', 'cost', 'energy_replen', 'uses', 'supplies_required', 'category', 'type']
      });
      console.log(`[LOG] 'Kafe Items' populated.`);
    } catch (error) {
      console.error(error);
    }
  }
  catch (error) {
    console.error(`[ERROR] 'Kafe Items' failed to completely upsert: ${error.message} ${error.stack}`);
  } 
}

export async function populateNpcs(Npcs, npcs) {
  try {
    const allNpcs = npcs.npcs.map(npc => npc);
    await Npcs.bulkCreate(allNpcs, {
      updateOnDuplucate: ['id', 'name', 'descriptive_name', 'proper_name']
    });
    console.log(`[LOG] 'Npcs' populated.`);
  }
  catch (error) {
    console.error(`[ERROR] 'Npcs' failed to completely upsert: ${error}`)
  }
}
