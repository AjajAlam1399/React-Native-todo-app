const mongoose = require("mongoose");
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchemas = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Enter users Name"],
    trim: true,
    maxlength: [30, "Users Name should not exceed 30 chracters"],
    minlength: [4, "Users name should consist more than 4 chracters"],
  },
  email: {
    type: String,
    required: [true, "Enter Users Email"],
    unique: true,
    validate: [validator.isEmail, "Enter valid Email"],
  },
  password: {
    type: String,
    require: [true, "Please Enter User Password"],
    minlength: [8, "User Password should contain more than 8 charaters"],
    maxlength: [20, "User Password should not exceed 20 charaters"],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: new Date(Date.now()),
  },
  task: [
    {
      title: String,
      description: String,
      completed: Boolean,
      createdAt: Date,
    },
  ],
  otp: {
    type: Number,
    required: true,
  },
  varified: {
    type: Boolean,
    default: false,
  },
  otpExpire: Date,
  reSetPasswordToken: String,
  reSetPasswordExpire: Date,
});

// enctypting users password
UserSchemas.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcryptjs.hash(this.password, 10);
  }
  next();
});

// creating a token for user signIn
UserSchemas.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_TOKEN, {
    expiresIn: process.env.JWT_EPXIRE,
  });
};

// password comparsion
UserSchemas.methods.comparePassword = async function (enterPassword) {
  return await bcryptjs.compare(enterPassword, this.password);
};

// gentating restPassword Token
UserSchemas.methods.getRestPasswordToken = function () {
  const restToken = crypto.randomBytes(20).toString("hex");

  // hasing restToken

  this.reSetPasswordToken = crypto
    .createHash("sha256")
    .update(restToken)
    .digest("hex");
  this.reSetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return restToken;
};

// auto delete from mongodb
UserSchemas.index({ otpExpire: 1 }, { expireAfterSeconds:0});

const User = new mongoose.model("User", UserSchemas);

module.exports = User;
