var Product = require('../models/product')
module.exports = {
    'glosbeDaily': async function () {
        var today = new Date()
        var yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        var profit_today = 0;
        var profit_yesterday = 0;
        var dailySales = 0
        var obj_DailySales = {}
        var pro = await Product.find(async (err, docs) => {
            await docs.forEach(s => {
                s.orderList.forEach(x => {
                    if (x.orderDate.toISOString().slice(0, 10) == today.toISOString().slice(0, 10) && x.status == 1) {
                        profit_today += x.totalHasDiscount
                    } else if (x.orderDate.toISOString().slice(0, 10) == yesterday.toISOString().slice(0, 10) && x.status == 1) {
                        profit_yesterday += x.totalHasDiscount
                    }
                })
            })
        })

        if (profit_yesterday != 0 && profit_today == 0) {
            dailySales = -100
            obj_DailySales.dailySales = dailySales;
            obj_DailySales.icon = 'fa fa-long-arrow-down'
            obj_DailySales.color = 'text-danger'
        } else if (profit_yesterday == 0 && profit_today != 0) {
            dailySales = (profit_today / 100).toFixed(1)
            obj_DailySales.dailySales = dailySales;
            obj_DailySales.icon = 'fa fa-long-arrow-up'
            obj_DailySales.color = 'text-success'
        } else if (profit_yesterday == 0 && profit_today == 0) {
            dailySales = 0
            obj_DailySales.dailySales = dailySales;
            obj_DailySales.icon = 'fa fa-long-arrow-down'
            obj_DailySales.color = 'text-danger'
        } else if (profit_yesterday != 0 && profit_today != 0) {
            dailySales = (((profit_today - profit_yesterday) / profit_yesterday) * 100).toFixed(1)
            obj_DailySales.dailySales = dailySales;
            if (dailySales > 0) {
                obj_DailySales.icon = 'fa fa-long-arrow-up'
                obj_DailySales.color = 'text-success'
            } else {
                obj_DailySales.icon = 'fa fa-long-arrow-down'
                obj_DailySales.color = 'text-danger'
            }
        }
        return await obj_DailySales
    },
    'message_notification': async function () {
        // task pending - order
        var arr = []
        var obj = {
            'message': 0
        }
        var pro = await Product.find({
            'orderList.status': 0
        }, async (err, doc) => {
            if (doc) {
                obj.message = obj.message + 1
                obj.task_pending = doc.length
                await doc.forEach(s => {
                    arr.push(s)
                })
            }
        })
        // notification for new order
        var today = new Date()
        var pro_new = await Product.find({
            'orderList.status': 0,
        }, async (err, rs) => {
            var check = false
            var count = 0
            await rs.forEach(s => {
                s.orderList.forEach(x => {
                    if (x.orderDate.toISOString().slice(0, 10) == today.toISOString().slice(0, 10)) {
                        check = true
                        count++
                    }
                })
            })
            if(check == true){
                obj.message++
                obj.new_order = await count
                obj.date_new = today.toISOString().slice(0, 10)
            }
        })
        return await obj
    }
}