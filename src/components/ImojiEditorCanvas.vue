<template>
  <div>
    <slot
      name="controllerBar"
      :stickerCanvas="stickerCanvas"
      :reset="reset"
      :importPhoto="importPhoto"
      :crop="crop"
      :layout="layout"
    ></slot>
    <div class="vue-photo-editor-wrapper">
      <div class="vue-photo-editor-container">
        <div id="sticker-wrapper">
          <canvas id="sticker-canvas"></canvas>
        </div>
        <div>
          <img id="user-photo" ref="uploadedPhoto" :src="uploadedPhotoSrc" />
        </div>
      </div>
    </div>
    <slot name="toolBar" :photoCanvas="photoCanvas" :layout="layout"></slot>
    <slot
      name="stickerToolBar"
      :stickerCanvas="stickerCanvas"
      :layout="layout"
    ></slot>
    <slot
      name="toolNavigation"
      :photoCanvas="photoCanvas"
      :openPhotoEditor="openPhotoEditor"
      :importPhoto="importPhoto"
      :openStickerEditor="openStickerEditor"
      :crop="crop"
    ></slot>
  </div>
</template>

<script>
import { PhotoEditor, StickerEditor } from '@/js/editor.js';

export default {
  data() {
    return {
      layout: '',
      stickerCanvas: undefined,
      photoCanvas: undefined,
      photoCanvasSize: [0, 0],
      uploadedPhotoSrc: '',
      initImageSrc: '',
      previousImageSrc: ''
    };
  },
  methods: {
    importPhoto(e) {
      this.uploadedPhotoSrc = URL.createObjectURL(e.target.files[0]);
      this.initImageSrc = this.uploadedPhotoSrc;

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
    reset() {
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
      this.setPhotoCanvasSize();
    },
    openPhotoEditor() {
      if (!this.uploadedPhotoSrc) {
        alert('편집할 사진을 선택해주세요');
        throw new Error('Please pick photo.');
      }

      this.layout = 'tool-bar';

      if (!this.photoCanvas) {
        this.photoCanvas = new PhotoEditor('user-photo', {
          zoomOnWheel: false,
          background: false
        });
      }

      if (this.stickerCanvas) {
        //To Do : 돔에 직접 접근하지 않는 방법 알아보기
        document.getElementById('sticker-wrapper').classList.add('hide');
      }
    },
    openStickerEditor() {
      if (!this.uploadedPhotoSrc) {
        alert('스티커를 붙일 사진을 선택해주세요');
        throw new Error('Please pick photo.');
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

.vue-photo-editor-container {
  position: relative;
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

.hide {
  display: none;
}
</style>
