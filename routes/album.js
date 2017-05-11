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
  res.render('album/index');
});

router.post('/create', jwtAuth, function (req, res, next) {
  var authorId = req.decoded._id;
  console.log(req.body);
  var name = req.body.album_name;
  var time = new Date().getTime();
  var id = uuidV4();
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('album').insertOne({
      type: 1,
      author_id: authorId,
      id: id,
      name: name,
      time: time,
      pages: [],
      comments: []
    }, function (err, result) {
      if (err) return res.json({success: false, message: err});
      res.json({success: true, message: '创建相册成功', data: {id: id}});
      db.close();
    });
  });
  
});

router.post('/changeType', function (req, res, next) {
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('album').updateOne({id: req.body.id}, {$set: {type: req.body.type}}, function (err, result) {
      if (err) return res.json({success: false, message: err});
      res.json({success: true});
    });
  });
});

router.get('/update', function (req, res, next) {
  
});

router.get('/delete', function (req, res, next) {
  
});

router.get('/like', function (req, res, next) {
  
});

router.get('/comment', function (req, res, next) {
  
});

router.get('/page/delete', function (req, res, next) {
  
});

router.get('/page/comment', function (req, res, next) {
  
});


router.post('/addPage', function (req, res, next) {
  console.log(req.body);
  var newImgUrl = req.body.img_url.replace('/images/tmp/', '/images/album/');
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('album').updateOne({id: req.body.id}, {
      $push: {
        pages: {
          desc: req.body.desc,
          img_url: newImgUrl,
          brightness: req.body.brightness,
          contrast: req.body.contrast,
          saturation: req.body.saturation
        }
      }
    }, function (err, result) {
      if (err) return res.json({success: false, message: err});
      db.close();
      fs.rename(webPath + '/public' + req.body.img_url, webPath + '/public' + newImgUrl, function (err) {
        if (err) return res.json({success: false, message: err});
        res.json({success: true, message: '添加成功'});
      });
    });
  });
});

router.post('/picturePreview', multipartMiddleware, function (req, res, next) {
  console.log(req.files);
  var fileExt;
  var originalFilename;
  var newFilename;
  var fileUrl;
  
  originalFilename = req.files['picture'].originalFilename;
  fileExt = originalFilename.slice(originalFilename.lastIndexOf('.'));
  newFilename = uuidV4() + fileExt;
  fileUrl = '/images/tmp/' + newFilename;
  fs.rename(req.files['picture'].path, webPath + '/public/images/tmp/' + newFilename, function (err) {
    if (err) return res.json({success: false, message: '图片上传失败'});
    res.json({
      success: true,
      data: {img_url: fileUrl}
    });
  });
  
});


router.post('/albumList', jwtAuth, function (req, res, next) {
  
  var userId = req.decoded._id;
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('album').find({author_id: userId}, {comments: 0}).toArray().then(function (albumList) {
      console.log(albumList);
      res.json({success: true, data: albumList});
      db.close();
    });
  });
  
});


router.post('/albumDetail', jwtAuth, function (req, res, next) {
  
  console.log(req.body);
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('album').findOne({id: req.body.id}, function (err, album) {
      if (err) return res.json({success: false, message: err});
      res.json({success: true, data: album});
      db.close();
    });
  });
  
});

router.post('/albumDesc', function (req, res, next) {
  
  console.log(req.body);
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('album').findOne({id: req.body.id}, {desc: 1}, function (err, album) {
      if (err) return res.json({success: false, message: err});
      if (album) {
        res.json({success: true, data: album.desc});
      } else {
        res.json({success: false, message: '出错了'});
      }
      db.close();
    });
  });
  
});

router.post('/editAlbumDesc', function (req, res, next) {
  
  // 缺验证
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('album').updateOne({id: req.body.id}, {$set: {desc: req.body.desc}}, function (err, album) {
      if (err) return res.json({success: false, message: err});
      res.json({success: true});
      db.close();
    });
  });
  
});

router.post('/editPage', function (req, res, next) {
  
  console.log(req.body);
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('album').updateOne({id: req.body.id}, {
      $set: {
        [`pages.${req.body.page_num}.desc`]: req.body.desc,
        [`pages.${req.body.page_num}.brightness`]: req.body.brightness,
        [`pages.${req.body.page_num}.contrast`]: req.body.contrast,
        [`pages.${req.body.page_num}.saturation`]: req.body.saturation
      }
    }, function (err, result) {
      if (err) return res.json({success: false, message: err});
      res.json({success: true});
    });
    
  });
  
});

module.exports = router;