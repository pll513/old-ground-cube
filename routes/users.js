var express = require('express');
var router = express.Router();
var jwtAuth = require('../jwtauth');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var fs = require('fs');
var uuidV4 = require('uuid/v4');
var webPath = require('../config').path;
var mongoUrl = require('../config').mongodb.url;
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

// 根据user的ID获取用户信息
router.get('/userInfo', jwtAuth, function (req, res, next) {
  MongoClient.connect(mongoUrl, function (err, db) {
    db.collection('user').findOne({_id: ObjectID(req.body.user_id ,{password: 0})}, function (err, user) {
      res.json({success: true, data: user});
    });
  });
});

// 用户修改密码
router.post('/changePassword', jwtAuth, function (req, res, next) {
  var userId = req.decoded._id;
  var oldPassword = req.body.old_password;
  var newPassword = req.body.new_password;
  var newPasswordConfirm = req.body.new_password_confirm;
  MongoClient.connect(mongoUrl, function (err, db) {
    assert.equal(null, err);
    var collUser = db.collection('user');
    collUser.findOne({_id: ObjectID(userId)}, function (err, user) {
      if (oldPassword !== user.password) {
        return res.json({
          success: false,
          message: '旧密码不正确'
        });
      }
      if (!/.{6,32}/.test(newPassword)) {
        return res.json({
          success: false,
          message: '新密码格式不正确'
        });
      }
      if (newPassword !== newPasswordConfirm) {
        return res.json({
          success: false,
          message: '密码与确认密码不一致'
        });
      }
      collUser.updateOne({_id: ObjectID(userId)}, {$set: {password: newPassword}}, function (err, result) {
        assert.equal(null, err);
        db.close();
        res.json({success: true, message: '修改密码成功'});
      });
    });
  });
});

// 用户修改头像
router.post('/changeAvatar', [jwtAuth, multipartMiddleware], function (req, res, next) {
  var userId = req.decoded._id;
  var file = req.files['avatar'];
  var fileExt;
  var originalFilename;
  var newFilename;
  var avatarUrl;
  originalFilename = req.files['avatar'].originalFilename;
  fileExt = originalFilename.slice(originalFilename.lastIndexOf('.'));
  newFilename = uuidV4() + fileExt;
  avatarUrl = '/images/avatar/' + newFilename;
  MongoClient.connect(mongoUrl, function (err, db) {
    assert.equal(null, err);
    db.collection('user').updateOne({_id: ObjectID(userId)}, {$set: {avatar: avatarUrl}}, {upsert: true}, function (err, result) {
      assert.equal(null, err);
      db.close();
      fs.rename(file.path, webPath + '/public/images/avatar/' + newFilename, function (err) {
        if (err) {
          console.log('rename error: ' + err);
          res.json({
            success: false,
            message: '对不起，图片上传失败'
          });
        } else {
          res.json({
            success: true,
            avatarUrl: avatarUrl
          });
        }
      });
    });
  });
});

router.post('/basicInfo', function (req, res, next) {
  MongoClient.connect(mongoUrl, function (err, db) {
    db.collection('user').findOne({_id: ObjectID(req.body.user_id)}, {
      _id: 1,
      name: 1,
      avatar: 1
    }, function (err, user) {
      res.json({success: true, data: user});
    })
  });
});

router.get('/:userId', function (req, res, next) {
  console.log('用户');
  res.render('user');
});

module.exports = router;
