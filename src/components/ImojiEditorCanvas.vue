<template>
  <section>
    <slot
      name="controllerBar"
      :reset="reset"
      :stickerCanvas="stickerCanvas"
      :changePhoto="changePhoto"
      :crop="crop"
      :layout="layout"
    ></slot>
    <div class="vue-photo-editor-wrapper">
      <div class="vue-photo-editor-container">
        <div id="sticker-wrapper">
          <canvas id="sticker-canvas"></canvas>
        </div>
        <div class="user-photo-wrapper">
          <img id="user-photo" ref="uploadedPhoto" :src="uploadedPhotoSrc" />
        </div>
      </div>
    </div>
    <slot
      name="toolBar"
      :photoCanvas="photoCanvas"
      :layout="layout"
      :zoom="zoom"
      :rotate="rotate"
    ></slot>
    <slot
      name="stickerToolBar"
      :stickerCanvas="stickerCanvas"
      :layout="layout"
    ></slot>
    <slot
      name="aspectRatioCrop"
      :photoCanvas="photoCanvas"
      :layout="layout"
    ></slot>
    <slot
      name="toolNavigation"
      :openPhotoEditor="openPhotoEditor"
      :openStickerEditor="openStickerEditor"
    ></slot>
  </section>
</template>

<script>
import { PhotoEditor, StickerEditor } from '@/js/imojiEditor.js';

let isInitZoom = true;
let isCropped = false;

export default {
  props: ['defaultImage'],
  data() {
    return {
      layout: '',
      stickerCanvas: undefined,
      photoCanvas: undefined,
      photoCanvasSize: [0, 0],
      uploadedPhotoSrc: '',
      initImageSrc: '',
      previousImageSrc: '',
      initZoomLevel: 0
    };
  },
  watch: {
    test() {}
  },
  mounted() {
    this.importPhoto();
  },
  methods: {
    importPhoto() {
      this.uploadedPhotoSrc = this.defaultImage.src;
      this.initImageSrc = this.defaultImage.src;

      // 밖에서 넣어주는 default 이미지를 다루는 함수를 importPhoto로 하기 (watch가 관리)
      // 컴포넌트를 설치하는 순간부터 watch가 돌게 할 수 있다. vue watch immediate
      // default-image 변경되는것을 watch가 관찰하여 변경이 발생하면 importPhoto가 실행되게 하기
    },
    turnToRatioCrop() {
      this.layout = 'aspect-ratio';
    },
    turnToFreeCrop() {
      this.layout = 'image-detail-editor';
    },
    changePhoto(e) {
      this.uploadedPhotoSrc = URL.createObjectURL(e.target.files[0]);
      this.initImageSrc = URL.createObjectURL(e.target.files[0]);

      if (this.photoCanvas) {
        this.photoCanvas.changePhoto(this.uploadedPhotoSrc);
      }

      this.$refs.uploadedPhoto.addEventListener(
        'load',
        () => {
          this.setPhotoCanvasSize();
          this.resizeStickerCanvas();
        },
        { once: true }
      );
    },
    zoom(x) {
      if (isInitZoom) {
        this.initZoomLevel = this.photoCanvas.getInitZoomLevel();
        isInitZoom = false;
      }
      this.photoCanvas.zoom(x);
    },
    rotate(sign) {
      this.photoCanvas.rotate(sign);
      const [width, height] = this.photoCanvas.getRotatedCanvasSize();
      this.$set(this.photoCanvasSize, 0, width);
      this.$set(this.photoCanvasSize, 1, height);
      this.resizeStickerCanvas();
    },
    reset() {
      isCropped = false;

      if (this.photoCanvas) {
        this.photoCanvas.changePhoto(this.initImageSrc);

        if (this.photoCanvas) {
          this.photoCanvas.clear();
        }

        this.$refs.uploadedPhoto.addEventListener(
          'load',
          () => {
            this.setPhotoCanvasSize();
            this.resizeStickerCanvas();
          },
          { once: true }
        );
      }

      if (this.stickerCanvas) {
        this.stickerCanvas.removeAllSticker();
      }
    },
    async setPhotoCanvasSize() {
      if (!this.photoCanvas) {
        const { uploadedPhoto } = this.$refs;
        this.$set(this.photoCanvasSize, 0, uploadedPhoto.width);
        this.$set(this.photoCanvasSize, 1, uploadedPhoto.height);
        return;
      }

      const res = await this.photoCanvas.getPhotoSize();
      this.$set(this.photoCanvasSize, 0, res[0]);
      this.$set(this.photoCanvasSize, 1, res[1]);
      this.resizeStickerCanvas();
    },
    resizeStickerCanvas() {
      const [width, height] = this.photoCanvasSize;

      if (this.stickerCanvas) {
        this.stickerCanvas.resizeStickerCanvas(width, height);
      }
    },
    crop() {
      this.photoCanvas.finishCrop();
      isCropped = true;
      this.setPhotoCanvasSize();
      isInitZoom = true;
      //크롭된 사진의 비율을 업데이트해야함
    },
    openPhotoEditor() {
      if (!this.uploadedPhotoSrc) {
        alert('편집할 사진을 선택해주세요');
        throw new Error('Please pick photo.');
      }

      document.getElementById('sticker-wrapper').classList.add('hide');
      this.layout = 'tool-bar';

      if (!this.photoCanvas) {
        this.photoCanvas = new PhotoEditor('user-photo');
      }
    },
    openStickerEditor() {
      if (!this.uploadedPhotoSrc) {
        alert('스티커를 붙일 사진을 선택해주세요');
        throw new Error('Please pick photo.');
      }

      if (!isCropped) {
        this.photoCanvas.resetZoomLevel(this.initZoomLevel);
      }

      this.layout = 'sticker-tool-bar';

      if (this.photoCanvas) {
        this.photoCanvas.clear();
        //To Do : 돔에 직접 접근하지 않는 방법 알아보기
        document.getElementById('sticker-wrapper').classList.remove('hide');
      }

      if (!this.stickerCanvas) {
        const [width, height] = this.photoCanvasSize;
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

.vue-photo-editor-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

#sticker-wrapper {
  position: absolute;
  z-index: 1;
}

#user-photo {
  display: block;
  max-width: 100%;
}

.hide {
  display: none;
}

.user-photo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
