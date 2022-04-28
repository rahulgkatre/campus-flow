import { Vector } from 'p5';
import { Goal } from './Goal';
import { p5 } from './sketch';
import { VectorField } from './VectorField';

/**
 * this class represents an individual particle being simulated
 * a new particle is created whenever a student goes from one building to another
 * particles are destroyed then recreated while they are "waiting" in a building for their next schedule entry.
 */
export class Particle {
  static readonly maxSpeed = 1.5;
  static readonly RESISTANCE_TO_TURN = 0.1;
  static readonly MOVING_AVG_SIZE = 20;
  static readonly GOAL_REACHED_DIST = 10;
  static readonly MAX_CONFUSION_COUNT = 3;
  static readonly MIN_POS_STDDEV = 2;

  readonly id: number;
  readonly spawnTime: number;
  readonly start: Goal|null;
  readonly startName: string;
  readonly startPos: Vector;
  readonly goal: Goal;
  private readonly position: Vector;
  private goalPos: Vector;
  private readonly heading: Vector;

  private lifespan: number;

  private avgOtherParticle: Vector;
  private otherParticleCount: number;

  private movingAvgPositions: Vector[];
  private movingAvgHeadings: Vector[];
  private movingAvgIndex: number;
  private framesSameGoal: number;
  private timesGoalChanged: number;

  private curled: boolean;
  private curlDir: number;
  confusedCount: number;

