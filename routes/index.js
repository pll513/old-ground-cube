var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = require('../config').mongodb.url;
var assert = require('assert');
var jwt = require('jsonwebtoken');
var jwtAuth = require('../jwtauth');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/test', function (req, res, next) {
  res.render('topic/publish');
});

router.post('/test', jwtAuth, function (req, res, next) {
  console.log('this is /test');
  console.log(req.dataOne);
  console.log(req.dataTwo);
  res.json({
    success: true
  });
});

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.get('/register', function (req, res, next) {
  res.render('register');
});

router.post('/login', function (req, res, next) {
  var reqBody = req.body;
  var userName = reqBody.user_name;
  var userPassword = reqBody.user_password;
  
  console.log(reqBody);
  
  MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    db.collection('user').findOne({name: userName}, function (err, user) {
      assert.equal(null, err);
      console.log(user);
      if (!user) {
        
        res.json({
          success: false,
          message: '账号不存在'
        });
        
      } else {
        
        if (user.password !== userPassword) {
          res.json({
            success: false,
            message: '密码错误'
          });
        } else {
          var token = jwt.sign(user, 'secret', {
            expiresIn: 24 * 60 * 60 // expires in 24 hours
          });
          res.json({
            success: true,
            message: 'Enjoy your token!',
            token: token
          });
        }
        
      }
      
    });
  });
  
});

router.post('/register', function (req, res, next) {
  var reqBody = req.body;
  var userName = reqBody.user_name;
  var userPassword = reqBody.user_password;
  var userPasswordConform = reqBody.user_password_confirm;
  
  if (/.{1,50}/.test(userName) && userPassword == userPasswordConform && /.{6}.{0,26}/.test(userPassword)) {
    // 检查账号是否已被注册
    MongoClient.connect(url, function (err, db) {
      assert.equal(null, err);
      db.collection('user').findOne({name: userName}, function (err, result) {
        assert.equal(null, err);
        console.log('item', result);
        if (result) {
          res.send({status: 1, msg: '该账号已被注册'});
        } else {
          db.collection('user').insertOne({name: userName, password: userPassword}, function (err, result) {
            assert.equal(null, err);
            res.send({status: 0, msg: '注册成功'});
          });
        }
        db.close();
      });
    });
  } else {
    res.send({status: 1});
  }
});

router.get('/me', function (req, res, next) {
  res.render('me');
});

module.exports = router;
