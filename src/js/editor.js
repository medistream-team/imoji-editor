import Cropper from 'cropperjs';
import { fabric } from './fabric.js';

export class photoEditor {
  constructor(selector, options) {
    /*
     * Create a new Cropper for edit Photo
     * @selector {String} id of img/canvas element - The target element for cropping.
     * @options {Object} [options={}] - The configuration options.
     */
    if (!selector) throw new Error('Please provide a selector.');
    this.userImage = document.getElementById(selector);
    this.cropper = new Cropper(this.userImage, options);
  }

  //controllers
  reset() {
    this.cropper.reset();
  }

  clear() {
    this.cropper.clear();
  }

  //tools
  getCropped() {
    const canvas = this.cropper.getCroppedCanvas();
    const previewURL = canvas.toDataURL();
    return previewURL;
  }
}

export class stickerEditor {
  constructor(canvasID) {
    /*
     * Create a new fabric Canvas for add Sticker
     * @canvasID {Element} The id of canvas element
     * @options {Object} The option of image
     */
    if (!canvasID)
      throw new Error('Please provide a canvas element with id canvas.');
    this.stickerCanvas = new fabric.Canvas(canvasID);
    this.stickerCanvas.backgroundColor = null;
    this.stickerCanvas.renderAll.bind(this.stickerCanvas)();
  }

  addSticker(src, options) {
    /*
     * @src {String} The src of sticker image
     * @options {Object} The options of sticker image
     */
    fabric.Image.fromURL(
      src,
      sticker => {
        this.stickerCanvas.add(sticker);
      },
      options
    );
  }

  hideCanvas() {
    this.stickerCanvas.classList.toggle('hide');
  }
}
