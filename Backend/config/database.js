const mongoose = require("mongoose");
const DATABASE = process.env.DATABASE;

mongoose
  .connect(DATABASE, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("DATABASE has been connected");
  });  // catch part is handeled by unhandeled promise rejection
