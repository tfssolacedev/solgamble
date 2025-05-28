const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const express = require('express'); // Added for web server
// Load environment variables
require('dotenv').config();

// === START EXPRESS SERVER ===
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('SolGamble Bot is Online!');
});

app.listen(PORT, () => {
    console.log(`[SERVER] Web server running on http://localhost:${PORT}`);
});
// === END EXPRESS SERVER ===

// === HARD CODED OWNER IDs ===
const OWNER_IDS = [
    "1335680462852587621", // Owner 1
    "1336450372398612521"  // Owner 2
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Map();

// Store command usage timestamps per user for anti-spam
const commandUses = new Map();

// Track blocked users and their unblock time
const blockedUsers = new Map(); // userId => unblockTimestamp

// Max allowed warnings before block
const MAX_WARNINGS = 2;
const BLOCK_DURATION = 900_000; // 15 minutes in milliseconds

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Helper function to update user stats after gambling
async function updateUserStats(userId, outcome, amount) {
    try {
        const User = require('./models/User');
        let user = await User.findOne({ userId });
        if (!user) {
            // Create user with default values if not exists
            user = new User({
                userId,
                balance: 1000,
                gamesPlayed: 1,
                gamesWon: outcome === 'win' ? 1 : 0,
                coinsWon: outcome === 'win' ? amount : 0,
                coinsLost: outcome === 'loss' ? amount : 0,
                biggestWin: outcome === 'win' ? amount : 0,
                biggestLoss: outcome === 'loss' ? amount : 0
            });
            await user.save();
            console.log(`[STATS] Created new user and logged stat: ${userId}`);
            return;
        }
        // Update stats
        user.gamesPlayed += 1;
        if (outcome === 'win') {
            user.gamesWon += 1;
            user.coinsWon += amount;
            if (amount > user.biggestWin) user.biggestWin = amount;
        } else if (outcome === 'loss') {
            user.coinsLost += amount;
            if (amount > user.biggestLoss) user.biggestLoss = amount;
        }
        await user.save();
        console.log(`[STATS] Updated stats for user: ${userId} | Outcome: ${outcome}, Amount: ${amount}`);
    } catch (err) {
        console.error(`[ERROR] Failed to update stats for user: ${userId}`, err);
    }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "your_mongodb_connection_string_here", {})
    .then(async () => {
        console.log('[DATABASE] Connected to MongoDB ✅');
        // Check for monthly reset
        const now = new Date();
        const Reset = require('./models/Reset');
        let resetDoc = await Reset.findOne();
        if (!resetDoc) {
            resetDoc = new Reset({ nextReset: new Date(now.getFullYear(), now.getMonth() + 1, 1) });
            await resetDoc.save();
        }
        const nextResetDate = new Date(resetDoc.nextReset);
        if (now >= nextResetDate) {
            const User = require('./models/User');
            await User.updateMany({}, { $set: { balance: 1000 } });
            resetDoc.nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            await resetDoc.save();
            console.log('[RESET] Monthly balance reset completed.');
        }
    })
    .catch(err => {
        console.error('[DATABASE] Connection error ❌:', err);
        process.exit(1); // Exit on failed DB connect
    });

// On ready
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
    updatePresence(); // Set initial presence
});

// Update presence dynamically
async function updatePresence() {
    const serverCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    await client.user.setPresence({
        activities: [{
            name: `${serverCount} servers | ${userCount} members | sol casino to register`,
            type: 3 // WATCHING
        }],
        status: 'dnd'
    });
}

// Guild join/leave triggers presence update
client.on('guildCreate', () => updatePresence());
client.on('guildDelete', () => updatePresence());

