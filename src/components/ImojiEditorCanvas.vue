<template>
  <section>
    <slot
      name="controllerBar"
      :reset="reset"
      :stickerCanvas="stickerCanvas"
      :changePhoto="changePhoto"
      :crop="crop"
      :layout="layout"
      :photoCanvas="photoCanvas"
    ></slot>
    <div class="imoji-editor-wrapper">
      <div class="imoji-editor-container">
        <div id="sticker-wrapper" :class="[hide ? 'hide' : '']">
          <canvas id="sticker-canvas"></canvas>
        </div>
        <div class="uploaded-photo-wrapper">
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
      name="ratioCropToolBar"
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
import { PhotoEditor, StickerEditor } from '@/js/ImojiEditor.js';

let isInitZoom = true;
let isCropped = false;

export default {
  props: {
    defaultImage: {
      type: Image,
      required: false
    }
  },
  data() {
    return {
      layout: '',
      stickerCanvas: undefined,
      photoCanvas: undefined,
      photoCanvasSize: [0, 0],
      uploadedPhotoSrc: '',
      initImageSrc: '',
      previousImageSrc: '',
      initZoomLevel: 0,
      hide: true
    };
  },
  watch: {
    defaultImage: {
      deep: true,
      immediate: true,
      handler() {
        this.importPhoto();
      }
    }
  },
  mounted() {
    this.importPhoto();
  },
  methods: {
    importPhoto() {
      this.uploadedPhotoSrc = this.defaultImage.src;
      this.initImageSrc = this.defaultImage.src;
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
    crop() {
      // To Do : crop시에만 move 버튼 활성화
      // crop 버튼 누르면 기본적으로 auto crop세팅
      this.photoCanvas.finishCrop();
      isCropped = true;
      this.setPhotoCanvasSize();
      isInitZoom = true;
    },
    openPhotoEditor() {
      if (!this.uploadedPhotoSrc) {
        alert('편집할 사진을 선택해주세요');
        throw new Error('Please pick photo.');
      }

      this.hide = true;
      this.layout = 'tool-bar';

      if (!this.photoCanvas) {
        this.photoCanvas = new PhotoEditor('user-photo');
      }

      this.setPhotoCanvasSize();
    },
    openStickerEditor() {
      if (!this.uploadedPhotoSrc) {
        alert('스티커를 붙일 사진을 선택해주세요');
        throw new Error('Please pick photo.');
      }

      this.hide = false;
      this.layout = 'sticker-tool-bar';

      // 스티커 캔버스 첫 생성
      if (!this.stickerCanvas) {
        console.log('첫 생성');
        this.setPhotoCanvasSize();
        const [width, height] = this.photoCanvasSize;
        this.stickerCanvas = new StickerEditor('sticker-canvas', width, height);
      }

      // edit 눌렀다
      if (this.photoCanvas) {
        console.log('edit누르고 sticker누름');
        this.photoCanvas.clear();
        // 아무것도 안 함
        // crop 완료 => crop 메소드에서 처리
        if (!isCropped) {
          // zoom만 발생 => zoom 복구
          console.log('크롭하지 않음');
          // To Do : edit 버튼을 누르고 sticker 버튼을 누르면 width height가 0으로 설정 - 원인은 아래 코드 때문임
          // this.photoCanvas.resetZoomLevel(this.initZoomLevel);
        }
      } else {
        // eidt 안 눌렀다
        console.log('edit 안 누름');
        this.setPhotoCanvasSize();
      }
    },
    turnToRatioCrop() {
      this.layout = 'aspect-ratio';
    },
    turnToFreeCrop() {
      this.layout = 'image-detail-editor';
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
.imoji-editor-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.imoji-editor-container {
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

.uploaded-photo-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
