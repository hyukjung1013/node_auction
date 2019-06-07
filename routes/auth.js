const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { User } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.get('/signup', isNotLoggedIn, (req, res) => {
    var msg = req.flash('join_error_msg');
    if(msg) {
        res.render('signup', { msg: msg });
    } else {
        res.render('signup', { msg: '' });
    }
})

router.post('/signup_process', async (req, res) => {
    const { email, name, password, nickname } = req.body;

    try {
        var exUser = await User.findOne({ where: { email: email } });

        if (exUser) {
            req.flash('join_error_msg', 'Email already exists.');
            return res.redirect('/auth/signup');
        } else {
            var hash = await bcrypt.hash(password, 12);

            await User.create({
                email: email,
                nickname: nickname,
                name: name,
                password: hash,
            });

            var user = await User.findOne({ where: {
                email: email, 
            } });

            req.login(user, function(err) {
                return res.redirect('/');
            });
        }
    } catch(err) {
        console.error(err);
        next(err);
    }
});

router.get('/login', isNotLoggedIn, (req, res) => {
    var msg = req.flash('login_error');
    if (msg) {
        res.render('login', { msg: msg });
    } else {
        res.render('login', { msg: '' });
    }
});

router.post('/login_process', (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {
        if(authError) {
            console.error(authError);
            return next(authError);
        }
        if(!user) {
            req.flash('login_error', info.message);
            return res.redirect('/');
        }
        return req.login(user, (loginError) => {
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});

router.get('/logout', isLoggedIn, (req, res) => {
    req.logout();
    req.session.save(function() {
        res.redirect('/');
    });
});

module.exports = router;