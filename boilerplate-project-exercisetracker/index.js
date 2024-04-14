const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const Model = require("./schema.js");
const bodyParser = require("body-parser");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//connect to mongodb
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("successfully connected to mongodb");
  } catch (error) {
    console.log("error connecting to mongodb");
  }
};
connectDb();

// home page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//post a new user
app.post("/api/users", (req, res) => {
  //creates and save a new document to database
  Model.create({
    username: req.body.username,
  }).then((docs) => {
    res.json({
      username: docs.username,
      _id: docs._id,
    });
  });
});

//adding a new exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
  id = req.params._id;
  let { description, duration, date } = req.body;

  //preprocessing and checking data
  duration = Number(duration);
  if (date === "") {
    date = new Date(Date.now())
  }
  else{
    date = new Date(date);
  }
  
  
  //check data validity
  if (isNaN(duration)) {
    return res.json({ error: "duration is not a number" });
  }
  if (date == "Invalid Date") {
    return res.json({ error: "date is invalid" });
  }
  date = date.toDateString();

  //check whether id exists in database
  try {
    const docs = await Model.findById(id);
    if (!docs) {
      throw new Error("user not found");
    }

    //pushing new data to particular document and increasing count variable
    docs.count = docs.count + 1;
    docs.exercise.push({
      description: description,
      duration: duration,
      date: date,
    });

    await docs.save()
    
    //returning json to user
    return res.json({
      _id: docs._id,
      username: docs.username,
      date: date,
      duration: duration,
      description: description,
    })
  } catch (error) {
    console.log(`error finding user -> ${error}`);
  }
  
});

//get all users
app.get("/api/users", async (req, res) => {
  try {
    let doc = await Model.find({}).select("_id username __v");
    res.json(doc);
  } catch (e) {
    console.log(`error getting all users -> ${e}`);
  }
});

//get all logs of a user
app.get("/api/users/:_id/logs", async (req, res) => {
  id = req.params._id;

  //checking if it's only the base url
  try {
  const docs = await Model.findById(id);
  if (!docs) {
    throw new Error("user not found");
  }

  return res.json({
    _id: docs._id,
    username: docs.username,
    count: docs.count,
    log: docs.exercise
  })
  }
  catch(e){
    return res.json({error: "user not found"})
  }
  /*
  //preprocessing data
  from = new Date(from);
  to = new Date(to);
  limit = Number(limit);

  //checking data
  if (from == "Invalid Date" || to =="Invalid Date") {
    return res.json({ error: "date is invalid" });
  }
  if(isNaN(limit)){
    return res.json({error: "limit is not a number"})
  }
  */


})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
