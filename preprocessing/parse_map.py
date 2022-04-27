import argparse
import os
import sys

from config import CONFIGS, DEFAULT_CONFIG, NULL_COLOR
from utils import *

parser = argparse.ArgumentParser(description='Process a map image into a importable typescript file for a p5 sketch.')
parser.add_argument('--mapdir', type=str, required=False,
                    help='where look for map.png and generate a map.ts')
parser.add_argument('--maps', type=str, required=False,
                    help='where to look for a collection of map folders with map.png and generate a map.ts')

def get_total_field(image, configName=None):
    """
    Get the total field of the image
    This is done by summing the vector field contributions from each element
    """
    if configName is not None and type(configName) is list:
        elements = configName
    else:
        if configName is None or configName not in CONFIGS:
            elements = DEFAULT_CONFIG['colors']
            print("\tUsing default config")
        else:
            elements = CONFIGS[configName]['colors']
            print("\tUsing config {}".format(configName))
    height,width = image.shape[:2]
    vecField = np.zeros((height, width, 2))
    null_color_mask = get_color_mask(NULL_COLOR, image)
    for element in elements:
        dy, dx, mask = element.get_vector_field(image, null_color_mask)
        vecField[:, :, 0] += dx
        vecField[:, :, 1] += dy
    return vecField

def evaluate_curls(image, configName=None):
    """
    Evaluate the curl of the vector field for each building
    Curl is only based on bulidings, so we first generate an obstacle only field.
    This field is then used to create two curl fields and these are passed to each building element to determine which curl field is optimal at each point of the map to push particles towards the closest entrance.
    """
    if configName is None or configName not in CONFIGS:
        obstacle_element = list(filter(lambda c: c.name == 'obstacle', DEFAULT_CONFIG['colors']))[0]
        elements = DEFAULT_CONFIG['buildings']
        print("\tUsing default config")
    else:
        obstacle_element = list(filter(lambda c: c.name == 'obstacle', CONFIGS[configName]['colors']))[0]
        elements = CONFIGS[configName]['buildings']
        print("\tUsing config {}".format(configName))
    obstacle_field = get_total_field(image, [obstacle_element])
    obstacle_field[get_color_mask(obstacle_element.color, image)] = 0
    obstacle_field = normalize_field(obstacle_field)
    fieldL = normalize_field(obstacle_field) @ np.array([[0, 1], [-1, 0]])
    fieldR = -fieldL

    for element in elements:
        element.set_curl_field(image, fieldL, fieldR)
    return elements

def runOnMapDir(mapdir, exit=False):
    """
    Find a map.png file within the directory and generate a map.ts file
    This is done by:
        reading the image
        calculating the potential field based on social-force model
        evaluating curl for each building
        writing the fields into a typescript file for importing into simulation
    """
    image_path = os.path.join(mapdir, "map.png")
    if not os.path.isfile(image_path):
        print("Could not find map.png in {}".format(mapdir))
        if exit:
            sys.exit(1)
        return
    field_path = os.path.join(mapdir, "map.ts")
    
    mapName = os.path.basename(mapdir)

    img = read_img(image_path)
    field = get_total_field(img, configName=mapName)
    field = add_noise(field)
    field = normalize_field(field)

    buildings = evaluate_curls(img, configName=mapName)

    if os.path.isfile(field_path):
        print("map.ts already exists in {}. replacing...".format(mapdir))
    write_field_file(field_path, field, buildings)

if __name__ == "__main__":
    args = parser.parse_args()
    if args.mapdir is None and args.maps is None:
        print("Please specify a directory for map parsing")
        parser.print_usage()
        sys.exit(1)
    if args.mapdir is not None and args.maps is not None:
        print("Cannot specify both mapdir and maps")
        parser.print_usage()
        sys.exit(1)

    pardir = os.path.dirname(os.path.abspath(__file__))
    map_names = []
    if args.mapdir is not None:
        map_names = [os.path.basename(os.path.normpath(args.mapdir))]
        pardir = os.path.relpath(os.path.join(args.mapdir, os.pardir))
    if args.maps is not None:
        map_names = os.listdir(args.maps)
        pardir = args.maps
    for mapdir in map_names:
        mapdir = os.path.relpath(os.path.join(pardir, mapdir))
        print("Parsing map in {}".format(mapdir))
        runOnMapDir(mapdir)

    