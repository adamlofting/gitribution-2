// Just a place to run some code while developing
var data = require('.././lib/data');

data.saveItem(new Date(), 'githubOrgName', 'githubRepo', 'githubLogin', 'githubPublicEmail@example.com', 'commit', function savedItem (err, res) {
  console.log('savedItem()');
});

var test1 = [new Date(), 'githubOrgName1', 'githubRepo1', 'githubLogin1', 'githubPublicEmail@example.com', 'commit'];
var test2 = [new Date(), 'githubOrgName2', 'githubRepo2', 'githubLogin2', 'githubPublicEmail@example.com', 'commit'];
var test3 = [new Date(), 'githubOrgName3', 'githubRepo3', 'githubLogin3', 'githubPublicEmail@example.com', 'commit'];
var test4 = [new Date(), 'githubOrgName4', 'githubRepo4', 'githubLogin4', 'githubPublicEmail@example.com', 'commit'];

var toSave = [test1, test2, test3, test4];

data.saveItems(toSave, function savedItems (err, res) {
  console.log('savedItems()');
});
