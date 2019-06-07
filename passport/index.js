const local = require('./LocalStrategy');
const { User } = require('../models');

module.exports = (passport) => {

    passport.serializeUser((user, done) => {
        done(null, user.dataValues.id);
    });

    passport.deserializeUser((id, done) => {
        User.findOne({
            where: { id: id }
        })
        .then((user) => {
            done(null, user)
        })
        .catch(err => done(err));
    });

    local(passport);
}; 