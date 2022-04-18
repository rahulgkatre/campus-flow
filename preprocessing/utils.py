import matplotlib.pyplot as plt
import numpy as np
import cv2

def read_img(path: str):
    '''
    Read an image from a path and return it as a numpy array
    '''
    return cv2.cvtColor(
        cv2.imread(path),
        cv2.COLOR_BGR2RGB)

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

def normalize_field(field):
    '''
    Max-normalize the field based on magnitude of vec
    '''
    # divide each vector by max of magnitude of any vector
    magnitude = np.linalg.norm(field, axis=2)
    field = field / np.max(magnitude)

    return field

def add_noise(field, noise_level=10):
    '''
    Add noise to the vector field
    '''
    field += np.random.normal(0, noise_level, field.shape)
    return field

def crop(data, center, lim):
    return data[center[1]-lim:center[1]+lim, center[0]-lim:center[0]+lim]


def get_field_str(field_):
    '''
    Convert the vector field to a string for saving
    '''
    fieldStr = 'export const field = `\n'
    for y in range(0,512):
        for x in range(0,512):
            fieldStr += f'[{field_[y,x,0]:.2f},{field_[y,x,1]:.2f}] '
        fieldStr += '\n'
    return fieldStr + '`;\nexport default field;\n'

def write_field_file(field_, path: str='map.ts'):
    '''
    Save the vector field string as a file
    '''
    fieldStr = get_field_str(field_)
    with open(path, 'w') as f:
        f.write(fieldStr)