<template>
  <div>
    <slot name="imageController" :reset="reset"></slot>
    <div class="vue-photo-editor-wrapper">
      <div id="sticker-wrapper">
        <canvas id="sticker-canvas"></canvas>
      </div>
      <div>
        <img id="user-photo" ref="uploadedPhoto" :src="uploadedPhotoSrc" />
      </div>
    </div>
    <slot
      name="detailEditor"
      :photoCanvas="photoCanvas"
      :layout="layout"
    ></slot>
    <slot name="aspectRatioCrop" :ratioCrop="ratioCrop" :layout="layout"></slot>
    <slot name="sticker" :addSticker="addSticker" :layout="layout"></slot>
    <slot
      name="imageEditor"
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
    //To Do : inline으로 넘기기
    addSticker(e) {
      this.stickerCanvas.addSticker(e.target.src);
    },
    freeCrop() {
      this.photoCanvas.setFreeCrop();
    },
    ratioCrop(x, y) {
      this.photoCanvas.setCropRatio(x, y);
    },

    deleteSticker() {
      this.stickerCanvas.removeSticker();
    },

    importPhoto(e) {
      console.log(e.target);
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
      /**
       * 사진을 처음 업로드 했을 때로 되돌림
       * 그에 맞게 스티커 캔버스의 사이즈도 업데이트
       * 모든 스티커를 삭제함
       */
      if (this.photoCanvas) {
        this.photoCanvas.changePhoto(this.initImageSrc);
        if (this.photoCanvas) {
          this.photoCanvas.clear();
        }
        this.$refs.uploadedPhoto.addEventListener(
          'load',
          () => {
            this.setPhotoCanvasSize(), this.resizeStickerCanvas();
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
      /**
       * 사진의 크기에 맞춰 스티커 캔버스의 크기를 재설정함
       */
      const [width, height] = this.photoCanvasSize;
      if (this.stickerCanvas) {
        this.stickerCanvas.resizeStickerCanvas(width, height);
      }
    },
    crop() {
      /**
       * 크롭이 완료되면 모듈에서 제공하는 메소드에 의해 크롭된 이미지로 대체됨
       * 크롭된 사이즈를 저장하고 그에 맞춰 스티커 캔버스의 사이즈를 재설정함
       */
      this.photoCanvas.finishCrop();
      this.setPhotoCanvasSize();
    },
    openPhotoEditor() {
      /**
       * 'edit' 버튼을 누르면 photo editor 인스턴스가 생성되고, 툴 버튼들을 보여줌
       * 인스턴스가 생성되는 것은 초기 단 한번만임. 생성 이후 이미지를 재업로드한다면 이미 생성된 캔버스 안에서 이미지만 replace됨
       * 사진이 업로드 되어 있지 않은데 누르면 에러를 반환함
       */
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
    openStickerEditor() {
      // To Do : 스티커 캔버스도 flex 정렬
      /**
       * 처음으로 'sticker'버튼을 눌렀을 때만 스티커 캔버스가 생성되며 width, height값을 따로 넣어줘야 함.
       * 이후 'edit'으로 넘어갈 때에는 스티커 캔버스를 안 보이게 숨김
       * 업로드한 사진이 없다면 에러를 반환함
       * 'edit'에서 크롭박스가 생긴 상태에서 스티커로 넘어갈 경우 크롭박스를 지움
       */
      if (!this.uploadedPhotoSrc) {
        alert('스티커를 붙일 사진을 선택해주세요');
        throw new Error('Please pick photo.');
      }
      this.layout = 'sticker-editor';
      if (this.photoCanvas) {
        this.photoCanvas.clear();
        //To Do : 돔에 직접 접근하지 않고 classList를 toggle하는 방법으로 수정하기
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
