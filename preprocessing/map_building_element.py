import json
from typing import List

import numpy as np

from utils import normalize_field

class MapBuildingElement:
    """
    This class represents a building in the map. Every map will have a list of these.
    A building has a set of entry points which are hard coded based on the map image.
    Each building also has a curl field which will guide particles towards the closest entrance from anywhere around that building.
        The curl fields were disabled for simulation since they increased complexity and other fatures on simulation yielded the same results.
    """

    def __init__(self, building_name:str, entry_points:List[np.array]):
        self.entry_points = entry_points
        self.building_name = building_name

    def set_curl_field(self, image, fieldL, fieldR):
        """
        This function sets the curl field for the building.
        The curl field is a vector field which guides particles towards the closest entrance from anywhere around the building.
        :param image: The image of the map.
        :param fieldL: The curl field for going CCW around the building.
        :param fieldR: The curl field for going CW around the building.
        :return: None
        """
        self.curl = np.zeros_like(fieldL) # we decided that the curl field was only adding complexity with little value, so we removed it from simulation
        return

        # create index arrays for the image
        x, y = np.meshgrid(np.arange(image.shape[1]), np.arange(image.shape[0]))
        # create a 2-d array where each element of the array is the coordinates of that element
        coords = np.array([y,x]).T
        
        # get a vector from every point to each of the entrances of the building
        toEntrancesVecs = np.array([entrance-coords for entrance in self.entry_points]).transpose(1,2,0,3)*np.array([1,-1]).astype(float)
        magnitudes = np.linalg.norm(toEntrancesVecs, axis=3)[:,:,:,None]
        # invert the magnitude of these vectors such that further points are weighted less than closer points
        toEntrancesVecs /= magnitudes
        toEntrancesVecs /= magnitudes

        # Use dot product to determine how aligned the CCW field lines are with the vectors pointing to each vector
        fieldL_dotted = np.einsum('ijk,ijnk->ijn', fieldL, toEntrancesVecs)
        # fieldR_dotted = np.einsum('ijk,ijnk->ijn', fieldR, toEntrancesVecs)

        # determine which entrance is most aligned with the field lines
        max_dot = np.abs(fieldL_dotted).argmax(axis=2)
        entrance_dot = np.take_along_axis(fieldL_dotted, max_dot[:,:,None], axis=2)

        # choose either the CCW or the CW field based on the sign of the dot product (this works because the fields are simply the negative of each other)
        best_curl = np.where(entrance_dot >= 0, fieldL, fieldR)
        best_curl = normalize_field(best_curl)
        self.curl = best_curl
