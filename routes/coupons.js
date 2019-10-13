var express = require('express');
var router = express.Router();
var Coupons = require('../models/coupon')
const multer = require('multer');

var fs = require('fs')
const csv = require('fast-csv');


var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'up-download/uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});
var upload = multer({ //multer settings
    storage: storage,
});

router.get('/exportData', function (req, res, next) {
    const file = 'up-download/download_template/template.csv';
    res.download(file); // Set disposition and send it.
});


router.post('/read_csv', upload.single('file'), (req, res) => {
    var fileRows = [],
        fileHeader;
        console.log(req.file)
    csv.fromPath(req.file.path).on("data", function (data) {
        fileRows.push(data); // push each row
        console.log(data)
    }).on("end", function () {
        fs.unlinkSync(req.file.path); // remove temp file
        //process "fileRows"
    })
    console.log(fileRows)
    res.redirect('../coupon/couponList')
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


