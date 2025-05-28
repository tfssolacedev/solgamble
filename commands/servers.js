const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'servers',
    description: 'Show all servers the bot is in.',
    async execute(message) {
        const guilds = [...message.client.guilds.cache.values()]; // Fixed here

        const embed = new EmbedBuilder()
            .setTitle('🌐 Servers I’m In')
            .setDescription('Below are the servers I am currently active in.')
            .setColor('#00BFFF');

        for (const guild of guilds) {
            try {
                const invites = await guild.invites.fetch();
                const invite = invites.first() || await guild.channels.cache
                    .filter(c => c.isText() && c.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE'))
                    .first()?.createInvite({ maxUses: 1, unique: true });

                embed.addFields({
                    name: `${guild.name} (${guild.memberCount} members)`,
                    value: invite ? invite.url : 'No invite available'
                });
            } catch (err) {
                embed.addFields({
                    name: `${guild.name} (Error fetching info)`,
                    value: 'No permissions or invite could not be generated.'
                });
            }
        }

        message.reply({ embeds: [embed] });
    }
};