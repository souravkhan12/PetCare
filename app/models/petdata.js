const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema({
    petname : {type: String, required: true},
    breed : { type: String , required : true},
    size : { type: String , required : true},
    petinfo : {type : String, required : true},
    image :{
        data : Buffer,
        contentType : String
    },
    ImageName : {type : String}
},  {timestamps : true})

const PetData = new mongoose.model("PetData" , registerSchema);

module.exports = PetData;