/**
 * foreman run fetch_historic
 * or
 * heroku run fetch_historic
 */


var fetchData = require('./lib/fetch_data');
fetchData.fetchMoreData(function fetched (err, res) {
  process.exit(0);
});


