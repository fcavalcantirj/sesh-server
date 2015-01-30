var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    email: { type : String , lowercase : true},
    isCoach: { type : String , lowercase : true}
});

module.exports = mongoose.model('User', UserSchema);