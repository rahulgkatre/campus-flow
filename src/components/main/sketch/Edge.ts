import {Vector} from 'p5';
import { p5 } from './sketch';
import { Particle } from './Particle';

export class Edge {

  readonly start: Vector;
  readonly end: Vector;
  readonly repulsion: number;
  readonly L2R_ignoreProbability: number;
  R2L_ignoreProbability: number;

  constructor(start: Vector,end: Vector) {
    this.start = start;
    this.end = end;
    this.repulsion = 400;
    this.L2R_ignoreProbability = 0.0;
    this.R2L_ignoreProbability = 0.0;
  }
  isOnLeft(particle: Particle) {
    const startToP = p5.atan2(particle.position.y - this.start.y, particle.position.x - this.start.x);
    const pToEnd = p5.atan2(this.end.y - particle.position.y, this.end.x - particle.position.x);
    return startToP < pToEnd;
  }
  pushParticle(particle: Particle) {
    const left = this.isOnLeft(particle);
    const right = !left;
    if (left && p5.random() < this.L2R_ignoreProbability) {
      return;
    }
    if (right && p5.random() < this.R2L_ignoreProbability) {
      return;
    }
    const midpoint = Vector.add(this.start, this.end).div(2);
    const dist = midpoint.dist(particle.position);
    //console.log({midpoint, dist,});
    if (dist > 200) {
      return;
    }
    const push = Vector.sub(midpoint, particle.position).mult(-1).normalize().mult(this.repulsion / dist);
    particle.applyForce(push);
  }
}
