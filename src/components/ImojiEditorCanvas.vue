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
      :getResultImage="getResultImage"
    ></slot>
    <div class="imoji-editor-wrapper">
      <div class="imoji-editor-container">
        <div id="sticker-wrapper" :class="[hide ? 'hide' : '']">
          <canvas id="sticker-canvas"></canvas>
        </div>
        <div id="uploaded-photo-wrapper">
          <img id="user-photo" ref="uploadedPhoto" :src="uploadedPhotoSrc" />
        </div>
      </div>
    </div>
    <div class="allToolBarWrapper">
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
    </div>
  </section>
</template>

<script>
import { PhotoEditor, StickerEditor } from '@/js/ImojiEditor.js';

export default {
  props: {
    isActiveRatioCrop: {
      type: Boolean,
      required: true
    },
    isActiveMove: {
      type: Boolean,
      required: true
    },
    errorMessage: {
      type: String,
      required: false,
      default: '편집할 사진을 선택해주세요'
    },
    width: {
      type: Number,
      required: false,
      default: document.documentElement.clientWidth
    },
    height: {
      type: Number,
      required: false,
      default: document.documentElement.clientHeight
    },
    // eslint-disable-next-line vue/require-default-prop
    defaultImage: {
      type: [Image, undefined],
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
      hide: true,
      zoomCount: 0
    };
  },
  watch: {
    defaultImage: {
      deep: true,
      immediate: true,
      handler() {
        if (this.defaultImage) {
          this.importPhoto();
        }
      }
    }
  },
  methods: {
    //# Handling target photo
    //라이브러리 외부에서 import하는 이미지가 있을 경우
    importPhoto() {
      this.uploadedPhotoSrc = this.defaultImage.src;
      this.initImageSrc = this.defaultImage.src;
      if (!this.photoCanvas) {
        this.photoCanvas = new PhotoEditor('user-photo', {
          minContainerHeight: this.height,
          minContainerWidth: this.width
        });
      }
    },
    //라이브러리 내부에서 사진을 교체하는 경우
    changePhoto(e) {
      this.uploadedPhotoSrc = URL.createObjectURL(e.target.files[0]);
      this.initImageSrc = URL.createObjectURL(e.target.files[0]);

      if (!this.photoCanvas) {
        this.photoCanvas = new PhotoEditor('user-photo', {
          minContainerHeight: this.height,
          minContainerWidth: this.width
        });
      }

      if (this.photoCanvas) {
        this.photoCanvas.changePhoto(this.uploadedPhotoSrc);
      }

      this.setPhotoCanvasSize();
    },
    //# Match sticker canvas - photo canvas dimensions
    //사진 편집 캔버스 사이즈를 저장한 후 스티커 캔버스 사이즈를 이에 맞춤
    async setPhotoCanvasSize(isFirstLoading = true) {
      const res = await this.photoCanvas.getPhotoSize(isFirstLoading);
      this.$set(this.photoCanvasSize, 0, res[0]);
      this.$set(this.photoCanvasSize, 1, res[1]);
      this.resizeStickerCanvas();
    },
    //스티커 캔버스 사이즈를 저장된 사진 편집 캔버스에 맞추는 함수
    resizeStickerCanvas() {
      const [width, height] = this.photoCanvasSize;

      if (this.stickerCanvas) {
        this.stickerCanvas.resizeStickerCanvas(width, height);
      }
    },
    //# Features of photo edit
    //확대, 회전 기능 함수
    zoom(x) {
      this.zoomCount += x;
      this.photoCanvas.zoom(x);
    },
    rotate(sign) {
      this.photoCanvas.rotate(sign);
      const [width, height] = this.photoCanvas.getRotatedCanvasSize();
      this.$set(this.photoCanvasSize, 0, width);
      this.$set(this.photoCanvasSize, 1, height);
      this.resizeStickerCanvas();
    },
    //사진과 스티커를 초기 상태로 되돌리는 함수
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
    //크롭 함수
    crop() {
      this.photoCanvas.finishCrop();
      this.setPhotoCanvasSize();
    },
    //최종 저장(완료)
    async getResultImage() {
      // case 1. 스티커 없이 편집만 해서 저장 => 잘됨 / canvas 상으로는 확대되어 보이는데 저장은 실제 크기로 저장됨
      if (!this.stickerCanvas && this.photoCanvas) {
        return this.photoCanvas.exportResultPhoto();
      }

      // case 2. 스티커만 붙여서 저장 => 잘 됨
      if (!this.photoCanvas && this.stickerCanvas) {
        const width = this.photoCanvas.getNatureSize()[0];
        return await this.photoCanvas.exportResultPhoto(
          this.stickerCanvas.saveStickerImage(width)
        );
      }

      // case 3. 편집, 스티커 둘 다 했을 때 저장 => 잘 됨
      if (this.photoCanvas && this.stickerCanvas) {
        const width = this.photoCanvas.getNatureSize()[0];
        return await this.photoCanvas.exportResultPhoto(
          this.stickerCanvas.saveStickerImage(width)
        );
      }
    },
    //# Handling edit mode
    //사진 편집 모드로 진입할 때의 동작
    openPhotoEditor() {
      if (!this.uploadedPhotoSrc) {
        alert(this.errorMessage);
        throw new Error('Please pick photo.');
      }

      this.hide = true;
      this.layout = 'tool-bar';

      this.setPhotoCanvasSize();
    },
    //스티커 편집 모드로 진입할 때의 동작
    openStickerEditor() {
      if (!this.uploadedPhotoSrc) {
        alert(this.errorMessage);
        throw new Error('Please pick photo.');
      }

      this.$parent.$data.isActiveRatioCrop = false;
      this.$parent.$data.isActiveMove = false;
      this.hide = false;
      this.layout = 'sticker-tool-bar';

      this.crop();
      this.photoCanvas.setDragMode('none');

      if (!this.stickerCanvas) {
        this.setPhotoCanvasSize();
        const [width, height] = this.photoCanvasSize;
        this.stickerCanvas = new StickerEditor('sticker-canvas', width, height);
      }

      if (this.photoCanvas) {
        if (this.zoomCount > 0) {
          this.photoCanvas.zoom(-1 * this.zoomCount);
          this.zoomCount = 0;
        }
        if (this.zoomCount < 0) {
          this.photoCanvas.zoom(Math.abs(this.zoomCount));
          this.zoomCount = 0;
        }
        this.photoCanvas.clear();
      }

      if (!this.photoCanvas) {
        this.setPhotoCanvasSize();
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
  max-height: 100vh;
}

.hide {
  display: none;
}

#uploaded-photo-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.allToolBarWrapper {
  position: absolute;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 2;
}
</style>
