const mongoose = require("mongoose");

const registerSchema = mongoose.Schema({
    // owner : { type: String , required : true},
    role : {type:String , default: 'client'},
    name : {type: String, required: true},
    email : { type: String , required : true},
    password : { type: String , required : true},
    phone : {type:String,required: true},
    // breed : {type:String , default: 'german'},
},  {timestamps : true})

const User = mongoose.model("User" , registerSchema);

module.exports = User;