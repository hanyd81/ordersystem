// order system
//  heroku link    https://enigmatic-beach-81988.herokuapp.com


const express=require ("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const exphbs = require("express-handlebars");
const clientSessions = require("client-sessions");
const date = require('date-and-time');
app = express();
//------------------- index start from 1-----------
var Handlebars = require('handlebars');

Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});
//---------------------------------------
const dataService=require("./data-service.js");

const HTTP_PORT=process.env.PORT || 8050;

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({ storage: storage });

app.use(express.static('./public'));

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(clientSessions ({
    cookieName:"session",
    secret: "happywokisanicechinesefoodresrunt",
    duration: 40*60*1000,
    activeDuration: 20*60*1000
}));

app.use((req,res,next)=>{
    res.locals.session=req.session;
    next();
})

function ensureLogin(req,res,next){
    if (!req.session.user){
        res.redirect("/login");
    }else {
        next();
    }
}
//----------------------active nav bar------------------------
app.use((req,res,next)=>{
    let route=req.baseUrl+req.path;
    //console.log("req.baseUrl  "+req.baseUrl);
    //console.log("req.path "+req.path);
    app.locals.activeRoute=(route=="/")?"/":route.replace(/\/$/,"");
    next();
})

app.engine('.hbs', exphbs({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function (url, options) {
            return '<li' + ((url == app.locals.activeRoute) ? ' class="active"' : "") +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        } }
    }));

app.set("view engine", '.hbs');


//--------------GET---routes-----------------------

app.get("/", (req,res)=>{
    res.render("home");
});

app.get("/login", (req,res)=>{
    res.render("login");
})

app.get("/Klogin", (req,res)=>{
    res.render("login");
})

app.get("/register", (req,res)=>{
    res.render("register");
})

app.get("/logout", (req,res)=>{
    req.session.reset();
    res.redirect("/");
})

app.get("/meals", (req,res)=>{
    dataService.getAllMeal().then((data)=>{
       res.render("meals",{mealData:data});  
    }).catch((err)=>{
        res.render("meals",{message:err}); 
    })
   
})

app.get("/addmeal",(req,res)=>{
    res.render("addmeal");
});

app.get("/meals/delete/:name", (req,res)=>{
    dataService.deleteMeal(req.params.name).then(()=>{
        res.redirect("/meals");
    }).catch((err)=>{
        console.log(err);
        res.status(500).send("Unable to Remove meal / meal not found");
    })
})

app.get("/meal/:mealId", (req, res) => {
    dataService.getMealById(req.params.mealId).then((data) => {
        if(data){
            res.render("changemeal", { meal: data }); 
        }else{
            res.status(404).send(" empty meal");
        }
        
    }).catch((err) => {
        res.status(404).send("Meal Not Found");
    })
});

app.get("/tableStart",(req,res)=>{
    res.render("tableStart");
})

app.get("/kitchenStart",(req,res)=>{
    res.render("kitchenStart");
})

app.get("/tMeals", (req, res) => {
    dataService.getAllMeal().then((meals) => {
        
        if(!req.session.user){
           // alert("Table session time out, please log in");
            res.redirect("/");
        }
        if (req.session.user.order == "") {
            dataService.createOrder(req.session.user.tableNumber).then((theOrder) => {
                req.session.user.order= theOrder.id;
                if(theOrder.active){req.session.user.actOrder=true; 
                    console.log(req.session.user.actOrder);
                }
                res.render("tMeals", { mealData: meals, actOrder: true});
            }).catch((err)=>{
                console.log(err);
                res.status(500).send("unable to create order");
            });
        } else
            res.render("tMeals", { mealData: meals });
    }).catch((err) => {
        console.log(err);
        res.status(500).send("unable to get meals");
    })
});

app.get("/tOrders",(req,res)=>{
    dataService.getLatestOrder(req.session.user.tableNumber).then((theOrder)=>{

        if(theOrder){
            if(theOrder.active){req.session.user.actOrder=true;}
           req.session.user.order=theOrder.id;
        let orderTime = date.format(theOrder.time, 'YYYY-MM-DD  hh:mm A');
        res.render("orders", { order: theOrder, time: orderTime });
        }else
        res.render("orders");
    }).catch((err)=>{
        console.log(err);
        res.status(500).send("unable to get meals for order");
    })
})

