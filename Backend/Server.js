const dotenv = require("dotenv");
const app = require("./App");
const cloudinary = require("cloudinary");

// unhandled uncaught excepton

process.on("uncaughtException", (err) => {
  console.log(`Error : ${err}`);
  console.log("Server is shuttion down due to uncaught exception");
  process.exit(1);
});

// dotenv configration
dotenv.config({ path: "Backend/config/config.env" });

// dataBase config
require("./config/database");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const server = app.listen(process.env.PORT, (error) => {
  if (!error) {
    console.log(`server is live on PORT : ${process.env.PORT}`);
  } else {
    console.log(error.message);
  }
});

// unhandeled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error : ${err}`);
  console.log("Server closed due to unhanedeled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});
