var express = require('express');
var router = express.Router();
var Product = require('../models/product')



router.get('/orderList', isLoggedIn, async (req, res) => {
    Product.find((err, docs) => {
        var arr = [];
        var number = 0;
        docs.forEach(s =>{
            s.orderList.forEach(x => {
                x.number = number+1;
                x.title = s.title;
                x.category = s.userGroup
                if(x.status == true){
                    x.status = 'Done'
                }else{
                    x.status = 'Cancel'
                }
                arr.push(x)
                number++;
            })
        })
        res.render('orders/orderList',{orders:'order', orderList: arr})
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