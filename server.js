const express = require("express");
const app = express();
const path = require("path");
const expressLayout = require("express-ejs-layouts");
const mongoose = require("mongoose");
const passport = require("passport");
const bodyParser = require("body-parser");
const multer = require("multer");
const Info = require("./app/models/petcare");
const session = require("express-session");
const MongoDbStore = require("connect-mongo");
const nodemailer = require("nodemailer");
const User = require("./app/models/user");
const bcrypt = require("bcrypt");
const PetData = require("./app/models/petdata");
var fs = require("fs");
const auth = require("./app/middleware/auth");

mongoose
  .connect("mongodb://127.0.0.1:27017/petcare", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successful connection");
  })
  .catch((e) => {
    console.log(e);
    console.log("Connection failed");
  });

app.use(
  session({
    secret: "mynameissourav",
    resave: false,
    store: MongoDbStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/petcare",
    }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 24 * 60 * 60 }, //24 hrs
  })
);

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });

app.use(express.static(__dirname + "/public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
require("./app/config/passport")(passport);

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.user;
  next();
});

app.post("/register",  async (req, res) => {
  const { role, name, email, password, phone } = req.body;
  User.exists({ email: email }, (err, result) => {
    if (result) {
      return res.redirect("/register");
    }
  });

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    role: role,
    name: name,
    email: email,
    password: hashPassword,
    phone: phone,
  });

  await newUser
    .save()
    .then((info) => {
      // req.flash('message','Register!!');
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/petdata", auth, upload.single("image"), async (req, res) => {
  const { petname, breed, size, petinfo } = req.body;
  //   console.log(JSON.stringify(req.file));

  var image = req.file.filename;
  var ImageName = image;
  var newPetData = new PetData({
    petname,
    breed,
    size,
    image,
    ImageName,
    petinfo,
  });
  await newPetData
    .save()
    .then((info) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/accept",(req,res)=>{
  PetData.updateOne({_id : req.body.Dog},{$set : {isaccepted : true}},(err)=>{
    if (err){
      console.log(err);
    }
    res.redirect("/")
  })
})
app.post("/delete",(req,res)=>{
  PetData.deleteOne({_id : req.body.Dog},(err)=>{
  res.redirect("/")
  })
})

app.post("/login", (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    // req.flash("error" , 'All fiels are required');
    return res.redirect("/login");
  }
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      // req.flash('error' , info.message);
      next(err);
    }
    if (!user) {
      // req.flash('error' , info.message);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        // req.flash('error' , info.message);
        next(err);
      }
      // console.log(user);
      return res.redirect("/");
    });
  })(req, res, next);
});

app.post("/logout", (req, res) => {
  req.logout();
  // req.flash('message', 'Logout');
  res.redirect("/login");
});

app.post("/send", auth, async (req, res) => {
  console.log("send");
  const output = `
  <p>You have a new Contact Message</p>
  <h3> Contact Details </h3>
  <ul>
  <li>Name : ${req.body.name}</li>
  <li>Company : ${req.body.company}</li>
  <li>Email : ${req.body.email}</li>
  <li>Phone : ${req.body.phone}</li>
  </ul>
  <h3> Message </h3>
  <p>${req.body.message}</p>
  `;
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    requireTLS: true,
    service: "gmail",
    auth: {
      user: "archi3wm@gmail.com", // generated ethereal user
      pass: "PKC4G4wnLZJ5ZU5", // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: "archi3wm@gmail.com", // sender address
    to: "souravkhan654@gmail.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: output, // html body
  });
  res.redirect("/contact");
});

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(expressLayout);
app.set("views", path.join(__dirname, "/resources/views"));
app.set("view engine", "ejs");

app.get("/login", (req, res) => {
  res.render("auth/login");
});

app.get("/petdata", (req, res) => {
  res.render("petdata");
});
app.get("/register", (req, res) => {
  res.render("auth/register");
});
app.get("/", (req, res) => {
  //   let files = fs.readdirSync("./uploads");
  //   console.log(files);
  PetData.find({}, (err, petdata) => {
    if (err) {
      console.log(err);
    } else {
      res.render("home", { petdata: petdata });
    }
  });
});

app.get("/contact", (req, res) => {
  res.render("contactUs");
});

app.get("/about",(req,res)=>{
  res.render("about")
})
app.get("/history",(req,res)=>{
  PetData.find({}, (err, petdata) => {
    if (err) {
      console.log(err);
    } else {
      res.render("history", { petdata: petdata });
    }
  });
})

app.listen(PORT, (err) => {
  console.log(`Listining on port ${PORT}`);
});
