import numpy as np
from skimage.filters import gaussian

from utils import crop, display_image, get_color_mask

class MapColorElement:
    def __init__(self, name, color,*args,externalBlurSigma,forceToEnter,internalBlurSigma=None,forceToLeave):
        self.name = name
        self.color = color
        self.externalBlurSigma = externalBlurSigma
        self.forceToEnter = forceToEnter
        if internalBlurSigma is None:
            internalBlurSigma = externalBlurSigma
        self.internalBlurSigma = internalBlurSigma
        self.forceToLeave = forceToLeave
    
    def get_vector_field(self, image):
        '''
        Calculate gradient over a slightly blurred image for a specific color
        This lets us calculate the vector field for a specific environment object (e.g. obstacle)
        '''
        color_mask = get_color_mask(self.color, image)
        # blur the outside and inside separately
        dy_ext, dx_ext = np.gradient(gaussian(color_mask.astype(float), sigma=self.externalBlurSigma))
        dy_int, dx_int = np.gradient(gaussian(color_mask.astype(float), sigma=self.internalBlurSigma))

        # combine the two blurs for internal/external
        dy = np.where(~color_mask, dy_ext, dy_int)
        dx = np.where(~color_mask, dx_ext, dx_int)

        # Force to enter is already negative (we don't want to enter an obstacle) 
        # but we negate it again to make positive so that the gradient field points away stronger
        dy *= np.where(~color_mask, -self.forceToEnter, self.forceToLeave)
        dx *= -np.where(~color_mask, -self.forceToEnter, self.forceToLeave)

        return dy, dx, color_mask

def get_total_field(elements, image):
    vecField = np.zeros((512, 512, 2))
    for element in elements:
        dy, dx, mask = element.get_vector_field(image)
        vecField[:, :, 0] += dx
        vecField[:, :, 1] += dy
    return vecField


'''
Define the colors that we want to separate out. 
Each color needs to have a separate vector field so that weighting can be done.
For example, the aversion to walk on grass is much less than the aversion to walk into a wall.
Similarly, there is an attraction to walk on a path rather than on the road.
'''
MAP_ELEMENTS = [
    MapColorElement('path', np.array([127, 127, 127]), externalBlurSigma=4, forceToEnter=1, internalBlurSigma=16, forceToLeave=-1),
    MapColorElement('grass', np.array([34, 177, 76]), externalBlurSigma=4, forceToEnter=1, forceToLeave=1),
    MapColorElement('obstacle', np.array([255, 255, 255]), externalBlurSigma=8, forceToEnter=-8, forceToLeave=0)
    # MapColorElement('red', np.array([237, 28, 36]), blurSigma=16, forceToEnter=1, forceToLeave=1),
    # MapColorElement('blue', np.array([63, 72, 204]), blurSigma=16, forceToEnter=1, forceToLeave=1)
]