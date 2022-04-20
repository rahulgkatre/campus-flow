import { P5Instance } from "react-p5-wrapper";
import { Image, Vector } from "p5";
import { Particle } from "./Particle";
import { Goal } from "./Goal";
import basic_map_path from "assets/maps/basic/map.png";
import basic_map_field from "assets/maps/basic/map";
import { VectorField } from "./VectorField";

export let p5: P5Instance;
function setP5(p: P5Instance) {
  p5 = p;
}

const fieldDescriptor = basic_map_field;

export function sketch(p5: P5Instance) {
  setP5(p5);

  const particles: Particle[] = [];
  const goals: Goal[] = [];
  const vectorField: VectorField = new VectorField(fieldDescriptor);

  const NUM_PARTICLES = 0;

  let resetCounter = 0;

  const coc: Goal = new Goal([p5.createVector(55, 90), p5.createVector(230, 135)], p5.color(255, 0, 0));
  const culc: Goal = new Goal([p5.createVector(235, 370), p5.createVector(440, 420)], p5.color(0, 0, 255));
  goals.push(coc);
  goals.push(culc);

  let mapImage: Image;
  let backgroundImage: Image;

  let paused = false;

  function randomPos() {
    return p5.createVector(p5.random(0, p5.width), p5.random(0, p5.height));
    // return Vector.random2D().mult(p5.random()*p5.width/2,p5.random()*p5.height/2).add(p5.width/2,p5.height/2);
  }

  function randomParticle(pos?: Vector) {
    return new Particle(pos ?? randomPos(), p5.random(goals));
  }

  function reset() {
    particles.length = 0;

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(randomParticle());
    }
    
    p5.background(0);
  }

  p5.preload = () => {
    mapImage = p5.loadImage(basic_map_path);
  }

  p5.setup = () => {
    p5.createCanvas(mapImage.width, mapImage.height);

    mapImage.loadPixels();

    // setup backgorund image
    p5.background(0);
    p5.image(mapImage, 0, 0);
    // vectorField.draw(); // toggle comment this line to not draw vector field
    backgroundImage = p5.get();

    reset();
  }

  p5.updateWithProps = props => {
    if (props.resetCounter !== undefined) {
      if (resetCounter !== props.resetCounter) {
        reset();
      }
      resetCounter = props.resetCounter;
    }
    if (props.paused !== undefined) {
      paused = props.paused;
      p5.loop();
    }
  };

  function drawBackground() {
    p5.background(0);
    p5.image(backgroundImage, 0, 0);
  }

  p5.mousePressed = () => {
    if (p5.mouseX < 0 || p5.mouseX >= p5.width || p5.mouseY < 0 || p5.mouseY >= p5.height) {
      return;
    }
    if (mapImage.get(p5.mouseX, p5.mouseY).every(v => v === 255)) {
      return;
    }
    particles.push(randomParticle(p5.createVector(p5.mouseX, p5.mouseY)));
  };

  p5.mouseDragged = () => {
    if (p5.random() < 0.3) {
      return;
    }
    p5.mousePressed();
  }

  p5.draw = () => {
    drawBackground();
    
    if (!paused) {
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.resetOtherParticleAvoidance();
        for (const otherP of particles) {
          if (particle === otherP) {
            continue;
          }
          particle.avoidOther(otherP);
        }
        const reached = particle.evaluateForces(vectorField);
        if (reached) {
          particles.splice(i, 1);
          i--;
        }
      }
    }

    for (const particle of particles) {
      if (!paused) particle.update();
      particle.draw();
    }

    // draw mouse position next to mouse
    p5.stroke(255,0,0);
    p5.line(p5.mouseX, p5.mouseY, p5.mouseX+10, p5.mouseY);
    p5.line(p5.mouseX, p5.mouseY, p5.mouseX-10, p5.mouseY);
    p5.line(p5.mouseX, p5.mouseY, p5.mouseX, p5.mouseY+10);
    p5.line(p5.mouseX, p5.mouseY, p5.mouseX, p5.mouseY-10);
    // put text of mouse coordinates
    p5.fill(255,0,0);
    p5.text(`(${p5.mouseX},${p5.mouseY})`, p5.mouseX+10, p5.mouseY);

  };
}