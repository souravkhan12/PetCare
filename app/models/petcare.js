const mongoose = require("mongoose");

const petcareSchema = mongoose.Schema({
    owner : { type: String , required : true},
    name : { type: String , required : true},
    type : { type: String , required : true},
    size : {type:String , required: true},
    breed : {type:String , default: 'german'},
},  {timestamps : true})

const Info = mongoose.model("Info" , petcareSchema);

module.exports = Info;