app.get("/orders/:orderId", (req, res) => {
    dataService.getOrderById(req.session.user.order).then((order) => {
        let orderTime = date.format(order.time, 'YYYY-MM-DD  hh:mm A')
        res.render("orders", { order: order, time: orderTime })
    }).catch((err) => {
        console.log(err);
        res.status(500).send("unable to get meals for order");
    })
})

app.get("/checkout/:orderId",(req,res)=>{
    dataService.checkOutOrder(req.params.orderId).then((mesg)=>{
        //console.log(mesg);
        req.session.user.order="";
        res.render("tableStart");
    }).catch((err)=>{
        console.log(err);
        res.status(500).send("unable to check out order");
    });
})
app.get("/kOrders",(req,res)=>{
    dataService.getActiveOrder().then((orders)=>{
        res.render("kOrders",{orders:orders} );
    }).catch((err)=>{
        console.log(err);
        res.status(500).send("unable to get orders");
    });
})

app.get("/allOrders",(req,res)=>{
    dataService.getAllOrder().then((orders)=>{
        res.render("kAllOrders",{orders:orders} );
    }).catch((err)=>{
        console.log(err);
        res.status(500).send("unable to get orders");
    })
})

//-------------------POST route---------------------
app.post("/register", (req, res) => {

    dataService.registerUser(req.body).then(() => {
        res.render("register", { successMessage: "Table created" });
    }).catch((err)=>{
        res.render("register", {errorMessage: err, userName: req.body.userName});
    });
});

app.post("/login",(req,res)=>{
    dataService.checkUser(req.body).then((user) => {
        req.session.user = {
        tableNumber:user.number,
        owner:user.owner,
        order:""
        }
        if(req.session.user.owner){
            res.redirect("/kitchenStart");
        }else{
            res.redirect('/tableStart');
        }
        
        }).catch((err)=>{
            res.render("login", {errorMessage: err, tableNumber: req.body.number});
        });
});

app.post("/meals/add", upload.single("picture"), (req, res) => {

    let meal = {
        name: req.body.name,
        price: parseFloat(req.body.price),
        picture: req.file.filename
    };
    dataService.addmeal(meal).then(() => {
        res.redirect("/meals");
    }).catch((err) => {
        res.render("addmeal", { message: err });
    });

})

app.post("/meal/updatePic", upload.single("newPicture"), (req, res) => {
    dataService.getMealById(req.body.mealId).then((meal) => {
        if(req.body.oldPic!=meal.picture){
            picPath = path.join("./public/images/uploaded", req.body.oldPic);
                //console.log(picPath);
                fs.unlink(picPath, (err) => {
                    if (err) console.log(err);
                });
        }
        res.render("changemeal", { meal: meal, newPic: req.file.filename });
    });

})

app.post("/meal/update", (req,res)=>{
    dataService.updateMeal(req.body).then(()=>{
        res.redirect("/meals");
    }).catch((err)=>{
        console.log(err);
        res.status(500).send("Unable to process request");
    });
})

app.post("/api/orders/:orderId",(req, res)=>{
    //console.log(req.body);
    dataService.addMealToOrder(req.session.user.order,req.body).then(()=>{
res.json("meal added to the order");
    }).catch((err)=>{
        console.log(err);
        res.json("cannot add meal");
    })
})

app.put("/api/orders/:orderId",(req, res)=>{
    dataService.fillMealInOrder(req.params.orderId, req.body.mealId).then(()=>{
        res.json("meal filled");
            }).catch((err)=>{
                console.log(err);
                res.json("cannot fill meal");
            })
})

//------------------------- 404-----------------------
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});


dataService.initialize()
.then(() => {
    app.listen(HTTP_PORT, function () {
        console.log("Express http server listening on " + HTTP_PORT);
    });
}).catch((err) => {
    console.log("unable to start server: "+ err);
})