import argparse
import os
import sys

from config import MAP_COLOR_ELEMENTS, NULL_COLOR, MAP_BUILDING_ELEMENTS
from utils import *

parser = argparse.ArgumentParser(description='Process a map image into a importable typescript file for a p5 sketch.')
parser.add_argument('--mapdir', type=str, required=False,
                    help='where look for map.png and generate a map.ts')
parser.add_argument('--maps', type=str, required=False,
                    help='where to look for a collection of map folders with map.png and generate a map.ts')

def get_total_field(image, elements=MAP_COLOR_ELEMENTS):
    # print(image.shape)
    height,width = image.shape[:2]
    vecField = np.zeros((height, width, 2))
    null_color_mask = get_color_mask(NULL_COLOR, image)
    for element in elements:
        dy, dx, mask = element.get_vector_field(image, null_color_mask)
        vecField[:, :, 0] += dx
        vecField[:, :, 1] += dy
    return vecField

def evaluate_curls(image, elements=MAP_BUILDING_ELEMENTS):
    obstacle_element = list(filter(lambda c: c.name == 'obstacle', MAP_COLOR_ELEMENTS))[0]
    obstacle_field = get_total_field(image, [obstacle_element])
    obstacle_field[get_color_mask(obstacle_element.color, image)] = 0
    obstacle_field = normalize_field(obstacle_field)
    fieldL = normalize_field(obstacle_field) @ np.array([[0, 1], [-1, 0]])
    fieldR = -fieldL

    for element in elements:
        element.set_curl_field(image, fieldL, fieldR)
    return elements

def runOnMapDir(mapdir, exit=False):
    image_path = os.path.join(mapdir, "map.png")
    if not os.path.isfile(image_path):
        print("Could not find map.png in {}".format(mapdir))
        if exit:
            sys.exit(1)
        return
    field_path = os.path.join(mapdir, "map.ts")
    
    img = read_img(image_path)
    field = get_total_field(img)
    field = add_noise(field)
    field = normalize_field(field)

    buildings = evaluate_curls(img)

    plot_vector_field_color(field[:, :, 1], field[:, :, 0], (img.shape[0] // 2, img.shape[1] // 2), (img.shape[0] // 2), shape=img.shape[:2])

    if os.path.isfile(field_path):
        print("map.ts already exists in {}. replacing...".format(mapdir))
        # os.remove(field_path)
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

    if args.mapdir is not None:
        args.maps = os.path.relpath(os.path.join(args.mapdir, os.pardir))
    if args.maps is not None:
        for mapdir in os.listdir(args.maps):
            mapdir = os.path.relpath(os.path.join(args.maps, mapdir))
            print("Parsing map in {}".format(mapdir))
            runOnMapDir(mapdir)

    