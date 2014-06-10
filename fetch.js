var async = require('async');
var fetchData = require('./lib/fetch_data');
var data = require('./lib/data');
var util = require('./lib/util');

async.waterfall([
    function saveSummaryForAll (callback){
      console.log('saveSummaryForAll');
      // get the total combined numbers
      data.update2014TotalActive(null, function updatedAll (err) {
        callback(null);
      });
    },
    function saveSummaryForTeams (callback){
      var teams = util.validTeamNames();

      async.each(teams,
        function toEach (team, callback) {
          data.update2014TotalActive(team, function updatedAll (err) {
            callback(null);
          });
        },
        function eachDone (err) {
          callback(null);
        }
      );
    },
    function fetchLatestGithubData (callback){
      fetchData.fetchMoreData(function fetched (err, res) {
        callback(null);
      });
    }
], function (err, result) {
   console.log('summaries and tables updated');
   process.exit(0);
});

