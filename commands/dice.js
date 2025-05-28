const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'dice',
    description: 'Roll a dice with a bet.',
    async execute(message, args) {
        const bet = parseInt(args[0]);
        const userId = message.author.id;

        if (isNaN(bet) || bet <= 0) {
            return message.reply('Please provide a valid bet.');
        }

        const user = await User.findOne({ userId });
        if (!user || user.balance < bet) {
            return message.reply("You don't have enough coins to bet.");
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll >= 4) {
            user.balance += bet;
            message.reply(`🎲 You rolled a ${roll}! You won ${bet} coins. New balance: ${user.balance}`);
        } else {
            user.balance -= bet;
            message.reply(`😢 You rolled a ${roll}. You lost ${bet} coins. New balance: ${user.balance}`);
        }

        await user.save();
    }
};
