import json
import random

#Start and end time for simulation to run
start_time = 0
end_time = 86400

#The various buildings, categorized by type
housing = ["North Avenue North", "North Avenue South", "North Avenue East", "North Avenue West", "Towers Residence Hall", "Glenn Residence Hall"]
#housing = ["Housing1", "Housing2"]

borders = ["5th Street Bridge", "North Avenue Bridge", "Centennial Olympic Park Drive", "10th Street"]
#borders = ["Border1", "Border2"]

buildings = ["CULC", "Skiles", "Georgia Tech Tower", "CoC", "Howey", "Klaus", "Van Leer", "Georgia Tech Library", "Student Center"]
#buildings = ["Building1", "Building2"]

other = ["Bobby Dodd Stadium"]
#other = ["Other1", "Other2"]

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
people = {"student": [True, 0.55, 6],
          "professor": [True, 0.15, 3],
          "faculty": [True, 0.15, 1],
          "other": [False, 0.15, 0]}

#The different parameters for schedule generation
parameters = {"num_people": 10, #number of particles in simulation for automatic particle class generation
              "auto_class": False, #generation of particle classes - True: automatic, False: manual. Note for automatic, percentage of particles in each class may not be exact, depending on the rounding of numbers in the calculation
              "event_number": [1,5],
              "min_len_event": 3000 #50 minutes
              "max_walk_time": 1800 #30 minutes
              "campus_housing": {"student": 0.5,
                                 "professor": 0,
                                 "faculty": 0,
                                 "other": 0}, #probability of particle class living on-campus vs. off-campus
              "events_classes": {"student": {"housing": 0.15,
                                             "borders": 0,
                                             "buildings": 0.8,
                                             "other": 0.05},
                                 "professor": {"housing": 0,
                                               "borders": 0,
                                               "buildings": 0.95,
                                               "other": 0},
                                 "faculty": {"housing": 0.01,
                                             "borders": 0,
                                             "buildings": 0.94,
                                             "other": 0.05},
                                 "other": {"housing": 0,
                                           "borders": 0,
                                           "buildings": 1,
                                           "other": 0}}} #probability of event type for particle schedules based on particle class

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
	count = 1
	for person in persons:
		for i in range(0,people[person]):
			particle = {"particle_id": count, "particle_class": person}
			schedule.append(particle)
			count += 1

#Generate the number of events of each particle
def determine_events(schedule, num_event_range):
	for person in range(0, len(schedule)):
		dictionary = {"schedule_start": [],
		              "schedule_middle": [],
		              "schedule_finish": []}
		num_events = random.randint(num_event_range[0],num_event_range[1])
		for event in range(1,num_events+1):
			dictionary["schedule_middle"].append([])
		schedule[person]["particle_schedule"] = dictionary

#Generate the start and end location and times
def generate_start_and_end(schedule, on_campus, off_campus, campus_probability, t_start, t_end, min_len_event, max_walk_time):
	for person in range(0, len(schedule)):
		num_events = len(schedule[person]["particle_schedule"]["schedule_middle"])
		sleep_time = round((t_end - t_start)/10)
		schedule_length = num_events*min_len_event + (num_events+1)*max_walk_time
		begin_time = random.randint(t_start + sleep_time, t_end - sleep_time - schedule_length)
		end_time = random.randint(begin_time + schedule_length, t_end - sleep_time)
		campus = random.random()
		location = None
		if campus <= campus_probability[schedule[person]["particle_class"]]:
			location = random.choice(on_campus)
		else:
			location = random.choice(off_campus)
		schedule[person]["particle_schedule"]["schedule_start"] = [location, begin_time]
		schedule[person]["particle_schedule"]["schedule_finish"] = [location, end_time]

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
		event_list = schedule[person]["particle_schedule"]["schedule_middle"]
		if len(event_list) == 1:
			location = helper_generate_events(schedule, locations, event_probability, person)
			while location == schedule[person]["particle_schedule"]["schedule_start"][0] or location == schedule[person]["particle_schedule"]["schedule_finish"][0]:
				location = helper_generate_events(schedule, locations, event_probability, person)
			event_list[0].append(location)
		else:
			for event in range(0, len(event_list)):
				location = helper_generate_events(schedule, locations, event_probability, person)
				while event == 0 and location == schedule[person]["particle_schedule"]["schedule_start"][0]:
					location = helper_generate_events(schedule, locations, event_probability, person)
				while event != 0 and location == event_list[event-1][0]:
					location = helper_generate_events(schedule, locations, event_probability, person)
				while event == len(event_list)-1 and (location == event_list[event-1][0] or location == schedule[person]["particle_schedule"]["schedule_finish"][0]) :
					location = helper_generate_events(schedule, locations, event_probability, person)
				event_list[event].append(location)


def generate_times(schedule, t_start, t_end):
	for person in range(0, len(schedule)):


#Generate the schedule of each particle
def generate_schedule(people_classes, locations, t_start, t_end, parameters):
	dictionary = {"num_particles": parameters["num_people"],
	              "particles": []}
	determine_classes(people_classes, dictionary["num_particles"], parameters["auto_class"])
	generate_classes(dictionary["particles"], people_classes)
	determine_events(dictionary["particles"], parameters["event_number"])
	generate_start_and_end(dictionary["particles"], locations[0], locations[1], parameters["campus_housing"], t_start, t_end, parameters["min_len_event"], parameters["max_walk_time"])
	generate_events(dictionary["particles"], locations, parameters["events_classes"])
	# generate_times(dictionary["particles"], t_start, t_end)
	if dictionary["num_particles"] != len(dictionary["particles"]):
		print("Error: There are particles missing. Do not proceed.")
		return -1
	else:
		return dictionary

#JSON object format:
#dictionary = {"num_particles": num_particles,
#              "particles": [{"particle_id": id_1, 
#                             "particle_class": class_1,
#                             "particle_schedule": {"schedule_start": [location_start, t_start],
#                                                   "schedule_finish": [location_finish, t_finish],
#                                                   "schedule_middle": [[location_1, t_begin, t_end], 
#                                                                       [location_2, t_begin, t_end],
#                                                                       ...                          ]}},
#                            {"particle_id": id_2, 
#                             "particle_class": class_2,
#                             "particle_schedule": {"schedule_start": [location_start, t_start],
#                                                   "schedule_finish": [location_finish, t_finish],
#                                                   "schedule_middle": [[location_1, t_begin, t_end], 
#                                                                       [location_2, t_begin, t_end],
#                                                                       ...                          ]}},
#                            ...                                                                         ]}
#Note: Each schedule represents 1 day in the simulation

if __name__ == '__main__':
	schedule = generate_schedule(people, objects, start_time, end_time, parameters)
	# print(schedule)
	if schedule == -1:
		print("Due to previous error, the schedule cannot be generated. Please try again.")
	else:
		data = json.dumps(schedule, indent=4)
		with open("schedule.json", "w") as file:
			file.write(data)