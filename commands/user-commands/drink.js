const path = require('node:path');
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const { SlashCommandBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { Users, KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('drink')
    .setDescription('Consume a drink.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('order')
        .setDescription('Order from cafe and consume immediately.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Consume a drink from your inventory.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'order') {
      const subMenu = client.menus.get('drinks-sub-menu');
      const response = await interaction.reply({
        content: subMenu.content,
        components: [subMenu.row]
      });

      try {
        const collector = await response.createMessageComponentCollector({
          ComponentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          const menu = client.menus.get(i.values[0])
          console.log('Drink Menu:', menu);
          const selectedValue = i.values[0];

          if (i.user.id === interaction.user.id) {
            if (menu) {
              await i.update({
                content: menu.content,
                components: [menu.row]
              });
            }

            else if (!menu) {
              if (selectedValue === 'nevermind') {
                await i.update({
                  content: `Oh, maybe next time.`,
                  components: []
                });
                collector.stop('User canceled order.');
                return;
              }

              const item = await KafeItems.findOne({
                where: { value: selectedValue }
              });
              const user = await Users.findOne({
                where: { user_id: interaction.user.id }
              })
              try {
                if (item) {
                  try {
                    if (item.cost < user.balance) {
                      await UserServices.subtractBalance(user.id, item.cost);
                      await UserServices.addItem(user.id, item);
                      await UserServices.addEnergy(user.id, item.energy_replen);
                      await interaction.editReply({
                        content: `Here is your **${item.name.toLowerCase()}**. Please enjoy it.\n*You drink all of it in one gulp.*`,
                        components: []
                      });
                      collector.stop('Drink consumed from cafe.');
                    }
                    else if (item.cost > user.balance) {
                      await interaction.editReply({
                        content: `Hm... You don't have enough credits. Maybe come back next time.`,
                        components: []
                      });
                    }
                  }
                  catch (e) {
                    console.error('An unexpected error occurred in evaluating item cost and user balance:', e);
                  }
                }
              }
              catch (e) {
                console.error('Not an item. Error:', e);
              }
            }
          }
          else if (i.user.id !== interaction.user.id) {
            await i.update({
              content: `Please wait your turn.`,
              components: [],
              ephemeral: true
            });
          }
        });
        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            console.log('Drink Command: Time limit reached.');
            interaction.editReply({
              content: `Hm... Take your time then.`,
              components: []
            });
          }
          console.log('Drink Command:', reason);
        });
      }
      catch (e) {
        console.error('An unexpected error occurred:', e);
        await i.update({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }

    else if (subcommand === 'inventory') {
      const inventory = new StringSelectMenuBuilder()
        .setCustomId('inventory')
        .setPlaceholder('View your inventory.')

      const userItems = await UserServices.getUserItems(interaction.user.id);

      userItems.forEach(userItem => {
        const item = userItem.dataValues;
        if (item.category === 'drinks') {
          inventory.addOptions(
            new StringSelectMenuOptionBuilder()
            .setLabel(`${item.name} (${item.energy_replen} energy)`)
            .setValue(item.value)
            .setDescription(item.description)
          )
        }
      });
      const row = new ActionRowBuilder().addComponents(inventory);

      const response = await interaction.reply({
        content: `*What do I have...?*`,
        components: [row]
      });

      try {
        const collector = response.createMessageComponentCollector({
          ComponentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          if (i.user.id === interaction.user.id) {
            const selectedValue = i.values[0];
            const user = interaction.user.id;
            await UserServices.removeItems(user, selectedValue, 1);
            await UserServices.addEnergy(user, selectedValue.energy_replen);
            await i.update({
              content: `*You gulp down the entire beverage.*`,
              components: []
            });
            collector.stop('Drink consumed form inventory.');
          }
          else if (i.user.id !== interaction.user.id) {
            await i.update({
              content: `Please wait your turn.`,
              components: [],
              ephemeral: true
            });
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            console.log('Time limit reached.');
            interaction.editReply({
              content: `Distracted? Give it some more thought.`,
              components: []
            });
          }
          else {
            console.log(reason);
          }
        });
      }
      catch (e) {
        console.error('An unexpected error occurred:', e);
        await interaction.editReply({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }
  }
}
