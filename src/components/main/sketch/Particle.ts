import { Vector } from 'p5';
import { Goal } from './Goal';
import { p5 } from './sketch';
import { VectorField } from './VectorField';

export class Particle {
  static readonly maxSpeed = 1.5;
  static readonly RESISTANCE_TO_TURN = 0.1;
  static readonly MOVING_AVG_SIZE = 20;
  static readonly GOAL_REACHED_DIST = 10;
  static readonly MAX_CONFUSION_COUNT = 3;

  readonly id: number;
  readonly spawnTime: number;
  readonly start: Goal;
  readonly startPos: Vector;
  readonly goal: Goal;
  private readonly position: Vector;
  private goalPos: Vector;
  private readonly heading: Vector;

  private avgOtherParticle: Vector;
  private otherParticleCount: number;

  private movingAvgPositions: Vector[];
  private movingAvgHeadings: Vector[];
  private movingAvgIndex: number;
  private framesSameGoal: number;

  private curled: boolean;
  confusedCount: number;

  constructor(id: number, spawnTime: number, start: Goal, goal: Goal) {
    this.id = id;
    this.spawnTime = spawnTime;
    this.start = start;
    this.goal = goal;
    this.startPos = start.closestPosition(goal.randomPosition());
    this.position = this.startPos.copy();
    this.goalPos = goal.closestPosition(this.position);
    this.heading = Vector.sub(this.goalPos, this.position).normalize();
    this.avgOtherParticle = new Vector(0, 0);
    this.otherParticleCount = 0;
    this.movingAvgPositions = [];
    this.movingAvgHeadings = [];
    this.movingAvgIndex = 0;
    this.framesSameGoal = 0;
    this.curled = false;
    this.confusedCount = 0;
    this.resetMovingAvgPositions();
    this.resetMovingAvgHeadings();
  }
  resetMovingAvgPositions() {
    this.movingAvgPositions = Array(Particle.MOVING_AVG_SIZE);
    this.framesSameGoal = 0;
    for (let i = 0; i < Particle.MOVING_AVG_SIZE; i++) {
      this.movingAvgPositions[i] = this.position.copy();
    }
  }
  resetMovingAvgHeadings() {
    this.movingAvgHeadings = Array(Particle.MOVING_AVG_SIZE);
    for (let i = 0; i < Particle.MOVING_AVG_SIZE; i++) {
      this.movingAvgHeadings[i] = this.heading.copy();
    }
  }
  evaluateForces(field: VectorField): boolean { // returns true if goal reached
    // this.goalPos = this.goal.closestPosition(this.position);
    let distToGoal = this.position.dist(this.goalPos);
    if (distToGoal < Particle.GOAL_REACHED_DIST*20) {
      this.goalPos = this.goal.closestPosition(this.position);
      this.resetMovingAvgPositions();
      distToGoal = this.position.dist(this.goalPos);
    }
    if (distToGoal <= Particle.GOAL_REACHED_DIST || this.confusedCount > Particle.MAX_CONFUSION_COUNT) {
      this.heading.mult(0);
      return true;
    }
    let turnResistance = Particle.RESISTANCE_TO_TURN;

    const avoidOthersHeading = this.avgOtherParticle;//.normalize();

    const fieldForce = field.getForce(this.position);
    const fieldMag = fieldForce.mag();
    // console.log(Math.round(fieldForce.mag()*100)/100);
    fieldForce.setMag(Math.pow(fieldMag, 0.75));

    const toGoalHeading = Vector.sub(this.goalPos, this.position).normalize();

    let goalEffect = 1.5;

    const fieldForceAtHeading = field.getForce(this.position.copy().add(toGoalHeading));
    fieldForceAtHeading.setMag(Math.pow(fieldForceAtHeading.mag(), 0.75));

    let fieldEffect = distToGoal > 100 ? 2 : (distToGoal > Particle.GOAL_REACHED_DIST*3 ? 1 : 0.5);

    const curlForce = this.goal.curlField.getForce(this.position);
    const curlMag = curlForce.mag();
    let curlEffect = 0.0;
    if (curlMag >= 0.2 && distToGoal < Particle.GOAL_REACHED_DIST*20) {
      goalEffect *= 0.05;
      fieldEffect *= 0.1;
      curlEffect = 0.5;
      // console.log(distToGoal);
      // turnResistance = Math.pow(turnResistance, 0.3);
    //   if (!this.curled) {
    //     this.curled = true;
    //     this.heading.set(curlForce).normalize();
    //     // fieldForceAtHeading.set(curlForce);
    //   }
    // } else {
    //   this.curled = false;
    }

    const desiredHeading = new Vector(0,0)
        .add(toGoalHeading.mult(goalEffect))
        .add(avoidOthersHeading.mult(this.otherParticleCount*4.5))
        .add(fieldForce.mult(fieldEffect))
        .add(fieldForceAtHeading.mult(fieldEffect))
        .add(curlForce.mult(curlEffect))
        .normalize();
    this.heading.mult(turnResistance).add(desiredHeading.mult(1 - turnResistance)).normalize();
    return false;
  }
  resetOtherParticleAvoidance() {
    this.avgOtherParticle = new Vector(0, 0);
    this.otherParticleCount = 0;
  }
  avoidOther(otherParticle: Particle) {
    if (this.position.dist(otherParticle.position) < 10) {
      const vec = Vector.sub(this.position, otherParticle.position);
      this.avgOtherParticle.add(vec.div(vec.magSq()+0.00001));
      this.otherParticleCount++;
    }
  }
  update() {
    // if (this.movingAvgGoalDists.reduce((a,b) => a + b) / Particle.MOVING_AVG_SIZE < this.position.dist(this.goalPos)) {
    //   this.goalPos = this.goal.closestPosition(this.position);
    // }

    // const averagePos = this.movingAvgPositions.reduce((a,b) => Vector.add(a,b)).div(Particle.MOVING_AVG_SIZE);
    // const headingsFromAvgPos = this.movingAvgPositions.map(p => Vector.sub(p, averagePos).heading());
    // const headingAngles = this.movingAvgHeadings.map(h => {
    //   const angle = h.heading();
    //   return angle < 0 ? angle + Math.PI * 2 : angle;
    // });
    const avgHeading = this.movingAvgHeadings.reduce((a,b) => Vector.add(a,b)).div(Particle.MOVING_AVG_SIZE);
    const stdDevHeading = Math.sqrt(this.movingAvgHeadings.map(h => Math.pow(h.angleBetween(avgHeading), 2)).reduce((a,b) => a + b) / Particle.MOVING_AVG_SIZE);
    // const avgDistFromAvgPos = this.movingAvgPosition.map(p => p.dist(averagePos)).reduce((a,b) => a + b) / Particle.MOVING_AVG_SIZE;
    // console.log(stdDevHeading);
    if (this.framesSameGoal > Particle.MOVING_AVG_SIZE*3 && stdDevHeading >= p5.PI/3 && this.position.dist(this.goalPos) > Particle.GOAL_REACHED_DIST*3) { // try to move 0.5 units per frame
      // console.log('std dev of heading: ' + stdDevHeading);
      // console.log('avg: ' + avgHeading);
      this.goalPos = this.goal.closestPosition(this.position, [this.goalPos]);
      this.resetMovingAvgPositions();
      this.confusedCount++;
      // p5.noLoop();
    }

    this.position.add(this.heading.copy().setMag(Particle.maxSpeed));
    
    // update moving avg
    this.movingAvgPositions[this.movingAvgIndex] = this.position.copy();
    this.movingAvgHeadings[this.movingAvgIndex] = this.heading.copy();
    this.movingAvgIndex = (this.movingAvgIndex + 1) % Particle.MOVING_AVG_SIZE;
    this.framesSameGoal++;
  }
  draw() {
    p5.noStroke();
    p5.fill(this.goal.color);
    p5.circle(this.position.x, this.position.y, 5);
    p5.stroke(this.goal.color);
    // const lookingAt = Vector.add(this.position, this.heading.mult(7));
    // // draw an arrow from position to lookingAt
    // p5.line(this.position.x, this.position.y, lookingAt.x, lookingAt.y);
    // // p5.strokeWeight(2);
    // // p5.line(lookingAt.x, lookingAt.y, lookingAt.x + (lookingAt.x - this.position.x) * 0.5, lookingAt.y + (lookingAt.y - this.position.y) * 0.5);
    // // p5.line(lookingAt.x, lookingAt.y, lookingAt.x - (lookingAt.x - this.position.x) * 0.5, lookingAt.y - (lookingAt.y - this.position.y) * 0.5);
    // // p5.strokeWeight(1);
    // if (this.position.dist(this.goalPos) <= Particle.GOAL_REACHED_DIST) {
    //   p5.stroke([0,255,0]);
    // }
    // p5.line(this.position.x, this.position.y, this.goalPos.x, this.goalPos.y);
  }

  markGoalAsReached() {
    this.goal.markReachedByAt(this.id, this.spawnTime);
  }

}
