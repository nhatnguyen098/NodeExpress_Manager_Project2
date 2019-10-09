var express = require('express');
var router = express.Router();
var Coupons = require('../models/coupon')
const multer = require('multer');

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
});
var upload = multer({ //multer settings
    storage: storage,
    fileFilter : function(req, file, callback) { //file filter
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

router.post('/read_xlsx',upload,(req,res)=>{
    if(err){
        res.json({error_code:1,err_desc:err});
        return;
   }
   res.json({error_code:0,err_desc:null});
})

router.get('/couponList', isLoggedIn, async (req, res) => {
    Coupons.find((err, docs) => {
        for (var i = 0; i < docs.length; i++) {
            docs[i].number = (i + 1)
            if (docs[i].active == true) {
                docs[i].status = 'Active'
            } else {
                docs[i].status = 'inActive'
            }
        }
        res.render('coupon/couponList', {
            coupons: docs,
            coupon: 'coupon'
        })
    })
})
router.get('/couponDetail/:id', (req, res) => {
    if (req.params.id == 'new') {
        res.render('coupon/couponUpload', {
            coupon: 'coupon'
        })
    } else {
        Coupons.findById(req.params.id, (err, doc) => {
            res.render('coupon/couponUpload', {
                coupons: doc,
                coupon: 'coupon',
            })
        })
    }
})
router.post('/couponUpload/:id', (req, res) => {
    if (req.params.id == 'new') {
        for (var i = 0; i < req.body.quantity; i++) {
            var coupons = new Coupons({
                discount: (req.body.discount / 100),
                description: req.body.description,
                active: req.body.active,
            })
            coupons.save();
        }
    } else {
        Coupons.findOneAndUpdate({
            '_id': req.params.id
        }, {
            $set: {
                'description': req.body.description,
                'discount': (req.body.discount / 100),
                'active': req.body.active
            }
        }, {
            upsert: true,
            new: true
        }, (err, doc) => {

        })
    }
    res.redirect('../couponList')
})


module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}