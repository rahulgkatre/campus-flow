import { P5Instance } from "react-p5-wrapper";
import { Image, Vector } from "p5";
import { Particle } from "./Particle";
import { Goal } from "./Goal";
import { VectorField } from "./VectorField";

import {field as map_field, buildings as map_buildings, img_path as map_img_path} from "assets/maps/campus/map";

import {schedule as particle_schedule} from "assets/schedules/campusdense7";

// create an exportable copy of the drawing instance
export let p5: P5Instance;
function setP5(p: P5Instance) {
  p5 = p;
  (window as any).p5 = p;
}

type ScheduleEntryJSON = [
  typeof map_buildings[number]['name'],
  number,
];

interface ParticleJSON {
  particle_class: "student" | "professor" | "faculty" | "other",
  particle_schedule: ScheduleEntryJSON[],
}

interface ScheduleJSON {
  num_particles: number,
  particles: ParticleJSON[],
}

const fieldDescriptor = map_field;
const buildings = map_buildings;
const scheduleJSON: ScheduleJSON = particle_schedule;

// determine the earliest an latest entries in the schedule to use as time jumps during simulation
const EARLIEST_SPAWN = (() => {
  let temp = scheduleJSON.particles.map(p => {
    return p.particle_schedule[0][1];
  }).reduce((a, b) => Math.min(a, b) as any,999999999999);
  return temp !== 999999999999 ? temp : 0;
})();

