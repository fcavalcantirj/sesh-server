var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var OpenTokUsersSchema   = new Schema({
    name: { type : String , lowercase : true, required: true},
    token: { type : String , required: true},
    expireTime: { type : Number, required: true },
    lastUpdated: { type : Date, required: true }
});

module.exports = mongoose.model('OpenTokUsers', OpenTokUsersSchema);
