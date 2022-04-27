import { Color, Vector } from 'p5';
import { p5 } from './sketch';
import { VectorField } from './VectorField';

export class Goal {
  readonly name: string;
  readonly positions: Vector[];
  readonly curlField: VectorField;
  readonly color: Color;
  readonly reachedParticleIDs: Map<number,Set<number>>;

  constructor(name: string, posArr: Vector[], curlStr: string, color: Color) {
    this.name = name;
    this.positions = posArr;
    this.curlField = new VectorField(curlStr);
    this.color = color;
    this.reachedParticleIDs = new Map();
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
  markReachedByAt(particleID: number, spawnTime: number) {
    if (!this.reachedParticleIDs.has(particleID)) {
      this.reachedParticleIDs.set(particleID, new Set());
    }
    this.reachedParticleIDs.get(particleID)!.add(spawnTime);
  }
  beenReachedByAt(particleID: number, spawnTime: number) {
    if (!this.reachedParticleIDs.has(particleID)) {
      return false;
    }
    return this.reachedParticleIDs.get(particleID)!.has(spawnTime);
  }
  reset() {
    this.reachedParticleIDs.clear();
  }
  draw() {
    // p5.beginShape();
    const avgPos = p5.createVector(0, 0);
    for (const pos of this.positions) {
      // p5.vertex(pos.x, pos.y);
      avgPos.add(pos);
    }
    avgPos.div(this.positions.length);
    
    let labelPos = avgPos.copy();
    let windowSize = 75;
    const negativeHalfWindowVec = p5.createVector(-windowSize/2, -windowSize/2);
    let numWhite = 0;
    let tries = 0;
    while (numWhite < 0.99*windowSize*windowSize && tries < 25) {
      labelPos.add(negativeHalfWindowVec);
      const im = p5.get(labelPos.x, labelPos.y, windowSize, windowSize);
      const avgWhiteVec = p5.createVector(0, 0);
      for (let x = 0; x < windowSize; x++) {
        for (let y = 0; y < windowSize; y++) {
          const c = im.get(x, y);
          if (c[0] === 255 && c[1] === 255 && c[2] === 255) {
            avgWhiteVec.add(p5.createVector(x, y));
            numWhite++;
          }
        }
      }
      if (numWhite <= 20) {
        return;
      }
      avgWhiteVec.div(numWhite);
      labelPos.add(avgWhiteVec);
      tries++;
    }

    const color = p5.lerpColor(this.color, p5.color(0,0,0), 0.5);
    p5.stroke(color);
    p5.strokeWeight(1);
    p5.noFill();
    // p5.endShape(p5.CLOSE);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.text(this.name, labelPos.x, labelPos.y);
  }
}
