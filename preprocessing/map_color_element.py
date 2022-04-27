import numpy as np
from skimage.filters import gaussian

import cv2

from utils import crop, display_image, get_color_mask

class MapColorElement:
    """
    This class represents a map element (e.g. obstacle) that can be used to calculate a contribution to the vector field
    Each map has a list of these elements, and the vector field is calculated for each element
    The map element is represented by a color which is used to get a mask of the image
    The mask is then blurred and we take the gradient to determine direction vectors either toward or away from regions of that color in the map
    """

    def __init__(self, name, color,*args,externalBlurSigmas,forceToEnter,internalBlurSigmas=None,forceToLeave):
        self.name = name
        self.color = color
        self.externalBlurSigmas = externalBlurSigmas
        self.forceToEnter = forceToEnter
        if internalBlurSigmas is None:
            internalBlurSigmas = externalBlurSigmas
        self.internalBlurSigmas = internalBlurSigmas
        self.forceToLeave = forceToLeave
    
    def get_vector_field(self, image, null_color_mask=None):
        '''
        Calculate gradient over a slightly blurred image for a specific color
        This lets us calculate the vector field for a specific environment object (e.g. obstacle)
        '''
        # get a mask of the image for the specific color of the element
        color_mask = get_color_mask(self.color, image)
        
        # blur the outside and inside separately, average blur results from multiple sigma values 
        int_blur = sum([gaussian((~color_mask).astype(float), sigma=int_sig) / len(self.internalBlurSigmas) for int_sig in self.internalBlurSigmas])
        ext_blur_mask = color_mask.astype(float) if self.name != 'obstacle' else cv2.dilate(color_mask.astype(float), np.ones((10, 10)))
        ext_blur = sum([gaussian(ext_blur_mask, sigma=ext_sig) / len(self.externalBlurSigmas) for ext_sig in self.externalBlurSigmas])

        # zero out the field where a different color is present
        if null_color_mask is not None:
            invalid_regions = ~(color_mask
            | null_color_mask
            | cv2.dilate(color_mask.astype(float), np.ones((int(np.mean(self.externalBlurSigmas)), int(np.mean(self.externalBlurSigmas))))).astype(bool))
            int_blur[invalid_regions] = 0
            ext_blur[invalid_regions] = 0

        # compute gradients
        dy_ext, dx_ext = np.gradient(ext_blur)
        dy_int, dx_int = np.gradient(int_blur)

        # combine the two blurs for internal/external
        dy = np.where(~color_mask, dy_ext, -dy_int)
        dx = np.where(~color_mask, dx_ext, -dx_int)

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

