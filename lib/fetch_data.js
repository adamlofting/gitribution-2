var async = require('async');
var GitHubApi = require('github');
var toTrack = require(".././to_track");

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
 * @return {Array}
 */
function getSelectedRepoValues(ghRes) {
  var arr = [];
  for (var i = 0; i < ghRes.length; i++) {
    var r = ghRes[i];
    if (r.name && r.updated_at) {
      arr.push([r.name, r.updated_at]);
    } else {
      console.log('FUNNY BUSINESS:', r);
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
    per_page: 100 // << low number to test next page logic
  };

  githubClient.repos.getFromOrg(msg, function gotFromOrg(err, res) {
    if (err) {
      console.log(err);
    }
    // this has loaded the first page of results
    // get the values we want out of this response
    repos = repos.concat(getSelectedRepoValues(res));

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
          repos = repos.concat(getSelectedRepoValues(res));

          // update the variables used in the whilst logic
          ghResult = res;
          hasNextPage = truthy(githubClient.hasNextPage(res));

          callback(null);
        });
      },
      function done(err) {
        console.log('ALLPAGESDONE');
        console.log(repos);
        console.log(repos.length);
        callback(null, repos);
      });
  });
}

/**
 * fetchMoreData - does the main work keeping the DB up to date with things that have changed in github
 */
exports.fetchMoreData = function pingGithubUpdateDB() {
  // loads the github org names listed in to_track.js
  async.eachSeries(toTrack.orgs,
    // for each github org we care about
    function workOnOrg (org, callback) {
      // do things in this order
      async.waterfall([
        // get a list of repos
        function getRepos (callback) {
          getOrgRepos(org, function gotOrgRepros (err, res) {
            callback(null, res);
          });
        },
        // do some work on these repos
        function workOnRepos (repos, callback) {
          console.log('WORKING ON REPOS RIGHT HERE');
          console.log(repos);
          callback(null);
        }
      ], function waterfallDone (err, result) {
         // result now equals 'done
      });
    },
    function gotRepos(err) {
      // We have iterated through all the orgs
      if (err) {
        console.log(err);
      }
      console.log('--=={{ DONE }}==--');
      process.exit(0);
    }
  );
};
