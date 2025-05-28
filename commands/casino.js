const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    name: 'casino',
    description: 'Show balance and available commands.',
    async execute(message) {
        const userId = message.author.id;
        let user = await User.findOne({ userId });

        if (!user) {
            user = new User({ userId });
            await user.save();
        }

        const embed = new EmbedBuilder()
            .setTitle('🎰 Welcome to SolGamble Casino')
            .setDescription('Here’s your current balance and all the games & commands you can use:')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '💰 Wallet Balance',
                    value: `${user.balance} SOL`,
                    inline: true
                },
                {
                    name: '🏦 Bank Balance',
                    value: `${user.bank} SOL`,
                    inline: true
                },
                { name: '\u200B', value: '\u200B' }, // Spacer field
                {
                    name: '🎮 Available Commands',
                    value: `
**🪙 Gambling**
\`sol coinflip [bet]\` – Flip a coin solo  
\`sol coinflip-multi @user [amount] <heads/tails>\` – Challenge someone & pick your side  
\`sol dice [bet]\` – Roll the dice  
\`sol slots [bet]\` – Try slot machine luck  
\`sol roulette [bet]\` – Bet on red/black/number  
\`sol blackjack [bet]\` – Play 21 against the dealer  
\`sol poker [bet]\` – Texas Hold'em style game  

**💼 Economy**
\`sol work\` – Earn coins every few minutes  
\`sol balance\` or @mention – View balance  
\`sol deposit [amount]\` – Secure your coins in the bank  
\`sol withdraw [amount]\` – Withdraw from bank  
\`sol transfer @user [amount]\` – Send coins to someone  
\`sol steal @user\` – Risky theft attempt  

**📊 Stats**
\`sol leaderboard [server/global]\` – Top players  
\`sol servers\` – See where I'm active  

**🔒 Admin/Owner Only**
\`sol reset extend [days]\` – Extend next balance reset  
\`sol resetall\` – Reset all balances globally (DANGEROUS)  
\`sol purge [amount]\` – Delete recent messages  
                    `
                }
            )
            .setFooter({ text: 'Use sol help for full details on any command!' })
            .setColor('#FFD700')
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};