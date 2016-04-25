var mongodb = require('./db');

function Post(post) {
  this.username = post.username;
  this.post = post.post;
  if (post.time) {
    this.time = post.time;
  } else {
    this.time = new Date();
  }
};
module.exports = Post;

Post.prototype.save = function save(callback) {
  // Save post to Mongodb 
  var post = {
    username: this.username,
    post: this.post,
    time: this.time,
  };
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }
    // Read posts from Mongodb
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // Define username as unique index
      collection.ensureIndex('username');
      // Insert post into Mongodb
      collection.insert(post, {safe: true}, function(err, post) {
        mongodb.close();
        callback(err, post);
      });
    });
  });
};

Post.get = function get(username, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }
    // Read posts from Mongodb
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // Find post by username = username查, if username is null, return all
      var query = {};
      if (username) {
        query.username = username;
      }
      collection.find(query).sort({time: -1}).toArray(function(err, docs) {
        mongodb.close();
        if (err || !docs) {
          return callback(err, null);
        }
        // If found, serialize to posts
        var posts = [];
        docs.forEach(function(doc, index) {
          var post = new Post(doc);
          posts.push(post);
        });
        callback(null, posts);
      });
    });
  });
};

