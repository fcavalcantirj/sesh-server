var express     = require('express')
    , app         = express()
    , bodyParser  = require('body-parser');

var User = require('./app/models/user');
var mongo   = require('mongoose');
var nodemailer = require("nodemailer");

var hasError = false;
if(!process.env.EMAILUSER){
    console.log('missing env variable EMAILUSER');
    hasError = true;
}
if(!process.env.EMAILPASS){
    console.log('missing env variable EMAILPASS');
    hasError = true;
}
if(!process.env.DBURL){
    console.log('missing env variable DBURL');
    hasError = true;
}
if(hasError){
    process.exit(1);
}

var transport = nodemailer.createTransport({
    service: 'Zoho',
    auth: {
        user: process.env.EMAILUSER,
        pass: process.env.EMAILPASS
    }
});

var sendSmtpEmail = function(email){
    transport.sendMail({
        from: "Sesh Team <no-reply@joinsesh.com>",
        to: email,
        subject: "Welcome to Sesh",
        text: "Welcome!\r\n\r\nYou've been added to the early-access list for Sesh, the world's first online platform for group coaching.\r\n\r\nYou'll be one of the first to receive an invite to join our early adopter groups. We can't wait to let you try Sesh and let us know what you think!\r\n\r\nIf you're as excited as we are, share the love with your friends by posting http://joinsesh.com to Facebook, Twitter, or anywhere you connect.\r\n\r\nIf you have any questions, comments, or other feedback, please send us an email at hello@joinsesh.com. We would love to hear from you.\r\n\r\nThank you,\r\n\r\nThe Sesh Team"
    }, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log("Message sent to=["+email+'] with response=[' + info.response+"]");
        }
    });
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
                    sendSmtpEmail(req.body.email);
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