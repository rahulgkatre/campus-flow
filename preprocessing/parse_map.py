import argparse
import os
import sys

from map_color_element import *
from config import MAP_ELEMENTS, NULL_COLOR
from utils import *

parser = argparse.ArgumentParser(description='Process a map image into a importable typescript file for a p5 sketch.')
parser.add_argument('--mapdir', type=str, required=False,
                    help='where look for map.png and generate a map.ts')
parser.add_argument('--maps', type=str, required=False,
                    help='where to look for a collection of map folders with map.png and generate a map.ts')

def get_total_field(image, elements=MAP_ELEMENTS):
    vecField = np.zeros((512, 512, 2))
    null_color_mask = get_color_mask(NULL_COLOR, image)
    for element in elements:
        dy, dx, mask = element.get_vector_field(image, null_color_mask)
        vecField[:, :, 0] += dx
        vecField[:, :, 1] += dy
    return vecField

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
    
    if os.path.isfile(field_path):
        print("map.ts already exists in {}. replacing...".format(mapdir))
        # os.remove(field_path)
    write_field_file(field, field_path)

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

    