var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require('express-handlebars')
var mongoose = require('mongoose');
var session = require('express-session')
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var indexRouter = require('./routes/index');
var couponRouter = require('./routes/coupons')
var orderRouter = require('./routes/order');
var usersRouter = require('./routes/users');
var productRouter = require('./routes/product')
var bodyParser = require('body-parser')
var glosbe_Daily = require('./config/setup_GlosbeDaily')

var app = express();
mongoose.connect('mongodb://localhost:27017/shopping', {
  useNewUrlParser: true
});
require('./config/passport')
// view engine setup
app.engine('.hbs', expressHbs({
  defaultLayout: 'layout',
  extname: '.hbs',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}))
app.set('view engine', '.hbs');



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(validator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false
}))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/product', productRouter)
app.use('/order', orderRouter);
app.use('/coupon', couponRouter);
app.use('/user', usersRouter);
app.use('/', indexRouter);




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;