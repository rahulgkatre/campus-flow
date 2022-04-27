import json
import os
import random

#Start and end time for simulation to run
start_time = 0
end_time = 86400

#The various buildings, categorized by type
#housing = ["North Avenue North", "North Avenue South", "North Avenue East", "North Avenue West", "Towers Residence Hall", "Glenn Residence Hall"]
#housing = ["Housing1", "Housing2"]
#housing = ["culc"]
housing = []

#borders = ["5th Street Bridge", "North Avenue Bridge", "Centennial Olympic Park Drive", "10th Street"]
#borders = ["Border1", "Border2"]
borders = ["NorthExit", "EastExit", "SouthExit", "WestExit"]

if len(borders) == 0:
	borders = housing
if len(housing) == 0:
	housing = borders

#buildings = ["CULC", "Skiles", "Georgia Tech Tower", "CoC", "Howey", "Klaus", "Van Leer", "Georgia Tech Library", "Student Center"]
#buildings = ["Building1", "Building2"]
#buildings = ["coc"]
buildings = ["Ferst", "Student Center", "Skiles", "CulcLibrary", "VanLeer", "IndustrialDesign", "BungerHenry"]

#other = ["Bobby Dodd Stadium"]
#other = ["Other1", "Other2"]
other = []

if len(other) == 0:
	other = buildings
if len(buildings) == 0:
	buildings = other

objects = [housing, borders, buildings, other]

#The different classes of particles.
#Each key represents a different class of particles.
#Each value is a list consisting of a boolean, which determines if that class
#is being used in the simulation, a number ranging from 0-1, which determines
#the percentage of particles in each class for automatic particle class generation,
#and another number, which represents the number of particles in each class for
#manual particle class generation.
#Note that the values will get replaced by a single number, representing the number
#of particles in each clss for the simulation.
people = {"student": [True, 1, 0],
          "professor": [False, 0, 0],
          "faculty": [False, 0, 0],
          "other": [False, 0, 0]}
         # {"student": [True, 0.55, 6],
         #  "professor": [True, 0.15, 3],
         #  "faculty": [True, 0.15, 1],
         #  "other": [False, 0.15, 0]}

#Value for "campus_housing" key in parameters dictionary
campus_housing = {"student": 1,
                  "professor": 1,
                  "faculty": 1,
                  "other": 1}
                 # {"student": 0.5,
                 #  "professor": 0,
                 #  "faculty": 0,
                 #  "other": 0}

#Value for "events_classes" key in parameters dictionary
events_classes = {"student": {"housing": 0, 
                              "borders": 0,
                              "buildings": 1,
                              "other": 0},
                  "professor": {"housing": 0,
                                "borders": 0,
                                "buildings": 0.95,
                                "other": 0.05},
                  "faculty": {"housing": 0.01,
                              "borders": 0,
                              "buildings": 0.94,
                              "other": 0.05},
                  "other": {"housing": 0,
                            "borders": 0,
                            "buildings": 1,
                            "other": 0}}
                 # {"student": {"housing": 0.15, 
                 #              "borders": 0,
                 #              "buildings": 0.8,
                 #              "other": 0.05},
                 #  "professor": {"housing": 0,
                 #                "borders": 0,
                 #                "buildings": 0.95,
                 #                "other": 0.05},
                 #  "faculty": {"housing": 0.01,
                 #              "borders": 0,
                 #              "buildings": 0.94,
                 #              "other": 0.05},
                 #  "other": {"housing": 0,
                 #            "borders": 0,
                 #            "buildings": 1,
                 #            "other": 0}}

#The different parameters for schedule generation
parameters = {"num_people": 50000, #number of particles in simulation for automatic particle class generation
              "auto_class": True, #generation of particle classes - True: automatic, False: manual. Note for automatic, percentage of particles in each class may not be exact, depending on the rounding of numbers in the calculation
              "event_number": [1,3], #minimum and maximum number of events a particle can have in a day (min: 1, max: 3)
              "min_len_event": round(50*(end_time - start_time)/1440), #Minimum duration of an event (50 minutes)
              "max_walk_time": round(30*(end_time - start_time)/1440), #Maximum time it takes to get from one location to another (30 minutes)
              "start_day": start_time + round(7*(end_time - start_time)/24), #Schedule cannot start earlier than this time (7 AM)
              "end_day": end_time - round(2*(end_time - start_time)/24), #Schedule cannot end later than this time (10 PM)
              "campus_housing": campus_housing, #probability of particle living on-campus vs. off-campus based on class
              "events_classes": events_classes} #probability of event type for particle schedules based on particle class

#Methods
#Determine the number of particles for each class
def determine_classes(people, num_people, auto_class):
	persons = people.keys()
	if auto_class:
		count = 0
		for person in persons:
			people[person] = int(round(people[person][0] * people[person][1] * num_people))
			count += people[person]
		if count != num_people:
			main = list(persons)[0]
			if count < num_people:
				while count < num_people:
					people[main] += 1
					count += 1
			elif count > num_people:
				while count > num_people:
					people[main] -= 1
					count -= 1
	else:
		for person in persons:
			people[person] = people[person][0] * people[person][2]

#Generate the class of each particle
def generate_classes(schedule, people):
	persons = people.keys()
	for person in persons:
		for i in range(0,people[person]):
			particle = {"particle_class": person, "particle_schedule": []}
			schedule.append(particle)

#Generate the number of events of each particle
def determine_events(schedule, num_event_range):
	for person in range(0, len(schedule)):
		num_events = random.randint(num_event_range[0],num_event_range[1])
		for event in range(0,num_events+1):
			schedule[person]["particle_schedule"].append([])

