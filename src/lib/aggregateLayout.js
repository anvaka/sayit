import createFakeLayout from './layout/boidLayout';
import createInterpolateLayout from './createInterpolateLayout';
import removeOverlaps from './layout/removeOverlaps';
import Rect from './layout/Rect';

let eventify = require('ngraph.events');

let createLayout = require('ngraph.forcelayout')
const USE_FAKE = 1;
const USE_INTERPOLATE = 2;
const REMOVE_OVERLAPS = 3;
const USE_REAL = 4;

/**
 * Orchestrates layout of algorithm between phases.
 */
export default function createAggregateLayout(graph, progress) {
  const MAX_DEPTH = graph.maxDepth;
  let physicsLayout = createPhysicsLayout(graph);
  let fakeLayout = createFakeLayout(graph);
  let interpolateLayout = createInterpolateLayout(fakeLayout, physicsLayout);

  let isGraphReady = false;
  let layoutIterations = 0;
  let layoutTime = 0;
  let maxLayoutIterations = 2000;
  let maxLayoutTime = 2000;
  let phase = USE_FAKE;
  let rectangles = new Map();

  var api = eventify({
    step,
    pinNode,
    getNodePosition,
    addNode,
    setGraphReady,
    getGraphReady
  })

  return api;

  function setGraphReady() {
    layoutIterations = 0;
    layoutTime = 0;
    isGraphReady = true;
  }

  function getGraphReady() {
    return isGraphReady;
  }

  function addNode(nodeId, rect) {
    fakeLayout.addNode(nodeId, rect);
    rectangles.set(nodeId, rect);
  }

  function getNodePosition(nodeId) {
    if (phase === USE_FAKE || phase === REMOVE_OVERLAPS) return fakeLayout.getNodePosition(nodeId);
    if (phase === USE_REAL) return physicsLayout.getNodePosition(nodeId);
    if (phase === USE_INTERPOLATE) return interpolateLayout.getNodePosition(nodeId);
  }

  function step() {
    if (!isGraphReady || layoutIterations < maxLayoutIterations) {
      phase = USE_FAKE;
      let start = window.performance.now();
      fakeLayout.step();

      do {
        physicsLayout.step();
        layoutIterations += 1;
      } while (window.performance.now() - start < 10)
      layoutTime += window.performance.now() - start;
      

      if (layoutTime > maxLayoutTime) layoutIterations = maxLayoutIterations;
      const finished = Math.min(1, Math.max(layoutTime/maxLayoutTime, layoutIterations/maxLayoutIterations));
      syncLayouts();

      progress.setLayoutCompletion(Math.round(finished * 100));

      if (layoutIterations >= maxLayoutIterations) phase = REMOVE_OVERLAPS;

      return true;
    } else if (phase === REMOVE_OVERLAPS) {
      runOverlapsRemoval();
      phase = USE_INTERPOLATE;

      return true;
    } else if (phase === USE_INTERPOLATE) {
      interpolateLayout.step();
      if (interpolateLayout.done()) {
        phase = USE_REAL;
        api.fire('ready', api);
      }
      return true;
    } 

    return false;
  }

  function syncLayouts() {
    graph.forEachNode(function (node) {
      var pos = physicsLayout.getNodePosition(node.id);
      fakeLayout.setDesiredNodePosition(node.id, pos);
    })
  }

  function runOverlapsRemoval() {
    // TODO: Async?
    let rectangles = getRectangles();
    removeOverlaps(rectangles);
    removeOverlaps(rectangles);
    removeOverlaps(rectangles);
    rectangles.forEach((rect, nodeId) => {
      physicsLayout.setNodePosition(nodeId, rect.left - rect.dx, rect.top - rect.dy);
    });
  }

  function getRectangles() {
    let rects = new Map();
    rectangles.forEach((rect, id) => {
      let pos = physicsLayout.getNodePosition(id);
      let {width, height} = rect;
      const inflatedRect = new Rect({
        id, 
        left: pos.x + rect.x,
        top: pos.y + rect.y,
        dx: rect.x,
        dy: rect.y,
        width,
        height,
      });
      rects.set(id, inflatedRect);
    });

    return rects;
  }

  function pinNode(node) {
    physicsLayout.pinNode(node, true);
  }

  function createPhysicsLayout() {
    return createLayout(graph, {
      springLength: 20,
      springCoeff: 0.002,
      gravity: -1.2,
      theta: 0.8,
      dragCoeff: 0.02,
      timeStep: 14,
      nodeMass(nodeId) {
        let links = graph.getLinks(nodeId);
        let mul = links ? links.length : 1;
        let node = graph.getNode(nodeId);
        mul *=  (MAX_DEPTH - node.data.depth) + 1;
        return nodeId.length * mul;
      }
    });
  }
}