import * as Models from '../models/models-barrel.js';

export default function defineAssociations() {
  Models.KafeItems.hasMany(Models.UserItems, {
    // defines the foreign key in the target model
    foreignKey: 'item_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Models.UserItems.belongsTo(Models.KafeItems, {
    // defines the foreign key in this target model
    // by default, the foreign key references the primary key of the source model
    // 'as' defines it's alias
    foreignKey: 'item_id', as: 'kafeItem'
  });

  console.log(`[LOG] Associations made.`);
}
