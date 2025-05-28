const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'roulette',
    description: 'Bet on red/black in roulette. Rare wins, big payouts!',
    async execute(message, args) {
        // Make sure the command starts with "sol"
        if (!message.content.startsWith('sol')) return;

        const input = message.content.slice(4).trim().split(/ +/);
        const command = input[0]; // This should be "roulette"

        // Only handle 'roulette' command
        if (command !== 'roulette') return;

        const bet = parseInt(input[1]);
        const choice = input[2]?.toLowerCase();
        const userId = message.author.id;

        if (isNaN(bet) || bet <= 0 || !['red', 'black'].includes(choice)) {
            return message.reply('Usage: `sol roulette [amount] [red/black]`');
        }

        const user = await User.findOne({ userId });
        if (!user || user.balance < bet) {
            return message.reply("You don't have enough coins to bet.");
        }

        // Lowered win chance to 10%
        const win = Math.random() < 0.1;

        if (win) {
            const multiplier = Math.floor(Math.random() * 5) + 2; // Random multiplier from 2 to 6
            const winnings = bet * multiplier;

            user.balance += winnings;
            message.reply(`🎉 Roulette landed on ${choice}! You hit the jackpot and won **${winnings} coins** (×${multiplier})!`);
        } else {
            user.balance -= bet;
            message.reply(`🔴 Roulette landed on ${choice === 'red' ? 'black' : 'red'}. You lost **${bet} coins**.`);
        }

        await user.save();
    }
};