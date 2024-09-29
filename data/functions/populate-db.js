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

async function populateCustomers(Customers, customers) {
  try {
    const allCustomers = customers.customers.map(customer => customer);
    await Customers.bulkCreate(allCustomers, {
      updateOnDuplucate: ['customer_id', 'name', 'descriptive_name']
    });
    console.log(`'Customers' upserted.`);
  }
  catch (error) {
    console.log(`'Customers' failed to completely upsert: ${error}`)
  } 
}

async function populateNpcs(Npcs, npcs) {
  try {
    const allNpcs = npcs.npcs.map(npc => npc);
    await Npcs.bulkCreate(allNpcs, {
      updateOnDuplucate: ['npc_id', 'name', 'descriptive_name', 'proper_name', 'janken']
    });
    console.log(`'Npcs' upserted.`);
  }
  catch (error) {
    console.log(`'Npcs' failed to completely upsert: ${error}`)
  } 
}

module.exports = {
  populateItems,
  populateCustomers,
  populateNpcs
}
