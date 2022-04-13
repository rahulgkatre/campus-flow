import { Color, Vector } from 'p5';
import { Goal } from './Goal';
import { p5 } from './sketch';

export class Particle {
  readonly goal: Goal;
  readonly position: Vector;
  velocity: Vector;
  accel: Vector;

  constructor(pos: Vector, goal: Goal) {
    this.goal = goal;
    this.position = pos;
    this.velocity = p5.createVector(0,0);
    this.accel = p5.createVector(0,0);
  }
  resetAccel() {
    this.accel.mult(0.75);
    const goalPos = this.goal.closestPosition(this);
    if (this.position.dist(goalPos) > 20) {
      const toGoal = Vector.sub(goalPos,this.position).normalize();
      this.accel.add(toGoal.mult(0.000005));
    } else {
      // this.accel.mult(0.0);
    }
  }
  avoidOther(otherParticle: Particle) {
    if (this.position.dist(otherParticle.position) < 10) {
      const awayVec = Vector.sub(this.position,otherParticle.position);
      this.accel.add(Vector.normalize(awayVec).mult(10));
    }
  }
  applyForce(force: Vector) {
    this.accel.add(force);
  }
  update() {
    this.accel.limit(0.1);
    this.velocity.add(this.accel);
    this.velocity.limit(1);
    // this.velocity.normalize().mult(2);
    this.position.add(this.velocity);  
  }
  draw() {
    p5.noStroke();
    p5.fill(this.goal.color);
    p5.circle(this.position.x, this.position.y, 5);
  }
}
