if (process.env.NEW_RELIC_ENABLED) {
  require("newrelic");
}

var express = require("express");
var data = require("./lib/data");
var util = require("./lib/util");
var app = express();

app.get('/', function (req, res) {
  res.send("You're probably looking for /api/2014/all or /api/2014/:teamname - or for more info about this app see https://github.com/adamlofting/gitribution-2");
});

// allow CORS so this can be graphed elsewhere in JS
app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/api/2014/all', function (req, res) {
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
      error: 'invalid team name',
      try_one_of_these_instead: util.validTeamNames()
    });
  }
});

app.get('/api/validteams', function (req, res) {
  res.json(util.validTeamNames());
});

app.get('/unclaimedrepos', function (req, res) {
  data.getAllRepos(function (err, result) {
    var unclaimed = util.filterOutClaimedRepos(result);
    var list = '<ul>';
    for (var i = unclaimed.length - 1; i >= 0; i--) {
      list += '<li><a href="http://github.com/' + unclaimed[i] + '" target="_blank">' + unclaimed[i] + '</a> (<a href="http://github.com/' + unclaimed[i] + '" target="_blank">who</a>?)</li>';
    }
    list += '</ul>';
    res.send(list);
  });
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function () {
  console.log("Listening on " + port);
});
