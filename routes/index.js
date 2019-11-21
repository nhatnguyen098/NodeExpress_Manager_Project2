var express = require('express');
var router = express.Router();
var Product = require('../models/product')
const multer = require('multer');
const multipart = require('connect-multiparty')
var chart = require('../config/setup_Chart')
var glosbe_Daily = require('../config/setup_GlosbeDaily')
var filter_Func = require('../config/filter_Func')
var auto_updateStatusOrder = require('../config/auto_updateStatusOrder')


let totalItemProfit = 0;
let totalAllOrder = 0;
let obj_DailySales = {}

router.get('/', isLoggedIn, async (req, res) => {
  var totalProfit = 0;
  var totalOrder = 0;
  Product.find(async (err, docs) => {
    for (var i = 0; i < docs.length; i++) {
      totalOrder += docs[i].orderList.length; // total order each product
      totalProfit += docs[i].totalProfit // sum total profit of each product.
    }
    // view compare profit of today with yesterday
    var dailySales = await glosbe_Daily.glosbeDaily()
    totalItemProfit = totalProfit;
    totalAllOrder = totalOrder

    // view line, pie, bar chart
    var lineChart = await chart.lineChart()
    res.locals.lineChart = await JSON.stringify(lineChart)
    var barChart = await chart.barChart()
    res.locals.arrProfit = await JSON.stringify(barChart)
    var pieChart = await chart.pieChart(totalProfit)
    res.locals.arrPercent = await JSON.stringify(pieChart)
    // filter top 5 product by profit
    Product.find().sort({
      totalProfit: -1
    }).limit(5).exec(async (err, rs) => {
      var i = 1;
      await rs.forEach(s=>{
        s.number = i
        i++ 
      })
      res.locals.top5_Profit = await rs
    })
    // filter top 5 product by rating star
    Product.find().sort({
      productRate: -1
    }).limit(5).exec(async (err, rs) => {
      var i = 1;
      await rs.forEach(s=>{
        s.number = i
        i++ 
      })
      res.locals.top5_rating = await rs
    })

    // var auto_updateStatus_Order = await auto_updateStatusOrder(2)
    var message = await glosbe_Daily.message_notification()
    req.session.messsages = message
    res.render('pages/index', {
      dashboard: 'dashboard', // 
      totalProfit: totalProfit.toFixed(1),
      totalOrder: totalOrder,
      dailySales: dailySales,
      // sessionUser: req.session.user._id
      sessionUser: req.session.user,
      notification: message
    })
  })
})


router.post('/filter_date', async (req, res) => {
  var start_date = await req.body.start.trim() // check value empty for input
  var end_date = await req.body.end.trim() // check value empty for input
  if (!start_date && !end_date) {
    res.redirect('/')
  } else {
    var pieChart = await chart.pieChart(totalItemProfit) // piechart
    var lineChart = await chart.lineChart() // linechart
    var barChart_filterDate = await filter_Func.filter_rangeDate(start_date, end_date) // func filter by range date for barchart
    res.locals.arrPercent = await JSON.stringify(pieChart) // binding data to pie chart
    res.locals.arrProfit = await JSON.stringify(barChart_filterDate) // binding data to bar chart
    res.locals.lineChart = await JSON.stringify(lineChart) // binding data to line chart
    var message = await glosbe_Daily.message_notification() // view message for header
    var dailySales = await glosbe_Daily.glosbeDaily() // view compare profit of today with yesterday
    res.render('pages/index', {
      dashboard: 'dashboard',
      totalProfit: totalItemProfit.toFixed(1), // view total value of product
      totalOrder: totalAllOrder, // view total order number
      dailySales: obj_DailySales, // view percent value today with yesterday
      sessionUser: req.session.user,
      notification: message,
      dailySales: dailySales
    })
  }
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


module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect('/user/signin');
}