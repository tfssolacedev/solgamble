const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'withdraw',
    description: 'Withdraw coins from your bank.',
    async execute(message, args) {
        const amount = parseInt(args[0]);
        const userId = message.author.id;

        if (isNaN(amount) || amount <= 0) {
            return message.reply('Please provide a valid amount.');
        }

        const user = await User.findOne({ userId });
        if (!user || user.bank < amount) {
            return message.reply("You don't have enough coins in your bank.");
        }

        user.balance += amount;
        user.bank -= amount;
        await user.save();

        const embed = new EmbedBuilder()
            .setTitle('🏧 Withdraw Successful')
            .setDescription(`Successfully withdrew ${amount} coins from your bank.`)
            .setColor('#00BFFF')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
