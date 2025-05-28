const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'transfer',
    description: 'Transfer coins to another user (with 8% fee).',
    async execute(message, args) {
        const mention = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!mention || isNaN(amount) || amount <= 0) {
            return message.reply('Usage: `sol transfer @user [amount]`');
        }

        const senderId = message.author.id;
        const receiverId = mention.id;

        // Make sure both users are in the same server
        const guild = message.guild;
        const receiverMember = guild.members.cache.get(receiverId);
        if (!receiverMember) {
            return message.reply("That person isn't in this server.");
        }

        const sender = await User.findOne({ userId: senderId });
        const receiver = (await User.findOne({ userId: receiverId })) || new User({ userId: receiverId });

        if (!sender || sender.balance < amount) {
            return message.reply("You don't have enough coins to transfer.");
        }

        // Calculate 8% fee
        const fee = Math.floor(amount * 0.08);
        const amountReceived = amount - fee;
        const totalDeduction = amount; // Sender is charged full amount

        // Deduct from sender, add received amount to receiver (no fee on their side)
        sender.balance -= totalDeduction;
        receiver.balance += amountReceived;

        await sender.save();
        await receiver.save();

        const embed = new EmbedBuilder()
            .setTitle('💸 Transfer Successful')
            .setDescription(`Transferred **${amount} coins** to ${mention}.\n\n🧾 **Fee**: ${fee} coins (8%)\n📥 **Receiver got**: ${amountReceived} coins`)
            .setColor('#00BFFF')
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};