import numpy as np
from map_color_element import MapColorElement

'''
Define the colors that we want to separate out. 
Each color needs to have a separate vector field so that weighting can be done.
For example, the aversion to walk on grass is much less than the aversion to walk into a wall.
Similarly, there is an attraction to walk on a path rather than on the road.
'''
MAP_ELEMENTS = [
    MapColorElement('path', np.array([127, 127, 127]), externalBlurSigma=24, forceToEnter=40, internalBlurSigma=16, forceToLeave=-20),
    MapColorElement('grass', np.array([34, 177, 76]), externalBlurSigma=4, forceToEnter=0, forceToLeave=15),
    MapColorElement('obstacle', np.array([255, 255, 255]), externalBlurSigma=24, forceToEnter=-100, internalBlurSigma=32, forceToLeave=100)
    # MapColorElement('red', np.array([237, 28, 36]), blurSigma=16, forceToEnter=1, forceToLeave=1),
    # MapColorElement('blue', np.array([63, 72, 204]), blurSigma=16, forceToEnter=1, forceToLeave=1)
]

NULL_COLOR = np.array([0, 0, 0])