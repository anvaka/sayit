/**
 * This file merges two subreddit user->subreddit logs into one.
 */
const lineByLine = require('n-readlines');

var OUT_FILE_NAME = 'out.csv';
//['./part0.csv', './part1.csv'];//
var files = process.argv.slice(2);

var fs = require('fs');

if (files.length === 0) {
  console.error('Pass file names to process');
  process.exit(1);
}

var readers = files.map(toInitializedReader);
console.warn('Initialized with ', files);

var lastUser = undefined;
var buffer = [];

class UserAggregator {
  constructor(commentor) {
    this.subreddits = Object.create(null);
    this.name = commentor.name;
    this.subreddits[commentor.subreddit] = commentor.count;
  }

  printAll() {
    var name = this.name;
    var subs = this.subreddits;
    Object.keys(this.subreddits).forEach((subreddit => {
      var line = name + ',' + subreddit + ',' + subs[subreddit];
      buffer.push(line);

      if (buffer.length > 10000) {
        // async stream writing or console.log with redirect give out of memory on my box.
        // So doing it this way.
        fs.appendFileSync(OUT_FILE_NAME, buffer.join('\n'));
        buffer = [];
      }
    }))
  }

  merge(otherCommentor) {
    if (otherCommentor.name !== this.name) {
      throw new Error('Wrong name ' + otherCommentor.name + ' !== ' +  this.name);
    }

    this.subreddits[otherCommentor.subreddit] = (this.subreddits[otherCommentor.subreddit] || 0) + otherCommentor.count;
  }
}

var processed = 0;

do {
  var nextReader = getReaderWithNextLine(readers);
  if (!nextReader) break;
  if (processed % 100000 === 0) {
    console.error('Processed lines: ', processed);
  }

  var currentUser = nextReader.lastUser()
  if (lastUser && lastUser.name !== currentUser.name) {
    lastUser.printAll();
    lastUser = new UserAggregator(currentUser);
  } else if (lastUser) {
    lastUser.merge(currentUser);
  } else {
    lastUser = new UserAggregator(currentUser);
  }

  if (!nextReader.next()) {
    // this one is over.
    removeReader(nextReader);
  }
  processed += 1;
} while (true);

lastUser.printAll();
if (buffer.length > 0) {
  fs.appendFileSync(OUT_FILE_NAME, buffer.join('\n'));
}

function removeReader(reader) {
  let readerIndex = readers.indexOf(reader);
  readers.splice(readerIndex, 1);
}

function getReaderWithNextLine(readers) {
  readers.sort(readerIsNext);
  return readers[0];
}

function readerIsNext(aReader, bReader) {
  let a = aReader.lastUser();
  let b = bReader.lastUser();

  let userDiff = a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  if (userDiff) return userDiff;

  let subredditDiff = a.subreddit < b.subreddit ? -1 : a.subreddit > b.subreddit ? 1 : 0;
  if (subredditDiff) return subredditDiff;

  var countDiff = a.count - b.count;
  if (countDiff) return countDiff;

  return (aReader.fileName.localeCompare(bReader.fileName));
}

function toInitializedReader(fileName) {
  var reader = createFileReader(fileName)
  reader.next();

  return reader;
}

function createFileReader(fileName) {
  var finished = false;
  var line;
  var commenter = {
    name: undefined,
    subreddit: undefined,
    count: 0
  };

  const liner = new lineByLine(fileName);

  return {
    lastUser,
    lastLine,
    next,
    isFinished,
    fileName
  }

  function isFinished() {
    return finished;
  }

  function lastUser() {
    return commenter;
  }
  function lastLine() {
    return line;
  }

  function next() {
    let lastBuff = liner.next();
    if (!lastBuff) {
      finished = true;
      return false;
    }
    line = lastBuff.toString('utf8');
    let parts = line.split(',');
    if (parts.length !== 3) throw new Error('invalid format ' + line);

    commenter.name = parts[0];
    commenter.subreddit = parts[1];
    commenter.count = Number.parseInt(parts[2], 10);
    if (!Number.isFinite(commenter.count)) throw new Error('Invalid count ' + line);

    return true;
  }
}
