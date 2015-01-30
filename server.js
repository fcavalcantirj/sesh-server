var express     = require('express')
    , app         = express()
    , bodyParser  = require('body-parser')
    , OpenTok = require('opentok')

var User = require('./app/models/user');
var OpenTokUser = require('./app/models/opentokusers');
var Session = require('./app/models/session');
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
if(!process.env.API_KEY){
    console.log('missing env variable API_KEY');
    //hasError = true;
}
if(!process.env.API_SECRET){
    console.log('missing env variable API_SECRET');
    //hasError = true;
}
if(hasError){
    process.exit(1);
}

var opentok = new OpenTok((process.env.API_KEY || '45082512'), (process.env.API_SECRET || 'a75dfb8c6292c26156271b6956be4a58a42b931a'));

var generateToken = function(name, sessionId, callback){
    var tokenOptions = {};
    tokenOptions.role = "publisher";
    tokenOptions.data = "name="+name;
    var token = opentok.generateToken(sessionId, tokenOptions);
    callback(token);
};
var generateSessionId = function(callback){
    Session.find(function (err, sessions) {
        if (err) {
            console.log(err);
            callback(err);
        }else{
            if(!sessions || sessions.length == 0){
                opentok.createSession({mediaMode:"routed"}, function(err, session) {
                    if (err) {
                        console.log(err);
                        callback(err);
                    }else{
                        var newSession = new Session();
                        newSession.sessionId = session.sessionId;
                        newSession.save(function(err) {
                            if (err){
                                res.send(err);
                            }
                            callback(session.sessionId);
                        });
                    }
                });
            }else{
                callback(sessions[0].sessionId);
            }
        }
    });
};

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
 * HEALTHCHECK
 */

router.route('/healthcheck')
    .get(function(req, res) {
        console.log('healthcheck['+new Date()+']');
        res.send('1');
    });

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

router.route('/v0/login')
    .post(function(req, res) {
        if(!req.body.user){
            return res.send(400);
        }else{
            if(req.body.user === 'james' ){
                res.json({ role: 'coach' });
            }else{
                res.json({ role: 'client' });
            }
        }
    });

router.route('/v0/groups')
    .post(function(req, res) {
        if(!req.body.role){
            return res.send(400);
        }else{

        }
    });

router.route('/users')
    .post(function(req, res) {
        if(!req.body.email){
            return res.send(400);
        }
        findUserByEmail(req.body.email, function(user){
            if(!user){
                var newUser = new User();
                newUser.email = req.body.email;
                newUser.isCoach = req.body.isCoach;
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

/**
 * SESSIONS
 */

router.route('/token')
    .post(function(req, res) {
        OpenTokUser.findOne({name: req.body.name}, function(err, user) {
            if (err){
                res.send(err);
            }
            if(user){
                var lastUpdated = new Date(user.lastUpdated);
                var now = new Date();
                var timeDiff = Math.abs(now.getTime() - lastUpdated.getTime());
                if(timeDiff >= 86400000){
                    generateSessionId(function(sessionId){
                        generateToken(req.body.name, sessionId, function(token){
                            if(!token || !sessionId){
                                console.log('null token || sessionId for user.name=['+req.body.name+'] and sessionId=['+sessionId+']');
                                res.status(500).send({message:"null token"});
                            }
                            user.token = token;
                            user.lastUpdated = now;
                            user.save(function(err) {
                                if (err){
                                    res.send(err);
                                }
                                console.log('old token. generated new one for user.name=['+user.name+'] and token=['+user.token+']');
                                res.json({ token: token, sessionId: sessionId });
                            });
                        });
                    });
                }else{
                    generateSessionId(function(sessionId){
                        if(!sessionId){
                            console.log('null sessionId for user.name=['+req.body.name+'] and sessionId=['+sessionId+']');
                            res.status(500).send({message:"null token"});
                        }
                        console.log('found user with name=['+user.name+'] and token=['+user.token+'] and sessionId=['+sessionId+']');
                        res.json({ token: user.token, sessionId: sessionId });
                    });
                }
            }else{
                generateSessionId(function(sessionId){
                    generateToken(req.body.name, sessionId, function(token){
                        if(!token || !sessionId){
                            console.log('null token || sessionId for req.body.name=['+req.body.name+'] and sessionId=['+sessionId+']');
                            res.status(500).send({message:"null token"});
                        }else{
                            var openTokUser = new OpenTokUser();
                            openTokUser.name = req.body.name;
                            openTokUser.token = token;
                            openTokUser.expireTime = 86400000;
                            openTokUser.lastUpdated = new Date();
                            openTokUser.save(function(err) {
                                if (err){
                                    res.send(err);
                                }else{
                                    console.log('generated new user with user.name=['+req.body.name+'] and openTokUser.token=['+token+'] and sessionId=['+sessionId+']');
                                    res.json({ token: token, sessionId: sessionId });
                                }
                            });
                        }
                    });
                });
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