const LATEST_SPAWN = (() => {
  let temp = scheduleJSON.particles.map(p => {
    return p.particle_schedule[p.particle_schedule.length-1][1];
  }).reduce((a, b) => Math.max(a, b) as any, 0);
  return temp !== 0 ? temp : 999999999999;
})();

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
  let doAnalysisCounter = 0;
  let renderHeatmap = false;

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

  // these variables are used to track the travel time statistics for analysis
  const travel_times: number[] = [];
  const travel_time_map: Map<string, number[]> = new Map();
  
  // this is the heatmap for the simulation
  const travel_history: Set<number>[][] = [];
  const TRAVEL_HISTORY_SCALE = 3;
  let maxTravelHistory = 0;

  function randomPos() {
    return p5.createVector(p5.random(0, p5.width), p5.random(0, p5.height));
  }
  function randomParticle(pos?: Vector) {
    const startIndex = Math.floor(p5.random(goals.length));
    let endIndex = Math.floor(p5.random(goals.length));
    while (endIndex === startIndex) {
      endIndex = Math.floor(p5.random(goals.length));
    }
    return new Particle(Math.round(p5.random(100000,1000000)), TIME, pos || randomPos(), goals[endIndex]);
  }

  function READ_RAW_TIME(): number {
    return p5.frameCount / 60 * 1000;
  }

  /**
   * reset the simulation
   * destroy all particles
   * reset all internal state for each goal (the particles that have reached that goal etc)
   * reset statistics variables and the heatmap
   */
  function reset() {
    particles.length = 0;
    live_particle_ids.clear();
    completed_particle_ids.clear();
    goals.forEach(g => g.reset());

    lastTimeCheck = READ_RAW_TIME();
    TIME = EARLIEST_SPAWN - SIM_START_DELAY;

    travel_times.length = 0;
    travel_time_map.clear();

    travel_history.length = 0;
    for (let x = 0; x < p5.width / TRAVEL_HISTORY_SCALE; x++) {
      travel_history.push([]);
      for (let y = 0; y < p5.height / TRAVEL_HISTORY_SCALE; y++) {
        travel_history[x].push(new Set());
      }
    }
    maxTravelHistory = 0;

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
    goals.forEach(goal => {
      goal.draw();
    });
    backgroundImage = p5.get();

    reset();
  }

  // take in commands from the react host for this sketch
  p5.updateWithProps = props => {
    if (props.resetCounter !== undefined) {
      if (resetCounter !== props.resetCounter) {
        reset();
      }
      resetCounter = props.resetCounter;
    }
    if (props.doAnalysisCounter !== undefined) {
      if (doAnalysisCounter !== props.doAnalysisCounter) {
        periodicAnalysis();
      }
      doAnalysisCounter = props.doAnalysisCounter;
    }
    if (props.renderHeatmap !== undefined) {
      if (renderHeatmap !== props.renderHeatmap) {
        renderHeatmap = props.renderHeatmap;
      }
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

  function drawHeatMap() {
    p5.noStroke();
    travel_history.forEach((row, x) => {
      row.forEach((val, y) => {
        if (val.size > 0) {
          p5.fill(255, 0, 0, val.size / maxTravelHistory * 255);
          p5.circle(x*TRAVEL_HISTORY_SCALE, y*TRAVEL_HISTORY_SCALE, TRAVEL_HISTORY_SCALE);
        }
      });
    });
  }

  // assuming the schedule is empty, allow clicks to spawn new particles
  p5.mousePressed = () => {
    if (p5.mouseX < 0 || p5.mouseX >= p5.width || p5.mouseY < 0 || p5.mouseY >= p5.height) {
      return;
    }
    if (mapImage.get(p5.mouseX, p5.mouseY).every(v => v === 255)) {
      return;
    }
    if (scheduleJSON.num_particles > 0) {
      return;
    }
    particles.push(randomParticle(p5.createVector(p5.mouseX, p5.mouseY)));
  };

  p5.mouseDragged = () => {
    if (p5.random() < 0.6) {
      return;
    }
    p5.mousePressed();
  }

  // look through the schedule and find new particles to spawn
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
    if (live_particle_ids.size === 0 && minSpawnTime - SIM_START_DELAY > TIME) { // if there are no particles in simulation, jump forward in time such that the user does not have to wait for an empty simulation
      console.log(`TIME JUMP: ${postProcessTimeValue(TIME)[1]} -> ${postProcessTimeValue(minSpawnTime - SIM_START_DELAY)[1]}`);
      TIME = minSpawnTime - SIM_START_DELAY;
    }
  }

  // advance the internal time used by the simulation - this is scaled such that the TIME variable matches the units of the schedules (real time seconds)
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

  // iterate over the particles and update their heading based on other particles, the vector field, and their goal
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
      if (reached) { // particles that have reached their destination should be destroyed
        particle.markGoalAsReached();
        particles.splice(i, 1);
        live_particle_ids.delete(particle.id);
        const travel_time = TIME - particle.spawnTime;
        if (particle.confusedCount <= Particle.MAX_CONFUSION_COUNT && travel_time <= 2000) { // ensure that the particle was not stuck in local minima to avoid putting outliers into the travel time stats
          registerTravelTime(travel_time, particle.startName, particle.goal.name);
        } else if (travel_time > 2000) {
          console.log(`particle ${particle.id} took a long time: ${postProcessTimeValue(travel_time)[1]}\n\t${particle.startName} -> ${particle.goal.name}`);
        }
      }
    });
  }

  // update the position of each particle based on its computed heading
  // draw the particles
  function updateAndDrawParticles() {
    particles.forEach((particle) => {
      if (!paused) particle.update();
      particle.draw();
    });
  }

  // convert a TIME value into a hours:mins:secs string for human readability
  function postProcessTimeValue(time: number): [number,string] {
    const seconds = Math.round(time);
    const minutes = Math.floor(seconds / 60);
    const seconds_ = seconds % 60;
    const hours = Math.floor(minutes / 60);
    const minutes_ = minutes % 60;
    return [time,`${hours}:${minutes_ < 10 ? '0' : ''}${minutes_}:${seconds_ < 10 ? '0' : ''}${seconds_}`];
  }

  // update the travel time stats based on a particles travel time from point to point
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

  // analyze a list of travel times and get the min,max,avg,stdDev
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

  // analyze the global and building-building travel times and print the results
  function periodicAnalysis() {
    // data analysis on travel times
    getMinMaxMeanStdTimes(travel_times, true);

    travel_time_map.forEach((times, key) => {
      const [start,goal] = key.split("->");
      const [,minStr,,maxStr,,meanStr,,stdStr] = getMinMaxMeanStdTimes(times, false);
      console.log(`\t${start}->${goal}: [${minStr},  ${meanStr} ,${maxStr}] :: ${stdStr}`);
    });
  }

  // run analysis on each frame of the simulation
  // currently just a heatmap calculation
  function perFrameAnalysis() {
    if (p5.frameCount % 30 === 0) {
      return;
    }
    // find hot spots where there are a lot of particles <- done by incrementing a global heatmap of particle positions
    if (renderHeatmap) {
      particles.forEach((particle) => {
        if (particles.length > 100 && p5.random() < (1 - 100/particles.length)) {
          return; // skip some of the particles when there are many
        }
        const x = Math.round(p5.constrain(particle.getX()/TRAVEL_HISTORY_SCALE, 0, p5.width/TRAVEL_HISTORY_SCALE-1));
        const y = Math.round(p5.constrain(particle.getY()/TRAVEL_HISTORY_SCALE, 0, p5.height/TRAVEL_HISTORY_SCALE-1));
        travel_history[x][y].add(particle.id);
        if (travel_history[x][y].size > maxTravelHistory) {
          maxTravelHistory = travel_history[x][y].size;
        }
      });
    }
  }

  p5.draw = () => {
    if (!renderHeatmap) {
      drawBackground();
    } else {
      p5.background(255);
      drawHeatMap();
    }
    advanceTime();
    
    if (!paused) {
      spawnNewParticles();
      calculateAndApplyForces();
    }

    updateAndDrawParticles();

    perFrameAnalysis();


    // draw mouse position next to mouse
    p5.textAlign(p5.LEFT, p5.TOP);
    p5.stroke(255,0,0);
    p5.line(p5.mouseX, p5.mouseY, p5.mouseX+10, p5.mouseY);
    p5.line(p5.mouseX, p5.mouseY, p5.mouseX-10, p5.mouseY);
    p5.line(p5.mouseX, p5.mouseY, p5.mouseX, p5.mouseY+10);
    p5.line(p5.mouseX, p5.mouseY, p5.mouseX, p5.mouseY-10);
    // put text of mouse coordinates
    p5.fill(255,0,0);
    p5.text(`(${Math.round(p5.mouseX*10)/10},${Math.round(p5.mouseY*10)/10})`, p5.mouseX+10, p5.mouseY);

    // put a timestamp in the top left of the simulation
    const timestamptxt = postProcessTimeValue(TIME)[1];
    p5.fill(0,255,0);
    p5.noStroke();
    p5.text(timestamptxt, 5,5);
  };
}