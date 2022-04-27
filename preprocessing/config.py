import numpy as np
from map_color_element import MapColorElement
from map_building_element import MapBuildingElement

'''
Define the colors that we want to separate out. 
Each color needs to have a separate vector field so that weighting can be done.
For example, the aversion to walk on grass is much less than the aversion to walk into a wall.
Similarly, there is an attraction to walk on a path rather than on the road.
'''
MAP_COLOR_ELEMENTS = [
    MapColorElement('path', np.array([127, 127, 127]), externalBlurSigmas=[24], forceToEnter=40, internalBlurSigmas=[16], forceToLeave=-20),
    MapColorElement('grass', np.array([34, 177, 76]), externalBlurSigmas=[4], forceToEnter=0, forceToLeave=15),
    MapColorElement('obstacle', np.array([255, 255, 255]), externalBlurSigmas=[24], forceToEnter=-100, internalBlurSigmas=[32], forceToLeave=100)
    # MapColorElement('red', np.array([237, 28, 36]), blurSigma=16, forceToEnter=1, forceToLeave=1),
    # MapColorElement('blue', np.array([63, 72, 204]), blurSigma=16, forceToEnter=1, forceToLeave=1)
]
NULL_COLOR = np.array([0, 0, 0])

basic_buildings = [
    MapBuildingElement('coc', [np.array([55, 90]), np.array([230, 135])]),
    MapBuildingElement('culc', [np.array([235, 370]), np.array([440, 420])]),
]

campus_buildings = [
    MapBuildingElement('Ferst', [np.array([14, 520]), np.array([83, 383])]),
    MapBuildingElement('Student Center', [np.array([51, 636]), np.array([51, 849]), np.array([290, 809]), np.array([272, 938])]),
    MapBuildingElement('Skiles', [np.array([727, 953]), np.array([776, 813]), np.array([916, 813])]),
    MapBuildingElement('CulcLibrary', [np.array([776, 718]), np.array([972, 718]), np.array([972, 569]), np.array([748, 368])]),
    MapBuildingElement('VanLeer', [np.array([521, 198]), np.array([702, 174])]),
    MapBuildingElement('IndustrialDesign', [np.array([852, 164]), np.array([744, 63])]),
    MapBuildingElement('BungerHenry', [np.array([301, 106]), np.array([368, 201]), np.array([248, 315]), np.array([333, 315])]),
    MapBuildingElement('NorthExit', [np.array([41, 2]), np.array([400, 2]), np.array([734, 0])]),
    MapBuildingElement('EastExit', [np.array([1028, 168]), np.array([1028, 352]), np.array([1028, 765])]),
    MapBuildingElement('SouthExit', [np.array([665, 1022]), np.array([272, 1022]), np.array([14, 1022])]),
]

MAP_BUILDING_ELEMENTS = campus_buildings
