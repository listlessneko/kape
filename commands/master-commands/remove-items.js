const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserItemsServices } = require(path.join(__dirname, '..', '..', 'services', 'user-items-services.js'));
const { KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));

module.exports = {
  cooldown: 5,
  allowedUserId: ['316419893694300160'],
  data: new SlashCommandBuilder()
    .setName('remove-items')
    .setDescription('Remove items to user.')
    .addStringOption(option =>
      option
        .setName('item')
        .setDescription('Input item name.')
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('quantity')
        .setDescription('Input quantity of items.')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Input username.')
    ),

  async autocomplete(interaction) {
    const items = await KafeItems.findAll();
    const focusedValue = interaction.options.getFocused().toLowerCase();

    const choices = items.map(item => ({
      name: item.name,
      value: item.name.toLowerCase()
    }));

    const filtered = choices
      .filter(choice => choice.value.includes(focusedValue))
      .map(choice => ({
        name: choice.name,
        value: choice.name
      }));

    await interaction.respond(filtered);
  },

  async execute(interaction) {
    if (!this.allowedUserId.includes(interaction.user.id)){
      return await interaction.reply({
        content: `You do not have permission to use this command. Please consult with the developer.`,
        ephemeral: true
      });
    }
    const user = interaction.options.getUser('user') ?? interaction.user;
    const selectedItem = interaction.options.getString('item');
    console.log(selectedItem);
    const quantity = interaction.options.getNumber('quantity');

    const item = await KafeItems.findOne({
      where: {
        name: selectedItem
      }
    });

    const result = await UserItemsServices.removeItems(item, quantity, user.id);

    if (result && quantity > 1) {
      await interaction.reply({
        content: `You have removed **${quantity} ${item.name}** from **${user.username}** and sent them to the *Void*.`
      });
    }
    else if (result && quantity === 1) {
      await interaction.reply({
        content: `You have removed **${quantity} ${item.name}** from **${user.username}** and sent it to the *Void*.`
      });
    }

    else {
      await interaction.reply({
        content: `This user does not have ${selectedItem} in their inventory.`
      });
    }
  }
}

