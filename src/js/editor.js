import Cropper from 'cropperjs';
import { fabric } from 'fabric';
import 'cropperjs/dist/cropper.css';

export class PhotoEditor {
  constructor(selector, options) {
    /*
     * Create a new Cropper for edit Photo
     * @param {string} selector - id of img/canvas element(The target element for cropping.)
     * @param {Object} options - The configuration options.
     */
    if (!selector) throw new Error('Please provide a selector.');
    this.userImage = document.getElementById(selector);
    this.cropper = new Cropper(this.userImage, {
      viewMode: 2,
      autoCrop: false,
      dragMode: 'none',
      ...options
    });
  }

  //controllers
  reset() {
    this.cropper.reset();
  }

  clear() {
    this.cropper.clear();
  }

  getContainerDimension() {
    const { width, height } = this.cropper.getImageData();
    return [width, height];
  }

  //tools
  getCropped() {
    const canvas = this.cropper.getCroppedCanvas();
    const croppedImgSrc = canvas.toDataURL();
    return croppedImgSrc;
  }

  /*
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

  /*
   * Set sign of rotate direction
   * @param {string} sign - '+' or '-'
   */
  rotate(sign) {
    this.cropper.clear();
    if (sign === '+') this.cropper.rotate(90);
    if (sign === '-') this.cropper.rotate(-90);
  }

  /*
   * Set direction of flip canvas
   * @param {string} direction - 'X' or 'Y'
   */
  flip(direction) {
    this.cropper.clear();
    if (direction === direction.toLowerCase())
      direction = direction.toUpperCase();
    if (direction === 'X') this.cropper.scaleX(-1);
    if (direction === 'Y') this.cropper.scaleY(-1);
  }
}

export class StickerEditor {
  /*
   * Create a new fabric Canvas for add Sticker
   * @param {Element} canvasID - The id of canvas element
   * @param {Object} options - The option of image
   */
  constructor(canvasID, width, height) {
    if (!canvasID)
      throw new Error('Please provide a canvas element with id canvas.');
    this.stickerCanvas = new fabric.Canvas(canvasID);
    if (width && height) {
      this.stickerCanvas.setDimensions({ width, height });
    }
    this.stickerCanvas.backgroundColor = null;
    this.stickerCanvas.renderAll.bind(this.stickerCanvas)();
  }

  /*
   * @param {string} src - The src of sticker image
   * @param {Object} options - The options of sticker image
   */
  addSticker(src, options) {
    fabric.Image.fromURL(
      src,
      sticker => {
        this.stickerCanvas.add(sticker);
      },
      options
    );
  }

  hideCanvas() {
    this.stickerCanvas.classList.add('hide');
  }

  showCanvas() {
    this.stickerCanvas.classList.remove('hide');
  }
}
