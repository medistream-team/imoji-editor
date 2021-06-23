import Cropper from 'cropperjs';
import { fabric } from 'fabric';
import 'cropperjs/dist/cropper.css';

export class PhotoEditor {
  constructor(selector, options) {
    /**
     * Create a new Cropper for edit Photo
     * @param {string} selector - Id of img or canvas element(The target element for cropping.)
     * @param {Object} options - The configuration options.
     */
    if (!selector) throw new Error('Please provide a selector.');
    this.userImage = document.getElementById(selector);
    this.cropper = new Cropper(this.userImage, {
      viewMode: 2,
      autoCrop: false,
      dragMode: 'none',
      minContainerHeight: document.documentElement.clientHeight,
      minContainerWidth: document.documentElement.clientWidth,
      ...options
    });
  }

  changePhoto(src) {
    this.cropper.replace(src);
  }

  getPhotoSize() {
    return new Promise((resolve, reject) => {
      try {
        this.userImage.addEventListener(
          'ready',
          () => {
            const { width, height } = this.cropper.getImageData();
            resolve([width, height]);
          },
          { once: true }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  reset() {
    this.cropper.reset();
  }

  clear() {
    this.cropper.clear();
  }

  disable() {
    const stickerCanvas = document.querySelector('.canvas-container');
    stickerCanvas && this.cropper.disable();
  }

  //To Do : undo
  undo() {
    //아래 메소드는 이전 크롭박스 상태만 기억. 크롭하고, undo시 직전의 크롭박스가 유지됨
    this.cropper.restore();
    //flip, zoom 등등도 undo 되도록
    //지금 생각나는 것은 edit이 일어날 때마다 그때의 상태를 img url로 만들어서 previous url에 저장
  }

  finishCrop() {
    const canvas = this.cropper.getCroppedCanvas();
    const croppedImgSrc = canvas.toDataURL();
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
   * Set sign of rotate direction
   * @param {string} sign - '+' or '-'
   */
  rotate(sign) {
    this.cropper.clear();
    if (sign === '+') this.cropper.rotate(90);
    if (sign === '-') this.cropper.rotate(-90);
  }

  /**
   * Set direction of flip canvas
   * @param {string} direction - 'X' or 'Y'
   */
  flip(direction) {
    this.cropper.clear();
    if (direction === direction.toLowerCase())
      direction = direction.toUpperCase();
    if (direction === 'X')
      this.cropper.scaleX(-this.cropper.getData().scaleX || -1);
    if (direction === 'Y')
      this.cropper.scaleY(-this.cropper.getData().scaleY || -1);
  }

  zoomIn() {
    this.cropper.zoom(0.1);
  }

  zoomOut() {
    this.cropper.zoom(-0.1);
  }

  saveEditedPhoto() {
    const canvas = this.cropper.getCroppedCanvas();
    const editedPhotoSrc = canvas.toDataURL();
    return editedPhotoSrc;
  }

  /**
   * @param {string} fileName - (optional)
   * @param {number} quality - quality of image (optional)
   * @return {FormData} FromData of editedPhoto
   */
  exportFormData(fileName, quality) {
    this.cropper.getCroppedCanvas().toBlob(blob => {
      const formData = new FormData();
      if (fileName && quality) {
        formData.append('editedPhoto', blob, fileName, quality);
        return formData;
      }
      formData.append('editedPhoto', blob);
      return formData;
    });
  }
}

export class StickerEditor {
  /**
   * Create a new fabric Canvas for add Sticker
   * @param {Element} canvasID - The id of canvas element
   * @param {Object} options - The option of image
   */
  //To Do : 스티커 컨트롤러 색상 & 이미지 컨트롤러 색상 통일 (옵션으로 지정)
  constructor(canvasID, width, height) {
    if (!canvasID)
      throw new Error('Please provide a canvas element with id canvas.');
    this.stickerCanvas = new fabric.Canvas(canvasID);
    if (width && height) {
      this.resizeStickerCanvas(width, height);
    }
    this.stickerCanvas.backgroundColor = null;
    this.stickerCanvas.renderAll.bind(this.stickerCanvas)();
  }

  /**
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

  /**
   *
   * @param {string} editedPhoto - src of editedPhoto from PhotoEditor
   * @returns {string} Src of merged image
   */
  saveResultImg(editedPhoto) {
    //put editedPhoto behind sticker
    this.stickerCanvas.setBackgroundImage(
      editedPhoto,
      this.stickerCanvas.renderAll.bind(this.stickerCanvas),
      {
        originX: 'left',
        originY: 'top'
      }
    );
    //save to img
    const resultImgSrc = this.stickerCanvas.toDataURL('image/png');
    const resultElement = new Image();
    resultElement.src = resultImgSrc;
    return resultElement;
  }

  /**
   * Resize Sticker Canvas (ex. after crop)
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
