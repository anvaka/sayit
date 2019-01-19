/**
 * Counts number of unique commenters per reddit
 */
var forEachLine = require('for-each-line');
var fileName = process.argv[2] || 'all.csv'

var counts = new Map();

forEachLine(fileName, (line) => {
  var parts = line.split(',')
  var sub = parts[1];
  counts.set(sub, (counts.get(sub) || 0) + 1);
}).then(() => {
  let buckets = [];
  Array.from(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(x => {
        const bucketNumber = Math.round(Math.log(x[1])) - 2;
        if (bucketNumber < 0) return;
        const subName = x[0];
        let bucket = buckets[bucketNumber];
        if (!bucket) {
          bucket = [subName];
          buckets[bucketNumber] = bucket;
        } else {
          bucket.push(subName);
        }
      })
  console.log(JSON.stringify(buckets));
});
