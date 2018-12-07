import BBox from './BBox';

const createRandom = require('ngraph.random');

export default function createNBLayout(graph) {
  let nodes = new Map();
  let random = createRandom(42);

  var edgeLength = 100;
  let k1 = 0.5;
  let k2 = 0.6;
  let k3 = 0.06;
  const desiredWidth = 1000;
  const desiredHeight = 1000;

  initLayout();
  
  return {
    addNode,
    getNodePosition,
    step
  };

  function initLayout() {
    graph.forEachNode(function(node) {
      addNode(node.id);
    })
  }

  function addNode(nodeId) {
    let pos = nodes.get(nodeId)
    if (pos) {
      return pos;
    }
    pos = {
      x: (random.nextDouble() - 0.5) * desiredWidth,
      y: (random.nextDouble() - 0.5) * desiredHeight,
      incX: 0,
      incY: 0,
      incLength: 0,
      aggDeg: 0,
      id: nodeId
    };

    nodes.set(nodeId, pos)
    return pos;
  }

  function getGraphBBox() {
    var graphBoundingBox = new BBox();

    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      currentPos.scaled = false;
      graphBoundingBox.addPoint(currentPos.x, currentPos.y);
      var otherPos = nodes.get(link.toId);
      otherPos.scaled = false;
      graphBoundingBox.addPoint(otherPos.x, otherPos.y);
    });
    return graphBoundingBox;
  }

  function rescale() {
    var bbox = getGraphBBox();
    var width = bbox.width;
    var height = bbox.height;

    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      if (!currentPos.scaled) {
        currentPos.x = ((currentPos.x - bbox.left)/width - 0.0) * desiredWidth
        currentPos.y = ((currentPos.y - bbox.top)/height - 0.0) * desiredHeight
        currentPos.scaled = true;
      }
      var otherPos = nodes.get(link.toId);
      if(!otherPos.scaled) {
        otherPos.x = ((otherPos.x - bbox.left)/width - 0.0) * desiredWidth
        otherPos.y = ((otherPos.y - bbox.top)/height - 0.0) * desiredHeight
        otherPos.scaled = true;
      }
    });
  }

  function processIncomingMessages() {
    nodes.forEach(function(pos) {
      pos.x = (pos.incX + pos.x)/(pos.incLength + 1);
      pos.y = (pos.incY + pos.y)/(pos.incLength + 1);
      pos.incLength = 0;
      pos.incX = 0;
      pos.incY = 0;
    });
  }

  function getNodePosition(nodeId) {
    let pos = nodes.get(nodeId)
    if (!pos) {
      pos = addNode(nodeId);
    } 
    return nodes.get(nodeId);
  }

  function step() {
    rescale();

    minimizeEdgeCrossings();
    minimizeEdgeLengthDifference();
    maximizeAngularResolution();
  }

  function rotate(center, point, alpha) {
    var x = point.x - center.x;
    var y = point.y - center.y;

    var nx = Math.cos(alpha) * x - Math.sin(alpha) * y;
    var ny = Math.sin(alpha) * x + Math.cos(alpha) * y;

    return {
      x: nx + center.x,
      y: ny + center.y
    }
  }

  function minimizeEdgeCrossings() {
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      var otherPos = nodes.get(link.toId);
      var dx = currentPos.x - otherPos.x;
      var dy = currentPos.y - otherPos.y;
      otherPos.incX += otherPos.x + k1 * dx;
      otherPos.incY += otherPos.y + k1 * dy;
      otherPos.incLength += 1;

      currentPos.incX += currentPos.x - k1 * dx;
      currentPos.incY += currentPos.y - k1 * dy;
      currentPos.incLength += 1;
    });

    processIncomingMessages();
  }

  function minimizeEdgeLengthDifference() {
    var desLength = 0;
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      var otherPos = nodes.get(link.toId);
      var dx = otherPos.x - currentPos.x;
      var dy = otherPos.y - currentPos.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      if (l > desLength) desLength = l;
    });

    edgeLength = desLength;

    graph.forEachLink(function(link) {
      var formPos = nodes.get(link.fromId);
      var toPos = nodes.get(link.toId);
      var dx = toPos.x - formPos.x;
      var dy = toPos.y - formPos.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      while (l < 1e-10) {
        dx = (random.nextDouble() - 0.5);
        dx = (random.nextDouble() - 0.5);
        l = Math.sqrt(dx * dx + dy * dy);
      }

      // ddx = k2 * (desLength - l) * dx/l;
      // ddy = k2 * (desLength - l) * dy/l;
      var tR = 1
      toPos.incX += toPos.x + k2 * (desLength - l) * dx/l * tR;
      toPos.incY += toPos.y + k2 * (desLength - l) * dy/l * tR;
      toPos.incLength += 1;

      // same drill with `tF`.
      var tF = 1;
      formPos.incX += formPos.x - k2 * (desLength- l) * dx/l * tF;
      formPos.incY += formPos.y - k2 * (desLength- l) * dy/l  * tF;
      formPos.incLength += 1;
    });

    processIncomingMessages();
  }

  function maximizeAngularResolution() {
    graph.forEachNode(function(node) {
      var currentPos = nodes.get(node.id);
      var neighbors = [];
      graph.forEachLinkedNode(node.id, function(other) {
        var otherPos = nodes.get(other.id);
        var dx = otherPos.x - currentPos.x;
        var dy = otherPos.y - currentPos.y;
        var angle = Math.atan2(dy, dx) + Math.PI;
        neighbors.push({
          pos: otherPos,
          angle,
          strength: 1 
        });
      });
      if (neighbors.length < 2) return;
      // if (Math.random() < 0.4) return;
      // if (Math.random() < 0.001) node.ascending = undefined;
      if (node.ascending === undefined) {
        node.ascending = Math.random() < 0.5;
      }
      // node.ascending; //
      var ascending = node.ascending; // Math.random() > 0.50;
      neighbors.sort((a, b) => a.angle - b.angle);

      var desiredAngle = 2 * Math.PI / neighbors.length;
      var direction = ascending ? 1 : -1;

      var idx = 0;
      var startFrom = Math.round(Math.random() * (neighbors.length - 1));
      while (idx < neighbors.length) {
        var i = (startFrom + idx) % neighbors.length;
        idx += 1;
        var curr = neighbors[i];
        var next, curAngle;
        var nextIndex = i + direction;
        if (nextIndex === neighbors.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = neighbors.length - 1;

        next = neighbors[nextIndex];
        curAngle = (next.angle - curr.angle) * direction;

        if (curAngle < 0) curAngle += 2 * Math.PI;

        if (curAngle < desiredAngle) continue;

        var otherPos = curr.pos;
        var newAngle = curr.strength * k3 * (curAngle - desiredAngle) * direction;
        var rPoint = rotate(currentPos, otherPos, newAngle);
        otherPos.incX += rPoint.x;
        otherPos.incY += rPoint.y;
        otherPos.incLength += 1;
      }
    });

    processIncomingMessages();
  }
}