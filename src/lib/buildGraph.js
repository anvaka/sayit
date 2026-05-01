import bus from '../bus';
import redditDataClient from './redditDataClient';
import subredditCountries from './subredditCountries';

export default function buildGraph(entryWord, MAX_DEPTH, progress) {
  entryWord = entryWord && entryWord.trim();
  if (!entryWord) return;

  entryWord = entryWord.toLocaleLowerCase();

  let cancelled = false;
  let pendingResponse;
  let graph = require('ngraph.graph')();
  graph.maxDepth = MAX_DEPTH;
  let queue = [];
  let requestDelay = 0;
  progress.startDownload();

  startQueryConstruction();

  return {
    dispose,
    graph
  }

  function dispose() {
    cancelled = true;
    if (pendingResponse) {
      // pendingResponse.cancel();
      pendingResponse = null;
    }
  }

  function startQueryConstruction() {
    fetchNext(entryWord);
  }

  function loadSiblings(results) {
    const parent = results[0];
    var parentNode = graph.getNode(parent);

    if (!parentNode) {
      parentNode = graph.addNode(parent, {
        depth: 0,
        size: redditDataClient.getSize(parent)
      });
    }

    results.forEach((other, idx) => {
      if (idx === 0) return;

      const hasOtherNode = graph.hasNode(other);
      if (hasOtherNode) {
        const hasOtherLink = graph.getLink(other, parent) || graph.getLink(parent, other);
        if (!hasOtherLink) {
          graph.addLink(parent, other);
        }
        return;
      }

      let depth = parentNode.data.depth + 1;
      graph.addNode(other, {depth, size: redditDataClient.getSize(other)});
      graph.addLink(parent, other);
      if (depth < MAX_DEPTH) queue.push(other);
    });

    setTimeout(loadNext, requestDelay);
  }

  function loadNext() {
    if (cancelled) return;
    if (queue.length === 0) {
      bus.fire('graph-ready', graph);
      return;
    }

    let nextWord = queue.shift();
    fetchNext(nextWord);
    progress.updateLayout(queue.length, nextWord);
  }

  function fetchNext(query) {
    pendingResponse = redditDataClient.getRelated(query);
    pendingResponse.then(res => onPendingReady(res, query)).catch((msg) => {
      const err = 'Failed to download ' + query + '; Message: ' + msg;
      console.error(err);
      progress.downloadError(err)
      loadNext();
    });
  }

  function onPendingReady(res, query) {
    if (!res || !res.length) res = [query];
    loadSiblings(res);
  }
}

export default function buildGraph(records) {
  records.forEach(record => {
    let from = record.from;
    let to = record.to;
    graph.addNode(from, {
      id: from,
      name: from,
      country: subredditCountries[from.toLowerCase()] || 'Unknown'
    });
    graph.addNode(to, {
      id: to,
      name: to,
      country: subredditCountries[to.toLowerCase()] || 'Unknown'
    });
    graph.addLink(from, to);
  });

  return graph;
}