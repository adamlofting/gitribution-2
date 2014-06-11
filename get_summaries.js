var data = require('./lib/data');

/**
 * foreman run node get_summaries.js 'teamname'
 * or
 * heroku run node get_summaries.js 'teamname'
 *
 * Then you need to restart the web dyno for heroku to clear the caching
 */


console.log('hack update to a teams numbers');

var team = 'coding';
if (process.argv[2]) {
 team = process.argv[2];
}

// get the total combined numbers
data.update2014TotalActive(team, function updatedAll (err) {
  process.exit(0);
});

