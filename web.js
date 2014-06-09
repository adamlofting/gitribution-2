if (process.env.NEW_RELIC_ENABLED) {
  require("newrelic");
}

var express = require("express");
var data = require("./lib/data");
var util = require("./lib/util");
var app = express();

app.get('/', function (req, res) {
  res.send("You're probably looking for /api or for more info about this app see https://github.com/adamlofting/gitribution-2");
});

app.get('/api/2014/total', function (req, res) {
  data.get2014TotalActive(null, function gotCounts(err, result) {
    res.json(result);
  });
});

app.get('/api/2014/:team', function (req, res) {

  var team = req.params.team;
  if (util.isValidTeamName(team)) {
    data.get2014TotalActive(team, function gotCounts(err, result) {
      res.json(result);
    });
  } else {
    res.json({
      error: 'invalid team name'
    });
  }
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log("Listening on " + port);
});
