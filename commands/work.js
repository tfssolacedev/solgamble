const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'work',
    description: 'Work to earn some coins.',
    cooldown: 3600,
    async execute(message) {
        const userId = message.author.id;
        const earnings = Math.floor(Math.random() * 226) + 25;

        let user = await User.findOne({ userId }) || new User({ userId });
        user.balance += earnings;
        await user.save();

        const embed = new EmbedBuilder()
            .setTitle('💼 You Worked!')
            .setDescription(`You earned ${earnings} coins by working hard!`)
            .setColor('#00BFFF')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
