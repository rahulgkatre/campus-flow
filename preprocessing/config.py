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

MAP_BUILDING_ELEMENTS = [
    MapBuildingElement('coc', [np.array([55, 90]), np.array([230, 135])]),
    MapBuildingElement('culc', [np.array([235, 370]), np.array([440, 420])]),
]