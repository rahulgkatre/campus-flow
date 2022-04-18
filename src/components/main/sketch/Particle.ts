import { Vector } from 'p5';
import { Goal } from './Goal';
import { p5 } from './sketch';

export class Particle {
  static readonly maxSpeed = 1;
  static readonly accelReduction = 0.05;
  static readonly goalAttractionForce = 0.0005;
  static readonly goalReachedFriction = 1.0;

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
    this.accel.mult(Particle.accelReduction);
    const goalPos = this.goal.closestPosition(this);
    if (this.position.dist(goalPos) > 20) {
      const toGoal = Vector.sub(goalPos,this.position).normalize();
      this.accel.add(toGoal.mult(Particle.goalAttractionForce*this.position.dist(goalPos)));
    } else {
      this.accel.mult(1 - Particle.goalReachedFriction);
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
    // this.accel.limit(0.1);
    this.velocity.add(this.accel.mult(1));
    this.velocity.limit(Particle.maxSpeed);
    // this.velocity.normalize().mult(2);
    this.position.add(this.velocity);
    this.velocity.mult(0.1);
  }
  draw() {
    p5.noStroke();
    p5.fill(this.goal.color);
    p5.circle(this.position.x, this.position.y, 5);
    const goalPos = this.goal.closestPosition(this);
    if (this.position.dist(goalPos) > 20) {
      p5.stroke(this.goal.color);
    } else {
      p5.stroke([0,255,0]);
    }
    p5.line(this.position.x, this.position.y, goalPos.x, goalPos.y);
  }
}
