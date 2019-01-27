const express = require('express');
const app = express();
const mongodb = require('mongodb');

const config = require('./db');
const PORT = 4000;
const client = mongodb.MongoClient;

client.connect(config.DB, function(err, db) {
    if(err) {
    	console.log(err)
        console.log('database is not connected')
    }
    else {
        console.log('connected!!')
    }
});

app.get('/', function(req, res) {
    res.json({"hello": "world"});
});

app.listen(PORT, function(){
    console.log('Your node js server is running on PORT:',PORT);
});

// require('dotenv').load();

// const
// 	localtunnel = require('localtunnel'),
// 	PORT = process.env.PORT || 1337;

// const tunnel = localtunnel(PORT, { subdomain: 'looksorn'}, (err, tunnel) => {
//   if(err){
//     console.log(err);
//     process.exit();
//   }
//   console.log(tunnel.url);
//   //console.log(tunnel);
// });

// tunnel.on('close', function() {
//     // When the tunnel is closed
//     process.exit();
// });

//tunnel.close();