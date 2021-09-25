var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var calendarRouter = require('./routes/CalendarModule');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/calendar', calendarRouter);

app.get('/doc/calendar', function(req, res) {
    res.sendFile('ressources/web/calendar.html', {root: __dirname});
    res.status(200);
});

app.get('/api', function(req, res) {
    
});

module.exports = app;