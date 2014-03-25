var db = require('../config');
var User = require('./user');
var Link = require('./link');
var crypto = require('crypto');

var UsersUrls = db.Model.extend({
  tableName: 'users_urls',
  hasTimestamps: true,

  links: function() {
    return this.hasMany(Link);
  },

  users: function() {
    return this.hasMany(User);
  },

  initialize: function(){
    this.on('creating', function(model, attrs, options){
      model.set('user_id', model.get('user_id'));
      model.set('link_id', model.get('link_id'));
      // var shasum = crypto.createHash('sha1');
      // shasum.update(model.get('url'));
      // model.set('code', shasum.digest('hex').slice(0, 5));
    });
  }
});

module.exports = UsersUrls;
