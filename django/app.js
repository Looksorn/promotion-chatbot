/*
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Remix this as the starting point for following the Messenger Platform
 * quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

require('dotenv').load();

// Imports dependencies and set up http server
const
  PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN,
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()), // creates express http server
  localtunnel = require('localtunnel'),
  PORT = process.env.PORT || 1337;

const tunnel = localtunnel(PORT, { subdomain: 'looksorn-looksorn'}, (err, tunnel) => {
  if(err){
    console.log(err);
    process.exit();
  }
  console.log(tunnel.url);
});

tunnel.on('close', function() {
    process.exit(1);// When the tunnel is closed
});

//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = 'mongodb://mongo:27017/admin';
mongoose.connect(mongoDB);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', function() {
  console.log("Connection Successful!");
});

var EventSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: String,
  image_url: String,
  tags: [String],
  dates: [String],
  location: String,
  url: String
});

var Event = mongoose.model('Event', EventSchema, 'event');

require('mongoose').set('debug', true);

// Sets server port and logs message on success
app.listen(PORT, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "eoeoeiei";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Handles messages events
async function handleMessage(sender_psid, received_message) {
  let response;
  // Check if the message contains text
  if (received_message.text) {
    const entities = received_message.nlp.entities;
    console.log('entities',entities);

    if (entities.intent!=undefined && entities.intent[0].value==='greetings' && entities.intent[0].confidence>0.8) {
      response={
          "text": "สวัสดี ลองถามโปรโมชั่นในช่วงนี้ดูสิ"
      }
      callSendAPI(sender_psid,response);
      response={
        "text": "อย่าลืม! ระบุวันที่มาด้วยนะ"
      }
    }
    else if (entities.intent!=undefined && entities.intent[0].value==='thanks' && entities.intent[0].confidence>0.8) {
      response={
        "text": "ยินดีเสมอจ้า"
      }
    }
    else if (entities.intent!=undefined && entities.intent[0].value==='bye' && entities.intent[0].confidence>0.8) {
      response={
        "text": "บายยยยย"
      }
    }
    else if ((entities.intent!=undefined && entities.intent[0].value==='search_query' && entities.intent[0].confidence>0.8)||(entities.tags!=undefined)) {
      const curl = new (require( 'curl-request' ))();
      const text_to_date = await curl.get('th-text-to-date:8000/?text='+received_message.text);
      var json_obj = text_to_date.body;
      if (json_obj==''){
        response={
          "text": "ใส่วันที่ด้วยสิ"
        }
      }
      else{
        json_obj=json_obj.replace(/}{/g, '},{');
        // console.log(json_obj);
        json_obj=json_obj.replace(/'/g, '\"');
        json_obj=JSON.parse('['+json_obj+']');
        // var json_str = JSON.stringify(json_obj[0].date);
        // json_str = json_str.replace(/"/g, "'");
        // console.log(json_obj);
        var date_list=[];
        if (json_obj[0].type==="single"){
          date_list.push(json_obj[0].date);
        }else{
          date_list=json_obj[0].date;
        }
        //console.log(date_list);

        var tag_list=[];
        if (entities.tags!=undefined) {
          for(let i=0;i<entities.tags.length;i++){
            tag_list.push(entities.tags[i].value);
          }
        }
        else{
          tag_list.push("ALL");
        }
        //console.log('tag_list',tag_list);

        var event_list = [];
        //console.log('date_list.length',date_list.length);
        for(let i=0; i<date_list.length; i++){
          for(let l=0;l<tag_list.length;l++){
            const date_to_event = await Event.find({'dates': date_list[i], 'tags': tag_list[l]}, function (err,event) {
              if (err) return console.log(err);
            });
            for(let j=0;j<date_to_event.length;j++){
              var flag=0;
              if (event_list.length===0) {
                event_list.push(date_to_event[j]);
              }
              else{
                for(let k=0;k<event_list.length;k++){
                  if (JSON.stringify(event_list[k]._id)===JSON.stringify(date_to_event[j]._id)){
                    flag=1;
                  }
                }
                if (flag===0){
                  event_list.push(date_to_event[j]);
                }
              }
            }
          }
        }
        //console.log('event list',event_list,typeof event_list);

        if (event_list.length===0) {
          response={
            "text": "ซอรี่ "+json_obj[0].token+"ไม่มีโปรโมชั่นนะ"
          }
        }else{
          response={
              "text": "โปรโมชั่น"+json_obj[0].token+" ก็เนี่ยเลย..."
          }
          callSendAPI(sender_psid,response);

          var element_list=[];
          event_list.forEach(function(event){
            let tags='';
            for(let i=0;i<event.tags.length;i++){
              tags=tags+event.tags[i]+',';
            }
            tags=tags.slice(0,-1);
            let element={
              "title": "📢"+event.title+"🔥🔥🔥",
              "image_url": event.image_url,
              "subtitle": "\n📆"+event.dates[0]+"ถึง"+event.dates[event.dates.length-1]+"\n📍"+event.location+"🛍️"+tags,
              "buttons":[
                {
                  "type":"web_url",
                  "url":event.url,
                  "title":"ดูรายละเอียด"
                }
              ]
            }
            element_list.push(element);
          });
          // console.log('element list',element_list);

          // Create the payload for a basic text message
          response = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements": element_list
              }
            }
          }
        }
      }
    }
    else{
      response={
        "text": "ไม่เข้าใจ พิมพ์ใหม่ซิ"
      }
    }
  }
  else if(received_message.attachments){
    response={
      "text": "ส่งข้อความมาสิ"
    }
  }
  if (response!==undefined) {
    callSendAPI(sender_psid, response);
  }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log(body)
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}