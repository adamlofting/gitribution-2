/**
 * foreman run fetch_historic
 * or
 * heroku run fetch_historic
 */

var repo = {
  org: 'mozilla-b2g',
  name: 'gonk-misc'
};

var fetchData = require('./lib/fetch_data');
fetchData.workOnRepoPullRequests(repo, function fetched (err, res) {
  process.exit(0);
});


