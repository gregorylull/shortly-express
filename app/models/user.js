var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  initialize: function(){
    this.on('creating', function(model, attrs, options){
      model.set('username', model.get('username'));
      model.set('password', this.hash(model.get('password')));
    });
  },

  hash: function(password){
   var hash = bcrypt.hashSync(password);
   return hash;
   // bcrypt.compareSync("bacon", hash); // true
  }
});

module.exports = User;