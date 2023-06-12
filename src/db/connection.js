const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://yakshmahawer:yaksh_1904@shresthar.fqk0htv.mongodb.net/shresthar?retryWrites=true&w=majority", {
     useNewUrlParser: true,
     useUnifiedTopology: true
}).then(() => {
    console.log("Connection Established");
}).catch((e) => {
    console.log(e);
});