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

router.get('/', function (req, res, next) {
  res.render('topic/index');
});

router.get('/detail', function (req, res, next) {
  res.render('topic/detail');
});

router.post('/publish', jwtAuth, function (req, res, next) {
  console.log(req.body);
  console.log(req.decoded);
  var userId = req.decoded._id;
  var userName = req.decoded.name;
  // console.log(req.body.topic_text);
  // console.log(Object.keys(req.body));
  // console.log(req.body['topic_img[]']);
  var text = req.body.topic_text;
  var images = req.body['topic_img[]'];
  var time = new Date().getTime();
  console.log(webPath + '/public' + images[0]);
  console.log(webPath + images[0].replace('/images/tmp/', '/public/images/topic/'));
  for (var i = 0; i < images.length; ++i) {
    fs.rename(webPath + '/public' + images[i], webPath + images[i].replace('/images/tmp/', '/public/images/topic/'), function (err) {
      if (err) {
        console.log('图片移动失败： ' + err);
      } else {
        console.log('图片移动成功： ');
      }
    });
  }
  MongoClient.connect(mongoUrl, function (err, db) {
    assert.equal(null, err);
    db.collection('topic').insertOne({
      text: text,
      images: images,
      time: time,
      author_id: userId,
      author_name: userName,
      status: 1
    }, function (err, result) {
      assert.equal(null, err);
      db.close();
      res.json({success: true, message: '话题发布成功'});
    });
  });
  
});

router.post('/comment', function (req, res, next) {
  
});

router.post('/stop', jwtAuth, function (req, res, next) {
  var topicId = req.body.topic_id;
  MongoClient.connect(mongoUrl, function (err, db) {
    assert.equal(null, err);
    db.collection('topic').updateOne({_id: ObjectID(topicId)}, {$set: {status: 0}}, function (err, result) {
      assert.equal(null, err);
      db.close();
      res.json({success: true, message: '已终止话题'})
    });
  });
});

router.post('/delete', jwtAuth, function (req, res, next) {
  var topicId = req.body.topic_id;
  MongoClient.connect(mongoUrl, function (err, db) {
    assert.equal(null, err);
    db.collection('topic').updateOne({_id: ObjectID(topicId)}, {$set: {status: -1}}, function (err, result) {
      assert.equal(null, err);
      db.close();
      res.json({success: true, message: '话题删除成功'});
    });
  });
});

router.post('/uploadPictures', [jwtAuth, multipartMiddleware], function (req, res, next) {
  // console.log(webPath);
  // console.log(req.files['picture1']);
  // console.log(typeof req.files['picture1']);
  // console.log(req.body.test);
  var fileUrl = [];
  var fileExt;
  var originalFilename;
  var newFilename;
  for (var i in req.files) {
    originalFilename = req.files[i].originalFilename;
    fileExt = originalFilename.slice(originalFilename.lastIndexOf('.'));
    newFilename = uuidV4() + fileExt;
    fileUrl.push('/images/tmp/' + newFilename);
    fs.rename(req.files[i].path, webPath + '/public/images/tmp/' + newFilename, function (err) {
      if (err) {
        console.log('rename error: ' + err);
      } else {
        console.log('rename ok');
      }
    });
  }
  res.json({
    success: true,
    imgUrls: fileUrl
  });
});


module.exports = router;