// Handle unblock command
client.on('messageCreate', async message => {
    if (!message.content.startsWith('sol') || message.author.bot) return;
    const args = message.content.slice('sol'.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    if (commandName === 'unblock') {
        const userId = message.author.id.toString();
        if (!OWNER_IDS.includes(userId)) {
            return message.reply("🚫 You don't have permission to run that command.");
        }
        const userIdToUnblock = args[0]?.trim();
        if (!userIdToUnblock || isNaN(userIdToUnblock)) {
            return message.reply("⚠️ Please provide a valid user ID.");
        }
        if (blockedUsers.has(userIdToUnblock)) {
            blockedUsers.delete(userIdToUnblock);
            return message.reply(`✅ Successfully unblocked user \`${userIdToUnblock}\`.`);
        }
        return message.reply("ℹ️ That user wasn't blocked.");
    }
});

// Command handler
client.on('messageCreate', async message => {
    if (!message.content.startsWith('sol') || message.author.bot) return;
    const args = message.content.slice('sol'.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;

    // Enforce minimum 5 members
    if (message.guild && message.guild.memberCount < 5) {
        return message.reply("⚠️ This bot only works in servers with at least 5 members.");
    }

    // Skip permission checks in DMs
    if (!message.guild) {
        try {
            console.log(`[CMD] Executing DM command: ${commandName} by ${message.author.id}`);
            return await command.execute(message, args);
        } catch (err) {
            console.error(`[ERROR] DM command failed: ${commandName}`, err);
            return message.reply('There was an error executing that command.');
        }
    }

    const everyoneRole = message.guild.roles.everyone;
    const permissions = message.channel.permissionsFor(everyoneRole);

    // Check if @everyone can view and send in this channel
    const needsUnlock =
        !permissions.has(PermissionFlagsBits.ViewChannel) ||
        !permissions.has(PermissionFlagsBits.SendMessages);

    if (needsUnlock) {
        try {
            await message.channel.permissionOverwrites.edit(everyoneRole, {
                ViewChannel: true,
                SendMessages: true
            });
            await message.reply({
                content: "🔓 This channel has been unlocked for everyone to use SolGamble.",
                allowedMentions: { parse: [] }
            });
        } catch (err) {
            console.error("Failed to unlock channel:", err);
            message.reply("⚠️ I couldn't unlock this channel. Make sure I have permission to manage channels.");
            return;
        }
    }

    // === RATE LIMITING FOR GAMBLING COMMANDS ONLY ===
    const gamblingCommands = ['poker', 'slots', 'blackjack', 'dice']; // Add more as needed
    if (gamblingCommands.includes(commandName)) {
        const userId = message.author.id;
        // Check if already blocked
        if (handleSpamWarning(userId, message)) return;
        const now = Date.now();
        const cooldownWindow = 10_000; // 10 seconds
        const maxUses = 5;
        const userUses = commandUses.get(userId) || [];
        const recentUses = userUses.filter(timestamp => now - timestamp < cooldownWindow);
        if (recentUses.length >= maxUses) {
            // Handle warning/block logic
            const warningKey = `${userId}_spam_warning`;
            if (!global[warningKey]) {
                global[warningKey] = 1;
                message.reply("⚠️ Yo chill out, you’re moving faster than Solace coding at 3 AM.");
            } else if (global[warningKey] === MAX_WARNINGS) {
                // Final strike — block them
                const unblockAt = now + BLOCK_DURATION;
                blockedUsers.set(userId, unblockAt);
                delete global[warningKey];
                message.reply("🛑 Oops yo ass been blocked for spamming. Time left: 15m.");
            } else {
                global[warningKey]++;
                message.reply(`⚠️ Warning #${global[warningKey]}: Slow it down.`);
            }
            return;
        }
        recentUses.push(now);
        commandUses.set(userId, recentUses);
    }
    // ================================================

    try {
        console.log(`[CMD] Running command: ${commandName} by ${message.author.id}`);
        const result = await command.execute(message, args, updateUserStats);
        if (result && result.type && result.amount !== undefined) {
            await updateUserStats(message.author.id, result.type, result.amount);
        }
    } catch (error) {
        console.error(`[ERROR] Command execution failed: ${commandName}`, error);
        message.reply('There was an error trying to execute that command!');
    }
});

function handleSpamWarning(userId, message) {
    if (blockedUsers.has(userId)) {
        const now = Date.now();
        const unblockTime = blockedUsers.get(userId);
        if (now < unblockTime) {
            const timeLeft = Math.ceil((unblockTime - now) / 1000);
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            message.reply(`Oops yo ass been blocked for spamming. Time left: ${minutes}m ${seconds}s.`);
            return true; // Blocked
        } else {
            // Unblock after timeout ends
            blockedUsers.delete(userId);
        }
    }
    return false; // Not blocked
}

// Start the bot
client.login(process.env.TOKEN);
