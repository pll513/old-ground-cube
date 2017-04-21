var MongoClient = require('mongodb').MongoClient;
var url = require('./config').mongodb.url;
var assert = require('assert');

MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log(err);
  }
  console.log('连接成功');
  db.createCollection('user', function (err, coll) {
    assert.equal(null, err);
  });
  // db.createCollection('')
  db.close();
});