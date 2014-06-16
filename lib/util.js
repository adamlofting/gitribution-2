var teamsRepos = require('../teams_repos.js').teamsRepos;

/**
 * Checks if a string ends with another string
 * @param  {str} str
 * @param  {str} suffix
 * @return {boolean}
 */
function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * parse a string to a Date, and check it's a valid date
 * @param  {str} str
 * @return {Date}
 */
function parseAndCheckDate(str) {
  var date;
  date = new Date(str);
  if (Object.prototype.toString.call(date) === "[object Date]") {
    if (isNaN(date.getTime())) {
      return null;
    }
    if (date.getFullYear() > 2025) {
      return null;
    }
  } else {
    return null;
  }
  return date;
}

/**
 * Convert a JS date to string "YYYY-MM-DD"
 * @param  {Date} date
 * @return {str}
 */
function dateToISOtring(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2); // 0 index
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

/**
 * Counts occurances in Array A that are not in Array B
 * @param  {Array} arrA
 * @param  {Array} arrB
 * @return {Int}
 */
function countInAnotInB(arrA, arrB) {
  var count = 0;
  for (var i = 0; i < arrA.length; i++) {
    if (arrB.indexOf(arrA[i]) === -1) {
      count++;
    }
  }
  return count;
}

/**
 * Extract named field from the object and return as an array
 * @param  {obj} obj
 * @param  {String} fieldname
 * @return {Array}
 */
function fieldToArray(obj, fieldname) {
  var arr = [];
  for (var i = 0; i < obj.length; i++) {
    arr.push(obj[i][fieldname]);
  }
  return arr;
}

/**
 * Apply any necessary formatting to fields before using in the API
 * @param  {Array} sqlResponse
 * @return {Array}
 */
function formatSummaryResults(sqlResponse) {
  var output = [];
  for (var i = 0; i < sqlResponse.length; i++) {
    var row = sqlResponse[i];
    row.wkcommencing = dateToISOtring(row.wkcommencing);
    output.push(row);
  }
  return output;
}

/**
 * picks out the team names from teams_repos.js
 * @return {Array}
 */
function validTeamNames() {
  var valid = ['moco', 'mofo'];
  for (var i = teamsRepos.length - 1; i >= 0; i--) {
    valid.push(teamsRepos[i].team_name);
  }
  return valid;
}

/**
 * Checks if a string is a valid team name
 */
function isValidTeamName(s) {
  return (validTeamNames().indexOf(s) !== -1);
}

/**
 * Comines the list of repos for all teams
 */
function allClaimedRepos() {
  var allRepos = [];
  for (var i = teamsRepos.length - 1; i >= 0; i--) {
    allRepos = allRepos.concat(teamsRepos[i].repos);
  }
  return allRepos;
}

/**
 * Comines the list of repos for all teams in moco OR mofo
 */
function rollUpReposFor(name) {
  var combinedRepos = [];
  for (var i = teamsRepos.length - 1; i >= 0; i--) {
    if (teamsRepos[i].moco_or_mofo === name) {
      combinedRepos = combinedRepos.concat(teamsRepos[i].repos);
    }
  }
  return combinedRepos;
}

/**
 * Gets the list of repos linked to a team
 * @param  {string} team
 * @return {Array}
 */
function reposForTeam(team) {
  if ((team === 'moco') || (team === 'mofo')) {
    return rollUpReposFor(team);
  }
  for (var i = teamsRepos.length - 1; i >= 0; i--) {
    if (teamsRepos[i].team_name === team) {
      return teamsRepos[i].repos;
    }
  }
  return null;
}

function filterOutClaimedRepos(allRepos) {
  var unclaimed = [];
  for (var i = allRepos.length - 1; i >= 0; i--) {
    if (allClaimedRepos().indexOf(allRepos[i]) === -1) {
      unclaimed.push(allRepos[i]);
    }
  }
  return unclaimed;
}

function justASCII(s) {
  return s.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
}

function cleanDescriptionForDB(s) {
  s = justASCII(s);
  s = s.substring(0, 1000);
  return s;
}

module.exports = {
  dateToISOtring: dateToISOtring,
  fieldToArray: fieldToArray,
  countInAnotInB: countInAnotInB,
  endsWith: endsWith,
  parseAndCheckDate: parseAndCheckDate,
  validTeamNames: validTeamNames,
  isValidTeamName: isValidTeamName,
  reposForTeam: reposForTeam,
  rollUpReposFor: rollUpReposFor,
  allClaimedRepos: allClaimedRepos,
  filterOutClaimedRepos: filterOutClaimedRepos,
  formatSummaryResults: formatSummaryResults,
  cleanDescriptionForDB: cleanDescriptionForDB
};
