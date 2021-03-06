import { loadJs, loadCss } from '@/js/utils.js';
loadJs(
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js'
);
loadCss(
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css'
);
loadJs('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/451/fabric.min.js');

export class PhotoEditor {
  constructor(selector, options) {
    /**
     * Create a new Cropper for edit Photo
     * @param {string} selector - img or canvas element (The target element for cropping.)
     * @param {Object} options - The configuration options.
     */
    if (!selector) throw new Error('Please provide a selector.');
    this.userImage = document.querySelector(selector);
    // eslint-disable-next-line no-undef
    this.cropper = new Cropper(this.userImage, {
      viewMode: 1,
      background: false,
      autoCrop: false,
      autoCropArea: 0.5,
      dragMode: 'none',
      zoomOnWheel: false,
      zoomOnTouch: false,
      ...options
    });
  }

  changeImage(src) {
    this.cropper.replace(src);
  }

  setDragMode(mode) {
    this.cropper.setDragMode(mode);
  }

  getPhotoCanvasSize() {
    return new Promise((resolve, reject) => {
      try {
        this.userImage.addEventListener(
          'ready',
          () => {
            const { width, height } = this.cropper.getCanvasData();
            resolve([width, height]);
          },
          { once: true }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Return Canvas area dimensions
   * @returns Canvas's width, height (Number)
   */
  getRotatedCanvasSize() {
    const { width, height } = this.cropper.getCanvasData();
    return [width, height];
  }

  reset() {
    this.cropper.reset();
  }

  clear() {
    this.cropper.clear();
  }

  disable() {
    this.cropper.disable();
  }

  destroy() {
    this.cropper.destroy();
  }

  /**
   * Crop Image
   * @param {string} imgType - same as original image type
   */
  finishCrop(imgType) {
    const canvas = this.cropper.getCroppedCanvas();
    const croppedImgSrc = canvas.toDataURL(imgType);
    this.cropper.replace(croppedImgSrc);
  }

  /**
   * Set two number for calculate ratio (x/y) of crop box
   * @param {number} x - numerator
   * @param {number} y - denominator
   */
  setCropRatio(x, y) {
    if (!x && !y) throw new Error('Please provide a ratio of crop box.');
    this.cropper.setDragMode('crop');
    this.cropper.crop();
    this.cropper.setAspectRatio(x / y);
  }

  setFreeCrop() {
    this.cropper.setDragMode('crop');
    this.cropper.crop();
    this.cropper.setAspectRatio(NaN);
  }

  /**
   * Set sign of 90 degree rotate
   * @param {string} sign - '+' or '-'
   */
  rotate(sign) {
    if (sign === '+') this.cropper.rotate(90);
    if (sign === '-') this.cropper.rotate(-90);
  }

  /**
   * Set direction of flip canvas
   * @param {string} direction - 'X' or 'Y'
   */
  flip(direction) {
    if (direction === direction.toLowerCase())
      direction = direction.toUpperCase();
    if (direction === 'X')
      this.cropper.scaleX(-this.cropper.getData().scaleX || -1);
    if (direction === 'Y')
      this.cropper.scaleY(-this.cropper.getData().scaleY || -1);
  }

  /**
   * Set ratio of zoom in or zoom out
   * @param {number} x - positive for zoom in, negative for zoom out
   */
  zoom(x) {
    this.cropper.zoom(x);
  }

  /**
   * Export result photo image object when edited with sticker
   * @param {Image} stickerImage - Image Object of sticker canvas result
   * @param {string} imgType - same as original image type
   * @returns Promise (for [HTMLCanvasElement, imgType])
   */
  exportWithSticker(stickerImage, imgType) {
    const canvas = this.cropper.getCroppedCanvas();
    const context = canvas.getContext('2d');

    const loadResultImage = new Promise(resolve => {
      stickerImage.onload = () => {
        context.drawImage(stickerImage, 0, 0);
        resolve([canvas, imgType]);
      };
    });

    return loadResultImage;
  }

  /**
   * Export result photo image object when only edited
   * @param {string} imgType
   * @returns [HTMLCanvasElement, imgType]
   */
  exportOnlyImage(imgType) {
    return [this.cropper.getCroppedCanvas(), imgType];
  }

  /**
   * Get natural size about original image
   * @returns natural size about original image
   */
  getNaturalSize() {
    const canvas = this.cropper.getCroppedCanvas();
    return [canvas.width, canvas.height];
  }
}

export class StickerEditor {
  /**
   * Create a new fabric Canvas for add Sticker
   * @param {Element} canvasID - The id of canvas element
   * @param {Object} options - The option of image
   */
  constructor(canvasID, width, height) {
    if (!canvasID)
      throw new Error('Please provide a canvas element with id canvas.');

    // eslint-disable-next-line no-undef
    this.stickerCanvas = new fabric.Canvas(canvasID);

    if (width && height) {
      this.resizeStickerCanvas(width, height);
    }

    this.stickerCanvas.backgroundColor = null;

    this.stickerCanvas.renderAll.bind(this.stickerCanvas)();
  }

  /**
   * Add sticker image on canvas
   * @param {string} src - The src of sticker image
   * @param {Object} options - The options of sticker image
   */
  addSticker(src, options) {
    // eslint-disable-next-line no-undef
    fabric.Image.fromURL(
      src,
      sticker => {
        sticker.scaleToWidth(this.stickerCanvas.width * 0.2);
        sticker.scaleToHeight(this.stickerCanvas.width * 0.2);
        this.stickerCanvas.add(sticker).renderAll();
      },
      {
        borderColor: '#39f',
        cornerColor: '#39f',
        cornerSize: 5,
        transparentCorners: false,
        originX: 'center',
        originY: 'center',
        left: this.stickerCanvas.width / 2,
        top: this.stickerCanvas.height / 2,
        ...options
      }
    );
  }

  /**
   * Resize sticker canvas's width => natural width of the original image
   * @param {number} naturalWidth
   */
  resizeStickerToNatural(naturalWidth) {
    if (this.stickerCanvas.width != naturalWidth) {
      const scaleMultiplier = naturalWidth / this.stickerCanvas.width;
      const objects = this.stickerCanvas.getObjects();
      for (let i in objects) {
        objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
        objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
        objects[i].left = objects[i].left * scaleMultiplier;
        objects[i].top = objects[i].top * scaleMultiplier;
        objects[i].setCoords();
      }

      this.stickerCanvas.discardActiveObject();
      this.stickerCanvas.setWidth(
        this.stickerCanvas.getWidth() * scaleMultiplier
      );
      this.stickerCanvas.setHeight(
        this.stickerCanvas.getHeight() * scaleMultiplier
      );
      this.stickerCanvas.renderAll();
      this.stickerCanvas.calcOffset();
    }
  }

  /**
   * Return result sticker image object
   * @param {number} naturalWidth
   * @returns Image Object (png)
   */
  saveStickerImage(naturalWidth) {
    this.resizeStickerToNatural(naturalWidth);
    //export sticker image
    const stickerImage = new Image();
    stickerImage.src = this.stickerCanvas.toDataURL('image/png');
    return stickerImage;
  }

  /**
   * Resize Sticker Canvas (ex. after crop, rotate)
   * @param {number | string} width
   * @param {number | string} height
   */
  resizeStickerCanvas(width, height) {
    this.stickerCanvas.setDimensions({
      width,
      height
    });
  }

  removeAllSticker() {
    this.stickerCanvas.clear();
  }

  removeSticker() {
    const selectedSticker = this.stickerCanvas.getActiveObject();
    this.stickerCanvas.remove(selectedSticker);
  }
}
