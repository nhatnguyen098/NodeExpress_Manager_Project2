var express = require('express');
var router = express.Router();
var Product = require('../models/product')
var User = require('../models/user')
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
    User.findById(arr[0], (err, user) => {
        console.log(user)
        Product.find((err, product) => {
            var arrProduct = [],
                arr_proDelet = []
            var obj = {
                'orderList': []
            }
            user.orderList.forEach(s => {
                if (s.number == arr[1]) {
                    obj.totalPrice = s.totalPrice
                    obj.orderDate = s.orderDate
                    s.sub_order.forEach(x => {
                        product.forEach(pro => {
                            if (pro._id == x.proId) {
                                x.orderNumber.forEach(o => {
                                    pro.orderList.forEach(p => {
                                        if (o == p.numberOrder) {
                                            p.proName = pro.title
                                            p.proPrice = pro.price
                                            p.proId = pro._id
                                            arrProduct.push(p) // view product detail
                                            // setup delete product
                                            var proDelete = {
                                                '_id': pro._id,
                                                'numberOrder': p.numberOrder
                                            }
                                            arr_proDelet.push(proDelete)
                                        }
                                    })
                                })
                            }
                        })
                    })
                }
            })
            obj.userInfo = arrProduct[0].userInfo
            obj.couponCode = arrProduct[0].couponCode
            obj.orderList = arrProduct
            if (arrProduct[0].status == 1) {
                obj.status = 'Done'
            } else if (arrProduct[0].status == 0) {
                obj.status = 'Pending'
            } else if (arrProduct[0].status == -1) {
                obj.status = 'Cancel'
            }
            res.render('orders/orderDetail', {
                orders: 'order',
                orderDetail: obj,
                sessionUser: req.session.user,
                notification: req.session.messsages,
                arr_proDelet: JSON.stringify(arr_proDelet)
            })
        })
    })
})

router.post('/updateStatus_Order', async (req, res) => {
    var arr_proDelet = JSON.parse(req.body.arrPro)
    //console.log(arr_proDelet)
    /// from products arr -> product object -> orders of product -> find order -> change order status
    arr_proDelet.forEach(pro => {
        var lastStatus = 0
        // Product.findById(pro._id, (err, doc) => {
        //     if (doc.orderList.length > 0) {
        //         doc.orderList.forEach(s => {
        //             if (s.numberOrder == pro.numberOrder) {
        //                 lastStatus = s.status
        //             }
        //         })
        //     }
        // })
        Product.findOneAndUpdate({
            '_id': pro._id,
            'orderList.numberOrder': pro.numberOrder
        }, {
            "$set": {
                'orderList.$.status': Number(req.body.status),
            }
        }, {
            upsert: true,
            new: true
        }, (err, docs) => {
            // docs.orderList.forEach(s => {
            //     var totalPro_Profit = 0
            //     ////////////////
            //     if (s.status == 1 && s.numberOrder == pro.numberOrder && (lastStatus == 0 || lastStatus == -1)) {
            //         totalPro_Profit = docs.totalProfit + s.totalHasDiscount
            //     } else if ((s.status == 0 || s.status == -1) && s.numberOrder == pro.numberOrder && lastStatus == 1) {
            //         if (totalPro_Profit != 0) {
            //             totalPro_Profit = docs.totalProfit - s.totalHasDiscount
            //         }
            //     }
            //     Product.findOneAndUpdate({
            //         _id: pro._id
            //     }, {
            //         $set: {
            //             totalProfit: totalPro_Profit
            //         }
            //     }, {
            //         upsert: true,
            //         new: true
            //     }, (err, doc) => {

            //     })
            // })
        })

    })
    await Product.find((err, products) => {
        products.forEach(x => {
            var totalProfit = 0
            x.orderList.forEach(s => {
                if (s.status == 1) {
                    totalProfit += s.totalHasDiscount
                }
            })
            Product.updateOne({
                '_id': x._id
            }, {
                '$set': {
                    'totalProfit': totalProfit
                }
            },{
                upsert: true,
                new:true
            },(err,rs)=>{
            })
        })

    })
    await res.redirect('orderList')
})

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}