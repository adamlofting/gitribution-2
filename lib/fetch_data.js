var async = require('async');
var GitHubApi = require('github');
var toTrack = require(".././to_track");
var data = require("./data");

var OLDEST_DATE_WE_CARE_ABOUT = '2013-01-01';

/**
 * createGithubClient()
 * @return {GitHubApi}
 */
function createGithubClient() {
  var githubClient = new GitHubApi({
    version: '3.0.0',
    protocol: 'https'
  });
  githubClient.authenticate({
    type: 'basic',
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_PASSWORD
  });
  return githubClient;
}

/**
 * A util
 */
function truthy(o) {
  if (o) {
    return true;
  }
  return false;
}

/**
 * Extract the values we want from all the data available in the API
 * @param  {JSON} ghRes, a single respsonse from the github API
 * @param  {String} org, the github org name
 * @return {Array}
 */
function getSelectedRepoValues(ghRes, org) {
  var arr = [];
  if (ghRes) {
    for (var i = 0; i < ghRes.length; i++) {
      var r = ghRes[i];
      if (r.name && r.updated_at) {
        arr.push({
          org: org,
          name: r.name,
          updated_at: r.updated_at,
          has_issues: r.has_issues,
          default_branch: r.default_branch
        });
      } else {
        console.log('FUNNY BUSINESS:', r);
      }
    }
  }
  return arr;
}

/**
 * Get a list of the repos linked to an org
 * @param  {String}   org      github org name
 * @param  {Function} callback
 * @return {Object}
 */
function getOrgRepos(org, callback) {
  var repos = [];
  var githubClient = createGithubClient();

  // The options msg we send to the client http://mikedeboer.github.io/node-github/#repos.prototype.getFromOrg
  var msg = {
    org: org,
    type: 'public',
    per_page: 100
  };

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  githubClient.repos.getFromOrg(msg, function gotFromOrg(err, res) {
    if (err) {
      console.log(err);
    }
    // this has loaded the first page of results
    // get the values we want out of this response
    repos = repos.concat(getSelectedRepoValues(res, org));

    // setup variables to use in the whilst loop below
    var ghResult = res;
    var hasNextPage = truthy(githubClient.hasNextPage(res));

    // now we work through any remaining pages
    async.whilst(
      function test() {
        return hasNextPage;
      },
      function doThis(callback) {
        githubClient.getNextPage(ghResult, function gotNextPage(err, res) {
          // get the values we want out of this response
          repos = repos.concat(getSelectedRepoValues(res, org));

          // update the variables used in the whilst logic
          ghResult = res;
          hasNextPage = truthy(githubClient.hasNextPage(res));

          callback(null);
        });
      },
      function done(err) {
        callback(null, repos);
      });
  });
}

/**
 * Save commits given to use from Gitub
 * @param  {JSON}   ghRes - the response from github
 * @param  {Object}   repo, reference object for which repo we're working on
 * @param  {Function} callback
 */
function saveCommits(ghRes, repo, callback) {
  var toSave = [];
  // look through the results from github
  if (ghRes) {
    for (var i = 0; i < ghRes.length; i++) {
      var r = ghRes[i];

      if (r.commit && r.commit.author && r.commit.author.date) {
        var login = (r.author && r.author.login) ? r.author.login : null;
        var email = (r.commit.author.email) ? r.commit.author.email : null;
        var url = (r.html_url) ? r.html_url : null;
        var commitId = (r.sha) ? r.sha : null;
        var commitMsg = (r.commit.message) ? r.commit.message : null;
        if (commitMsg) {
          // Just keep the ASCII chars
          commitMsg = commitMsg.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
          commitMsg = commitMsg.substring(0,1000); // JUST in case there's a really long message, truncate it.
        }
        toSave.push([new Date(r.commit.author.date), repo.org, repo.name, login, email, url, 'commit-author', commitId, commitMsg]);
      } else {
        console.log('FORMAT EXCEPTION:', r);
      }
    }
  }
  if (toSave.length > 1) {
    data.saveItems(toSave, function saved(err) {
      console.log('Saved', toSave.length, 'commits for:', repo.org, repo.name);
      callback(null);
    });
  } else {
    callback(null);
  }
}

