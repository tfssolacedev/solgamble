const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'coinflip',
    description: 'Flip a coin with a bet. Win with random multiplier between 1.5x and 5x!',
    async execute(message, args) {
        const bet = parseInt(args[0]);
        const userId = message.author.id;

        if (isNaN(bet) || bet <= 0) {
            return message.reply('Please provide a valid bet amount.');
        }

        const user = await User.findOne({ userId });
        if (!user || user.balance < bet) {
            return message.reply("You don't have enough coins to place this bet.");
        }

        // Flip coin
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = result === 'heads';

        if (won) {
            // Random multiplier between 1.5x and 5x
            const multiplier = (Math.random() * (5 - 1.5) + 1.5).toFixed(2);
            const winnings = Math.floor(bet * parseFloat(multiplier));

            user.balance += winnings;
            message.reply(`🎉 You flipped heads! You won **${winnings} coins** (×${multiplier})!\nNew balance: ${user.balance}`);
        } else {
            user.balance -= bet;
            message.reply(`😢 You flipped tails. You lost **${bet} coins**.\nNew balance: ${user.balance}`);
        }

        await user.save();
    }
};