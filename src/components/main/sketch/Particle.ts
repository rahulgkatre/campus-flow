import {Vector} from 'p5';
import { p5 } from './sketch';

export class Particle {
  readonly goal: Vector;
  readonly position: Vector;
  velocity: Vector;
  accel: Vector;

  constructor(pos: Vector, goal: Vector) {
    this.goal = goal;
    this.position = pos;
    this.velocity = p5.createVector(0,0);
    this.accel = p5.createVector(0,0);
  }
  resetAccel() {
    this.accel.mult(0);
    if (this.position.dist(this.goal) > 20) {
      const toGoal = Vector.sub(this.goal,this.position).normalize();
      this.accel.add(toGoal.mult(1));
    }
  }
  avoidOther(otherParticle: Particle) {
    if (this.position.dist(otherParticle.position) < 10) {
      const awayVec = Vector.sub(this.position,otherParticle.position).normalize();
      this.accel.add(awayVec.mult(10));
    }
  }
  addForce(force: Vector) {
    this.accel.add(force);
  }
  update() {
    this.velocity.add(this.accel);
    this.velocity.normalize().mult(2);
    this.position.add(this.velocity);  
  }
}
