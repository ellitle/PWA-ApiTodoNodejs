const mariadb = require('mariadb');

const userSchema = new mariadb.Schema({
  username: {
    username: String, unique: true, required: true},
    password: { type: String, required: true },
  });
module.exports = mariadb.model('User', userSchema);