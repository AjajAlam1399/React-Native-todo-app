const express = require("express");
const app = express();
const cookiParser = require("cookie-parser");
const ErrorMiddleware = require("./middleware/Error");
const User = require("./Routes/UserRoutes");
const fileUpload = require("express-fileupload");
const cors=require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookiParser());
app.use(fileUpload({
    limits:{fileSize:50*1024*1024},
    useTempFiles:true
}));
app.use(cors());
// routing
app.use("/api/v1", User);

app.use(ErrorMiddleware);


app.get('/',(reqs,resp)=>{
resp.send("server is working");
})

module.exports = app;

// "type":"module"  module.export->export default , exports.register->expost const register, const express=require('express') --> import express from 'express'
