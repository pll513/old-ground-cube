var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = require('../config').mongodb.url;
var assert = require('assert');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
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
    db.collection('user').findOne({name: userName, password: userPassword}, function (err, result) {
      assert.equal(null, err);
      console.log(result);
      if (result) {
        console.log('hahahah');
        // req.session.userId = result._id;
        res.send({status: 0, msg: '注册成功'});
      } else {
        res.send({status: 1, msg: '账号或密码错误'});
      }
    })
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

module.exports = router;
