import {Flock, Boid} from './flock';
let createRandom = require('ngraph.random');

export default function createFakeLayout(graph) {
  let nodes = new Map();
  let random = createRandom(42);
  const flock = new Flock(graph);
  
  return {
    addNode,
    getNodePosition,
    setDesiredNodePosition,
    step
  };

  function addNode(nodeId) {
    const pos = {
      x: (random.nextDouble() - 0.5) * 1000,
      y: (random.nextDouble() - 0.5) * 1000
    }
    const boid = new Boid(pos.x, pos.y);
    flock.addBoid(nodeId, boid);
    nodes.set(nodeId, boid);
    return boid;
  }

  function getNodePosition(nodeId) {
    let pos = nodes.get(nodeId)
    if (!pos) {
      pos = addNode(nodeId);
    } 
    return pos.position;
  }

  function step() {
    flock.run();
  }

  function setDesiredNodePosition(nodeId, pos) {
    flock.setDesiredBoidPosition(nodeId, pos);
  }
}