import { Vector } from 'p5';
import { Goal } from './Goal';
import { p5 } from './sketch';
import { VectorField } from './VectorField';

export class Particle {
  static readonly maxSpeed = 1;
  static readonly accelReduction = 0.75;
  static readonly goalAttractionForce = 0.005;
  static readonly goalReachedFriction = 1.0;
  static readonly MOVING_AVG_SIZE = 10;
  static readonly GOAL_REACHED_DIST = 20;

  readonly goal: Goal;
  readonly position: Vector;
  velocity: Vector;
  accel: Vector;
  lastHighVelocity: Vector;
  highCount: number;
  goalPos: Vector;
  movingAvgGoalDists: number[];
  movingAvgIndex: number;
  movingAvgLength: number;
  // movingAvgDistToGoal: number;

  constructor(pos: Vector, goal: Goal) {
    this.goal = goal;
    this.position = pos;
    this.velocity = p5.createVector(0,0);
    this.accel = p5.createVector(0,0);
    this.lastHighVelocity = p5.createVector(0,0);
    this.highCount = 0;
    this.goalPos = goal.closestPosition(this);
    this.movingAvgGoalDists = [];
    this.movingAvgIndex = 0;
    this.movingAvgLength = 0;
    // this.movingAvgDistToGoal = 0;
    this.resetMovingAvg();
  }
  resetMovingAvg() {
    const goalDist = this.position.dist(this.goalPos);
    this.movingAvgGoalDists = Array(Particle.MOVING_AVG_SIZE).fill(goalDist);
    this.movingAvgLength = 0;
  }
  evaluateForces(field: VectorField): boolean {
    this.accel.mult(Particle.accelReduction);
    const distToGoal = this.position.dist(this.goalPos);
    if (distToGoal > Particle.GOAL_REACHED_DIST) {
      this.applyForce(field.forceAtPoint(this.position));
      const toGoal = Vector.sub(this.goalPos,this.position).normalize();
      const vec = field.forceAtPoint(Vector.add(this.position, toGoal.copy().setMag(this.velocity.mag()))).normalize().mult(0.5);
      toGoal.add(vec);
      this.accel.add(toGoal.mult(1/Particle.goalAttractionForce/distToGoal));
      return false;
    } else {
      // this.accel.mult(1 - Particle.goalReachedFriction);
      this.accel.set(this.velocity.copy().mult(-1));
      return true;
    }
  }
  avoidOther(otherParticle: Particle) {
    if (this.position.dist(otherParticle.position) < 5) {
      const awayVec = Vector.sub(this.position,otherParticle.position);
      this.applyForce(awayVec.normalize().mult(5));
    }
  }
  applyForce(force: Vector) {
    this.accel.add(force);
  }
  update() {

    // update moving avg
    this.movingAvgGoalDists[this.movingAvgIndex] = this.position.dist(this.goal.closestPosition(this));
    this.movingAvgIndex = (this.movingAvgIndex + 1) % Particle.MOVING_AVG_SIZE;
    this.movingAvgLength++;

    if (this.movingAvgGoalDists.reduce((a,b) => a + b) / Particle.MOVING_AVG_SIZE < this.position.dist(this.goalPos)) {
      this.goalPos = this.goal.closestPosition(this);
    }

    if (this.movingAvgLength > Particle.MOVING_AVG_SIZE && Math.max(...this.movingAvgGoalDists) - Math.min(...this.movingAvgGoalDists) <= Particle.MOVING_AVG_SIZE / 2) { // try to move 0.5 units per frame
      this.goalPos = this.goal.randomPosition();
      this.resetMovingAvg();
    }

    // this.accel.limit(0.1);
    this.velocity.add(this.accel.mult(1));
    this.velocity.limit(Particle.maxSpeed);
    // if (this.velocity.mag() < Particle.maxSpeed/3) {
    //   this.velocity.set(this.lastHighVelocity).div(this.highCount);
    // }
    // this.velocity.normalize().mult(2);
    this.position.add(this.velocity);
    if (this.velocity.mag() > Particle.maxSpeed/3) {
      this.lastHighVelocity.add(this.velocity);
      this.highCount++;
    }
    this.velocity.mult(0.2);
  }
  draw() {
    p5.noStroke();
    p5.fill(this.goal.color);
    p5.circle(this.position.x, this.position.y, 5);
    p5.stroke(this.goal.color);
    const lookingAt = Vector.add(this.position, this.velocity.copy().normalize().mult(10));
    // draw an arrow from position to lookingAt
    p5.line(this.position.x, this.position.y, lookingAt.x, lookingAt.y);
    p5.strokeWeight(2);
    p5.line(lookingAt.x, lookingAt.y, lookingAt.x + (lookingAt.x - this.position.x) * 0.5, lookingAt.y + (lookingAt.y - this.position.y) * 0.5);
    p5.line(lookingAt.x, lookingAt.y, lookingAt.x - (lookingAt.x - this.position.x) * 0.5, lookingAt.y - (lookingAt.y - this.position.y) * 0.5);
    p5.strokeWeight(1);
    if (this.position.dist(this.goalPos) <= Particle.GOAL_REACHED_DIST) {
      p5.stroke([0,255,0]);
    }
    p5.line(this.position.x, this.position.y, this.goalPos.x, this.goalPos.y);
  }
}
