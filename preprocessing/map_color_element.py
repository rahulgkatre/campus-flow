import numpy as np
from skimage.filters import gaussian

class MapColorElement:
    def __init__(self, name, color, blurSigma, forceToEnter, forceToLeave):
        self.name = name
        self.color = color
        self.blurSigma = blurSigma
        self.forceToEnter = forceToEnter
        self.forceToLeave = forceToLeave
    
    def get_vector_field(self, image):
        '''
        Calculate gradient over a slightly blurred image for a specific color
        This lets us calculate the vector field for a specific environment object (e.g. obstacle)
        '''
        color_mask = get_color_mask(self.color, image)
        dy, dx = np.gradient(gaussian(color_mask.astype(float), sigma=self.blurSigma))

        # Force to enter is already negative (we don't want to enter an obstacle) 
        # but we negate it again to make positive so that the gradient field points away stronger
        dy *= np.where(~color_mask, -self.forceToEnter, self.forceToLeave)
        dx *= -np.where(~color_mask, -self.forceToEnter, self.forceToLeave)

        return dy, dx, color_mask

def getTotalField(elements, image):
    vecField = np.zeros((512, 512, 2))
    for element in elements:
        dy, dx, mask = element.get_vector_field(image)
        vecField[:, :, 0] += dx
        vecField[:, :, 1] += dy
    return vecField

MAP_ELEMENTS = [
    MapColorElement('path', path, 4, 1, -1),
    MapColorElement('grass', grass, 4, 1, 1),
    MapColorElement('obstacle', obstacle, 4, -2, 0),
    MapColorElement('red', red, 16, 1, 1),
    MapColorElement('blue', blue, 16, 1, 1)
]