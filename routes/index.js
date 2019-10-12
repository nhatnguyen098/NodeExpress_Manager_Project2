var express = require('express');
var router = express.Router();
var Product = require('../models/product')
const multer = require('multer');
const multipart = require('connect-multiparty')



// const upload = multer({ dest:'public/images' });
/* GET home page. */

// using upload image
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
});




const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1200 * 1486
  },
  // fileFilter: fileFilter
  // dest:'upload/',

});



let totalItemProfit = 0;
let totalAllOrder = 0;
let obj_DailySales = {}

router.get('/', isLoggedIn, async (req, res) => {
  var arrTitle = []
  var arrProfit = []
  var arrPercent = []
  var totalProfit = 0;
  var totalOrder = 0;
  var d = new Date(); // Today!
  var today = new Date()
  d.setDate(d.getDate() - 1); // Yesterday!
  var totalYesterday = 0;
  var totalToday = 0;
  Product.find((err, docs) => {
    for (var i = 0; i < docs.length; i++) {
      arrTitle.push(docs[i].title)
      arrProfit.push(docs[i].totalProfit)
      totalProfit += docs[i].totalProfit
      totalOrder += docs[i].orderList.length;

      for (var s = 0; s < docs[i].orderList.length; s++) {
        // var dates = docs[i].orderList[s].orderDate.toISOString().slice(5, 7)
        if (docs[i].orderList[s].orderDate.toISOString().slice(0, 10) == d.toISOString().slice(0, 10)) {
          totalYesterday += docs[i].orderList[s].totalPrice
        }
        if (docs[i].orderList[s].orderDate.toISOString().slice(0, 10) == today.toISOString().slice(0, 10)) {
          totalToday += docs[i].orderList[s].totalPrice;
        }
      }
    }
    var dailySales = 0

    if (totalYesterday == 0) {
      dailySales = 100
      obj_DailySales.dailySales = dailySales;
      obj_DailySales.icon = 'fa fa-long-arrow-up',
        obj_DailySales.color = 'text-success'
    } else {
      dailySales = (((totalToday - totalYesterday) / totalYesterday) * 100).toFixed(1);
      if (dailySales <= 0) {
        obj_DailySales.dailySales = dailySales;
        obj_DailySales.icon = 'fa fa-long-arrow-down',
          obj_DailySales.color = 'text-danger'
      } else {
        obj_DailySales.dailySales = dailySales;
        obj_DailySales.icon = 'fa fa-long-arrow-up',
          obj_DailySales.color = 'text-success'
      }
    }

    docs.forEach(s => {
      var obj = {}
      obj.name = s.title;
      obj.percent = ((s.totalProfit / totalProfit) * 100).toFixed(1)
      arrPercent.push(obj)
    })
    totalItemProfit = totalProfit;
    totalAllOrder = totalOrder
    res.locals.arrPercent = JSON.stringify(arrPercent)
    res.locals.arrTitle = JSON.stringify(arrTitle)
    res.locals.arrProfit = JSON.stringify(arrProfit)
    res.render('pages/index', {
      dashboard: 'dashboard',
      totalProfit: totalProfit.toFixed(1),
      totalOrder: totalOrder,
      dailySales: obj_DailySales,
      sessionUser: req.session.user._id
    })
  })
})

router.post('/', async (req, res) => {
  var start = req.body.start.trim();
  var end = req.body.end.trim();
  var arrPercent = []
  Product.find(async (err, doc) => {
    var arrTitle = []
    var arrProfit = []
    for (var i = 0; i < doc.length; i++) {
      arrTitle.push(doc[i].title)
      var totalPrice = 0;
      for (var s = 0; s < doc[i].orderList.length; s++) {
        var dates = doc[i].orderList[s].orderDate.toISOString().slice(0, 10)
        if (dates >= start && dates <= end) {
          var discount = 1;
          if (doc[i].orderList[s].couponCode.discount) {
            discount = 1 - doc[i].orderList[s].couponCode.discount
          }
          totalPrice += (doc[i].orderList[s].totalQuantity * doc[i].price) * discount
        } else if (!start && !end) {
          totalPrice += doc[i].orderList[s].totalQuantity * doc[i].price
        } else if (dates >= start && !end) {
          var discount = 1;
          if (doc[i].orderList[s].couponCode.discount) {
            discount = 1 - doc[i].orderList[s].couponCode.discount
          }
          totalPrice += (doc[i].orderList[s].totalQuantity * doc[i].price) * discount
        } else if (!start && dates <= end) {
          var discount = 1;
          if (doc[i].orderList[s].couponCode.discount) {
            discount = 1 - doc[i].orderList[s].couponCode.discount
          }
          totalPrice += (doc[i].orderList[s].totalQuantity * doc[i].price) * discount
        }
      }
      arrProfit.push(totalPrice)
    }
    doc.forEach(s => {
      var obj = {}
      obj.name = s.title;
      obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
      arrPercent.push(obj)
    })

    res.locals.arrPercent = JSON.stringify(arrPercent)
    res.locals.arrTitle = JSON.stringify(arrTitle)
    res.locals.arrProfit = JSON.stringify(arrProfit)
    await res.render('pages/index', {
      dashboard: 'dashboard',
      totalProfit: totalItemProfit.toFixed(1),
      totalOrder: totalAllOrder,
      dailySales: obj_DailySales,
    })
  })
})

