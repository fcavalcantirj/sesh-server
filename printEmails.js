var User = require('./app/models/user');

var mongo   = require('mongoose');

var dbURL = process.env.DBURL;

if(!dbURL){
    console.log("please ask admin to set DBURL");
    return;
}
console.log("connecting...");
mongo.connect(process.env.DBURL);
console.log("connected");

User.find(function (err, users) {
    if (err) {
        console.log(err);
    }
    for(var u in users)
    {
        console.log(users[u].email);
    }
    console.log("END");
    return;
});
