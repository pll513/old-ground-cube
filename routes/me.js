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
  res.redirect('/me/pictures');
});

router.get('/pictures', function (req, res, next) {
  res.render('me/picture');
});

router.get('/topics', function (req, res, next) {
  res.render('me/topic');
});

router.get('/albums', function (req, res, next) {
  res.render('me/album');
});

router.get('/albums/:albumId', function (req, res, next) {
  res.render('me/album-detail');
});

router.get('/messages', function (req, res, next) {
  res.render('me/message');
});

router.get('/settings/change-pass', function (req, res, next) {
  res.render('me/change-pass');
});

router.get('/settings/change-avatar', function (req, res, next) {
  res.render('me/change-avatar');
});



module.exports = router;