import findMinimumSpanningTree from 'ngraph.kruskal';
import getDelaunayGraph from './getDelaunayGraph';
import makeSpanningTree from './makeSpanningTree';

class EdgeModel {
  constructor (from, to) {
    this.from = from
    this.to = to
  }
}

/**
 * For a given set of rectangles, removes overlaps
 *
 * @param {Map} rectangles - rectId -> Rectangle mapping
 */
export default function removeOverlaps(rectangles, options) {
  // Convert rectangle centers into vertices, that we can feed into Delaunay
  // triangulation
  const vertices = []
  options = options || {}

  const canMove = options.canMove || yes
  const pullX = options.pullX || false
  const pullY = options.pullY || false

  if (rectangles.size < 2) {
    return;
  }
  if (rectangles.size === 2) {
    // we cannot triangulate this, so let's just cal it directly
    let arrayOfRects = Array.from(rectangles).map(x => x[1]);

    removeOverlapsForRectangles(arrayOfRects[0], arrayOfRects[1]);
    return;
  }

  rectangles.forEach(r => {
    const pair = [r.cx, r.cy]
    pair.id = r.id
    vertices.push(pair)
  })

  const triangulationGraph = getDelaunayGraph(vertices)
  triangulationGraph.forEachLink(addTriangulationLinkWeight);

  const mst = findMinimumSpanningTree(triangulationGraph, e => e.data)
  const mstEdges = mst.map(edge => new EdgeModel(
    getRect(edge.fromId),
    getRect(edge.toId)
  ))

  let spanningTree
  if (mstEdges.length > 0) {
    spanningTree = makeSpanningTree(mstEdges)

    grow(spanningTree)
  }

  return

  function getRect (id) {
    return rectangles.get(id)
  }

  function grow(spanningTree) {
    const spanningGraph = spanningTree.getGraph()

    const processed = new Set()
    growAt(spanningTree.getRootId())

    function growAt(nodeId) {
      if (processed.has(nodeId)) return

      processed.add(nodeId)

      const rootPos = getRect(nodeId)

      spanningGraph.forEachLinkedNode(nodeId, otherNode => {
        if (processed.has(otherNode.id)) return

        const childPos = getRect(otherNode.id)
        removeOverlapsForRectangles(rootPos, childPos);
        growAt(otherNode.id)
      })
    }
  }

  function removeOverlapsForRectangles(rootPos, childPos) {
    if (overlaps(rootPos, childPos)) {
      let t = getOverlapFactor(rootPos, childPos)
      let dx = (childPos.cx - rootPos.cx)
      let dy = (childPos.cy - rootPos.cy)

      if (!Number.isFinite(t)) {
        t = 1
        dx = 1e-3
        dy = -1e-3
      }

      if (canMove(childPos.id)) {
        childPos.cx = rootPos.cx + t * dx
        childPos.cy = rootPos.cy + t * dy
      } else {
        rootPos.cx = childPos.cx - t * dx
        rootPos.cy = childPos.cy - t * dy
      }
    }
  }

  /**
  * Given two rectangles returns a value by which they overlap
  */
  function getOverlapFactor (a, b) {
    const dx = Math.abs(a.cx - b.cx)
    const dy = Math.abs(a.cy - b.cy)

    const wx = (a.width + b.width) / 2
    const wy = (a.height + b.height) / 2

    const t = Math.min(wx / dx, wy / dy)
    return t
  }

  function addTriangulationLinkWeight(link) {
    const from = getRect(link.fromId)
    const to = getRect(link.toId)
    const weight = getTriangulationWeight(from, to)
    link.data = weight;
  }

  function getTriangulationWeight(a, b) {
    if (overlaps(a, b)) {
      const centerDistance = getPointDistance(a, b)
      const t = getOverlapFactor(a, b)
      return -(t - 1) * centerDistance
    }

    return getRectangularDistance(a, b)
  }

  function overlaps(a, b) {
    if (pullX) {
      return true;
    }
    // If one rectangle is on left side of other
    // NOTE: This gives funny results when we always return true
    if (a.left > b.right || b.left > a.right) return pullX

    // If one rectangle is above other
    if (a.top > b.bottom || b.top > a.bottom) return pullY

    return true
  }

  function getRectangularDistance(a, b) {
    if (overlaps(a, b)) return 0
    let dx = 0
    let dy = 0

    if (a.right < b.left) {
      dx = b.right - a.left
    } else if (b.right < a.left) {
      dx = a.left - b.right
    }

    if (a.top < b.bottom) {
      dy = b.bottom - a.top
    } else if (b.top < a.bottom) {
      dy = a.bottom - b.top
    }

    return Math.sqrt(dx * dx + dy * dy)
  }

  function getPointDistance(a, b) {
    const dx = a.cx - b.cx
    const dy = a.cy - b.cy

    return Math.sqrt(dx * dx + dy * dy)
  }
}

function yes() {
  return true
}
