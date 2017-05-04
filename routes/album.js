var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = require('../config').mongodb.url;
var assert = require('assert');

router.get('/', function(req, res, next) {
  res.render('album/index');
});

router.get('/create', function(req, res, next) {
  
});

router.get('/update', function(req, res, next) {
  
});

router.get('/delete', function(req, res, next) {
  
});

router.get('/like', function(req, res, next) {
  
});

router.get('/comment', function(req, res, next) {
  
});

router.get('/page/delete', function(req, res, next) {
  
});

router.get('/page/comment', function(req, res, next) {
  
});

module.exports = router;