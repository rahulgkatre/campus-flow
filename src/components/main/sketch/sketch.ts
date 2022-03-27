import { P5Instance } from "react-p5-wrapper";
import { Vector } from "p5";
import { Particle } from "./Particle";
import { Edge } from "./Edge";

export let p5: P5Instance;
function setP5(p: P5Instance) {
  p5 = p;
}

export function sketch(p5: P5Instance) {
  setP5(p5);

  const particles: Particle[] = [];
  const edges: Edge[] = [];

  const NUM_PARTICLES = 100;

  let resetCounter = 0;

  let coc: Vector;
  let culc: Vector;

  function randomPos() {
    return Vector.random2D().mult(p5.random()*p5.width/2,p5.random()*p5.height/2).add(p5.width/2,p5.height/2);
  }

  function reset() {
    particles.length = 0;
    edges.length = 0;

    coc.mult(0).add(randomPos());
    culc.mult(0).add(randomPos());

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(new Particle(randomPos(),p5.random() < 0.5 ? coc : culc));
      //console.log(particles[i].position);
    }
    
    edges.push(new Edge(randomPos(), randomPos()));
    
    p5.background(0);
  }

  p5.setup = () => {
    p5.createCanvas(600,600);

    coc = p5.createVector(80/300*p5.width,80/300*p5.height);
    culc = p5.createVector(250/300*p5.width,140/300*p5.height);
    //console.log(coc,culc);

    reset();
  }

  p5.updateWithProps = props => {
    if (props.resetCounter !== undefined) {
      if (resetCounter !== props.resetCounter) {
        reset();
      }
      resetCounter = props.resetCounter;
    }
  };

  function drawBackground() {
    p5.background(0);
    p5.rectMode(p5.CENTER);
    p5.noStroke();
    p5.fill(255,0,0);
    p5.rect(coc.x,coc.y,5,5);
    p5.fill(0,255,0);
    p5.rect(culc.x,culc.y,5,5);
  }

  p5.mousePressed = () => {
    if (p5.mouseX < 0 || p5.mouseX >= p5.width || p5.mouseY < 0 || p5.mouseY >= p5.height) {
      return;
    }
    particles.push(new Particle(p5.createVector(p5.mouseX,p5.mouseY),p5.random() < 0.5 ? coc : culc));
  };

  p5.draw = () => {
    drawBackground();
    
    for (const particle of particles) {
      particle.update();
      //console.log(particle);
      p5.noStroke();
      if (particle.goal === coc) {
        p5.fill(255,0,0);
      } else {
        p5.fill(0,255,0);
      }
      p5.circle(particle.position.x, particle.position.y, 5);
      particle.resetAccel();
    }
    for (const particle of particles) {
      for (const otherP of particles) {
        if (particle === otherP) {
          continue;
        }
        particle.avoidOther(otherP);
      }
    }
    
    for (const edge of edges) {
      //console.log(edge);
      p5.stroke(0,0,255);
      p5.line(edge.start.x, edge.start.y, edge.end.x, edge.end.y);
      for (const particle of particles) {
        edge.pushParticle(particle);
      }
    }
  };
}