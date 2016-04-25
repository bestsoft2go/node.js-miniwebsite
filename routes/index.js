var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  Post.get(null, function(err, posts) {
    if (err) {
      posts = [];
    }
    res.render('index', {
      title: '首頁',
      posts: posts,
    });
  });
});

router.get('/register', checkNotLogin);
router.get('/register', function(req, res, next) {
  res.render('register', { title: '註冊' });
});

router.post('/register', checkNotLogin);
router.post('/register', function(req, res, next) {
  var password = req.body['password'];
  var repeated = req.body['password-repeat'];

  // Check if both passwords are same
  if (repeated != password) {
    console.log('Passwords not same');
    console.log('Password：' + password);
    console.log('Repeated Password：' + repeated);
	
    req.flash('error', '密碼輸入不一致');
    return res.redirect('/register');
  }
  
  var username = req.body['username'];

  // Check if username exists
  User.get(username, function(err, user) {
    if (user) {
      console.log('Username already exists');
      console.log('Username：' + username);
      err = '使用者名稱已經被使用';
    }
    if (err) {
      req.flash('error', err);
      return res.redirect('/register');
    }

    // Encode password
    var md5 = crypto.createHash('md5');
    var cipher = md5.update(password).digest('base64');

    // New a user
    var newUser = new User({
      name: username,
      cipher: cipher,
    });

    // Add new user
    newUser.save(function(err) {
      if (err) {
        console.log('Error：' + err);
        req.flash('error', err);
        return res.redirect('/register');
      }
      req.session['user'] = newUser;
      req.flash('success', '註冊成功');
      res.redirect('/u/' + newUser.name);
    });
  });
});

router.get('/login', checkNotLogin);
router.get('/login', function(req, res, next) {
  res.render('login', { title: '登入' });
});

router.post('/login', checkNotLogin);
router.post('/login', function(req, res, next) {
  var username = req.body['username'];
  var password = req.body['password'];

  // Encode password
  var md5 = crypto.createHash('md5');
  var cipher = md5.update(password).digest('base64');

  // Check if username exists
  User.get(username, function(err, user) {
    if (!user) {
      console.log('Username not exists');
      console.log('Username：' + username);
      err = '使用者不存在';
    } else if (user.cipher != cipher) {
      console.log('Password not correct');
      console.log('Password：' + password);
      err = '密碼錯誤';
    }
    if (err) {
      req.flash('error', err);
      return res.redirect('/login');
    }

    // User loaded
    req.session['user'] = user;
    req.flash('success', '登入成功');
    res.redirect('/u/' + user.name);
  });

});

router.get('/u/:user', function(req, res, next) {
  User.get(req.params['user'], function(err, user) {
    if (!user) {
      err = '使用者不存在';
    }
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }

    Post.get(user.name, function(err, posts) {
      if (err) {
        console.log('Error：' + err);
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('user', {
        title: user.name,
        posts: posts,
      });
    });
  });
});

router.post('/post', checkLogin);
router.post('/post', function(req, res, next) {
  var user = req.session['user'];
  var post = req.body['post'];

  // New a post
  var newPost = new Post({
    username: user.name, 
    post: post
  });

  // Add new post
  newPost.save(function(err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    req.flash('success', '發表成功');
    res.redirect('/u/' + user.name);
  });
});

router.get('/logout', checkLogin);
router.get('/logout', function(req, res, next) {
  req.session.user = null;
  req.flash('success', '登出成功');
  res.redirect('/');
});

function checkLogin(req, res, next) {
  if (!req.session['user']) {
    req.flash('error', '未登入');
    return res.redirect('/login');
  }
  next();
}

function checkNotLogin(req, res, next) {
  if (req.session['user']) {
    req.flash('error', '已登入');
    return res.redirect('/');
  }
  next();
}

module.exports = router;
