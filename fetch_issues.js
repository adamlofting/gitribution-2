var fetchData = require('./lib/fetch_data');
fetchData.fetchMoreIssuesData(function fetched (err, res) {
  process.exit(0);
});


