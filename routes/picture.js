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
  res.render('picture/index');
});

router.get('/upload', function (req, res, next) {
  res.render('picture/upload');
});

router.get('/download', function (req, res, next) {
  var pictureId = req.query.picture_id;
  var size = req.query.size;
  console.log(req.query);
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.send({success: false});
    db.collection('picture').findOne({_id: ObjectID(pictureId)}, function (err, picture) {
      if (err) return res.send({success: false});
      var picturePath = 'public' + picture.url;
      console.log(picturePath);
      res.sendFile(picturePath, {root: webPath});
      db.close();
    });
  });
});

router.get('/:pictureId', function (req, res, next) {
  res.render('picture/detail');
});

router.post('/likeCount', function (req, res, next) {
  
  var pictureId = req.body.picture_id;
  
  MongoClient.connect(mongoUrl, function (err, db) {
    db.collection('picture').findOne({_id: ObjectID(pictureId)}, function (err, picture) {
      res.json({success: true, data: picture.like_count});
    });
  });
  
});

router.post('/like', jwtAuth, function (req, res, next) {
  var userId = req.decoded._id;
  var pictureId = req.body.picture_id;
  console.log(pictureId);
  console.log(userId);
  MongoClient.connect(mongoUrl, function (err, db) {
    db.collection('picture').findOne({_id: ObjectID(pictureId)}, function (err, picture) {
      if (!~picture.like_users.indexOf(userId)) {
        db.collection('picture').updateOne({_id: ObjectID(pictureId)}, {
          $inc: {like_count: 1},
          $push: {like_users: userId}
        }, function (err, result) {
          res.json({success: true});
          db.close();
        });
      } else {
        res.json({success: false, message: '你已经点过赞了'});
      }
    });
  });
  
});

router.post('/comment', jwtAuth, function (req, res, next) {
  
  var authorId = req.decoded._id;
  var pictureId = req.body.picture_id;
  var time = new Date().getTime();
  var text = req.body.text;
  console.log(pictureId);
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false});
    db.collection('user').findOne({_id: ObjectID(authorId)}, function (err, user) {
      if (err) return res.json({success: false});
      db.collection('picture').updateOne({_id: ObjectID(pictureId)}, {
        $push: {
          comments: {
            author_id: authorId,
            author_name: user.name,
            time: time,
            text: text
          }
        }
      }, function (err, result) {
        if (err) return res.json({success: false});
        res.json({success: true, message: '评论成功'});
        db.close();
      });
    });
    
  });
  
});

router.post('/commentList', function (req, res, next) {
  
  var pictureId = req.body.picture_id;
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false});
    db.collection('picture').findOne({_id: ObjectID(pictureId)}, function (err, picture) {
      if (err) return res.json({success: false});
      res.json({success: true, data: picture.comments});
    });
    
  });
  
});

router.post('/pictureList', function (req, res, next) {
  
  var category = req.body.category;
  var pageIndex = parseInt(req.body.pageIndex) || 1;
  var pageSize = parseInt(req.body.pageSize) || 24;
  var skip = (pageIndex - 1) * pageSize;
  var limit = pageSize;
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('picture').find({category: category}, {
      _id: 1,
      url: 1
    }).skip(skip).limit(limit).toArray().then(function (pictureList) {
      res.json({success: true, data: pictureList});
      db.close();
    });
  });
  
});

router.post('/pictureDetail', function (req, res, next) {
  
  var pictureId = req.body.picture_id;
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false});
    db.collection('picture').findOne({_id: ObjectID(pictureId)}, function (err, picture) {
      if (err) return res.json({success: false});
      res.json({success: true, data: picture});
      db.close();
    });
  });
  
});

router.post('/publish', [multipartMiddleware, jwtAuth], function (req, res, next) {
  var authorId = req.decoded._id;
  var authorName = req.decoded.name;
  var pictureDesc = req.body.picture_desc;
  var pictureCategory = req.body.picture_category;
  var picture = req.files['picture_file'];
  var originalFilename = picture.originalFilename;
  var fileExt = originalFilename.slice(originalFilename.lastIndexOf('.'));
  var newFilename = uuidV4() + fileExt;
  var time = new Date().getTime();
  var bigTwoName = uuidV4() + fileExt;
  var smallTwoName = uuidV4() + fileExt;
  
  fs.rename(picture.path, webPath + '/public/images/share/' + newFilename, function (err) {
    if (err) return res.json({success: false, message: err});
    MongoClient.connect(mongoUrl, function (err, db) {
      if (err) return res.json({success: false, message: err});
      sizeOf(webPath + '/public/images/share/' + newFilename, function (err, dimensions) {
        console.log(dimensions.width, dimensions.height);
        Jimp.read(webPath + '/public/images/share/' + newFilename, function (err, picture) {
          if (err) throw err;
          picture.resize(dimensions.width * 2, dimensions.height * 2)
            .write(webPath + '/public/images/share/' + bigTwoName);
        });
        Jimp.read(webPath + '/public/images/share/' + newFilename, function (err, picture) {
          if (err) throw err;
          picture.resize(Math.floor(dimensions.width / 2), Math.floor(dimensions.height / 2))
            .write(webPath + '/public/images/share/' + smallTwoName);
        });
      });
      db.collection('picture').insertOne({
        author_id: authorId,
        author_name: authorName,
        desc: pictureDesc,
        category: pictureCategory,
        url: '/images/share/' + newFilename,
        url_big_2: '/images/share/' + bigTwoName,
        url_small_2: '/images/share/' + smallTwoName,
        like_count: 0,
        like_users: [],
        comments: [],
        time: time
      }, function (err, result) {
        if (err) return res.json({success: false, message: err});
        res.json({success: true, message: '上传成功'});
        db.close();
      });
    });
  });
  
});

module.exports = router;
