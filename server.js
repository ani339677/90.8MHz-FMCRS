//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require('nodemailer');
const {google} = require("googleapis");
const CLIENT_ID = '372917835791-1cslhmea6njrmpqbod1mrrlauadv74kf.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04EkzH2uX-IVgCgYIARAAGAQSNwF-L9IrQBJ2aTfRhedrqn7ZcAXmxBL0pl48F3XaodGyKXa9jY3Lur3S8VmDgxI9OR-3nn1GFrU';
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:gndec%40123@90-8mhzwebdb.cepkh.mongodb.net/fmcrsDB?retryWrites=true&w=majority", {useNewUrlParser: true});

subscribersSchema={
  email_id: {
    type: String,
    required: [1,"Email is must."],
    trim: true,
    lowercase: true,
    unique: true,
  },
  phone_number: {
    type: Number,
    min: 1000000000,
    max: 9999999999,
    required: [1, "Phone number is must."],
    unique: true
  }
};
participantSchema={
  _id: Number,
  fullName: {
    type: String,
    required: [1]
  },
  phone_number: {
    type: Number,
    required: [1]
  },
  email_id: {
    type: String,
    required: [1]
  },
  class: {
    type: String,
    required: [1]
  },
  branch: {
    type: String,
    required: [1]
  },
};
eventSchema={
  eventName: {
    type: String,
    unique: true
  },
  participants: {
    type: [participantSchema],
  }
};

const subscriber = mongoose.model("subscriber",subscribersSchema);
const participant = mongoose.model("participant",participantSchema);
const event = mongoose.model("event",eventSchema);

const subscribeContent = fs.createReadStream(__dirname+"/subscribeUs.html");

const app=express();
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("static"));

app.listen(process.env.PORT || 3000, function(){
  console.log("Server started on port 3000");
});

app.get("/", function(req,res){
  res.render("index",{if_success: ""});
});
app.get("/programs",function(req,res){
  const programs=require(__dirname+"/static/data/programs");
  console.log(programs);
  var audioFilesObj={}
  programs.forEach(function(program){
    var pName=program.programName;
    const folderPath = __dirname+"/static/data/programAudios/"+pName;
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
      }
      else{
        const files = fs.readdirSync(folderPath);
        const audios=[];
        files.forEach(function(file){
          if (path.extname(file)=='.mp3' || path.extname(file)=='.wav'){
            audios.push(file);
          }
        });
        console.log(audios);
        audioFilesObj[pName]=audios;
      }
    } catch (err) {
      console.error(err)
    }
  });
  console.log(audioFilesObj);
  res.render("snippet_programs",{if_success: "", programs:programs, audioFiles:audioFilesObj});
})

app.post("/", function(req,res){
    var em_id=req.body.email_id;
    var ph_no=req.body.phone_number;
    const newSubscriber= new subscriber({
      email_id: em_id,
      phone_number: ph_no
    });
    subscriber.insertMany([newSubscriber], function(err){
      if(!err){
        oAuth2Client.getAccessToken(function(err,token){
          if (err){
            console.log(err);
          }
          else{
            console.log("Access Token is ",token);
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                type: 'OAuth2',
                user: 'fmcommunityradio90.8mhz@gmail.com',
                cllientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: token, 
              }
            });
            const mailOptions = {
              from: 'fmcommunityradio90.8mhz@gmail.com',
              to: em_id,
              subject: '90.8 MHz FM Community Radio',
              html: subscribeContent,
            };
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
                success="false";
              } else {
                console.log('Email sent: ' + info.response);
                success="true";
              }
              res.render("index",{if_success: success});
            });
          }
        }); 

      }
      else{
        if(err.code===11000){
          res.render("index",{if_success: "already registered"});
        }
        if(err._message==="subscriber validation failed"){
          console.log("Invalid data");
          res.render("index",{if_success: "invalid data"});
        }
        
      }
    })
    
});

app.post("/event", function(req,res){
  console.log(req.body);
  const folderPath = __dirname+"/static/data/eventGlimpses/"+req.body.event_name
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath)
    }
    else{
      const files = fs.readdirSync(folderPath);
      const photos=[];
      files.forEach(function(file){
        if (path.extname(file)=='.png' || path.extname(file)=='.jpg' || path.extname(file)=='.jpeg' || path.extname(file)=='.mp4' || path.extname(file)=='.mkv' || path.extname(file)=='.avi'){
          photos.push({fName: file, ext: path.extname(file)});
        }
      });
      console.log(photos);
      res.render("snippet_event_glimpses",{if_success: "", event_name: req.body.event_name, glimpses: photos});
    }
  } catch (err) {
    console.error(err)
  }
});

app.post("/event_register",function(req,res){
  const details=req.body;
  console.log(details);
  event.find({eventName:details.eventName}, function(err,docs){
    console.log(docs);
    const newParticipant = new participant(
      {
        fullName: details.full_name,
        phone_number: details.phone_number,
        email_id: details.email_id,
        _id: details.university_roll_no,
        class: details.class,
        branch: details.branch
      }
    );
    if (docs.length==0){
      console.log("New event to be created!");
      const newEvent = new event({
        eventName: details.eventName,
        participants: [newParticipant]
      });
      event.insertMany([newEvent],function(err){
        if (err){
          console.log(err);
        }
      });
    }
    else{
      console.log("Exsisting event needs to be updated!");
      var toBeAdded=true;
      console.log(docs[0].participants);
      docs[0].participants.forEach(function(participant){
        if (participant._id==details.university_roll_no){
          toBeAdded=false;
        }
      })
      if (toBeAdded){
        event.updateOne({eventName: details.eventName}, {participants: docs[0].participants.concat([newParticipant])}, function(err){
          if (err){
            console.log(err);
          }
        });
      }
      
    }
  });
});