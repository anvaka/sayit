import createPanZoom from 'panzoom';
import createTextMeasure from './measureText';
import createAggregateLayout from './aggregateLayout';
import bus from '../bus';
import createLinkAnimator from './renderer/linkAnimator';

let svg = require('simplesvg');

export default function createRenderer(progress) {
  const scene = document.querySelector('#scene');
  const nodeContainer = scene.querySelector('#nodes');
  const edgeContainer = scene.querySelector('#edges');

  const panzoom = createPanZoom(scene);
  const defaultRectangle = {left: -500, right: 500, top: -500, bottom: 500}
  panzoom.showRectangle(defaultRectangle);

  // maps node id to node ui
  let nodes = new Map();

  let layout, graph, currentLayoutFrame = 0, linkAnimator;
  let textMeasure = createTextMeasure(scene);
  bus.on('graph-ready', onGraphReady);

  return {
    render,
    dispose
  }

  function dispose() {
    clearLastScene();
    bus.off('graph-ready', onGraphReady);
  }

  function onMouseClick(e) {
    const clickTarget = e.target;
    if (!nodeContainer.contains(clickTarget)) return;

    let nodeId = getNodeIdFromUI(clickTarget);
    bus.fire('show-subreddit', nodeId);

    removeClass('hovered');
    removeClass('emphasized');

    const mainNode = nodes.get(nodeId);
    mainNode.classList.add('hovered');
    mainNode.classList.add('emphasized');
    graph.forEachLinkedNode(nodeId, function(otherNode, link) {
      const ui = nodes.get(otherNode.id);
      ui.classList.add('hovered');
      moveToFront(ui);

      const linkInfo = linkAnimator.getLinkInfo(link.id);
      if (linkInfo) {
        const linkUI = linkInfo.ui;
        linkUI.classList.add('hovered');
        moveToFront(linkUI);
      }
    });
    moveToFront(mainNode);
  }

  function moveToFront(el) {
    const {parentNode} = el;
    parentNode.removeChild(el);
    parentNode.appendChild(el);
  }

  function getNodeIdFromUI(el) {
    while (el) {
      if (el.classList.contains('node')) return el.id;
      el = el.parentNode;
    }
  }

  function removeClass(className) {
    const elements = scene.querySelectorAll(`.${className}`);
    if (elements) {
      for (let i = 0; i < elements.length; ++i) {
        elements[i].classList.remove(className);
      }
    }
  }

  function render(newGraph) {
    clearLastScene();
    graph = newGraph;

    layout = createAggregateLayout(graph, progress);
    
    layout.on('ready', drawLinks);

    nodes = new Map();

    graph.forEachNode(addNode);
    graph.on('changed', onGraphStructureChanged);

    cancelAnimationFrame(currentLayoutFrame);
    currentLayoutFrame = requestAnimationFrame(frame)
  }

  function onGraphReady(readyGraph) {
    if (readyGraph === graph) {
      layout.setGraphReady();
      progress.startLayout();
    }
  }

  function frame() {
    if (layout.step()) {
      currentLayoutFrame = requestAnimationFrame(frame)
    }
    updatePositions();
  }

  function onGraphStructureChanged(changes) {
    changes.forEach(change => {
      if (change.changeType === 'add' && change.node) {
        addNode(change.node);
      }
    })
  }

  function drawLinks() {
    progress.done();
    linkAnimator = createLinkAnimator(graph, layout, edgeContainer);
    document.addEventListener('click', onMouseClick);
  }

  function clearLastScene() {
    clear(nodeContainer);
    clear(edgeContainer);

    document.removeEventListener('click', onMouseClick);

    if (layout) layout.off('ready', drawLinks);
    if (graph) graph.off('changed', onGraphStructureChanged);
    if (linkAnimator) linkAnimator.dispose();
  }

  function clear(el) {
    while (el.lastChild) {
        el.removeChild(el.lastChild);
    }
  }

  function addNode(node) {
    const dRatio = node.data.size * 1.2; // (graph.maxDepth - node.data.depth)/graph.maxDepth;
    let pos = getNodePosition(node.id);
    if (node.data.depth === 0) {
      layout.pinNode(node);
    }

    const uiAttributes = getNodeUIAttributes(node.id, dRatio);
    layout.addNode(node.id, uiAttributes);

    const rectAttributes = {
      x: uiAttributes.x,
      y: uiAttributes.y,
      width: uiAttributes.width,
      height: uiAttributes.height,
      rx: uiAttributes.rx,
      ry: uiAttributes.ry,
      fill: 'white',
      'stroke-width': uiAttributes.strokeWidth, 
      stroke: '#aaa' // '#58585A'
    }
    const textAttributes = {
      'font-size': uiAttributes.fontSize,
      x: uiAttributes.px,
      y: uiAttributes.py
    }
    
    const rect = svg('rect', rectAttributes);
    const text = svg('text', textAttributes)
    text.text(node.id);

    const ui = svg('g', {
      class: 'node',
      id: node.id,
      transform: `translate(${pos.x}, ${pos.y})`
    });
    ui.appendChild(rect);
    ui.appendChild(text);

    nodeContainer.appendChild(ui);
    nodes.set(node.id, ui);
  }


  function getNodeUIAttributes(nodeId, dRatio) {
    const fontSize = 24 * dRatio + 12;
    const size = textMeasure(nodeId, fontSize);
    const width = size.totalWidth + size.spaceWidth * 6;
    const height = fontSize * 1.6;

    return {
      fontSize,
      width,
      height,
      x: -width/2,
      y: -height/2,
      rx: 15 * dRatio + 2,
      ry: 15 * dRatio + 2,
      px: -width/2 + size.spaceWidth*3,
      py: -height/2 + fontSize * 1.1,
      strokeWidth: 4 * dRatio + 1
    };
  }

  function updatePositions() {
    nodes.forEach((ui, nodeId) => {
      let pos = getNodePosition(nodeId)
      ui.attr('transform', `translate(${pos.x}, ${pos.y})`);
    });
  }

  function getNodePosition(nodeId) {
    return layout.getNodePosition(nodeId);
  }
}