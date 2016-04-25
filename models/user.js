var mongodb = require('./db');

function User(user) {
  this.name = user.name;
  this.cipher = user.cipher;
};
module.exports = User;

User.prototype.save = function save(callback) {
  // Save user to Mongodb
  var user = {
    name: this.name,
    cipher: this.cipher,
  };
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }
    // Read users from Mongodb
    db.collection('users', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // Define name as unique index
      collection.ensureIndex('name', {unique: true});
      // Insert user into Mongodb
      collection.insert(user, {safe: true}, function(err, user) {
        mongodb.close();
        callback(err, user);
      });
    });
  });
};

User.get = function get(username, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }
    // Read users from Mongodb
    db.collection('users', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // Find user by name = username查
      collection.findOne({name: username}, function(err, doc) {
        mongodb.close();
        if (err || !doc) {
          return callback(err, null);
        } 
        // If found, serialize to user
        var user = new User(doc);
        callback(null, user);
      });
    });
  });
};
