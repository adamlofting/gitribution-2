var mysql = require('mysql');
var async = require('async');
var util = require("./util");
var dates = require("./dates");

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
function saveItem(happenedOn, githubOrgName, githubRepo, githubLogin, githubPublicEmail, actionType, callback) {

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
}

/**
 * Save multiple contribution item
 * 'items' is an array of arrays
 * each nester array matches the activities columns listed in the SQL below
 * This is turned into a nested array:
 * https://github.com/felixge/node-mysql#escaping-query-values
 */
function saveItems(items, callback) {

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
}

/**
 * Get the date of the most recent commit we have in our DB
 */
function getOldestCommitDate(repo, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {
    if (err) {
      console.error(err);
      callback(err);
    } else {

      var sql = 'SELECT * FROM gitribution2.activities WHERE github_organization=? AND github_repository=? ORDER BY happened_on asc limit 1;';
      var values = [repo.org, repo.name];
      var qry = connection.query(sql, values, function (err, result) {
        if (err) {
          console.error(err);
          console.log(qry.sql);
          callback(err);
        }
        connection.end();

        // check if this repo has any commits (it might be new)
        var date = null;
        if (result[0] && result[0].happened_on) {
          date = result[0].happened_on;
        }
        callback(null, date);
      });
    }
  });
}

/**
 * Get total active count for a given date
 * @param  {Date}   date
 * @param  {Function} callback
 */
function getActiveContributors(date, callback) {
  var connection = mysql.createConnection(connectionOptions);
  connection.connect(function connectionAttempted(err) {
    if (err) {
      console.error(err);
      callback(err);
    } else {

      var queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);

      var yearPrior = new Date(queryDate);
      yearPrior.setFullYear(yearPrior.getFullYear() - 1);

      // format these for queryDate
      queryDate = util.dateToISOtring(queryDate);
      yearPrior = util.dateToISOtring(yearPrior);

      /*jshint multistr: true */
      var sql = 'SELECT DISTINCT github_username FROM activities \
                WHERE happened_on <= ? AND happened_on > ? ;';

      var values = [queryDate, yearPrior];
      var qry = connection.query(sql, values, function (err, result) {
        if (err) {
          console.error(err);
          console.log(qry.sql);
          callback(err);
        }
        connection.end();

        var namesYear = util.fieldToArray(result, 'github_username');
        var output = {
          wkcommencing: queryDate,
          total_active: namesYear.length
        };

        callback(null, output);
      });
    }
  });
}

/**
 * Get counts by week of rolling total active for all teams combined
 * @param  {Function} callback
 */
function get2014TotalActive(callback) {
  var totals2014 = [];
  async.eachSeries(dates.year2014,
    function eachDo(date, callback) {
      getActiveContributors(date, function gotActive(err, res) {
        if (err) {
          console.log(err);
        } else {
          totals2014.push(res);
        }
        callback(null);
      });
    },
    function eachDone(err) {
      if (err) {
        console.log(err);
      }
      callback(null, totals2014);
    });
}

module.exports = {
  getActiveContributors: getActiveContributors,
  get2014TotalActive: get2014TotalActive,
  getOldestCommitDate: getOldestCommitDate,
  saveItem: saveItem,
  saveItems: saveItems
};
