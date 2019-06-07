const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Good } = require('../models');

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
        await Good.create({
            ownerId: req.user.id,
            name: name,
            img: req.file.filename,
            price: price
        });
        res.redirect('/');
    } catch(err) {
        console.error(err);
        next(err);
    }
});

router.get('/charge_money', (req, res) => {
    res.render('charge_money');
});

router.get('/mylist', (req, res) => {
    res.render('mylist');
});

module.exports = router;