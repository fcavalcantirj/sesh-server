var express     = require('express')
    , app         = express()
    , bodyParser  = require('body-parser');

var User = require('./app/models/user');

var email   = require("./node_modules/emailjs/email");

var mongo   = require('mongoose');
var server  = email.server.connect({
    user:    "hell@sesh.com",
    password:"password",
    host:    "smtp.gmail.com",
    ssl:     true
});
var sendEmail = function(email) {
    server.send({
        text:    "Welcome!\r\n\r\nYou've been added to the early-access list for Sesh, the world's first online platform for group coaching.\r\n\r\nYou'll be one of the first to receive an invite to join our early adopter groups. We can't wait to let you try Sesh and let us know what you think!\r\n\r\nIf you're as excited as we are, share the love with your friends by posting http://joinsesh.com to Facebook, Twitter, or anywhere you connect.\r\n\r\nIf you have any questions, comments, or other feedback, please send us an email at hello@joinsesh.com. We would love to hear from you.\r\n\r\nThank you,\r\n\r\nThe Sesh Team",
        from:    "SeshTeam <hello@sesh.com>",
        to:      email,
        subject: "Welcome to Sesh"
    }, function(err, message) { console.log(err || message); });
};
mongo.connect(process.env.DBURL);

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var router = express.Router();

// REST API


/**
 * USERS
 */

var findUserByEmail = function(email, callback){
    User.findOne({email: email}, function(err, user) {
        if (err){
            res.send(err);
        }
        callback(user);
    });
};

router.route('/users')
    .post(function(req, res) {
        if(!req.body.email){
            return res.send(400);
        }
        findUserByEmail(req.body.email, function(user){
            if(!user){
                var newUser = new User();
                newUser.email = req.body.email;
                newUser.save(function(err) {
                    if (err){
                        res.send(err);
                    }
                    //send email
                    //sendEmail(req.body.email);
                    res.json({ message: 'success' });
                });
            }else{
                //return res.send(400);
                res.json({ message: 'success' });
            }
        });
    });

router.use(function(req, res, next) {
    console.log('log req here');
    next();
});

router.get('/', function(req, res) {res.json({ message: 'working baby!!!' })});

app.use('/api', router);

// END REST API

app.listen(port);
console.log('listenning port ' + port);