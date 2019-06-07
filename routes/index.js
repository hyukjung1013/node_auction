const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');

const { Good, Auction, User, sequelize } = require('../models');

const router = express.Router();

router.get('/', isLoggedIn, async (req, res, next) => {
    try {
        const goods = await Good.findAll( {} );
        if (goods) {
            res.render('main', { 
                user: req.user,
                goods: goods, 
            });
        } else {
            res.render('main', { 
                user: req.user,
                goods: [], 
            });

        }
    } catch(err) {
        console.error(err);
        next(err);
    }
});

router.get('/register_good', (req, res) => {
    res.render('register_good');
});

fs.readdir('uploads', (err) => {
    if(err) {
        console.error('upload directory does not exists.');
        console.error('upload directory is created.');
        fs.mkdirSync('uploads');
    }
});

const uploadImage = multer({
    storage: multer.diskStorage({
        destination(req, file, callback) {
            callback(null, 'uploads/');
        },
        filename(req, file, callback) {
            const external = path.extname(file.originalname);
            callback(null, path.basename(file.originalname, external) + new Date().valueOf() + external);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024}
});

router.post('/register_good_process', uploadImage.single('img'), async (req, res, next) => {
    try {
        const { name, price } = req.body;
        const good = await Good.create({
            ownerId: req.user.id,
            name: name,
            img: req.file.filename,
            price: price
        });

        const end = new Date();
        end.setDate(end.getDate() + 1); // one day after.
        
        schedule.scheduleJob(end, async() => {
            const success = await Auction.findOne({
                where: { goodId: good.id },
                order: [['price', 'DESC']]
            });

            await Good.update({ soldId: success.userId }, { where: { id: good.id } });
            await User.update({
                money: sequelize.literal(`money - ${success.price}`)
            }, {
                where: { id: success.userId }
            });
        });

        res.redirect('/');
    } catch(err) {
        console.error(err);
        next(err);
    }
});

router.get('/charge_money', (req, res) => {
    res.render('charge_money', { user: req.user });
});

router.post('/charge_money_process', async (req, res) => {
    var money = req.body.money;
    try {
        await User.update({
            money: sequelize.literal(`money + ${money}`)
        }, {
            where: { id: req.user.id }
        });

        const user = await User.findOne( {
            where: { id: req.user.id }
        } );

        res.redirect('/');

    } catch(err) {
        console.error(err);
        next(err);
    }
});

router.get('/mylist', async (req, res, next) => {
    try {
        const goods = await Good.findAll({
            where: { soldId: req.user.id },
            include: { model: Auction },
            order: [[{ model: Auction }, 'price', 'DESC']]
        });

        if (goods) {
            res.render('mylist', {
                user: req.user,
                goods: goods
            });

        } else {
            res.render('mylist', {
                user: req.user,
                goods: []
            });
        }
    } catch(err) {
        console.error(err);
    }
});

router.get('/good/:id', async(req, res, next) => {
    try {
        const[ good, auction ] = await Promise.all([Good.findOne({
            where: { id: req.params.id },
            include: {
                model: User,
                as: 'owner'
            }
        }), Auction.findAll({
            where: { goodId: req.params.id },
            include: { model: User },
            order: [['price', 'ASC']]
        })]);res.render('room', {
            good: good,
            nickname: req.user.dataValues.nickname,
            user: req.user,
            auctions: auction
        });
    } catch(err) {
        console.error(err);
        next(err);
    }
});

router.post('/good/:id/bid', async(req, res, next) => {
    const { price, comment } = req.body;
    const good = await Good.findOne({
        where: { id: req.params.id },
        include: { model: Auction },
        order: [[{ model: Auction }, 'price', 'DESC']]
    });
    if (good.price > price) {
        return res.status(403).send('You have to bid more than the starting price.');
    }

    if (new Date(good.createdAt).valueOf() + (24 * 60 * 60 * 1000) < new Date() ) {
        return res.status(403).send('The auction ended.')
    }

    if(good.auctions[0] && good.auctions[0].price >= price) {
        return res.status(403).send('Price must be over than previous bidding price.');
    }

    const result = await Auction.create({
        price: price,
        comment: comment,
        userId: req.user.id,
        goodId: req.params.id
    });
    req.app.get('io').to(req.params.id).emit('bid', {
        price: result.price,
        comment: result.comment,
        nickname: req.user.nickname
    });

    return res.send('ok');
});

module.exports = router;