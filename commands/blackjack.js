const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

function getRandomCard() {
    const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
    return cards[Math.floor(Math.random() * cards.length)];
}

function getCardValue(card) {
    if (card === 'J' || card === 'Q' || card === 'K') return 10;
    if (card === 'A') return 11;
    return parseInt(card);
}

module.exports = {
    name: 'blackjack',
    description: 'Play a quick round of Blackjack. Win often, earn small.',
    async execute(message, args, updateUserStats) {
        const bet = parseInt(args[0]);
        const userId = message.author.id;

        if (isNaN(bet) || bet <= 0) {
            return message.reply('Please provide a valid bet.');
        }

        const user = await User.findOne({ userId });
        if (!user || user.balance < bet) {
            return message.reply("You don't have enough coins to bet.");
        }

        let playerCards = [getRandomCard(), getRandomCard()];
        let dealerCards = [getRandomCard(), getRandomCard()];

        let playerTotal = playerCards.reduce((sum, card) => sum + getCardValue(card), 0);
        let dealerTotal = dealerCards.reduce((sum, card) => sum + getCardValue(card), 0);

        // Dealer logic
        while (dealerTotal < 17) {
            dealerCards.push(getRandomCard());
            dealerTotal = dealerCards.reduce((sum, card) => sum + getCardValue(card), 0);
        }

        let resultMessage = `Your cards: ${playerCards.join(', ')} (Total: ${playerTotal})\nDealer's cards: ${dealerCards.join(', ')} (Total: ${dealerTotal})`;

        let playerWon = false;
        let winAmount = 0;

        if (playerTotal > 21) {
            // Player bust
            user.balance -= bet;
            resultMessage += '\n❌ Bust! You lost.';
        } else if (dealerTotal > 21) {
            // Dealer bust
            const multiplier = 1.5 + Math.random() * 1.5; // between 1.5x and 3x
            winAmount = Math.floor(bet * multiplier);
            user.balance += winAmount;
            resultMessage += `\n🎉 Dealer bust! You won **${winAmount} coins**!`;
            playerWon = true;
        } else if (playerTotal > dealerTotal) {
            // Player wins
            const multiplier = 1.5 + Math.random() * 1.5;
            winAmount = Math.floor(bet * multiplier);
            user.balance += winAmount;
            resultMessage += `\n✅ You beat the dealer! You won **${winAmount} coins**!`;
            playerWon = true;
        } else if (playerTotal < dealerTotal) {
            // Dealer wins — apply 65% override if applicable
            const shouldPlayerWin = Math.random() < 0.65;
            if (shouldPlayerWin) {
                const multiplier = 1.5 + Math.random() * 1.5;
                winAmount = Math.floor(bet * multiplier);
                user.balance += winAmount;
                resultMessage += `\n🍀 Lucky break! You won **${winAmount} coins**!`;
                playerWon = true;
            } else {
                user.balance -= bet;
                resultMessage += '\n❌ Dealer won.';
                playerWon = false;
            }
        } else {
            // Push
            resultMessage += '\n🟰 Push (tie). No coins gained or lost.';
        }

        // Update user stats in the database
        await updateUserStats(userId, playerWon ? 'win' : 'loss', winAmount || bet);

        const embed = new EmbedBuilder()
            .setTitle('🃏 Blackjack')
            .setDescription(resultMessage)
            .setColor(playerWon ? '#00FF00' : '#FF0000');

        await user.save();
        message.reply({ embeds: [embed] });
    }
};