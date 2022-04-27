import { P5Instance } from "react-p5-wrapper";
import { Image, Vector } from "p5";
import { Particle } from "./Particle";
import { Goal } from "./Goal";
import { VectorField } from "./VectorField";

import {field as map_field, buildings as map_buildings, img_path as map_img_path} from "assets/maps/campus/map";


export let p5: P5Instance;
function setP5(p: P5Instance) {
  p5 = p;
}

const fieldDescriptor = map_field;
const buildings = map_buildings;

export function sketch(p5: P5Instance) {
  setP5(p5);

  const particles: Particle[] = [];
  const goals: Goal[] = [];
  const vectorField: VectorField = new VectorField(fieldDescriptor);

  const NUM_PARTICLES = 0;

  let resetCounter = 0;

  const defaultColors = [
    p5.color(255, 0, 0),
    p5.color(0, 0, 255),
    p5.color(0, 255, 0),
    p5.color(255, 255, 0),
    p5.color(255, 0, 255),
    p5.color(0, 255, 255),
    p5.color(255, 255, 255),
  ];

  for (const building of buildings) {
    goals.push(new Goal(
        building.name,
        building.entryPoints.map(p => p5.createVector(...p)),
        building.curl,
        defaultColors.length > 0 ? defaultColors.shift()! : p5.color(p5.random(255), p5.random(255), p5.random(255))
      ));
  }

  let mapImage: Image;
  let backgroundImage: Image;

  let paused = false;

  function randomPos() {
    return p5.createVector(p5.random(0, p5.width), p5.random(0, p5.height));
    // return Vector.random2D().mult(p5.random()*p5.width/2,p5.random()*p5.height/2).add(p5.width/2,p5.height/2);
  }

  function randomParticle(pos?: Vector) {
    return new Particle(pos ?? randomPos(), p5.random(goals.slice(0,1)));
  }

  function reset() {
    particles.length = 0;

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(randomParticle());
    }
    
    p5.background(0);
  }

  p5.preload = () => {
    mapImage = p5.loadImage(map_img_path);
  }

  p5.setup = () => {
    const c = p5.createCanvas(mapImage.width, mapImage.height);
    const canvas = (c as any).canvas as HTMLCanvasElement;
    canvas.removeAttribute("style");
    canvas.classList.add("max-w-full");
    canvas.classList.add("max-h-full");


    mapImage.loadPixels();

    // setup backgorund image
    p5.background(0);
    p5.image(mapImage, 0, 0);
    vectorField.draw(); // toggle comment this line to not draw vector field
    // goals[0].curlField.draw();
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
    p5.text(`(${Math.round(p5.mouseX*10)/10},${Math.round(p5.mouseY*10)/10})`, p5.mouseX+10, p5.mouseY);

  };
}