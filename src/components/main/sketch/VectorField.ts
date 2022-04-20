import { Vector } from 'p5';
import { p5 } from './sketch';

export class VectorField {
  readonly field: Vector[][];
  static readonly repulsion = 1.0;

  constructor(fieldDescriptor: string) {
    this.field = [];
    const lines = fieldDescriptor.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 0) {
        const fieldStrengths = line.split(' ').map(vecStr => vecStr.slice(1, -1).split(',').map(v => parseFloat(v))).map(v => p5.createVector(v[0], -v[1]).mult(VectorField.repulsion));
        this.field.push(fieldStrengths);
      }
    }
    // console.log(this.field);
  }
  forceAtPoint(point: Vector) {
    const yInd = Math.floor(point.y * this.field.length / (p5.height+1));
    const xInd = Math.floor(point.x * this.field[0].length / (p5.width+1));
    return this.field[p5.constrain(yInd, 0, this.field.length-1)][p5.constrain(xInd, 0, this.field[0].length-1)].copy();
  }
  draw() {
    // draw small arrows for each vector
    for (let y = 0; y < this.field.length; y++) {
      for (let x = 0; x < this.field[y].length; x++) {
        const vec = this.field[y][x].copy().mult(100);
        p5.stroke(255);
        p5.strokeWeight(1);
        p5.line(x * (p5.width+1) / this.field[0].length, y * (p5.height+1) / this.field.length, x * (p5.width+1) / this.field[0].length + vec.x, y * (p5.height+1) / this.field.length + vec.y);
        p5.strokeWeight(2);
        p5.line(x * (p5.width+1) / this.field[0].length, y * (p5.height+1) / this.field.length, x * (p5.width+1) / this.field[0].length + vec.x / 2, y * (p5.height+1) / this.field.length + vec.y / 2);
      }
    }
  }
}
