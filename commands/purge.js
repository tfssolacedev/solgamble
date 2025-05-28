const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'purge',
    description: 'Delete a number of messages from this channel.',
    async execute(message, args) {
        // Check if user has "Manage Messages" permission
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('Please provide a valid number between 1 and 100.');
        }

        try {
            await message.channel.bulkDelete(amount, true); // true = don't delete older than 14 days

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Messages Purged')
                .setDescription(`✅ Successfully deleted **${amount}** message(s).`)
                .setColor('#FF5733')
                .setTimestamp();

            // Send message and store it
            const sentMessage = await message.channel.send({ embeds: [embed] });

            // Delete success message after 20 seconds
            setTimeout(async () => {
                try {
                    await sentMessage.delete();
                } catch (err) {
                    // Ignore error if message was already deleted
                }
            }, 20000); // 20 seconds

        } catch (error) {
            console.error('Error purging messages:', error);
            message.channel.send('❌ There was an error trying to purge messages.');
        }
    }
};