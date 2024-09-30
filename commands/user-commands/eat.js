const path = require('node:path');
const { client } = require(path.join(__dirname, '..', '..', 'client.js'));
const { SlashCommandBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { UserServices } = require(path.join(__dirname, '..', '..', 'services', 'user-services.js'));
const { UserItemsServices } = require(path.join(__dirname, '..', '..', 'services', 'user-items-services.js'));
const { KafeServices } = require(path.join(__dirname, '..', '..', 'services', 'kafe-services.js'));
const { MathServices } = require('../../services/math-services.js');
const { Users, KafeItems } = require(path.join(__dirname, '..', '..', 'data', 'db-objects.js'));

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('eat')
    .setDescription('Consume a food.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('order')
        .setDescription('Order from cafe and consume immediately.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Consume a food from your inventory.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'order') {
      const subMenu = client.menus.get('food-sub-menu');
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
                return collector.stop('Eat Cmd: User canceled order.');
              }

              const item = await KafeServices.findItem(selectedValue);
              const user = await UserServices.getUsers(interaction.user.id);

              try {
                if (item) {
                  try {
                    if (item.cost <= user.balance) {
                      await UserServices.subtractBalance(item.cost, user.user_id);

                      let energy = '';

                      if (item.energy_replen.min !== item.energy_replen.max) {
                        console.log('Eat Cmd - Energy Diff');
                        const interval = 5;
                        const energyDiff = MathServices.randomMultiple(item.energy_replen.min, item.energy_replen.max, interval);
                        energy = energyDiff.fate;
                        console.log('Eat Cmd - Fate:', energy);
                      }
                      else {
                        energy = item.energy_replen.max;
                      }
                      if (energy <= 0) {
                        await UserServices.addEnergy(energy, user.user_id);
                        await interaction.editReply({
                          content: `*Here is your **${item.name.toLowerCase()}**. Please enjoy it.\n\n*You eat the entire thing in one bite. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(energy)} energy**`,
                          components: []
                        });
                        return collector.stop('Food unfortunatey consumed from cafe.');
                      }
                      else {
                        await UserServices.addEnergy(energy, user.user_id);
                        await interaction.editReply({
                          content: `Here is your **${item.name.toLowerCase()}**. Please enjoy it.\n*You drink all of it in one gulp.*\n\n-# **${MathServices.formatNumber(energy)} energy**`,
                          components: []
                        });
                        return collector.stop('Food consumed from cafe.');
                      }
                    }
                    else if (item.cost > user.balance) {
                      await interaction.editReply({
                        content: `Hm... You lack the sufficient credits to purchase this item. Maybe come back next time.`,
                        components: []
                      });
                      return collector.stop('User canceled order.');
                    }
                  }
                  catch (e) {
                    console.error('Eat Cmd: An unexpected error occurred in evaluating item cost and user balance:', e);
                  }
                }
              }
              catch (e) {
                console.error('Eat Cmd: Not an item. Error:', e);
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
            console.log('Eat Cmd: Time limit reached.');
            return interaction.editReply({
              content: `Hm... Take your time then.`,
              components: []
            });
          }
          return console.log('Eat Cmd:', reason);
        });
      }
      catch (e) {
        console.error('Eat Cmd: An unexpected error occurred:', e);
        return await i.update({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }

    else if (subcommand === 'inventory') {
      const inventory = new StringSelectMenuBuilder()
        .setCustomId('inventory')
        .setPlaceholder('View your inventory.')

      const userItems = await UserItemsServices.getUserItems({requestModelInstance: false}, interaction.user.id);

      userItems.forEach(userItem => {
        const i = userItem.kafeItem;
        console.log('Eat Inventory - Item:', i);
        const max = MathServices.formatNumber(i.energy_replen.max);
        const min = MathServices.formatNumber(i.energy_replen.min);
        inventory.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(
              (() => {
                if (i.energy_replen.min === i.energy_replen.max) {
                  return `${i.name} (${max} energy)`;
                }
                else {
                  return `${i.name} (${min} to ${max} energy)`;
                }
              })()
            )
            .setValue(i.value)
            .setDescription(i.description)
        )
      });

      if (inventory.options.length === 0) {
        return await interaction.reply({
          content: `*You ruffle through your bag and realize you don't have any food...*`
        });
      }

      inventory.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Nevermind')
          .setValue('nevermind')
          .setDescription('Close bag.')
      )

      const row = new ActionRowBuilder().addComponents(inventory);

      const response = await interaction.reply({
        content: `*Hm...*`,
        components: [row]
      });

      try {
        const collector = response.createMessageComponentCollector({
          ComponentType: ComponentType.StringSelect,
          time: 60_000
        });

        collector.on('collect', async i => {
          const selectedValue = i.values[0];

          if (i.user.id === interaction.user.id) {
            if (selectedValue === 'nevermind') {
              await i.update({
                content: `*You close your bag.*`,
                components: []
              });
              return collector.stop('Eat Cmd: User closed bag.')
            }

            const item = await KafeServices.findItem(selectedValue);
            const user = interaction.user.id;

            await UserItemsServices.removeItems(item, 1, user);

            let energy = '';

            if (item.energy_replen.min !== item.energy_replen.max) {
              console.log('Eat Cmd - Energy Diff');
              const interval = 5;
              const energyDiff = MathServices.randomMultiple(item.energy_replen.min, item.energy_replen.max, interval);
              energy = energyDiff.fate;
              console.log('Eat Cmd - Fate:', energy);
            }
            else {
              energy = item.energy_replen.max;
            }
            if (energy <= 0) {
              await UserServices.addEnergy(energy, user);
              await i.update({
                content: `*You eat the entire thing in one bite. Your stomach starts to feel strange and you have a sudden urge to find the nearest restroom.*\n\n-# **${MathServices.formatNumber(energy)} energy**`,
                components: []
              });
              return collector.stop('Food consumed from inventory.');
            }
            else {
              await UserServices.addEnergy(energy, user);
              await i.update({
                content: `*You eat the entire thing in one bite.*\n\n-# **${MathServices.formatNumber(energy)} energy**`,
                components: []
              });
              return collector.stop('Eat Cmd: Food consumed from inventory.');
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
            console.log('Eat Cmd: Time limit reached.');
            return interaction.editReply({
              content: `Distracted? Give it some more thought.`,
              components: []
            });
          }
          else {
            return console.log(reason);
          }
        });
      }
      catch (e) {
        console.error('Eat Cmd: An unexpected error occurred:', e);
        return await interaction.editReply({
          content: `*A cat screeches and glass breaks behind the kitchen doors.*\nPlease wait while I take care of something...`,
          components: [],
        });
      }
    }
  }
}
