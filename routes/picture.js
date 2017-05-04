var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = require('../config').mongodb.url;
var assert = require('assert');

router.get('/', function (req, res, next) {
  res.render('picture/index');
});

router.get('/upload', function (req, res, next) {
  res.render('picture/upload');
});

router.get('/download', function (req, res, next) {
  
});

router.get('/like', function (req, res, next) {
  
});

router.get('/comment', function (req, res, next) {
  
});

module.exports = router;
