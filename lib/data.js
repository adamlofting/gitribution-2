var mysql = require('mysql');

var connectionOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

if (process.env.DB_SSL) {
  // SSL is used for Amazon RDS, but not necessarily for local dev
  connectionOptions.ssl = process.env.DB_SSL;
}

/**
 * Save a single contribution item
 */
exports.saveItem = function saveItem(happenedOn, githubOrgName, githubRepo, githubLogin, githubPublicEmail, actionType, callback) {

  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {
    if (err) {
      console.error(err);
      callback(err);
    } else {

      var activity = {
        happened_on: new Date(happenedOn),
        github_organization: githubOrgName,
        github_repository: githubRepo,
        github_username: githubLogin,
        github_public_email: githubPublicEmail,
        action_type: actionType
      };

      // Using REPLACE INTO to avoid worrying about duplicate entries for activities
      // There is a unique key set across all the fields
      connection.query('REPLACE INTO activities SET ?', activity, function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
};

/**
 * Save multiple contribution item
 * 'items' is an array of arrays
 * each nester array matches the activities columns listed in the SQL below
 * This is turned into a nested array:
 * https://github.com/felixge/node-mysql#escaping-query-values
 */
exports.saveItems = function saveItems(items, callback) {

  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {
    if (err) {
      console.error(err);
      callback(err);
    } else {

      var sql = 'REPLACE INTO activities (happened_on, github_organization, github_repository, github_username, github_public_email, action_type) VALUES ?';
      var values = items;

      // Using REPLACE INTO to avoid worrying about duplicate entries for activities
      // There is a unique key set across all the fields
      connection.query(sql, [values], function (err, result) {
        if (err) {
          console.error(err);
          callback(err);
        }
        connection.end();
        callback(null);
      });
    }
  });
};
