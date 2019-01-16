import buildGraph from './lib/buildGraph';
import Progress from './Progress';

const queryState = require('query-state');

const qs = queryState(
  {
    query: ''
  },
  {
    useSearch: true
  }
);

let lastBuilder;
const appStateFromQuery = qs.get();
const appState = {
  hasGraph: false,
  maxDepth: appStateFromQuery.maxDepth || 2,
  progress: new Progress(),
  graph: null,
  query: appStateFromQuery.query
};

if (appState.query) {
  performSearch(appState.query);
}

export default appState;

qs.onChange(updateAppState);

function updateAppState(newState) {
  appState.query = newState.query;
}

export function performSearch(queryString) {
  appState.hasGraph = true;
  appState.progress.reset();

  qs.set('query', queryString);
  if (lastBuilder) {
    lastBuilder.dispose();
  }

  lastBuilder = buildGraph(queryString, appState.maxDepth, appState.progress);
  lastBuilder.graph.rootId = queryString;
  appState.graph = Object.freeze(lastBuilder.graph);
  return lastBuilder.graph;
}
