export default function createInterpolateLayout(from, to, duration = 100) {
  let t = 0;
  let elapsed = 0;

  return {
    step,
    getNodePosition,
    done,
  };

  function step() {
    elapsed += 1;
  }

  function done() {
    return elapsed > duration;
  }

  function getNodePosition(nodeId) {
    t = ease(elapsed/duration);
    let fromPos = from.getNodePosition(nodeId);
    let toPos = to.getNodePosition(nodeId);

    return {
      x: fromPos.x * (1 - t) + toPos.x * t,
      y: fromPos.y * (1 - t) + toPos.y * t
    }
  }

  function ease(t) {
    return t*(2-t);
  }
}