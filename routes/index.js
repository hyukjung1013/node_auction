const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('main');
});

router.get('/register_good', (req, res) => {
    res.render('register_good');
});

router.get('/charge_money', (req, res) => {
    res.render('charge_money');
});

router.get('/mylist', (req, res) => {
    res.render('mylist');
});

module.exports = router;