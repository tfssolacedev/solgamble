module.exports = {
    prefix: process.env.PREFIX || 'sol',
    casinoName: 'SolGamble',
    defaultBalance: 1000,
    cooldowns: {
        work: 3600,
        steal: 60,
    },
    monthlyResetDay: 1 // Day of month to auto-reset
};
