const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'coinflip-multi',
    description: 'Start a multiplayer coinflip game with another user.',
    async execute(message, args) {
        // Check for proper usage
        if (!args[0] || !args[1] || !['heads', 'tails'].includes(args[2]?.toLowerCase())) {
            return message.reply('Usage: `sol coinflip-multi @user <amount> <heads/tails>`');
        }

        const opponent = message.mentions.users.first();

        if (!opponent) {
            return message.reply('You must mention a valid user!');
        }

        if (opponent.bot) {
            return message.reply("You can't play against bots!");
        }

        if (message.author.id === opponent.id) {
            return message.reply("You can't play against yourself!");
        }

        const amount = parseInt(args[1]);
        const chosenSide = args[2].toLowerCase(); // heads or tails

        if (isNaN(amount) || amount <= 0) {
            return message.reply('Please provide a valid bet amount.');
        }

        const author = await User.findOne({ userId: message.author.id });
        const opponentUser = await User.findOne({ userId: opponent.id });

        if (!author || author.balance < amount) {
            return message.reply(`<@${message.author.id}>, you don't have enough coins.`);
        }

        if (!opponentUser || opponentUser.balance < amount) {
            return message.reply(`<@${opponent.id}> doesn't have enough coins.`);
        }

        const embed = new EmbedBuilder()
            .setTitle('🪙 Coinflip Challenge')
            .setDescription(
                `<@${message.author.id}> has challenged <@${opponent.id}> to a coinflip for **${amount} coins**!\n` +
                `<@${message.author.id}> chose **${chosenSide.charAt(0).toUpperCase() + chosenSide.slice(1)}**.\n\n` +
                `<@${opponent.id}>, click the button below to accept.`
            )
            .setColor('#00BFFF')
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('accept_coinflip')
                .setLabel('Accept Coinflip')
                .setStyle(ButtonStyle.Success)
        );

        const reply = await message.reply({ embeds: [embed], components: [row] });

        const filter = (interaction) => interaction.customId === 'accept_coinflip' && interaction.user.id === opponent.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 30000 });

        let gameCompleted = false;

        collector.on('collect', async (interaction) => {
            if (gameCompleted) return;
            gameCompleted = true;

            // Deduct bets
            author.balance -= amount;
            opponentUser.balance -= amount;

            // Simulate fair coinflip
            const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
            const winner = coinResult === chosenSide ? message.author.id : opponent.id;

            let winAmount = amount * 2;

            // Optional: Add 5% house fee
            const takeFee = false; // change to true if needed
            if (takeFee) {
                winAmount = Math.floor(winAmount * 0.95); // 5% fee
            }

            let resultMessage;
            if (winner === message.author.id) {
                author.balance += winAmount;
                resultMessage = `<@${message.author.id}> won **${winAmount} coins**!`;
            } else {
                opponentUser.balance += winAmount;
                resultMessage = `<@${opponent.id}> won **${winAmount} coins**!`;
            }

            await author.save();
            await opponentUser.save();

            const resultEmbed = new EmbedBuilder()
                .setTitle('🪙 Coinflip Result')
                .setDescription(
                    `The coin landed on **${coinResult.charAt(0).toUpperCase() + coinResult.slice(1)}**!\n\n` +
                    `${resultMessage}`
                )
                .setColor('#00FF00');

            await interaction.update({ embeds: [resultEmbed], components: [] });
        });

        collector.on('end', async () => {
            if (!gameCompleted) {
                await message.reply('⏰ Time ran out. The challenge was canceled.');
            }
        });
    }
};