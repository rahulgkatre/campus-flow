import matplotlib.pyplot as plt
import numpy as np

def crop(data, center, lim):
    return data[center[1]-lim:center[1]+lim, center[0]-lim:center[0]+lim]

def display_image(image, cmap='gray'):
    '''
    Use matplotlib to display an image
    '''
    plt.figure(figsize=(32,32))
    plt.imshow(image, cmap=cmap)
    plt.axis('off')
    plt.show()    

def get_color_mask(color, img):
    '''
    Create a mask for where a color is located on the image.
    To do this we need to create 3 masks, one for each color channel, and AND them together.
    '''
    return ((img[:, :, 0] == color[0]) & (img[:, :, 1] == color[1]) & (img[:, :, 2] == color[2]))

def plot_vector_field(dy, dx, center, lim):
    '''
    Plot the vector field at a given center with bounds of [center-lim,center+lim] in both x,y directions
    '''

    pixels = np.linspace(0, 512, 512, endpoint=False).astype(int)
    x, y = np.meshgrid(pixels, pixels)

    plt.figure(figsize=(32,32))

    # Reverse y coordinates because image and axes y are reverses.
    plt.quiver(crop(x,center,lim), crop(y,center,lim)[::-1], crop(dx,center,lim), crop(dy,center,lim))
    plt.axis('off')
    plt.show()