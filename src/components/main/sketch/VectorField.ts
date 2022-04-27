import { Vector } from 'p5';
import { p5 } from './sketch';

export class VectorField {
  readonly field: Vector[][];
  static readonly repulsion = 1.0;
  readonly hasField: boolean;

  constructor(fieldDescriptor: string) {
    this.field = [];
    this.hasField = !!(fieldDescriptor?.trim());
    if (this.hasField) {
      const lines = fieldDescriptor.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length > 0) {
          const fieldStrengths = line.split(' ').map(vecStr => vecStr.slice(1, -1).split(',').map(v => parseFloat(v))).map(v => p5.createVector(v[0], -v[1]).mult(VectorField.repulsion));
          this.field.push(fieldStrengths);
        }
      }
    }
    // console.log(this.field);
  }
  getForce(point: Vector) {
    if (!this.hasField) {
      return p5.createVector(0, 0);
    }
    const yInd = Math.floor(point.y * this.field.length / (p5.height+1));
    const xInd = Math.floor(point.x * this.field[0].length / (p5.width+1));
    return this.field[p5.constrain(yInd, 0, this.field.length-1)][p5.constrain(xInd, 0, this.field[0].length-1)].copy();
  }
  draw() {
    // draw small arrows for each vector
    const incr = 5;
    const avgVector = p5.createVector(0, 0);
    const maxVector = p5.createVector(0, 0);
    const maxVecLoc = p5.createVector(0, 0);
    let count = 0;
    for (let x = 0; x < p5.width; x++) {
      for (let y = 0; y < p5.height; y++) {
        const vec = this.getForce(new Vector(x,y));
        avgVector.add(vec);
        count++;
        if (vec.mag() > maxVector.mag()) {
          maxVector.set(vec);
          maxVecLoc.set(x, y);
        }
        if (x%incr === 0 && y%incr === 0) {
          vec.normalize().mult(incr*0.7);
          p5.stroke(255);
          p5.strokeWeight(incr/8);
          p5.line(x, y, x + vec.x, y + vec.y);
          p5.strokeWeight(incr/3);
          p5.point(x, y);
        }
      }
    }
    avgVector.div(count);
    // console.log(avgVector);
    // console.log(maxVector, maxVecLoc);
  }
}
