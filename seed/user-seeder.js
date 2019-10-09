var User = require('../models/user');
var mongoose = require('mongoose');
const mongo = mongoose.connect('mongodb://localhost:27017/shopping',{useNewUrlParser: true});
mongo.then(() => {
    console.log('connected');
    }).catch((err) => {
    console.log('err', err);
    });
var user = [
    new User({
        email: 'nhatnguyen00198@gmail.com',
        password: '1234',
        fullName: 'Nhat Nguyen',
        phoneNum: '0123123123',
        address: '01 Yersin, district 1, Ho Chi Minh city, VN',
        role: 'Manager',
        status: 'Active',
        company: 'Greenwich of University',
        description: 'TOP 2 student',
        birthday: ''
    })
];
var done = 0;
for(var i = 0 ; i< user.length; i++){
    user[i].encryptPassword(user[i].password)
    user[i].save(function(err,result){
        done++;
        if(done == user.length){
            exit();
        }
    });
}
function exit(){
    mongoose.disconnect();
}