var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SessionSchema   = new Schema({
    sessionId: { type : String , required: true}
});

module.exports = mongoose.model('Session', SessionSchema);
