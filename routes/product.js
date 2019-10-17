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
  // limits: {
  //   fileSize: 1200 * 1486
  // },
  // fileFilter: fileFilter
  // dest:'upload/',

});



router.get('/exportData', (req, res) => {
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

    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=report.csv'
    });

    res.end(dataToCSV(docs, ["Product Name", "Total Quantity (bought)", "Total Order", "Total Profit"]), "binary");

  })

})

router.post('/filter_Month', (req, res) => {
  if (req.body.searchMonth == 0) {
    res.redirect('./productList')
  } else {
    Product.find((err, docs) => {
      var sumProfit = 0;
      var sumQuantity = 0;
      var sumOrder = 0;
      for (var i = 0; i < docs.length; i++) {
        docs[i].number = (i + 1)
        var quantity = 0;
        var totalPrice = 0;
        if (docs[i].orderList.length != 0) {
          for (var s = 0; s < docs[i].orderList.length; s++) {
            var date = docs[i].orderList[s].orderDate.toISOString().slice(5, 7)
            if (date == req.body.searchMonth) {
              quantity += docs[i].orderList[s].totalQuantity
              var discount = 1;
              if (docs[i].orderList[s].couponCode.discount) {
                discount = 1 - docs[i].orderList[s].couponCode.discount
              }
              totalPrice += (docs[i].orderList[s].totalQuantity * docs[i].price) * discount
            }
          }
          var obj = {
            "qty": quantity,
            "price": totalPrice.toFixed(1)
          }
          sumOrder += docs[i].orderList.length
          sumProfit += totalPrice
          sumQuantity += quantity
          docs[i].orderInfo = obj
        }
      }
      res.render('product/productList', {
        products: docs,
        product: 'product',
        sumProfit: sumProfit.toFixed(1),
        sumQuantity: sumQuantity,
        sumOrder: sumOrder,
      })
    })
  }
})
router.get('/productList', isLoggedIn, function (req, res, next) {
  Product.find(async (err, docs) => {
    var sumProfit = 0;
    var sumQuantity = 0;
    var sumOrder = 0;
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
      sumOrder += docs[i].orderList.length
      sumProfit += totalPrice
      sumQuantity += quantity
      docs[i].orderInfo = obj
    }
    res.render('product/productList', {
      products: docs,
      product: 'product',
      sumProfit: sumProfit.toFixed(1),
      sumQuantity: sumQuantity,
      sumOrder: sumOrder,
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
    res.render('product/productDetail', {
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
    res.render('product/productUpload', {
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
      productRate: 0,
      totalProfit: 0
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
  res.render('product/productUpdate', {
    product: 'product'
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


function dataToCSV(dataList, headers) {
  var allObjects = [];
  // Pushing the headers, as the first arr in the 2-dimensional array 'allObjects' would be the first row
  allObjects.push(headers);

  //Now iterating through the list and build up an array that contains the data of every object in the list, in the same order of the headers
  dataList.forEach(function (object) {
    var arr = [];
    arr.push(object.title);
    arr.push(object.orderInfo.qty);
    arr.push(object.orderList.length)
    arr.push(object.orderInfo.price);

    // Adding the array as additional element to the 2-dimensional array. It will evantually be converted to a single row
    allObjects.push(arr)
  });

  // Initializing the output in a new variable 'csvContent'
  var csvContent = "";

  // The code below takes two-dimensional array and converts it to be strctured as CSV
  // *** It can be taken apart from the function, if all you need is to convert an array to CSV
  allObjects.forEach(function (infoArray, index) {
    var dataString = infoArray.join(",");
    csvContent += index < allObjects.length ? dataString + "\n" : dataString;
  });

  // Returning the CSV output
  return csvContent;
}

async function paginate(pages, limitNum) {
  var productChunks = [];
  await Product.paginate({}, {
    page: pages,
    limit: limitNum
  }, function (err, result) {
    var chuckSize = 4;
    for (var i = 0; i < result.docs.length; i += chuckSize) {
      productChunks.push(result.docs.slice(i, i + chuckSize))
    }
  });
  return await productChunks;
}