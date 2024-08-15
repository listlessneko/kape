const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));


module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('add-items')
    .setDescription('Add items to user.')
    .addStringOption(option =>
      option
        .setName('item')
        .setDescription('Input item name.')
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Input amount of items.')
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
    const user = interaction.options.getUser('user') ?? interaction.user;
    const selectedItem = interaction.options.getString('item');
    console.log(selectedItem);
    const amount = interaction.options.getNumber('amount');

    const item = await KafeItems.findOne({
      where: {
        name: selectedItem
      }
    });

    await UserServices.addItems(user.id, item.id, amount);

    if (user === interaction.user.id) {
      await interaction.reply({
        content: `You have given yourself **${amount} ${item.name}**. What are you going to do with that?`
      });
    }
      await interaction.reply({
        content: `You have given **${amount} ${item.name}** to **${user.username}**.`
      });
  }
}
