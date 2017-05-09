var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var mongoUrl = require('../config').mongodb.url;
var assert = require('assert');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var fs = require('fs');
var uuidV4 = require('uuid/v4');
var webPath = require('../config').path;
var jwtAuth = require('../jwtauth');
var Jimp = require('jimp');
var sizeOf = require('image-size');

router.get('/', function (req, res, next) {
  res.render('me/index');
});

router.get('/pictures', function (req, res, next) {
  
});

router.get('/topics', function (req, res, next) {
  
});

router.get('/albums', function (req, res, next) {
  
});

router.get('/settings/change-pass', function (req, res, next) {
  
});

router.get('/settings/change-avatar', function (req, res, next) {
  
});



module.exports = router;