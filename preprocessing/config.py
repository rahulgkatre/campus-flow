import numpy as np
from map_color_element import MapColorElement
from map_building_element import MapBuildingElement

'''
Define the colors that we want to separate out. 
Each color needs to have a separate vector field so that weighting can be done.
For example, the aversion to walk on grass is much less than the aversion to walk into a wall.
Similarly, there is an attraction to walk on a path rather than on the road.
'''
basic_colors = [
    MapColorElement('path', np.array([127, 127, 127]), externalBlurSigmas=[24], forceToEnter=40, internalBlurSigmas=[16], forceToLeave=-20),
    MapColorElement('grass', np.array([34, 177, 76]), externalBlurSigmas=[4], forceToEnter=0, forceToLeave=15),
    MapColorElement('obstacle', np.array([255, 255, 255]), externalBlurSigmas=[24], forceToEnter=-100, internalBlurSigmas=[32], forceToLeave=100)
]
basic_buildings = [
    MapBuildingElement('coc', [np.array([55, 90]), np.array([230, 135])]),
    MapBuildingElement('culc', [np.array([235, 370]), np.array([440, 420])]),
]


campus_colors = basic_colors
campus_buildings = [
    MapBuildingElement('Ferst', [np.array([14, 520]), np.array([83, 383])]),
    MapBuildingElement('Student Center', [np.array([51, 636]), np.array([51, 849]), np.array([290, 809]), np.array([272, 938])]),
    MapBuildingElement('Skiles', [np.array([727, 953]), np.array([776, 813]), np.array([916, 813])]),
    MapBuildingElement('CulcLibrary', [np.array([776, 718]), np.array([972, 718]), np.array([972, 569]), np.array([748, 368])]),
    MapBuildingElement('VanLeer', [np.array([521, 198]), np.array([550, 198]), np.array([702, 174])]),
    MapBuildingElement('IndustrialDesign', [np.array([852, 164]), np.array([744, 63])]),
    MapBuildingElement('BungerHenry', [np.array([301, 106]), np.array([368, 201]), np.array([248, 315]), np.array([333, 315])]),
    MapBuildingElement('NorthExit', [np.array([41, 2]), np.array([400, 2]), np.array([734, 0])]),
    MapBuildingElement('EastExit', [np.array([1028, 168]), np.array([1028, 352]), np.array([1028, 765])]),
    MapBuildingElement('SouthExit', [np.array([665, 1022]), np.array([272, 1022]), np.array([14, 1022])]),
    MapBuildingElement('WestExit', [np.array([2, 568]), np.array([2, 850])]),
]

doorway_colors = basic_colors
doorway_buildings = [
    MapBuildingElement('Left', [np.array([0, 256])]),
    MapBuildingElement('Right', [np.array([512, 256])]),
]

hallway_colors = basic_colors
hallway_buildings = [
    MapBuildingElement('Left', [np.array([0, 256])]),
    MapBuildingElement('Right', [np.array([512, 256])]),
]

CONFIGS = {
    'basic': {
        'colors': basic_colors,
        'buildings': basic_buildings,
    },
    'campus': {
        'colors': campus_colors,
        'buildings': campus_buildings,
    },
    'doorway': {
        'colors': doorway_colors,
        'buildings': doorway_buildings,
    },
    'hallway': {
        'colors': hallway_colors,
        'buildings': hallway_buildings,
    },
}
DEFAULT_CONFIG_NAME = 'campus'

DEFAULT_CONFIG = CONFIGS[DEFAULT_CONFIG_NAME]
MAP_COLOR_ELEMENTS = DEFAULT_CONFIG['colors']
NULL_COLOR = np.array([0, 0, 0])

MAP_BUILDING_ELEMENTS = DEFAULT_CONFIG['buildings']
