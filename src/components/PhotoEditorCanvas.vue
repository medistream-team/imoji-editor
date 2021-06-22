<template>
  <div>
    <slot name="imageController"></slot>
    <div class="vue-photo-editor-wrapper">
      <div id="sticker-wrapper">
        <canvas id="sticker-canvas"></canvas>
      </div>
      <div>
        <img id="user-photo" :src="userPhoto" />
      </div>
    </div>

    <slot name="detailEditor"></slot>
    <slot name="aspectRatioCrop"></slot>
    <slot name="sticker"></slot>
    <slot name="imageEditor"></slot>
  </div>
</template>

<script>
import Vue from 'vue';
import { PhotoEditor, StickerEditor } from '@/js/editor.js';

export default {
  data() {
    return {
      uploadedPhotoSrc: null,
      stickerCanvas: null,
      photoCanvas: null,
      photoCanvasSize: [0, 0]
    };
  },
  methods: {
    //To Do : inline으로 넘기기
    addSticker(e) {
      this.stickerCanvas.addSticker(e.target.src);
    },
    rotateRight() {
      this.photoCanvas.rotate('+');
    },
    rotateLeft() {
      this.photoCanvas.rotate('-');
    },
    freeCrop() {
      this.photoCanvas.setFreeCrop();
    },
    ratioCrop() {
      this.photoCanvas.setCropRatio(16, 9);
    },
    flipX() {
      this.photoCanvas.flip('X');
    },
    flipY() {
      this.photoCanvas.flip('Y');
    },
    reset() {
      //To Do : 스티커 모드일 때는 스티커 다 지우기
      this.photoCanvas.reset();
    },
    zoomIn() {
      this.photoCanvas.zoomIn();
    },
    zoomOut() {
      this.photoCanvas.zoomOut();
    },
    deleteSticker() {
      this.stickerCanvas.removeSticker();
    },
    //여기서부터는 methods에서 관리
    setCanvasDimension() {
      //resize sticker canvas size by cropped size
      const { uploadedPhoto } = this.$refs;
      console.log('set');

      // 이미지를 업로드하고 포토 캔버스를 불러오지 않은 상황에서 포토캔버스의 디멘션을 구하려 하니까 에러가 남
      // 포토 캔버스가 없으니까 이미지 본연의 크기를 저장함
      if (!this.photoCanvas) {
        uploadedPhoto.addEventListener('load', () => {
          Vue.set(this.photoCanvasSize, 0, uploadedPhoto.width);
          Vue.set(this.photoCanvasSize, 1, uploadedPhoto.height);
        });

        uploadedPhoto.removeEventListener('load', () => {
          Vue.set(this.photoCanvasSize, 0, uploadedPhoto.width);
          Vue.set(this.photoCanvasSize, 1, uploadedPhoto.height);
        });
        return;
      }

      if (this.photoCanvas) {
        // 이미지를 업로드하고 포토 캔버스를 불러온 상황
        uploadedPhoto.addEventListener('load', () => {
          const [width, height] = this.photoCanvas.getContainerDimension();
          Vue.set(this.photoCanvasSize, 0, width);
          Vue.set(this.photoCanvasSize, 1, height);
        });

        uploadedPhoto.removeEventListener('load', () => {
          const [width, height] = this.photoCanvas.getContainerDimension();
          Vue.set(this.photoCanvasSize, 0, width);
          Vue.set(this.photoCanvasSize, 1, height);
        });
      }
    },
    resizeStickerCanvas() {
      console.log('resize');
      const [width, height] = this.photoCanvasSize;
      if (this.stickerCanvas) {
        this.stickerCanvas.resizeStickerCanvas(width, height);
      }
    },
    importPhoto(e) {
      this.uploadedPhotoSrc = URL.createObjectURL(e.target.files[0]);
      // 이미 로드되어 캔버스가 있는 상황에서 재 업로드
      if (this.photoCanvas) {
        this.photoCanvas.changePhoto(this.uploadedPhotoSrc);
        this.setCanvasDimension();
        this.resizeStickerCanvas();
        return;
      }
      // 첫 로드 때 사진 dimension 저장, 스티커 캔버스 사이즈 결정
      this.setCanvasDimension();
      this.resizeStickerCanvas();
    },
    crop() {
      //Bug : 크롭 여러번 했을 때 크기 저장이 제대로 안됨 (undefined)
      console.log('before', this.photoCanvasSize);
      this.photoCanvas.finishCrop();
      //크롭한 크기 저장
      //set, resize가 crop한 이미지가 load되는 것보다 먼저 발생해서 load 이벤트리스너 걸었음
      const { uploadedPhoto } = this.$refs;
      uploadedPhoto.addEventListener('load', () => {
        this.setCanvasDimension();
        this.resizeStickerCanvas();
      });

      uploadedPhoto.removeEventListener('load', () => {
        this.setCanvasDimension();
        this.resizeStickerCanvas();
      });

      console.log('after', this.photoCanvasSize);
    },
    openEditor() {
      if (!this.uploadedPhotoSrc) {
        alert('편집할 사진을 선택해주세요');
        throw new Error('Please pick photo.');
      }

      this.layout = 'image-detail-editor';

      if (!this.photoCanvas) {
        this.photoCanvas = new PhotoEditor('user-photo', {
          zoomOnWheel: false,
          background: false
        });
      }

      if (this.stickerCanvas) {
        document.getElementById('sticker-wrapper').classList.add('hide');
      }
    },
    openSticker() {
      if (!this.uploadedPhotoSrc) {
        alert('스티커를 붙일 사진을 선택해주세요');
        throw new Error('Please pick photo.');
      }

      this.layout = 'sticker-editor';

      const [width, height] = this.photoCanvasSize;
      if (this.photoCanvas) {
        this.photoCanvas.clear();
        document.getElementById('sticker-wrapper').classList.remove('hide');
      }

      if (!this.stickerCanvas) {
        this.stickerCanvas = new StickerEditor('sticker-canvas', width, height);
      }
    },
    getResultImageSrc() {
      // case 1. 스티커 없이 편집만 해서 저장
      if (!this.stickerCanvas) {
        this.photoCanvas.saveEditedPhoto();
      }

      // case 2. 스티커만 붙여서 저장
      if (!this.photoCanvas) {
        this.stickerCanvas.saveResultImg(this.uploadedPhotoSrc);
      }

      // case 3. 편집, 스티커 둘 다 했을 때 저장
      if (this.photoCanvas && this.stickerCanvas) {
        this.stickerCanvas.saveResultImg(this.photoCanvas.saveEditedPhoto());
      }

      //결과물 src를 가지고 image 요소를 만들거나 files 인스턴스를 만들어서 form data에 싸서 서버로 post => 이용자가 알아서...
    }
  }
};
</script>

<style scoped>
.vue-photo-editor-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

#sticker-wrapper {
  position: absolute;
  top: 0;
  z-index: 1;
}

#user-photo {
  display: block;
  max-width: 100%;
}
</style>