router.post('/filterOption', (req, res) => {
  totalItemProfit
  var arr = []
  if (!req.body.proName.trim() && req.body.category != "0") {
    Product.find({
      'userGroup': req.body.category
    }, (err, docs) => {
      docs.forEach(s => {
        var obj = {};
        obj.name = s.title;
        obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
        arr.push(obj)
      })
      res.locals.arrProfit = JSON.stringify(arr)
    })
  } else if (req.body.proName.trim() && req.body.category === "0") {
    Product.find({
      'title': {
        '$regex': req.body.proName,
        '$options': 'i'
      }
    }, (err, docs) => {
      docs.forEach(s => {
        var obj = {};
        obj.name = s.title;
        obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
        arr.push(obj)
      })
      res.locals.arrProfit = JSON.stringify(arr)
    })
  } else if (req.body.proName.trim() && req.body.category !== "0") {
    Product.find({
      'title': {
        '$regex': req.body.proName,
        '$options': 'i'
      },
      userGroup: req.body.category
    }, (err, docs) => {
      docs.forEach(s => {
        var obj = {};
        obj.name = s.title;
        obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
        arr.push(obj)
      })
      res.locals.arrProfit = JSON.stringify(arr)
    })
  } else if (!req.body.proName.trim() && req.body.category === "0") {
    Product.find((err, docs) => {
      docs.forEach(s => {
        var obj = {};
        obj.name = s.title;
        obj.percent = ((s.totalProfit / totalItemProfit) * 100).toFixed(1)
        arr.push(obj)
      })
      res.locals.arrPercent = JSON.stringify(arr)
    })
  }
  // res.locals.arrTitle = JSON.stringify(arrTitle)
  // res.locals.arrProfit = JSON.stringify(arrProfit)
  res.render('pages/index', {
    dashboard: 'dashboard',
    totalProfit: totalItemProfit.toFixed(1),
    totalOrder: totalAllOrder
  })
})



router.get('/productList', isLoggedIn, function (req, res, next) {
  Product.find((err, docs) => {
    for (var i = 0; i < docs.length; i++) {
      docs[i].number = (i + 1)
      var quantity = 0;
      var totalPrice = 0;
      for (var s = 0; s < docs[i].orderList.length; s++) {
        quantity += docs[i].orderList[s].totalQuantity
        var discount = 1;
        if (docs[i].orderList[s].couponCode.discount) {
          discount = 1 - docs[i].orderList[s].couponCode.discount
        }
        totalPrice += (docs[i].orderList[s].totalQuantity * docs[i].price) * discount
      }
      var obj = {
        "qty": quantity,
        "price": totalPrice.toFixed(1)
      }
      docs[i].orderInfo = obj
    }
    res.render('pages/productList', {
      products: docs,
      product: 'product'
    });
  })
});

router.get('/productDetail/:id', (req, res) => {
  var proId = req.params.id
  var arrOrder = [];
  var sumPrice = 0;
  var sumQty = 0;
  Product.findById(proId, (err, docs) => {
    if (docs.orderList) {
      for (var i = 0; i < docs.orderList.length; i++) {
        if (docs.orderList[i].couponCode.discount) {
          docs.orderList[i].totalPrice -= (docs.orderList[i].totalPrice * docs.orderList[i].couponCode.discount)
        }
        sumPrice += docs.orderList[i].totalPrice
        sumQty += docs.orderList[i].totalQuantity
        arrOrder.push(docs.orderList[i])
      }
    }
    res.render('pages/productDetail', {
      proDetail: docs,
      orderDetail: arrOrder,
      totalOrderPrice: sumPrice,
      totalOrderQty: sumQty,
      product: 'product'
    })
  })
})
router.get('/product-upload/:id', (req, res) => {
  Product.findById(req.params.id, (err, doc) => {
    res.render('pages/productUpload', {
      keyUpdate: req.params.id,
      product: 'product',
      pro: doc
    })
  })

})
router.post('/product-upload/:id', upload.single('imagePath'), (req, res) => {
  // console.log(req.body)
  // console.log(req.file.path)
  // console.log(req.file.originalname)
  var key = req.params.id
  if (key == "new") {
    var pro = new Product({
      imagePath: req.file.originalname, // req.body.imagePath
      title: req.body.proname,
      description: req.body.description,
      userGroup: req.body.userGroup,
      price: req.body.price,
      reviews: [],
      orderList: [],
      productRate: 0
    })
    pro.save();
  } else {
    Product.findOneAndUpdate({
      _id: key
    }, {
      '$set': {
        'imagePath': req.file.originalname, // req.body.imagePath
        'title': req.body.proname,
        'description': req.body.description,
        'userGroup': req.body.userGroup,
        'price': req.body.price,
      }
    }, {
      new: true,
      upsert: true
    }, (err, doc) => {})
  }

  res.redirect('../productList')
})

router.get('/product-update', (req, res) => {
  res.render('pages/productUpdate', {
    product: 'product'
  })
})




router.get('/downloadCSV',(req,res)=>{
  var ws = fs.createWriteStream('my.csv');
  csv.write([["a1","b1"],["a2","b2"],["a3","b3"]],{headers:true}).pipe(ws)
  res.render('pages/index', {
    dashboard: 'dashboard'
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