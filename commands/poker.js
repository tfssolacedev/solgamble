const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

// Store command usage timestamps per user: { userId => [timestamps] }
const commandUses = new Map();

// Helper function to generate a poker hand
function generateHand() {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♠', '♥', '♦', '♣'];
    let hand = [];

    while (hand.length < 5) {
        const card = ranks[Math.floor(Math.random() * ranks.length)] + suits[Math.floor(Math.random() * suits.length)];
        if (!hand.includes(card)) hand.push(card);
    }

    return hand;
}

module.exports = {
    name: 'poker',
    description: 'Play a simplified version of poker.',
    async execute(message, args) {
        const userId = message.author.id;

        // === ANTI-SPAM LOGIC ===
        const now = Date.now();
        const cooldownDuration = 10_000; // 10 seconds
        const maxUses = 5;

        // Get user's recent command uses or initialize empty array
        const userUses = commandUses.get(userId) || [];

        // Filter out old timestamps outside the cooldown window
        const recentUses = userUses.filter(timestamp => now - timestamp < cooldownDuration);

        if (recentUses.length >= maxUses) {
            return message.reply("You're using this too often! Please wait a few seconds before trying again.");
        }

        // Add current timestamp and update map
        recentUses.push(now);
        commandUses.set(userId, recentUses);
        // ======================

        const bet = parseInt(args[0]);

        if (isNaN(bet) || bet <= 0) {
            return message.reply('Please provide a valid positive bet.');
        }

        const user = await User.findOne({ userId });
        if (!user || user.balance < bet) {
            return message.reply("You don't have enough coins to bet.");
        }

        const playerHand = generateHand();
        const botHand = generateHand();

        // Simulate outcome - roughly 1 in 4-7 chance to win
        const randomWinChance = Math.floor(Math.random() * 6) + 3;
        const result = Math.random() < 1 / randomWinChance ? 'win' : Math.random() < 0.5 ? 'lose' : 'tie';

        let embed = new EmbedBuilder()
            .setTitle('🃏 Poker')
            .setDescription(`Your hand: ${playerHand.join(', ')}\nBot hand: ${botHand.join(', ')}`)
            .setColor('#FFD700');

        if (result === 'win') {
            const winnings = bet * 2;
            user.balance += winnings;

            embed.setDescription(embed.data.description + `\n✅ You won! (+${winnings} coins)`)
                .setColor('#00FF00');
        } else if (result === 'lose') {
            user.balance -= bet;
            embed.setDescription(embed.data.description + `\n❌ You lost. (-${bet} coins)`)
                .setColor('#FF4500');
        } else {
            embed.setDescription(embed.data.description + '\n🟰 It\'s a tie. No coins gained or lost.')
                .setColor('#808080');
        }

        await user.save();
        message.reply({ embeds: [embed] });
    }
};