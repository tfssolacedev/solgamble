const { EmbedBuilder } = require('discord.js');
const Reset = require('../models/Reset');
const User = require('../models/User');

module.exports = {
    name: 'reset',
    description: 'Extend or manually trigger balance reset (owners only).',
    ownerOnly: true,
    async execute(message, args) {
        const subCommand = args[0];
        const days = parseInt(args[1]);

        if (subCommand === 'extend' && !isNaN(days)) {
            const resetDoc = await Reset.findOne();
            resetDoc.nextReset.setDate(resetDoc.nextReset.getDate() + days);
            await resetDoc.save();

            const embed = new EmbedBuilder()
                .setTitle('🔁 Reset Extended')
                .setDescription(`Next auto-reset extended by ${days} days.`)
                .setColor('#00BFFF')
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } else {
            message.reply('Invalid usage. Use: ');
        }
    }
};
