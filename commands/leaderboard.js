const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'leaderboard',
    description: 'Show top players globally or per-server.',
    async execute(message, args) {
        const scope = args[0]?.toLowerCase() || 'global';
        let users = [];

        if (scope === 'server') {
            const members = message.guild.members.cache.map(m => m.id);
            users = await User.find({ userId: { $in: members } });
        } else {
            users = await User.find({});
        }

        // Sort by total coins (balance + bank)
        users.sort((a, b) => {
            const totalA = a.balance + a.bank;
            const totalB = b.balance + b.bank;
            return totalB - totalA; // Descending order
        });

        // Limit to top 10
        users = users.slice(0, 10);

        if (users.length === 0) return message.reply('No users found.');

        let leaderboard = '';
        users.forEach((user, index) => {
            const total = user.balance + user.bank;
            leaderboard += `${index + 1}. <@${user.userId}> – ${total} coins\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle(scope === 'server' ? '🏆 Top Players (Server)' : '🌍 Top Players (Global)')
            .setDescription(leaderboard)
            .setColor('#FFD700')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};