import { Vector } from 'p5';
import { p5 } from './sketch';
import { Particle } from './Particle';

export class VectorField {
  readonly field: Vector[][];
  readonly repulsion: number;
  

  constructor(fieldDescriptor: string) {
    this.repulsion = 1;
    this.field = [];
    const lines = fieldDescriptor.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 0) {
        const fieldStrengths = line.split(' ').map(vecStr => vecStr.slice(1, -1).split(',').map(v => parseFloat(v))).map(v => p5.createVector(v[0], v[1]));
        this.field.push(fieldStrengths);
      }
    }
    // console.log(this.field);
  }
  pushParticle(particle: Particle) {
    const yInd = Math.floor(particle.position.y * this.field.length / (p5.height+1));
    const xInd = Math.floor(particle.position.x * this.field[0].length / (p5.width+1));
    const fieldForce = this.field[p5.constrain(yInd, 0, this.field.length-1)][p5.constrain(xInd, 0, this.field[0].length-1)];
    particle.applyForce(fieldForce.copy().mult(this.repulsion));
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