function getCommitsForRepoUntil(repo, dateUntil, dateSince, callback) {
  var githubClient = createGithubClient();
  // The options msg we send to the client http://mikedeboer.github.io/node-github/#repos.prototype.getCommits
  var msg = {
    sha: repo.default_branch,
    user: repo.org,
    repo: repo.name,
    per_page: 100,
    since: dateSince,
  };
  if (dateUntil) {
    // if there is existing data stored for this repo, only fetch older records
    msg.until = dateUntil.toISOString();
  }

  // To see the data from github: curl -i https://api.github.com/repos/mozilla-appmaker/appmaker/commits?per_page=1
  githubClient.repos.getCommits(msg, function gotFromOrg(err, res) {
    if (err) {
      console.log(msg);
      console.log(err);
    }

    // setup variables to use in the doUntil loop below
    var ghResult = res;
    var hasNextPage = truthy(githubClient.hasNextPage(ghResult));

    if (ghResult && ghResult.length) {
      async.doUntil(
        function repeatedly(callback) {
          saveCommits(ghResult, repo, function saved(err) {
            // check if there's another page
            hasNextPage = truthy(githubClient.hasNextPage(ghResult));
            // if there is, set this to work on in the next loop
            if (hasNextPage) {
              githubClient.getNextPage(ghResult, function gotNextPage(err, res) {
                ghResult = res;
                callback(null);
              });
            } else {
              // nothing else to work on here
              callback(null);
            }
          });
        },
        function untilTest() {
          return !hasNextPage;
        },
        function done(err) {
          callback(null);
        }
      );
    } else {
      console.log("> Nothing to do on:", repo.name);
      callback(null);
    }
  });
}

function workOnRepo(repo, callback) {
  // When a new repo is worked on, we start from today's date and work back
  // through the API pages until the oldest date we care about.
  // If the script or process is interupted, the next time we get to this repo
  // we check the oldest date we have process and carry on working back from
  // there.
  // Once we have capture the historic activity we care about, future runs
  // of the script look for any activity that is newer than what we have in
  // our records
  async.waterfall([
    // historic data first
    function firstGetHistoricActivity(callback) {
      data.getOldestCommitDate(repo, function gotOldestCommitDate(err, oldestDateInOurDB) {
        // use the oldest date for another pass over the API
        getCommitsForRepoUntil(repo, oldestDateInOurDB, OLDEST_DATE_WE_CARE_ABOUT, function gotNewCommits(err) {
          console.log('Done historic:', repo.org, repo.name);
          callback(null);
        });
      });
    },
    // then check for anything new
    function nextCheckForNewActivity(callback) {
      var now = new Date();
      data.getLatestCommitDate(repo, function gotLatestCommitDate(err, latestDateInOurDB) {
        // use the latest date for another pass over the API
        getCommitsForRepoUntil(repo, now, latestDateInOurDB, function gotNewCommits(err) {
          console.log('Done recent:', repo.org, repo.name);
          callback(null);
        });
      });
    }
  ], function waterfallDone(err) {
    callback(null);
  });
}

/**
 * Work on repos - check which need updating and work on those
 * @param  {Array}   repos
 */
function workOnRepos(repos, callback) {
  async.eachLimit(repos, 3,
    function eachRepo(repo, callback) {
      console.log('Working on:', repo.org, repo.name);
      workOnRepo(repo, function workedOnRepo(err) {
        callback(null);
      });
    },
    function eachDone(err) {
      if (err) {
        console.log(err);
      }
      callback(null);
    }
  );
}

/**
 * fetchMoreData - does the main work keeping the DB up to date with things that have changed in github
 */
exports.fetchMoreData = function pingGithubUpdateDB(callback) {
  // loads the github org names listed in to_track.js
  async.eachLimit(toTrack.orgs, 2,
    // for each github org we care about
    function workOnThisOrg(org, callback) {
      // do things in this order
      async.waterfall([
        // get a list of repos
        function waterfallGetRepos(callback) {
          getOrgRepos(org, function gotOrgRepros(err, res) {
            callback(null, res);
          });
        },
        // do some work on these repos
        function waterfallWorkOnRepos(repos, callback) {
          workOnRepos(repos, function workedOnRepos(err, res) {
            callback(null);
          });
        }
      ], function waterfallDone(err, result) {
        callback(null);
      });
    },
    function eachDone(err) {
      // We have iterated through all the orgs
      if (err) {
        console.log(err);
      }
      console.log('--=={{ GH FETCH DONE }}==--');
      callback(null);
    }
  );
};
