const createGraph = require('ngraph.graph')

export default function makeSpanningTree(mstEdges) {
  const graph = createGraph();

  mstEdges.forEach(e => {
    graph.addLink(e.from.id, e.to.id)
  })

  // Doesn't really matter what is the root
  const rootId = mstEdges[0].from.id

  return {
    getGraph() {
      return graph
    },
    getRootId() {
      return rootId
    },
    get(id) {
      return graph.gentNode(id)
    }
  }
}
