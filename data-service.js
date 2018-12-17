const fs = require("fs");
const path = require("path");

const mongoose=require("mongoose");
const Schema=mongoose.Schema;




var mealSchema = new Schema({
    name: String,
    picture: String,
    price: Number
})
var orderSchema = new Schema({
    number: Number,
    time: { type: Date, default: Date.now },
    meals: [{ name: String, picture: String, price: Number }],
    total: Number
})

var userSchema= new Schema({
    owner: Boolean,
    number: Number,
    password: String,
})
var Meals, Users, Orders; // to be defined on new connection (see initialize)

module.exports.initialize=function(){
    return new Promise((resolve, reject)=>{
        let db=mongoose.createConnection("mongodb://orderTable:tableOrder11@ds251819.mlab.com:51819/order_page", { useNewUrlParser: true });
        db.on('err',(err)=>{
            reject(err);
        });
        db.once('open',()=>{
            Meals=db.model('Meals',mealSchema);
            Orders=db.model('Orders',orderSchema);
            Users=db.model('Users',userSchema);
            userSchema.add({orders:[orderSchema]});
            resolve();
        });

    });
};

module.exports.addmeal = function (newmeal) {
    let meal=new Meals(newmeal);
    return new Promise((resolve, reject) => {
        meal.save((err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                resolve(data.name + " saved ");
            }
        })
    });
}

module.exports.getAllMeal=function(){
    return new Promise((resolve, reject) => {
        Meals.find().exec().then((data)=>{
            resolve(data);
        }).catch((err)=>{
            reject(err);
        });
    });
}

module.exports.deleteMeal = function (myname) {
    return new Promise((resolve, reject) => {
        Meals.findOne({name:myname}).exec().then((meal)=>{
            Meals.deleteOne({ name: meal.name }).exec().then(() => {
                picPath=path.join("./public/images/uploaded",meal.picture);
                //console.log(picPath);
                fs.unlink(picPath,(err) => {
                    if (err) reject(err) ;
                     resolve(meal.name + 'deleted');
                  });        
            }).catch((err)=>{
                reject(err);
            })
        }).catch((err) => {
            reject(err);
        })
    });
}

module.exports.updateMeal=function(){
    
}
