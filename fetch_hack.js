var data = require('./lib/data');

console.log('hack update');
// get the total combined numbers
data.update2014TotalActive('coding', function updatedAll (err) {
  console.log('done');
  process.exit(0);
});

