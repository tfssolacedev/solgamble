const { EmbedBuilder } = require('discord.js');
const Reset = require('../models/Reset');
const User = require('../models/User');

module.exports = {
    name: 'resetall',
    description: 'Reset all balances and banks to 0, then give everyone 1000 coins (owners only).',
    ownerOnly: true,
    async execute(message) {
        // Step 1: Reset both balance and bank to 0
        await User.updateMany(
            {}, 
            { 
                $set: { 
                    balance: 0, 
                    bank: 0 
                } 
            }
        );

        // Step 2: Give everyone 1000 balance to start fresh
        await User.updateMany(
            {}, 
            { 
                $inc: { balance: 1000 } 
            }
        );

        // Update next reset date
        const resetDoc = await Reset.findOne();
        resetDoc.nextReset = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
        await resetDoc.save();

        // Send confirmation embed
        const embed = new EmbedBuilder()
            .setTitle('💥 Full Reset & Fresh Start')
            .setDescription('All user balances and banks have been reset to 0.\nThen, everyone received 1000 coins to start fresh!')
            .setColor('#FF4500')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};