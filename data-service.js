const fs = require("fs");
const path = require("path");
const bcrypt= require("bcryptjs");

const mongoose=require("mongoose");
const Schema=mongoose.Schema;


var mealSchema = new Schema({
    name: String,
    picture: String,
    price: Number
})
var orderSchema = new Schema({
    table: Number,
    time: { type: Date, default: Date.now },
    meals: [{ name: String, picture: String, price: Number , serve : Number, filled:Boolean}],
    total: Number,
    active: { type:Boolean, default: true }
})

var userSchema= new Schema({
    owner: Boolean,
    number: Number,
    password: String,
})
var Meals, Users, Orders; // to be defined on new connection (see initialize)

module.exports.initialize=function(){
    return new Promise((resolve, reject)=>{
        //let db=mongoose.createConnection("mongodb://orderTable:tableOrder11@ds251819.mlab.com:51819/order_page", { useNewUrlParser: true });
        let db=mongoose.createConnection("mongodb+srv://hyd:K7sMNzcksSj2TCKi@cluster0.ob1vk.mongodb.net/orderhyd?retryWrites=true&w=majority", { useNewUrlParser: true });
        db.on('err',(err)=>{
            reject(err);
        });
        db.once('open',()=>{
            Meals=db.model('Meals',mealSchema);
            Orders=db.model('Orders',orderSchema);
            Users=db.model('Users',userSchema);
           // userSchema.add({orders:[orderSchema]}); 
            /*//----------------add first owner---------------------
         bcrypt.genSalt(10, (err, salt) => {
            if (err) { console.log("There was an error encrypting the password");} 
            else {
                bcrypt.hash("123456", salt, (err, hash) => {
                    if (err) {console.log("There was an error encrypting the password");} 
                    else {
                        let newUser = new Users({
                            owner: true,
                            number: 999,
                            password: hash
                        });
                        newUser.save((err) => {
                            if (err) {
                                if (err.code == 11000) {console.log("User Name already taken");} 
                                else {console.log("There was an error creating the user:" + err);}
                            }
                        });
                    }
                })
            }
        }); 
//--------------------------------------------------------*/
            resolve();
        });
        

    });
};




//-------------------user related-----------------
module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password != userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) { reject("There was an error encrypting the password");} 
                else {
                    bcrypt.hash(userData.password, salt, (err, hash) => {
                        if (err) {reject("There was an error encrypting the password");} 
                        else {
                            let newUser = new Users({
                                owner: false,
                                number: userData.number,
                                password: hash
                            });
                            newUser.save((err) => {
                                if (err) {
                                    if (err.code == 11000) {reject("User Name already taken");} 
                                    else {reject("There was an error creating the user:" + err);}
                                }
                                else {resolve(); }
                            });
                        }
                    })
                }
            }); 
        }
    });
};

module.exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        Users.find({ number: userData.number }).exec().then((users) => {
            if (users.length == 0) { reject("Unable to find table: " + userData.number); }
            else {
                bcrypt.compare(userData.password, users[0].password).then((match) => {
                    if (!match) { reject("Incorrect Password for table: " + userData.number); }
                    else { resolve(users[0]); }
                });
            }
        }).catch(() => {
            reject("Unable to find table: " + userData.number);
        })
    });
};



//------------------meal CRUD-----------------------------
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

module.exports.deleteMeal = function (myId) {
    return new Promise((resolve, reject) => {
        Meals.findById(myId).exec().then((meal) => {
            Meals.deleteOne({ _id: myId }).exec().then(() => {
                picPath = path.join("./public/images/uploaded", meal.picture);
                fs.unlink(picPath, (err) => {
                    if (err) console.log(err);
                    resolve(meal.name + 'deleted');
                });
            }).catch((err) => {
                reject(err);
            })
        }).catch((err) => {
            reject(err);
        })
    });
}

module.exports.updateMeal = function (body) {
    return new Promise((resolve, reject) => {
        Meals.findOne({ _id: body.mealId }).exec().then((oldmeal) => {
            Meals.updateOne({ _id: body.mealId },
                { $set: { name: body.mealName, price: body.mealPrice, picture: body.mealPic } }
            ).then(() => {
                if (oldmeal.picture != body.mealPic) {
                    picPath = path.join("./public/images/uploaded", oldmeal.picture);
                    console.log(picPath);
                    fs.unlink(picPath, (err) => {
                        if (err) console.log(err);
                    });
                }
                resolve(body.mealName + 'updated');
            }).catch((err)=>{
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        })
    })
}

module.exports.getMealById = function (myId) {
    return new Promise((resolve, reject) => {
        Meals.findOne({ _id: myId }).exec().then((meal) => {
            resolve(meal);
        }).catch((err) => {
            console.log(err);
            reject(err);
        });
    })
}

//---------------------order CRUD---------------------
module.exports.createOrder = function (tableNum) {
    return new Promise((resolve, reject) => {
        var order = new Orders({
            table: tableNum,
            total: 0,
            meals: []
        });
        order.save((err,data) => {
            if (err) { console.log(err); reject(); }
            else{
                 resolve(data);
            }      
        })
    });
}

module.exports.addMealToOrder = function (orderId, newMeal) {
    return new Promise((resolve, reject) => {
        let mealTotal = 0;
        mealTotal += newMeal.price * newMeal.serve;
        Orders.updateOne({ _id: orderId },
            { $push: { meals: newMeal },
            $inc: { total: mealTotal } },
            )
            .exec().then(() => {
                resolve("meal added to the order");
            }).catch((err) => {
                reject(err);
            })
    })
}

module.exports.fillMealInOrder = function (orderId,mealId){
    return new Promise((resolve, reject) => {
        Orders.updateOne({ _id: orderId , "meals._id": mealId},
         { $set:{ "meals.$.filled": true}}   )
         .exec().then(() => {
            resolve("meal filled");
        }).catch((err) => {
            reject(err);
        })
    });
}

module.exports.getOrderById= function(orderId){
    return new Promise((resolve,reject)=>{
        Orders.findById(orderId).exec().then((order)=>{
            resolve(order);
        }).catch((err)=>{
            reject(err);
        })
    })
}



module.exports.getLatestOrder = function (tableNum) {
    let myOrders = [];
    return new Promise((resolve, reject) => {
        Orders.find({ table: tableNum }).exec().then((data) => {
            myOrders = data;
                resolve(myOrders[myOrders.length-1]);
              
        }).catch((err) => {
            reject(err);
        })
    });
}

module.exports.getAllOrder = function () {
   
    return new Promise((resolve, reject) => {
        //console.log("call getAllOrder");
        Orders.find().exec().then((data) => {
            resolve(data);
        }).catch((err) => {
            console.log(err);
            reject(err);
        });
    });
}

module.exports.getActiveOrder=function(){
    return new Promise((resolve, reject) => {
        Orders.find({active:true}).exec().then((orders) => {
            resolve(orders);
        }).catch((err) => {
            reject(err);
        });
    });
}

module.exports.checkOutOrder = function (id) {
    return new Promise((resolve, reject) => {
        Orders.updateOne({ _id: id },
            { $set: { active: false } })
            .exec().then(() => {
                resolve("order checked out");
            }).catch((err) => {
                reject(err);
            })
    });
}
