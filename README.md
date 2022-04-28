# CX 4230 - Group 1 - Spring 2022 - Campus Flow
## [Live Simulation](https://github.gatech.edu/pages/cx4230-sp22-group1/campus-flow/)
## Relevant Code
This repository contains code for a webapp to render the simulation of pedestrian flow on Georgia Tech's campus.
### Field generation
The potential fields are generated using python scripts in the `preprocessing` folder. The `.ipynb` files can be ignored as those were used for testing and visual generation. The `map_*_element.py` files contain much of the math done for field generation.
The generated fields are encoded into typescript files which can be directly imported into simulation. The source maps and generated files can be found within the subdirectories of the `src/assets/maps/` folder.
### Schedule generation
The schedules were pre-generated using python sripts in the `schedule` folder. The generation was heavily parametrized to ease the creation of new schedules for different maps and different parameters.
The generated schedules are encoded into typescript files which can be directly imported into simulation. The generated files can be found within the `src/assets/schedules` folder.
### Simulation
The main code for simulations is in typescript and runs in the frontend of a web application. The relevant code is in the `src/components/main/sketch` folder. Most of the other code in the `src` folder is simply boilerplate for the website.
The `sketch.ts` file contains the actual code that imports map/schedule data before setting up and running the simulator.
The `VectorField.ts` file contains code for reading in a vector field from the generated code.
The `Goal.ts` file contains code for buildings in the simulation which are the goals for each particle as they move through the map.
The `Particle.ts` file contains code for the particles in the simulation. This is where particles will measure the field force and other factors that affect their heading before making a movement to reach their goal.