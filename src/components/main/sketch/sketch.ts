import { P5Instance } from "react-p5-wrapper";
import { Image } from "p5";
import { Particle } from "./Particle";
import { Goal } from "./Goal";
import { VectorField } from "./VectorField";

import {field as map_field, buildings as map_buildings, img_path as map_img_path} from "assets/maps/campus/map";

import {schedule as particle_schedule} from "assets/schedules/campus4";

export let p5: P5Instance;
function setP5(p: P5Instance) {
  p5 = p;
  (window as any).p5 = p;
}

const fieldDescriptor = map_field;
const buildings = map_buildings;
const scheduleJSON = particle_schedule;

const EARLIEST_SPAWN = scheduleJSON.particles.map(p => {
  return p.particle_schedule[0][1];
}).reduce((a, b) => Math.min(a, b) as any);

const LATEST_SPAWN = scheduleJSON.particles.map(p => {
  return p.particle_schedule[p.particle_schedule.length-1][1];
}).reduce((a, b) => Math.max(a, b) as any);

export function sketch(p5: P5Instance) {
  setP5(p5);
  
  /**
   * The ratio of simulation frames to real seconds
   * 1: 1ms sim -> 1s real
   * 2: 2ms sim -> 1s real
   */
  const SIMULATION_SPEED_FACTOR = 35;
  const SIM_START_DELAY = 500/SIMULATION_SPEED_FACTOR;

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

  const particles: Particle[] = [];
  const live_particle_ids: Set<number> = new Set();
  const completed_particle_ids: Set<number> = new Set();
  const goals = buildings.map(building => {
    return new Goal(
      building.name,
      building.entryPoints.map(p => p5.createVector(...p)),
      building.curl,
      defaultColors.length > 0 ? defaultColors.shift()! : p5.color(p5.random(255), p5.random(255), p5.random(255))
    );
  });
  const goal_map: ReadonlyMap<string, Goal> = new Map(
    goals.map(g => [g.name, g])
  );
  const vectorField: VectorField = new VectorField(fieldDescriptor);

  let mapImage: Image;
  let backgroundImage: Image;

  let paused = false;

  let timer__wasPaused = false;
  let lastTimeCheck = 0;
  let TIME = 0;

  const travel_times: number[] = [];
  const travel_time_map: Map<string, number[]> = new Map();

  // function randomPos() {
  //   return p5.createVector(p5.random(0, p5.width), p5.random(0, p5.height));
  //   // return Vector.random2D().mult(p5.random()*p5.width/2,p5.random()*p5.height/2).add(p5.width/2,p5.height/2);
  // }

  // function randomParticle(pos?: Vector) {
  //   return new Particle(Math.round(p5.random(100000,1000000)), TIME, pos ?? randomPos(), p5.random(goals.slice(0,1)));
  // }

  function READ_RAW_TIME(): number {
    return p5.frameCount / 60 * 1000;
  }

  function reset() {
    particles.length = 0;
    // particles.length = scheduleJSON.num_particles;
    live_particle_ids.clear();
    completed_particle_ids.clear();
    goals.forEach(g => g.reset());

    lastTimeCheck = READ_RAW_TIME();
    TIME = EARLIEST_SPAWN - SIM_START_DELAY;
    // console.log(EARLIEST_SPAWN,TIME);

    travel_times.length = 0;

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
    // vectorField.draw(); // toggle comment this line to not draw vector field
    // goals[0].curlField.draw();
    goals.forEach(goal => {
      goal.draw();
    });
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
    // particles.push(randomParticle(p5.createVector(p5.mouseX, p5.mouseY)));
  };

  p5.mouseDragged = () => {
    if (p5.random() < 0.3) {
      return;
    }
    p5.mousePressed();
  }

  function spawnNewParticles() {
    let minSpawnTime = LATEST_SPAWN;
    for (let i = 0; i < scheduleJSON.particles.length; i++) {
      if (live_particle_ids.has(i) || completed_particle_ids.has(i)) {
        continue;
      }
      const newParticleData = scheduleJSON.particles[i];
      let schedIndex = 0;
      const fullSched = newParticleData.particle_schedule;
      let spawnTime = fullSched[schedIndex][1];
      let startBuilding = goal_map.get(fullSched[schedIndex][0])!;
      while (schedIndex < fullSched.length - 1 && goal_map.get(fullSched[schedIndex + 1][0])!.beenReachedByAt(i, spawnTime)) {
        schedIndex++;
        spawnTime = fullSched[schedIndex][1];
        startBuilding = goal_map.get(fullSched[schedIndex][0])!;
      }
      if (schedIndex === fullSched.length - 1) {
        completed_particle_ids.add(i);
        continue;
      }
      if (spawnTime > TIME) {
        minSpawnTime = Math.min(minSpawnTime, spawnTime) as any;
        continue;
      }
      const goal = goal_map.get(fullSched[schedIndex + 1][0])!;
      const newParticle = new Particle(
        i,
        spawnTime,
        startBuilding,
        goal,
      );
      // console.log(`spawning particle ${newParticle.id}@${Math.floor(TIME)}/${spawnTime}\n\t${startBuilding.name} -> ${newParticle.goal.name}`);
      particles.push(newParticle);
      live_particle_ids.add(i);
    }
    if (live_particle_ids.size === 0 && minSpawnTime - SIM_START_DELAY > TIME) {
      console.log(`TIME JUMP: ${TIME} -> ${minSpawnTime - SIM_START_DELAY}`);
      TIME = minSpawnTime - SIM_START_DELAY;
    }
  }

  function advanceTime() {
    // console.log(TIME);
    if (paused) {
      timer__wasPaused = true;
      return;
    }
    if (timer__wasPaused) {
      timer__wasPaused = false;
      lastTimeCheck = READ_RAW_TIME();
    }
    const now = READ_RAW_TIME();
    TIME += (now - lastTimeCheck) / SIMULATION_SPEED_FACTOR;
    lastTimeCheck = now;
  }

  function calculateAndApplyForces() {
    particles.forEach((particle, i) => {
      particle.resetOtherParticleAvoidance();
      particles.forEach((otherParticle) => {
        if (particle === otherParticle) {
          return;
        }
        particle.avoidOther(otherParticle);
      });
      const reached = particle.evaluateForces(vectorField);
      if (reached) {
        particle.markGoalAsReached();
        particles.splice(i, 1);
        live_particle_ids.delete(particle.id);
        const travel_time = TIME - particle.spawnTime;
        if (particle.confusedCount <= Particle.MAX_CONFUSION_COUNT && travel_time <= 2000) {
          registerTravelTime(travel_time, particle.start.name, particle.goal.name);
          doAnalysisPerFrame();
        } else {
          console.log(`particle ${particle.id} took a long time: ${postProcessTimeValue(travel_time)[1]}\n\t${particle.start.name} -> ${particle.goal.name}`);
        }
        // console.log(`particle ${particle.id} reached goal ${particle.goal.name} at ${Math.floor(TIME)}`);
      }
    });
  }

  function updateAndDrawParticles() {
    particles.forEach((particle) => {
      if (!paused) particle.update();
      particle.draw();
    });
  }

  function postProcessTimeValue(time: number): [number,string] {
    const seconds = Math.round(time);
    const minutes = Math.floor(seconds / 60);
    const seconds_ = seconds % 60;
    return [time,`${minutes}:${seconds_ < 10 ? "0" : ""}${seconds_}`];
  }

  function registerTravelTime(travel_time: number, start: string, goal: string) {
    const key = `${start}->${goal}`;
    const entry = travel_time_map.get(key);
    if (entry === undefined) {
      travel_time_map.set(key, [travel_time]);
    } else {
      entry.push(travel_time);
    }
    travel_times.push(travel_time);
  }

  function getMinMaxMeanStdTimes(times: number[], print = false) {
    const [min,minStr] = postProcessTimeValue(Math.min(...times));
    const [max,maxStr] = postProcessTimeValue(Math.max(...times));
    const [mean,meanStr] = postProcessTimeValue(times.reduce((a, b) => a + b, 0) / times.length);
    const [std,stdStr] = postProcessTimeValue(Math.sqrt(times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length));
    if (print) {
      console.log(`min: ${minStr}, max: ${maxStr}, mean: ${meanStr}, std: ${stdStr}`);
    }
    return [min,minStr,max,maxStr,mean,meanStr,std,stdStr];
  }

  function doAnalysisPerFrame() {
    // find hot spots where there are a lot of particles
    
    // data analysis on travel times
    getMinMaxMeanStdTimes(travel_times, true);

    travel_time_map.forEach((times, key) => {
      const [start,goal] = key.split("->");
      const [,minStr,,maxStr,,meanStr,,stdStr] = getMinMaxMeanStdTimes(times, false);
      console.log(`\t${start}->${goal}: [${minStr},  ${meanStr} ,${maxStr}] :: ${stdStr}`);
    });

    // console.log(travel_times);
  }

  p5.draw = () => {
    drawBackground();
    advanceTime();
    
    if (!paused) {
      spawnNewParticles();
      calculateAndApplyForces();
    }

    updateAndDrawParticles();

    if (p5.frameCount % 3000 === 0) {
      console.log(`TIME: ${postProcessTimeValue(TIME).join(" - ")}`);
      // doAnalysisPerFrame();
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