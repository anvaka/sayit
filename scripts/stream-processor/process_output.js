let JSONStream = require('JSONStream')
let es = require('event-stream')
let ignore = new Set([
  '[deleted]',
  'AutoModerator',
]);

process.stdin
  .pipe(JSONStream.parse())
  .pipe(es.mapSync(function (data) {
    if (ignore.has(data.author)) return;
    if (data.author.match(/bot/i)) return;
    console.log(data.author + ',' + data.subreddit)
  }))
