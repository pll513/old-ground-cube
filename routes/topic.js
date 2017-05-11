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
  console.log('hahaha');
  res.render('topic/index');
});

router.get('/:topic_id', function (req, res, next) {
  console.log(req.params.topic_id);
  res.render('topic/detail');
});

router.post('/topicDetail', function (req, res, next) {
  var topicId = req.body.topic_id;
  MongoClient.connect(mongoUrl, function (err, db) {
    assert.equal(null, err);
    db.collection('topic').findOne({_id: ObjectID(topicId)}, function (err, topic) {
      assert.equal(null, err);
      res.json({success: true, data: topic});
      db.close();
    });
  });
});

router.post('/topicList', function (req, res, next) {
  var sortBy = parseInt(req.body.sort_by) || '_id';
  var limit = parseInt(req.body.page_size) || 10;
  var page_num = parseInt(req.body.page_num) || 1;
  var skip = (page_num - 1) * limit;
  console.log(sortBy);
  console.log(limit);
  console.log(page_num);
  console.log(skip);
  MongoClient.connect(mongoUrl, function (err, db) {
    assert.equal(null, err);
    db.collection('topic').find({}, {comment: 0}).sort({sortBy: 1}).skip(skip).limit(limit).toArray().then(function (topicList) {
      res.json({success: true, data: topicList});
      db.close();
    });
  });
  
});

router.post('/publish', jwtAuth, function (req, res, next) {
  console.log(req.body);
  console.log(req.decoded);
  var userId = req.decoded._id;
  var userName = req.decoded.name;
  var avatar = req.decoded.avatar;
  var text = req.body.topic_text;
  var images = req.body['topic_img[]'] || [];
  var newImages = [];
  var time = new Date().getTime();
  for (var i = 0; i < images.length; ++i) {
    var newImgUrl = images[i].replace('/images/tmp/', '/images/topic/');
    newImages[i] = newImgUrl;
    fs.rename(webPath + '/public' + images[i], webPath + '/public' + newImgUrl, function (err) {
      if (err) {
        console.log('图片移动失败： ' + err);
      } else {
        console.log('图片移动成功');
      }
    });
  }
  MongoClient.connect(mongoUrl, function (err, db) {
    assert.equal(null, err);
    db.collection('topic').insertOne({
      text: text,
      images: newImages,
      time: time,
      author_id: userId,
      author_name: userName,
      author_avatar: avatar,
      status: 1,
      comments: [],
      comment_count: 0
    }, function (err, result) {
      assert.equal(null, err);
      res.json({success: true, message: '话题发布成功'});
      db.close();
    });
  });
  
});

router.post('/topicComment', function (req, res, next) {
  console.log(req.body);
  var pageIndex = req.body.page_index;
  var pageSize = req.body.page_size;
  var topicId = req.body.topic_id;
  
  MongoClient.connect(mongoUrl, function (err, db) {
    db.collection('topic').findOne({_id: ObjectID(topicId)}, function (err, topic) {
      if (err) return res.json({success: false});
      db.close();
      res.json({success: true, data: topic.comments});
    });
  });
});

router.post('/comment', jwtAuth, function (req, res, next) {
  var authorId = req.decoded._id;
  var authorName = req.decoded.name;
  var authorAvatar = req.decoded.avatar;
  var text = req.body.comment_text;
  var topicId = req.body.topic_id;
  var time = new Date().getTime();
  var commentId = uuidV4();
  MongoClient.connect(mongoUrl, function (err, db) {
    db.collection('topic').updateOne({_id: ObjectID(topicId)},
      {
        $push: {
          comments: {
            comment_id: commentId,
            first: {author_id: authorId, text: text, time: time, author_name: authorName, author_avatar: authorAvatar},
            replies: []
          }
        },
        $inc: {
          comment_count: 1
        }
      }, function (err, result) {
        assert.equal(null, err);
        db.close();
        res.json({success: true, message: '评论成功'});
      }
    );
  });
  
});

router.post('/reply', jwtAuth, function (req, res, next) {
  var fromId = req.decoded._id;
  var fromName = req.decoded.name;
  var toId = req.body.to_id;
  console.log(toId);
  var toName = req.body.to_name;
  var text = req.body.reply_text;
  var topicId = req.body.topic_id;
  var commentId = req.body.comment_id;
  var time = new Date().getTime();
  console.log(commentId);
  
  MongoClient.connect(mongoUrl, function (err, db) {
    db.collection('topic').findOne();
    db.collection('topic').updateOne({_id: ObjectID(topicId), "comments.comment_id": commentId},
      {
        $push: {
          'comments.$.replies': {
            from_id: fromId,
            from_name: fromName,
            to_id: toId,
            to_name: toName,
            text: text,
            time: time
          }
        },
        $inc: {
          comment_count: 1
        }
      }, function (err, result) {
        assert.equal(null, err);
        db.close();
        res.json({success: true, message: '回复成功'});
      }
    );
  });
  
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
      res.json({success: true, message: '已删除话题'});
    });
  });
});

router.post('/uploadPictures', [jwtAuth, multipartMiddleware], function (req, res, next) {
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


router.post('/myTopicList', jwtAuth, function (req, res, next) {
  
  var userId = req.decoded._id;
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('topic').find({author_id: userId, status: {$gte: 0}}).toArray().then(function (topicList) {
      res.json({success: true, data: topicList});
    });
  });
  
});

router.post('/userTopicList', function (req, res, next) {
  
  MongoClient.connect(mongoUrl, function (err, db) {
    if (err) return res.json({success: false, message: err});
    db.collection('topic').find({author_id: req.body.user_id}).toArray().then(function (topicList) {
      res.json({success: true, data: topicList});
    });
  });
  
});

module.exports = router;

