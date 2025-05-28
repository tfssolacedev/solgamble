const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'steal',
    description: 'Try to steal coins from someone in this server.',
    cooldown: 60,
    async execute(message, args) {
        const mention = message.mentions.users.first();
        if (!mention) return message.reply('Usage: `sol steal @user`');

        const victimId = mention.id;
        const thiefId = message.author.id;

        if (thiefId === victimId) {
            return message.reply("You can't steal from yourself!");
        }

        // Ensure both users are in the same server
        const victimMember = message.guild.members.cache.get(victimId);
        if (!victimMember) {
            return message.reply("That person isn't in this server.");
        }

        let victim = await User.findOne({ userId: victimId });
        let thief = await User.findOne({ userId: thiefId }) || new User({ userId: thiefId });

        if (!victim) {
            return message.reply("That user doesn't exist in the system yet.");
        }

        // Only allow stealing from balance (not bank), and only if balance > 0
        if (victim.balance <= 0) {
            return message.reply("That user has no coins in their balance to steal.");
        }

        // Random percentage between 5% and 75%
        const stealPercent = Math.floor(Math.random() * 71) + 5;
        const amount = Math.floor(victim.balance * (stealPercent / 100));

        // Steal from balance only
        victim.balance -= amount;
        thief.balance += amount;

        await victim.save();
        await thief.save();

        const embed = new EmbedBuilder()
            .setTitle('💰 Heist Successful!')
            .setDescription(`You stole ${amount} coins (${stealPercent}% of their **balance**) from ${mention.username}!`)
            .setColor('#FF4500')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};