var mysql = require('mysql');
var async = require('async');
var util = require("./util");
var dates = require("./dates");
var NodeCache = require("node-cache");

var myCache = new NodeCache();

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

      var weekPrior = new Date(queryDate);
      weekPrior.setDate(queryDate.getDate() - 7);

      var yearPrior = new Date(queryDate);
      yearPrior.setFullYear(yearPrior.getFullYear() - 1);

      // format these for query
      queryDate = util.dateToISOtring(queryDate);
      weekPrior = util.dateToISOtring(weekPrior);
      yearPrior = util.dateToISOtring(yearPrior);

      /*jshint multistr: true */
      var sql = 'SELECT DISTINCT github_username FROM activities \
                WHERE happened_on <= ? AND happened_on > ? ;';

      async.parallel({
          last_year: function (callback) {
            var values = [queryDate, yearPrior];
            connection.query(sql, values,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              });
          },
          last_week: function (callback) {
            /*jshint multistr: true */
            var values = [queryDate, weekPrior];
            connection.query(sql, values,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              });
          },
          last_year_excluding_last_week: function (callback) {
            /*jshint multistr: true */
            var values = [weekPrior, yearPrior];
            connection.query(sql, values,
              function queryComplete(err, result) {
                if (err) {
                  console.log(err);
                }
                callback(null, result);
              }
            );
          }
        },
        function (err, results) {
          var namesYear = util.fieldToArray(results.last_year, "github_username");
          var namesWeek = util.fieldToArray(results.last_week, "github_username");
          var namesYearExWeek = util.fieldToArray(results.last_year_excluding_last_week, "github_username");

          var counts = {};
          counts.wkcommencing = queryDate;
          counts.totalactive = namesYear.length;
          counts.new = util.countInAnotInB(namesWeek, namesYearExWeek);

          connection.end();
          callback(null, counts);
        });
    }
  });
}

/**
 * Get counts by week of rolling total active for all teams combined
 * @param  {Function} callback
 */
function get2014TotalActive(callback) {
  // timer to check impact of loading
  console.time('getData');

  // check cache
  var cache = myCache.get("totals");

  // check if anythign is saved in the cache
  if (cache.totals) {
    // Yes, use the cached list
    console.log('loaded from cache');
    console.timeEnd('getData');

    callback(null, cache.totals);

  } else {
    // No cache, so need to get this from the DB
    console.log('loading from database');

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
        // cache this so we're not constantly pinging GH
        console.timeEnd('getData');
        myCache.set("totals", totals2014, 600000); // 10 mins
        callback(null, totals2014);
      });
  }
}

module.exports = {
  getActiveContributors: getActiveContributors,
  get2014TotalActive: get2014TotalActive,
  getOldestCommitDate: getOldestCommitDate,
  saveItem: saveItem,
  saveItems: saveItems
};
