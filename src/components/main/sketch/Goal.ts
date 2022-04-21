import { Color, Vector } from 'p5';
import { Particle } from './Particle';
import { p5 } from './sketch';
import { VectorField } from './VectorField';

export class Goal {
  readonly name: string;
  readonly positions: Vector[];
  readonly curlField: VectorField;
  readonly color: Color;

  constructor(name: string, posArr: Vector[], curlStr: string, color: Color) {
    this.name = name;
    this.positions = posArr;
    this.curlField = new VectorField(curlStr);
    this.color = color;
  }
  closestPosition(particlePos: Vector, exclude?: Vector[]): Vector {
    let minDist = Number.MAX_VALUE;
    let minIndex = 0;
    for (let i = 0; i < this.positions.length; i++) {
      if (exclude && exclude.find(e => e.equals(this.positions[i]))) {
        continue;
      }
      const dist = particlePos.dist(this.positions[i]);
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
