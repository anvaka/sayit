export class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  static sub(a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
  }
  static dist(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  normalize() {
    let l = Math.sqrt(this.x * this.x + this.y * this.y);
    if (l === 0)
      l = 0.0001;
    this.x /= l;
    this.y /= l;
  }
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  add(other) {
    this.x += other.x;
    this.y += other.y;
  }
  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
  }
  div(scalar) {
    this.x /= scalar;
    this.y /= scalar;
  }
  mult(scalar) {
    this.x *= scalar;
    this.y *= scalar;
  }
  limit(maxMag) {
    let mag = this.mag();
    if (mag > maxMag) {
      this.x *= maxMag / mag;
      this.y *= maxMag / mag;
    }
  }
  distanceTo(other) {
    let dx = this.x - other.x;
    let dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}