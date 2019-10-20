var express = require('express');
var router = express.Router();
var Product = require('../models/product')
var url = require('url');


router.get('/orderList', isLoggedIn, async (req, res) => {
    Product.find((err, docs) => {
        var arr = [];
        var number = 0;
        docs.forEach(s => {
            s.orderList.forEach(x => {
                x.number = number + 1;
                x.title = s.title;
                x.category = s.userGroup;
                x.id = s._id;
                if (x.status == 1) {
                    x.status = 'Done'
                    if (x.couponCode.discount) {
                        x.totalPrice -= (x.totalPrice * x.couponCode.discount)
                    }
                } else if (x.status == -1) {
                    x.status = 'Cancel'
                    x.totalPrice = 0
                } else if (x.status == 0) {
                    x.status = 'Pending'
                    x.totalPrice = 0
                }
                arr.push(x)
                number++;
            })
        })
        res.render('orders/orderList', {
            orders: 'order',
            orderList: arr
        })
    })
})

router.get('/orderDetail/:numberOrder', (req, res) => {
    var numOrder = req.params.numberOrder
    var arr = numOrder.split('-')
    Product.findById(arr[0], (err, doc) => {
        doc.orderList.forEach(s => {
            if (s.numberOrder == arr[1]) {
                s.proId = doc._id
                s.proName = doc.title
                s.proPrice = doc.price
                s.imgPro = doc.imagePath
                if (s.couponCode.discount) {
                    s.totalPrice -= (s.totalPrice * s.couponCode.discount)
                }
                if (s.status == 1) {
                    s.status = 'Done'
                } else if (s.status == -1) {
                    s.status = 'Cancel'
                } else if (s.status == 0) {
                    s.status = 'Pending'
                }
                res.render('orders/orderDetail', {
                    orders: 'order',
                    orderDetail: s
                })
            }
        })
    })
})

router.post('/updateStatus_Order', async (req, res) => {
    console.log(req.body.proId)
    console.log(req.body.numOrder)
    console.log(req.body.status)
    var updStatus = await Product.findOneAndUpdate({
        '_id': req.body.proId,
        'orderList.numberOrder': Number(req.body.numOrder)
    }, {
        "$set": {
            'orderList.$.status': Number(req.body.status),
        }
    }, {
        upsert: true,
        new: true
    }, async (err, docs) => {
        if (err) {
            console.log(err)
        }
        res.redirect('orderList')
    })

})

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}