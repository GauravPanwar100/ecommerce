const User = require('../models/user');
const jwt = require('jsonwebtoken'); //to generate signed token
const expressjwt = require('express-jwt'); // for authorization check
const {errorHandler} = require('../helpers/dbErrorHandler');
require('dotenv').config();

exports.signup = (req, res) => {
    console.log("reqq",req.body);
    const user = new User(req.body);
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({
                error : errorHandler(err)
            });
        }
        // for hiding salt and hashed password from response
        user.salt = undefined;
        user.hashed_password = undefined;
        // end here
        res.json({
            user
        });
    })
}


exports.signin = (req, res) => {
    // find the user based on email
    const {email, password} = req.body;
    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: "User with that email doesn't exist.Please Signup."
            });
        }
        // if user is found make sure the email and password match
        // create authenticate method in user model
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error : 'Email and password doesn\'t match.'
            })
        }
        // generate a signed token with user id and secret
        const token = jwt.sign({_id : user._id}, process.env.JWT_SECRET);
        // persist the token as 't' in cookie with expiry date  // I can give any name as my choice except 't'
        res.cookie('t', token, { expire: new Date() + 9999 });
        // return response with user and token  to frontend  client
        const {_id, name, email, role} = user;
        return res.json({ token, user: {_id, name, email, role} });

    });
};

exports.signout = (req, res) => {
    res.clearCookie('t');
    res.json({ message : "SignOut Successfully." });
};

exports.requireSignin = expressjwt({
    secret : process.env.JWT_SECRET,
    userProperty : "auth",
    algorithms: ['HS256']
});

exports.hello = (req, res) => {
    res.json({
        message : "hello route"
    });
}

exports.isAuth = (req, res, next) => {
    let user = req.profile && req.auth && req.profile._id == req.auth._id;
    if (!user) {
        return res.status(403).json({
            error : 'Access Denied!!'
        });
    }
    next();
}

exports.isAdmin = (req, res, next) => {
    if (req.profile.role === 0) {  // role = 1 = admin, role = 0 = normal user
        return res.status(403).json({
            error : 'Admin resource! Access Denied.'
        });
    }
    next();
}