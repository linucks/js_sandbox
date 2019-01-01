#! /usr/bin/env node
var async = require('async')

console.log('This script populates some users to your database. Specified database as argument - e.g.: populatedb mongodb://your_username:your_password@your_dabase_url');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
if (!userArgs[0].startsWith('mongodb://')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}

var User = require('./models/user')
var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB);
var db = mongoose.connection;
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

function userCreate(userdetail, callback) {
  var user = new User(userdetail);
  user.save(function (err, newuser) {
    if (err) {
      console.log(`Error adding user: ${err}`);
      return callback(err, null);
    }
    // console.log('Added New User: ' + newuser);
    return callback(null, user);
  } );
}

async.parallel([
  function(callback){
    userCreate({ email : 'test1@foo.bar',
                 username : 'test1',
                 password : 'test1'},
               callback);
  },
  function(callback){
    userCreate({ email : 'test2@foo.bar',
                 username : 'test2',
                 password : 'test2'},
               callback);
  }],
  function(err, results){
    if (err) {
      console.log(`Async finished with error: ${err}`);
      mongoose.connection.close();
      return;
    }
    console.log(`Async finished with results: ${results}`);
    mongoose.connection.close();
  }
);
