const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'slots',
    description: 'Play slots with a bet. Randomized payouts up to 7x!',
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

        const emojis = ['🍒', '🍋', '🍊', '🍉', '⭐', '💎'];
        const slot1 = emojis[Math.floor(Math.random() * emojis.length)];
        const slot2 = emojis[Math.floor(Math.random() * emojis.length)];
        const slot3 = emojis[Math.floor(Math.random() * emojis.length)];

        let win = false;
        let multiplier = 0;

        if (slot1 === slot2 && slot2 === slot3) {
            // All 3 match: random between 4x - 7x
            multiplier = Math.floor(Math.random() * 4) + 4; // 4 to 7
            win = true;
        } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
            // Two match: random between 1.5x - 3x
            multiplier = (Math.random() * (3 - 1.5) + 1.5).toFixed(2); // float
            multiplier = parseFloat(multiplier);
            win = true;
        }

        if (win) {
            const winnings = Math.floor(bet * multiplier);
            user.balance += winnings;
            message.reply(`${slot1} | ${slot2} | ${slot3} — You matched symbols! You won **${winnings} coins** (×${multiplier})`);
        } else {
            user.balance -= bet;
            message.reply(`${slot1} | ${slot2} | ${slot3} — No match. You lost **${bet} coins**.`);
        }

        await user.save();
    }
};