const http = require('http');
const express = require('express');
var router = express.Router();
const cheerio = require('cheerio');
const got = require('got');

const app = express();
const calendar = require('./CalendarModule.js');

router.get('/', function(req, res) {
    res.redirect('/index');
});

router.get('/index', function (req, res) {
    res.sendFile('../ressources/web/home.html', {root: __dirname});
    res.status(200);
});


module.exports = router;