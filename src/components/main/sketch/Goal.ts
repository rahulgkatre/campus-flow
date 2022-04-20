import { Color, Vector } from 'p5';
import { Particle } from './Particle';
import { p5 } from './sketch';

export class Goal {
  readonly positions: Vector[];
  readonly color: Color;

  constructor(posArr: Vector[], color: Color) {
    this.positions = posArr;
    this.color = color;
  }
  closestPosition(particle: Particle) {
    let minDist = Number.MAX_VALUE;
    let minIndex = 0;
    for (let i = 0; i < this.positions.length; i++) {
      const dist = particle.position.dist(this.positions[i]);
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }
    return this.positions[minIndex].copy();
  }
  randomPosition() {
    return p5.random(this.positions).copy();
  }
}
