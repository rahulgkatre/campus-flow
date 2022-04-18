import argparse
import os
import sys

from map_color_element import *
from utils import *

parser = argparse.ArgumentParser(description='Process a map image into a importable typescript file for a p5 sketch.')
parser.add_argument('--mapdir', type=str, required=True,
                    help='where look for map.png and generate a field.ts')

if __name__ == "__main__":
    args = parser.parse_args()
    if args.mapdir is None:
        print("Please specify a directory for map parsing")
        sys.exit(1)
    image_path = os.path.join(args.mapdir, "map.png")
    if not os.path.isfile(image_path):
        print("Could not find map.png in {}".format(args.mapdir))
        sys.exit(1)
    field_path = os.path.join(args.mapdir, "field.ts")
    if os.path.isfile(field_path):
        print("field.ts already exists in {}. deleting...".format(args.mapdir))
        os.remove(field_path)
    
    img = read_img(image_path)
    field = get_total_field(img)
    field = add_noise(field)
    field = normalize_field(field)
    write_field_file(field, field_path)