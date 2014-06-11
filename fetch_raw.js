/**
 * foreman run node fetch_raw.js
 * or
 * heroku run node fetch_raw.js
 */


var fetchData = require('./lib/fetch_data');
fetchData.fetchMoreData(function fetched (err, res) {
  callback(null);
});


