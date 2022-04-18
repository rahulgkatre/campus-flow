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
        int_blur = gaussian(color_mask.astype(float), sigma=self.internalBlurSigma)
        ext_blur = gaussian(color_mask.astype(float), sigma=self.externalBlurSigma)

        # compute gradients
        dy_ext, dx_ext = np.gradient(ext_blur)
        dy_int, dx_int = np.gradient(int_blur)

        # combine the two blurs for internal/external
        dy = np.where(~color_mask, dy_ext, dy_int)
        dx = np.where(~color_mask, dx_ext, dx_int)

        # get unit vectors
        norm = np.sqrt(dy ** 2 + dx ** 2)
        dy[norm!=0] /= norm[norm!=0]
        dx[norm!=0] /= norm[norm!=0]

        # multiply by blurred mask values
        dy *= np.where(~color_mask, ext_blur, int_blur)
        dx *= np.where(~color_mask, ext_blur, int_blur)

        # Force to enter is already negative (we don't want to enter an obstacle) 
        # but we negate it again to make positive so that the gradient field points away stronger
        dy *= np.where(~color_mask, -self.forceToEnter, self.forceToLeave)
        dx *= -np.where(~color_mask, -self.forceToEnter, self.forceToLeave)

        return dy, dx, color_mask

'''
Define the colors that we want to separate out. 
Each color needs to have a separate vector field so that weighting can be done.
For example, the aversion to walk on grass is much less than the aversion to walk into a wall.
Similarly, there is an attraction to walk on a path rather than on the road.
'''
MAP_ELEMENTS = [
    MapColorElement('path', np.array([127, 127, 127]), externalBlurSigma=4, forceToEnter=0.25, internalBlurSigma=16, forceToLeave=0.25),
    MapColorElement('grass', np.array([34, 177, 76]), externalBlurSigma=4, forceToEnter=0.25, forceToLeave=0.25),
    MapColorElement('obstacle', np.array([255, 255, 255]), externalBlurSigma=4, forceToEnter=-512, forceToLeave=0)
    # MapColorElement('red', np.array([237, 28, 36]), blurSigma=16, forceToEnter=1, forceToLeave=1),
    # MapColorElement('blue', np.array([63, 72, 204]), blurSigma=16, forceToEnter=1, forceToLeave=1)
]

def get_total_field(image, elements=MAP_ELEMENTS):
    vecField = np.zeros((512, 512, 2))
    for element in elements:
        dy, dx, mask = element.get_vector_field(image)
        vecField[:, :, 0] += dx
        vecField[:, :, 1] += dy
    return vecField

