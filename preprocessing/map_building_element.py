import json
from typing import List

import numpy as np

from utils import normalize_field

class MapBuildingElement:

    def __init__(self, building_name:str, entry_points:List[np.array]):
        self.entry_points = entry_points
        self.building_name = building_name

    def set_curl_field(self, image, fieldL, fieldR):
        # pixels = np.linspace(0, 512, 512, endpoint=False).astype(int)
        x, y = np.meshgrid(np.arange(image.shape[1]), np.arange(image.shape[0]))
        coords = np.array([y,x]).T
        toEntrancesVecs = np.array([entrance-coords for entrance in self.entry_points]).transpose(1,2,0,3)*np.array([1,-1]).astype(float)
        magnitudes = np.linalg.norm(toEntrancesVecs, axis=3)[:,:,:,None]
        toEntrancesVecs /= magnitudes
        toEntrancesVecs /= magnitudes
        fieldL_dotted = np.einsum('ijk,ijnk->ijn', fieldL, toEntrancesVecs)
        # fieldR_dotted = np.einsum('ijk,ijnk->ijn', fieldR, toEntrancesVecs)
        max_dot = np.abs(fieldL_dotted).argmax(axis=2)
        entrance_dot = np.take_along_axis(fieldL_dotted, max_dot[:,:,None], axis=2)
        best_curl = np.where(entrance_dot >= 0, fieldL, fieldR)
        best_curl = normalize_field(best_curl)
        self.curl = best_curl
