const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'gift',
    description: 'Gift coins to a user (Owner only).',
    example: 'sol gift @User 1000',
    async execute(message, args) {
        // === OWNER CHECK ===
        const allowedOwners = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [];

        if (!allowedOwners.includes(message.author.id)) {
            return message.reply("❌ You don't have permission to use this command.");
        }

        // === ARGUMENT VALIDATION ===
        const user = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!user || isNaN(amount) || amount <= 0) {
            return message.reply('Usage: `sol gift @user <amount>`');
        }

        if (user.bot) {
            return message.reply("❌ You cannot gift coins to a bot.");
        }

        // === DATABASE HANDLING ===
        let userData = await User.findOne({ userId: user.id });

        if (!userData) {
            userData = new User({ userId: user.id, balance: 0 });
        }

        userData.balance += amount;
        await userData.save();

        // === SUCCESS EMBED ===
        const embed = new EmbedBuilder()
            .setTitle('🎁 Coins Gifted')
            .setDescription(`Successfully gifted **${amount} coins** to <@${user.id}>`)
            .addFields(
                { name: 'New Balance', value: `${userData.balance} coins`, inline: true }
            )
            .setColor('#00FF00')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};