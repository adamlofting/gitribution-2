var GitHubApi = require('github');
var data = require('./data.js');
var async = require('async');

function toItemArray(happenedOn, githubOrganization, githubRepository, githubUsername, githubPublicEmail, actionType) {
  var item = [];
  item.push(new Date(happenedOn));
  item.push(githubOrganization);
  item.push(githubRepository);
  item.push(githubUsername);
  item.push(githubPublicEmail);
  item.push(actionType);
  return item;
}

/* =================
 ISSUES
================= */

var saveIssues = function (githubOrgName, mozTeamName, githubRepoName, issues, callback) {

  var keys = [];
  if (typeof issues === 'object') {
    keys = Object.keys(issues); // get the keys to determine length of JSON
  } else {
    console.warn('ERROR getting ISSUES for: ' + githubOrgName + '/' + githubRepoName);
    callback(null);
    return;
  }

  var itemsToSave = [];
  keys.forEach(function (key) {
    checkActivity(key);
  });

  if (itemsToSave.length > 0) {
    data.saveItems(itemsToSave, function savedItems(err, res) {
      console.log('Saved', itemsToSave.length, 'items (issues)');
      callback(null);
    });
  } else {
    callback(null);
  }

  function checkActivity(key) {
    var issue = null;
    var issueLogin = 'NOT_RECORDED';
    var issueDate = null;
    var issueEmail = null; // could later use API to get public email linked to an account
    var isStaff = 0; //false

    if (issues[key]) {
      issue = issues[key];

      if (issue.created_at) {
        issueDate = issue.created_at;
      }

      if (issue.user && issue.user.login) {
        issueLogin = issue.user.login;
      }

    }

    if (issueDate) {
      itemsToSave.push(toItemArray(issueDate, githubOrgName, githubRepoName, issueLogin, issueEmail, 'open-an-issue', mozTeamName, isStaff));
    }
  }
};

function processBatchOfIssues(err, res, githubOrgName, mozTeamName, githubRepoName, githubClient, callback) {

  var issues = res;

  saveIssues(githubOrgName, mozTeamName, githubRepoName, issues, function issuesSaved(err) {

    if (err) {
      console.error(err);
    }

    // Recursively check if there is a next page
    if (githubClient.hasNextPage(res)) {
      githubClient.getNextPage(res, function gotNextPage(err, res) {

        if (err) {
          console.error(err);
        } else {
          processBatchOfIssues(err, res, githubOrgName, mozTeamName, githubRepoName, githubClient, callback);
        }

      });
    } else {
      callback(null); // we've been through them all
    }
  });
}

var updateIssueActivity = function (githubOrgName, mozTeamName, githubRepoName, since, callback) {

  var githubClient = new GitHubApi({
    version: '3.0.0',
    protocol: 'https'
  });
  githubClient.authenticate({
    type: 'basic',
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_PASSWORD
  });

  var msg = {
    user: githubOrgName,
    repo: githubRepoName,
    per_page: 100
  };
  if (since) {
    msg.since = since.toISOString(); // otherwise fetch ALL the things
  }

  githubClient.issues.repoIssues(msg, function (err, res) {

    if (err) {
      try {
        var e = JSON.parse(err);
        console.log('No action:', e.message, '(', githubRepoName, ')');
      } catch (e) {
        console.log('No parse', err);
      }
      callback(null);
    } else {
      processBatchOfIssues(err, res, githubOrgName, mozTeamName, githubRepoName, githubClient, function processedIssues(err, res) {
        console.log('Checked all issues for:', githubOrgName, mozTeamName, githubRepoName);
        callback(null);
      });
    }
  });
};

/* =================
 COMMITS
================= */

