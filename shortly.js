var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  // authentication code from
  // http://www.9bitstudios.com/2013/09/express-js-authentication/
  app.use(express.cookieParser('shhhh, very secret'));
  app.use(express.session());
});

// authentication code from
// http://www.9bitstudios.com/2013/09/express-js-authentication/
function restrict(req, res, next) {
  if (req.session.user) {
    console.log(req.session.greg);
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

////////////////////////////////////////////////////////////////////////////////////

// app.get('/restricted', restrict, function(req, res){
//   response.send('This is the restricted area! Hello ' + request.session.user + '! click <a href="/logout">here to logout</a>');
// });

////////////////////////////////


// initial page IS login page
app.get('/', restrict, function(req, res){
  res.render('index');
  console.log('redirecting');
});

app.get('/login', function(req, res){
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.get('/create', restrict, function(req, res) {
  res.render('index');
});

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  // if the url is not valid just redirect
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  // we create an instance of link and check if it exists in the database
  new Link({ url: uri }).fetch().then(function(found) {
    // found -> we retrieve the attributes
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
      // we instantiate a new link with the new information
        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin   // what's this
        });
      // we save the new link
        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

// when users sign in with their username and password
app.post('/signup', function(req, res){
  // var username = req.body.username;
  // var password = req.body.password;

  var userInfo = req.body;

  // check if the username is already taken
  new User({ username: userInfo.username }).fetch().then(function(found) {
    if (found) {
      // yes
        // redirect to signup with message, (already taken)
      res.send(200, 'user Name Taken!');
    }else{
      // no
      // save data
      // redirect to login page
      var user = new User({
        username: userInfo.username,
        password: userInfo.password
      });
      // we save the new link
      user.save().then(function() {
        res.send(200, "success! You're a member!!!");
      });
    }
  });
});

app.post('/login', function(req, res){
  // var username = req.body.username;
  // var password = req.body.password;
  var userInfo = req.body;
  // check if the username is already taken
  new User({ username: userInfo.username }).fetch().then(function(found) {
    if (found) {
      if(found.attributes.password === userInfo.password){
        req.session.regenerate(function(){
          req.session.user = userInfo.username;
          req.session.greg = "passing whatever";
          // res.redirect('/restricted');
          // console.log(found.attributes);
          res.redirect('/');
        });
      }
    }else{
      res.redirect('/login');
    }
  });
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
      res.redirect('/login');
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
