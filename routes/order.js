var express = require('express');
var router = express.Router();
var Product = require('../models/product')
var url = require('url');
var filter = require('../config/filter_Func')

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
            orderList: arr,
            sessionUser: req.session.user,
            notification: req.session.messsages
        })
    })
})
router.get('/filter_status/:id', async (req, res) => {
    if (req.params.id == 0) {
        var filter_status = await filter.filter_status(Number(req.params.id))
        res.render('orders/orderList', {
            orders: 'order',
            orderList: filter_status,
            sessionUser: req.session.user,
            notification: req.session.messsages
        })
    } else {
        var filter_status = await filter.filter_oneDate(req.params.id)
        res.render('orders/orderList', {
            orders: 'order',
            orderList: filter_status,
            sessionUser: req.session.user,
            notification: req.session.messsages
        })
    }
})

router.post('/filter_status', async (req, res) => {
    if (Number(req.body.status) == 2) {
        res.redirect('./orderList')
    } else {
        var filter_status = await filter.filter_status(Number(req.body.status))
        res.render('orders/orderList', {
            orders: 'order',
            orderList: filter_status,
            sessionUser: req.session.user,
            notification: req.session.messsages
        })
    }
})

router.get('/orderDetail/:numberOrder', async (req, res) => {
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
                    orderDetail: s,
                    sessionUser: req.session.user,
                    notification: req.session.messsages
                })
            }
        })
    })
})

router.post('/updateStatus_Order', async (req, res) => {
    var lastStatus = 0
    var pro = Product.findById(req.body.proId, async (err, doc) => {
        if (doc.orderList.length > 0) {
            doc.orderList.forEach(s => {
                if (s.numberOrder == req.body.numOrder) {
                    lastStatus = s.status
                }
            })
        }

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
            // console.log(docs)
            var totalPro_Profit = docs.totalProfit;
            await docs.orderList.forEach(s => {
                if (s.status == 1 && s.numberOrder == Number(req.body.numOrder) && (lastStatus == 0 || lastStatus == -1)) {
                    totalPro_Profit += s.totalHasDiscount
                } else if ((s.status == 0 || s.status == -1) && s.numberOrder == Number(req.body.numOrder) && lastStatus == 1) {
                    if (totalPro_Profit != 0) {
                        totalPro_Profit -= s.totalHasDiscount
                    }
                }
            })
            var pro = await Product.findOneAndUpdate({
                _id: req.body.proId
            }, {
                $set: {
                    totalProfit: totalPro_Profit
                }
            }, {
                upsert: true,
                new: true
            }, (err, doc) => {
                console.log(doc)
            })
            // console.log(docs)
            res.redirect('orderList')
        })
    })


    console.log(lastStatus)


})

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}