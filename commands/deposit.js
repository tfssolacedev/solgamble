const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'deposit',
    description: 'Deposit coins into your bank.',
    async execute(message, args) {
        const input = args[0]?.toLowerCase();
        const userId = message.author.id;

        if (!input) {
            return message.reply('Usage: `sol deposit [amount]` or `sol deposit all`');
        }

        let amount;
        const user = await User.findOne({ userId });

        if (input === 'all') {
            if (!user || user.balance <= 0) {
                return message.reply("You don't have any coins to deposit.");
            }
            amount = user.balance;
        } else {
            amount = parseInt(input);
            if (isNaN(amount) || amount <= 0) {
                return message.reply('Please provide a valid amount.');
            }
            if (!user || user.balance < amount) {
                return message.reply("You don't have enough coins to deposit.");
            }
        }

        user.balance -= amount;
        user.bank += amount;
        await user.save();

        const embed = new EmbedBuilder()
            .setTitle('🏦 Deposit Successful')
            .setDescription(`Successfully deposited ${amount} coins into your bank.`)
            .setColor('#00BFFF')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};