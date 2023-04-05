const mongoose = require("mongoose");


mongoose
  .connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("DATABASE has been connected");
  });  // catch part is handeled by unhandeled promise rejection
