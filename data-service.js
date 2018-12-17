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
            Meals=mongoose.model('Meals',mealSchema);
            Orders=mongoose.model('Orders',orderSchema);
            Users=mongoose.model('Users',userSchema);
            userSchema.add({orders:[orderSchema]});
            resolve();
        });
    });
};

