var express = require('express');
var router = express.Router();
var Product = require('../models/product')
var User = require('../models/user')
var csrf = require('csurf');
var passport = require('passport')
var csurfProtection = csrf();
router.use(csurfProtection);
//isLoggedIn
router.get('/userList', isLoggedIn, (req, res) => {
  User.find((err, docs) => {
    for (var i = 0; i < docs.length; i++) {
      docs[i].number = (i + 1)
    }
    res.render('user/userList', {
      users: docs,
      person: 'person'
    })
  })
})

// router.get('/signup', function (req, res, next) {
//   var messages = req.flash('error')
//   var birthday = ""
//   res.render('user/signup', { csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 })
// })

router.get('/signup/:id', isLoggedIn, function (req, res, next) {
  var user = req.session.user;
  var messages = req.flash('error')
  if (req.params.id != 'new') {
    User.findById(req.params.id, (err, doc) => {
      var arr = []
      var birthday = ""
      if (doc.birthday) {
        var birthday = doc.birthday.toISOString().slice(0, 10)
      }
      Product.find((err, docs) => {
        docs.forEach(x => {
          x.orderList.forEach(s => {
            if (s.userInfo.email) {
              if (s.userInfo.email == doc.email) {
                s.proId = x._id
                s.orderDate = s.orderDate.toISOString().slice(0, 19)
                arr.push(s)
              }
            }
          })
        })
        console.log(arr)
        res.render('user/signup', {
          users: doc,
          csrfToken: req.csrfToken(),
          messages: messages,
          hasErrors: messages.length > 0,
          userBirth: birthday,
          person: 'person',
          orderList: arr,
        })
      })
    })
  } else {
    res.render('user/signup', {
      csrfToken: req.csrfToken(),
      messages: messages,
      hasErrors: messages.length > 0,
      person: 'person'
    })

    // res.redirect('../signup')
  }

});

router.post('/signup', passport.authenticate('local.signup', {
  failureRedirect: './signup/new',
  failureFlash: true
}), function (req, res, next) {
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl;
    req.session.oldUrl = null;
    res.redirect(oldUrl);
  } else {
    res.redirect('./user/userList')
  }
})

router.post('/userUpl/:id', (req, res) => {
  User.findOneAndUpdate({
    _id: req.params.id
  }, {
    $set: {
      'fullName': req.body.fullName,
      'status': req.body.status,
      'role': req.body.role,
      'company': req.body.company,
      'phoneNum': req.body.phoneNum,
      'address': req.body.address,
      'description': req.body.description,
      'birthday': req.body.birthday
    }
  }, {
    upsert: true,
    new: true
  }, (err, doc) => {
    console.log(req.body.birthday)
    res.redirect('./user/userList')
  })
})



router.get('/logout', isLoggedIn, function (req, res, next) {
  req.logOut();
  req.session.user = null;
  res.redirect('/');
})

router.use('/', notLoggedIn, function (req, res, next) {
  next();
})



router.get('/signin', function (req, res, next) {
  var messages = req.flash('error')
  res.render('user/signin', {
    csrfToken: req.csrfToken(),
    messages: messages,
    hasErrors: messages.length > 0,
    layout: false
  })
})

router.post('/signin', passport.authenticate('local.signin', {
  failureRedirect: './signin',
  failureFlash: true
}), function (req, res, next) {
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl;
    req.session.oldUrl = null;
    res.redirect(oldUrl);
  } else {
    res.redirect('./user/userList')
  }
})




module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

function notLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}