var saveCommits = function (githubOrgName, mozTeamName, githubRepoName, activities, callback) {

  var keys = [];
  if (typeof activities === 'object') {
    keys = Object.keys(activities); // get the keys to determine length of JSON
  } else {
    console.warn('ERROR getting COMMITS for: ', githubOrgName, '/', githubRepoName);
    callback(null);
    return;
  }

  var itemsToSave = [];
  keys.forEach(function (key) {
    checkActivity(key);
  });

  if (itemsToSave.length > 0) {
    data.saveItems(itemsToSave, function savedItems(err, res) {
      console.log('Saved', itemsToSave.length, 'items');
      callback(null);
    });
  } else {
    callback(null);
  }

  function checkActivity(key) {
    // Basic checking that fields exist
    var a = null;
    // 1) The commit author
    var authorLogin = 'NOT_RECORDED';
    var authorDate = null;
    var authorEmail = null;
    var authorIsStaff = 0; // false
    // 2) The commit committer
    var committerLogin = 'NOT_RECORDED';
    var committerDate = null;
    var committerEmail = null;
    var committerIsStaff = 0; // false

    if (activities[key]) {
      a = activities[key];

      // Author
      if (a.author && a.author.login) {
        authorLogin = a.author.login;
      }

      if (a.commit && a.commit.author && a.commit.author.date) {
        authorDate = a.commit.author.date;
      }

      if (a.commit && a.commit.author && a.commit.author.email) {
        authorEmail = a.commit.author.email;
      }

      // Committer
      if (a.committer && a.committer.login) {
        committerLogin = a.committer.login;
      }

      if (a.commit && a.commit.committer && a.commit.committer.date) {
        committerDate = a.commit.committer.date;
      }

      if (a.commit && a.commit.committer && a.commit.committer.email) {
        committerEmail = a.commit.committer.email;
      }
    }

    if (authorDate && committerDate) {
      // two activities to save in parallel
      itemsToSave.push(toItemArray(authorDate, githubOrgName, githubRepoName, authorLogin, authorEmail, 'commit-author', mozTeamName, authorIsStaff));
      itemsToSave.push(toItemArray(committerDate, githubOrgName, githubRepoName, committerLogin, committerEmail, 'commit-commiter', mozTeamName, committerIsStaff));
    }
  }
};

function processBatchOfCommits(err, res, githubOrgName, mozTeamName, githubRepoName, githubClient, callback) {

  var activities = res;
  saveCommits(githubOrgName, mozTeamName, githubRepoName, activities, function commitsSaved(err) {

    if (err) {
      console.error(err);
    }

    // Recursively check if there is a next page
    if (githubClient.hasNextPage(res)) {
      githubClient.getNextPage(res, function gotNextPage(err, res) {

        if (err) {
          console.error(err);
        } else {
          processBatchOfCommits(err, res, githubOrgName, mozTeamName, githubRepoName, githubClient, callback);
        }

      });
    } else {
      callback(null); // we've been through them all
    }
  });
}

var updateCommitActivity = function (githubOrgName, mozTeamName, githubRepoName, since, callback) {

  var githubClient = new GitHubApi({
    version: '3.0.0',
    protocol: 'https'
  });
  githubClient.authenticate({
    type: 'basic',
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_PASSWORD
  });

  var msg = {
    user: githubOrgName,
    repo: githubRepoName,
    per_page: 100
  };
  if (since) {
    msg.since = since.toISOString(); // if no 'since' is specifified this will fetch full repo history
  }

  githubClient.repos.getCommits(msg, function (err, res) {

    if (err) {
      console.error(err);
    }

    processBatchOfCommits(err, res, githubOrgName, mozTeamName, githubRepoName, githubClient, function processedCommits(err, res) {
      console.log('== All commits stored for ' + githubOrgName + ' ' + mozTeamName + ' ' + githubRepoName);
      callback(null);
    });

  });
};

/* =================
 ALL CONTRIBUTION
================= */

var updateContributionActivityForList = function (repos, since, callback) {
  function updateRepoActivity(r, callback) {

    async.parallel([

        function (callback) {
          // Commit activity
          updateCommitActivity(r.githubOrgName, r.mozTeamName, r.githubRepoName, since, function commitListUpdated(err, res) {
            callback(null);
          });

        },
        function (callback) {
          // Issues activity
          updateIssueActivity(r.githubOrgName, r.mozTeamName, r.githubRepoName, since, function issueListUpdated(err, res) {
            callback(null);
          });

        }
      ],
      function (err, results) {
        if (err) {
          console.error(err);
        }
        callback(null);
      });

  }

  async.eachLimit(repos, 3, updateRepoActivity, function allUpdated(err) {
    if (err) {
      console.log(err);
    }
    callback(null);
  });
};

module.exports = {
  updateCommitActivity: updateCommitActivity,
  updateContributionActivityForList: updateContributionActivityForList
};