  constructor(id: number, spawnTime: number, start: Goal | Vector, goal: Goal) {
    this.id = id;
    this.spawnTime = spawnTime;
    if (start instanceof Goal) {
      this.start = start;
      this.startName = start.name;
      this.startPos = start.closestPositionToGoal(goal);
    } else {
      this.start = null;
      this.startName = 'spawned';
      this.startPos = start;
    }
    this.goal = goal;
    this.position = this.startPos.copy();
    this.goalPos = goal.closestPosition(this.position);
    this.heading = Vector.sub(this.goalPos, this.position).normalize();

    this.lifespan = 0;

    // these variables are used to track other particles aroun this particle that need to be avoided
    this.avgOtherParticle = new Vector(0, 0);
    this.otherParticleCount = 0;

    // the below variables are used for maintaining moving averages to detect when particles have gotten stuck in lcocal minima in the field
    this.movingAvgPositions = [];
    this.movingAvgHeadings = [];
    this.movingAvgIndex = 0;
    this.framesSameGoal = 0;
    this.timesGoalChanged = 0;
    
    // this determines which direction a particle curls in when it gets stuck in a local minimum
    this.curled = false;
    this.curlDir = Math.PI/2 * Math.sign(p5.random()-0.5);

    // this is used to track how many times a particle has gotten stuck in a local minimum
    this.confusedCount = 0;
    this.resetMovingAvgPositions();
    this.resetMovingAvgHeadings();
  }
  resetMovingAvgPositions() {
    this.movingAvgPositions = Array(Particle.MOVING_AVG_SIZE);
    this.framesSameGoal = 0;
    for (let i = 0; i < Particle.MOVING_AVG_SIZE; i++) {
      this.movingAvgPositions[i] = this.position.copy().add(this.heading.copy().mult(i));
    }
    this.timesGoalChanged++;
  }
  resetMovingAvgHeadings() {
    this.movingAvgHeadings = Array(Particle.MOVING_AVG_SIZE);
    for (let i = 0; i < Particle.MOVING_AVG_SIZE; i++) {
      this.movingAvgHeadings[i] = this.heading.copy();
    }
  }
  evaluateForces(field: VectorField): boolean { // returns true if goal reached
    let distToGoal = this.position.dist(this.goalPos);
    // if the particle is near the goal, ensure that it's targetting the closest entry point
    if (distToGoal < Particle.GOAL_REACHED_DIST*20) {
      const tmp = this.goal.closestPosition(this.position);
      if (tmp !== this.goalPos) {
        this.goalPos = tmp;
        this.resetMovingAvgPositions();
        distToGoal = this.position.dist(this.goalPos);
      }
    }
    // if the particle has reached its goal, gotten stuck too many times, or gone off screen, tell the simulation the particle is to be destroyed
    if (distToGoal <= Particle.GOAL_REACHED_DIST || this.confusedCount > Particle.MAX_CONFUSION_COUNT || this.position.x < 0 || this.position.y < 0 || this.position.x > p5.width || this.position.y > p5.height) {
      this.heading.mult(0);
      if (distToGoal > Particle.GOAL_REACHED_DIST) { // this lets the simulator know that this particle was faulty and should not be used to compute travel time distributions
        this.confusedCount = Particle.MAX_CONFUSION_COUNT + 1;
      }
      return true;
    }
    let turnResistance = Particle.RESISTANCE_TO_TURN;

    // heading to avoid other particles
    const avoidOthersHeading = this.avgOtherParticle;

    // heading to avoid walls/follow the path/other field elements
    const fieldForce = field.getForce(this.position);
    const fieldMag = fieldForce.mag();
    fieldForce.setMag(Math.pow(fieldMag, 0.75));

    // heading to reach the goal
    const toGoalHeading = Vector.sub(this.goalPos, this.position).normalize();
    let goalEffect = 1.5;

    // heading to make sure we dont go into a wall (essentially doubles the field effect on particle heading)
    const fieldForceAtHeading = field.getForce(this.position.copy().add(toGoalHeading));
    fieldForceAtHeading.setMag(Math.pow(fieldForceAtHeading.mag(), 0.75));

    let fieldEffect = distToGoal > 100 ? 2 : (distToGoal > Particle.GOAL_REACHED_DIST*3 ? 1 : 0.5);

    // heading based on necessary curl based on the building (set to 0)
    const curlForce = this.goal.curlField.getForce(this.position);

    // determine if the goal and field are in opposite directions, this usually indicates a local minimum
    const angleClsoeTo180By = Math.abs(((toGoalHeading.angleBetween(fieldForceAtHeading) + Math.PI*2) % (Math.PI*2)) - Math.PI);
    if (angleClsoeTo180By < Math.PI/12) {
      curlForce.set(toGoalHeading.copy().rotate(this.curlDir).setMag(1));
    }

    // if there is relevant curl, then prioritize following the curl over following the field/goal
    const curlMag = curlForce.mag();
    let curlEffect = 0.0;
    if (curlMag >= 0.2) {
      goalEffect *= 0.05;
      fieldEffect *= 0.1;
      curlEffect = 0.5;
    }

    // take a weighted average of the desired headings before turning in the new direction
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
    this.lifespan++;

    const averagePos = this.movingAvgPositions.reduce((a,b) => Vector.add(a,b)).div(Particle.MOVING_AVG_SIZE);
    const stdDevPos = Math.sqrt(this.movingAvgPositions.map(pos => Vector.sub(pos,averagePos).magSq()).reduce((a,b) => a + b) / Particle.MOVING_AVG_SIZE);

    const avgHeading = this.movingAvgHeadings.reduce((a,b) => Vector.add(a,b)).div(Particle.MOVING_AVG_SIZE);
    const stdDevHeading = Math.sqrt(this.movingAvgHeadings.map(h => Math.pow(h.angleBetween(avgHeading), 2)).reduce((a,b) => a + b) / Particle.MOVING_AVG_SIZE);

    // formulas which determine if the particle is in a local minimum
    //  the particle must be alive for at least some amount of time
    //  the particles heading is changing rapidly
    //  the particles position is barely changing
    if ((this.framesSameGoal > Particle.MOVING_AVG_SIZE*3 && stdDevHeading >= p5.PI/3 && this.position.dist(this.goalPos) > Particle.GOAL_REACHED_DIST*3) || (this.lifespan > Particle.MOVING_AVG_SIZE*3 && (this.framesSameGoal > Particle.MOVING_AVG_SIZE*3 || this.timesGoalChanged > 20) && stdDevPos <= Particle.MIN_POS_STDDEV)) { // try to move 0.5 units per frame
      if (stdDevPos > Particle.MIN_POS_STDDEV) { // if the particle is simply spinning around, reset it's goal but don't increment the got stuck counter
        this.goalPos = this.goal.closestPosition(this.position, [this.goalPos]);
        this.resetMovingAvgPositions();
      } else {
        this.confusedCount++;
      }
    }

    // update the position based on the heading of the particle
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
    
    // draw an arrow from position to lookingAt
    // const lookingAt = Vector.add(this.position, this.heading.mult(7));
    // p5.line(this.position.x, this.position.y, lookingAt.x, lookingAt.y);
  }

  markGoalAsReached() {
    this.goal.markReachedByAt(this.id, this.spawnTime);
  }

  getX() {
    return this.position.x;
  }
  getY() {
    return this.position.y;
  }

}