#Generate the start and end location and times
def generate_start_and_end(schedule, on_campus, off_campus, campus_probability, t_start, t_end, min_len_event, max_walk_time):
	for person in range(0, len(schedule)):
		num_events = len(schedule[person]["particle_schedule"])-1
		schedule_length = num_events*min_len_event + (num_events+1)*max_walk_time
		begin_time = random.randint(t_start, t_end - schedule_length)
		campus = random.random()
		location = None
		if campus <= campus_probability[schedule[person]["particle_class"]]:
			location = random.choice(on_campus)
		else:
			location = random.choice(off_campus)
		schedule[person]["particle_schedule"][0].append(location)
		schedule[person]["particle_schedule"][0].append(begin_time)

#Helper method for the generate_events() function
def helper_generate_events(schedule, locations, event_probability, person):
	selector = random.random()
	location = None
	particle_class = schedule[person]["particle_class"]
	high = event_probability[particle_class]["housing"]
	if selector <= high:
		location = random.choice(locations[0])
	low = high
	high += event_probability[particle_class]["borders"]
	if selector > low and selector <= high:
		location = random.choice(locations[1])
	low = high
	high += event_probability[particle_class]["buildings"]
	if selector > low and selector <= high:
		location = random.choice(locations[2])
	if selector > high:
		location = random.choice(locations[3])
	return location

#Generate the locations of the events for each particle's schedule
def generate_events(schedule, locations, event_probability):
	for person in range(0, len(schedule)):
		event_list = schedule[person]["particle_schedule"]
		if len(event_list) == 2:
			location = helper_generate_events(schedule, locations, event_probability, person)
			while location == event_list[0][0]:
				location = helper_generate_events(schedule, locations, event_probability, person)
			event_list[1].append(location)
		else:
			for event in range(1, len(event_list)):
				location = helper_generate_events(schedule, locations, event_probability, person)
				while event >= 1 and event < len(event_list)-1 and location == event_list[event-1][0]:
					location = helper_generate_events(schedule, locations, event_probability, person)
				if event == len(event_list)-1:
					if len(event_list)%2 == 0 and (len(locations[2]) == 1 and (len(locations[3]) == 1 and locations[2][0] == locations[3][0]) or (len(locations[0]) == 1 and len(locations[1]) == 1 and locations[0][0] == locations[1][0])):
						event_list.pop(event)
						continue
					while location == event_list[event-1][0] or location == event_list[0][0]:
						location = helper_generate_events(schedule, locations, event_probability, person)
				event_list[event].append(location)

#Generate the times of the events for each particle's schedule
def generate_times(schedule, t_end, max_walk_time, min_length_event):
	for person in range(0, len(schedule)):
		event_list = schedule[person]["particle_schedule"]
		t_start = event_list[0][1]
		for event in range(0, len(event_list)):
			t_low = t_start - max_walk_time
			if event != 0:
				t_low = event_list[event-1][1]+max_walk_time+min_length_event
			t_high = t_end
			if event != len(event_list)-1:
				t_high = t_end - (len(event_list)-1-event)*(max_walk_time+min_length_event)
			t = random.randint(t_low,t_high)
			if event == 0:
				event_list[event][1] = t
			else:
				if t < event_list[event-1][1]+max_walk_time+min_length_event:
					print("Times are too close together.")
				event_list[event].append(t)

#Generate the schedule of each particle
def generate_schedule(people_classes, locations, parameters):
	dictionary = {"num_particles": parameters["num_people"],
	              "particles": []}
	determine_classes(people_classes, dictionary["num_particles"], parameters["auto_class"])
	generate_classes(dictionary["particles"], people_classes)
	determine_events(dictionary["particles"], parameters["event_number"])
	generate_start_and_end(dictionary["particles"], locations[0], locations[1], parameters["campus_housing"], parameters["start_day"], parameters["end_day"], parameters["min_len_event"], parameters["max_walk_time"])
	generate_events(dictionary["particles"], locations, parameters["events_classes"])
	generate_times(dictionary["particles"], parameters["end_day"], parameters["max_walk_time"], parameters["min_len_event"])
	if dictionary["num_particles"] != len(dictionary["particles"]):
		print("Error: There are particles missing. Do not proceed.")
		return -1
	else:
		return dictionary

#JSON object format:
#{"num_particles": num_particles,
# "particles": [{"particle_class": class_0,
#                "particle_schedule": [[location_start_end, t_departure], 
#                                      [location_1, t_departure],
#                                      [location_2, t_departure],
#                                      ...                               ]},
#               {"particle_class": class_1,
#                "particle_schedule": [[location_start_end, t_departure], 
#                                      [location_1, t_departure],
#                                      [location_2, t_departure],
#                                      ...                               ]},
#               ...                                                         ]}
#Note: Each schedule represents 1 day in the simulation

outdir = os.path.join(os.path.dirname(__file__), "../src/assets/schedules/")
mapname = "campus"
version = 4

if __name__ == '__main__':
	schedule = generate_schedule(people, objects, parameters)
	# print(schedule)
	if schedule == -1:
		print("Due to previous error, the schedule cannot be generated. Please try again.")
	else:
		data = json.dumps(schedule, indent=2)
		with open(os.path.join(outdir, f'{mapname}{version}.ts'), "w") as file:
			file.write("export const schedule = ")
			file.write(data)
			file.write(" as const;\nexport default schedule;\n")