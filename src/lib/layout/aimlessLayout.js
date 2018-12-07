const random = require('ngraph.random')(42);

export default function aimlessLayout(graph) {
  const nodes = new Map();
  const width = 250;
  const height = 250;
  const speed = 100;
  const WANDER = 1;
  const FOLLOW = 2;

  const api = {
    addNode,
    getNodePosition,
    step
  }

  graph.forEachNode(function(node) {
    addNode(node.id);
  })

  return api;

  function addNode(nodeId) {
    let pos = nodes.get(nodeId);
    if (pos) return pos;

    pos = {
      x: random.gaussian() * width,
      y: random.gaussian() * height,
      sx: 0, sy: 0,
      tx: 0, ty: 0,
      t: 0, maxT: 0,
      follow: null
    };
    pickNewGoal(pos, nodeId);
    nodes.set(nodeId, pos)

    return pos;
  }

  function getNodePosition(nodeId) {
    let pos = nodes.get(nodeId);
    if (!pos) {
      pos = addNode(nodeId);
    }

    return pos;
  }


  function step() {
    nodes.forEach(updateNode);
  }

  function updateNode(node, key) {
    if (node.t > node.maxT) {
      pickNewGoal(node, key);
    }

    let t = ease(node.t/node.maxT);
    if (node.strategy === WANDER || !node.follow) {
      node.x = node.sx * (1 - t) + node.tx * t;
      node.y = node.sy * (1 - t) + node.ty * t;
    } else {
      node.x = node.sx * (1 - t) + node.follow.x * t;
      node.y = node.sy * (1 - t) + node.follow.y * t;
    }
    node.t += 1;
  }

  function pickNewGoal(node, nodeId) {
    node.sx = node.x; node.sy = node.y;
    node.tx = random.gaussian() * width;
    node.ty = random.gaussian() * height;
    node.t = 0;
    node.maxT = Math.abs(Math.round(random.gaussian() * speed)) + 400;

    node.strategy = WANDER; // Math.random() < 0.8 ? FOLLOW : WANDER;
    if (node.strategy === FOLLOW) {
      node.follow = getNodeToFollow(nodeId)
      if (!node.follow) node.strategy = WANDER;
    } else {
      node.follow = null;
    }
  }

  function getNodeToFollow(nodeId) {
    let candidates = [];
    graph.forEachLinkedNode(nodeId, function(otherNode) {
      candidates.push({
        otherNode,
        degree: getNodeDegree(otherNode.id)
      })
    });
    candidates.sort((b, a) => a.degree - b.degree);
    if (candidates.length === 0) { let nodeCandidates = []
      graph.forEachNode(function(otherNode) {
        if (otherNode.id !== nodeId) nodeCandidates.push(otherNode.id);
      });
      let index = Math.round(random.nextDouble() * (nodeCandidates.length - 1));
      return nodes.get(nodeCandidates[index]);
    }
    return nodes.get(candidates[0].id);
  }

  function getNodeDegree(nodeId) {
    let nodeLinks = graph.getLinks(nodeId)
    return ((nodeLinks && nodeLinks.length) || 0);
  }
}

function ease(t) {
  return t*(2-t);
}