const mongoose = require('mongoose');

const resetSchema = new mongoose.Schema({
    nextReset: { type: Date, required: true }
});

module.exports = mongoose.model('Reset', resetSchema);
