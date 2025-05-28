const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'balance',
    description: 'Check your or someone else\'s balance.',
    async execute(message, args) {
        let targetUser = message.author;
        let mentionedUser = null;

        // Check if a user was mentioned
        const mention = message.mentions.users.first();
        if (mention) {
            mentionedUser = await message.guild.members.fetch(mention).catch(() => null);

            if (!mentionedUser) {
                return message.reply("That user isn't in this server.");
            }

            targetUser = mentionedUser.user;
        }

        // Fetch user data from DB
        let user = await User.findOne({ userId: targetUser.id });

        if (!user) {
            user = new User({ userId: targetUser.id });
            await user.save();
        }

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(`${targetUser.username}'s Balance`)
            .setDescription(`Here’s ${targetUser.username}'s current financial status:`)
            .addFields(
                { name: '💰 In Hand', value: `${user.balance}`, inline: true },
                { name: '🏦 In Bank', value: `${user.bank}`, inline: true },
                { name: '💎 Total Net Worth', value: `${user.balance + user.bank}`, inline: true }
            )
            .setColor('#00FF00')
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

        // Send response
        message.reply({ embeds: [embed] });
    }
};