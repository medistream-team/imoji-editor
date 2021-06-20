<template>
  <div class="photo-editor">
    <image-controller>
      <template #imageController>
        <div class="image-controller-wrap">
          <button class="image-control-button">
            <i class="mdi mdi-undo"></i>
          </button>
          <button class="image-control-button" @click="reset">
            Reset
          </button>
          <button class="image-control-button" @click="deleteSticker">
            Delete
          </button>
          <button class="image-control-button">
            <i class="mdi mdi-redo"></i>
          </button>
        </div>
      </template>
    </image-controller>
    <!-- <image-loader /> -->
    <!-- canvas -->
    <template>
      <div class="vue-photo-editor-wrapper">
        <div id="sticker-wrapper">
          <canvas id="sticker-canvas"></canvas>
        </div>
        <div>
          <img id="user-photo" ref="userPhoto" :src="userPhoto" />
        </div>
      </div>
    </template>
    <!-- canvas -->
    <image-editor>
      <template #imageEditor>
        <div
          v-if="layout === 'image-detail-editor'"
          class="image-detail-editor"
        >
          <detail-editor-button
            v-for="detailEditor in detailEditors"
            :key="detailEditor.id"
            :detail-editor="detailEditor"
            @rotate-right="rotateRight"
            @rotate-left="rotateLeft"
            @free-crop="freeCrop"
            @ratio-crop="ratioCrop"
            @flip-x="flipX"
            @flip-y="flipY"
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
          />
        </div>

        <div v-if="layout === 'aspect-ratio'" class="aspect-ratio-editor">
          <button
            class="image-ratio-editor-button"
            @click="layout = 'image-detail-editor'"
          >
            <i class="mdi mdi-arrow-left"></i>
          </button>
          <button class="image-ratio-editor-button">
            16:9
          </button>
          <button class="image-ratio-editor-button">
            4:3
          </button>
          <button class="image-ratio-editor-button">
            2:3
          </button>
          <button class="image-ratio-editor-button">
            1:1
          </button>
        </div>

        <div v-if="layout === 'sticker-editor'" class="sticker-editor">
          <img
            v-for="sticker in stickers"
            :key="sticker.id"
            class="image-sticker"
            :src="sticker.src"
            @click="addSticker"
          />
        </div>

        <div class="imageEditorWrap">
          <button
            class="image-editor-button"
            title="image upload"
            accept="image/*"
          >
            <label>
              <i class="mdi mdi-file-image"></i>
              <input type="file" class="file" @change="importPhoto" />
            </label>
          </button>

          <button class="image-editor-button" title="edit" @click="openEditor">
            Edit
          </button>

          <button
            class="image-editor-button"
            title="sticker"
            @click="openSticker"
          >
            Sticker
          </button>

          <button class="image-editor-button" title="complete" @click="crop">
            <i class="mdi mdi-check"></i>
          </button>
        </div>
      </template>
    </image-editor>
  </div>
</template>

<script>
import { PhotoEditor, StickerEditor } from '@/js/editor.js';
// To Do : 사진 가져올 때 src import해야만 사용 가능?
import sticker01 from '/src/assets/01.png';
import sticker02 from '/src/assets/02.png';
import sticker03 from '/src/assets/03.png';
import sticker04 from '/src/assets/04.png';

import ImageController from '@/components/ImageController.vue';
import ImageEditor from '@/components/ImageEditor.vue';
import DetailEditorButton from '@/components/DetailEditorButton.vue';

export default {
  components: {
    'image-controller': ImageController,
    'image-editor': ImageEditor,
    'detail-editor-button': DetailEditorButton
  },
  data() {
    return {
      layout: '',
      userPhoto: null,
      toggleEdit: false,
      toggleSticker: false,
      //To Do : 상수 데이터르 분리가능한지 알아보기
      stickers: [
        {
          id: 1,
          src: sticker01
        },
        {
          id: 2,
          src: sticker02
        },
        {
          id: 3,
          src: sticker03
        },
        {
          id: 4,
          src: sticker04
        }
      ],
      detailEditors: [
        { id: 1, icon: 'mdi-crop', emitEvent: 'free-crop' },
        { id: 2, icon: 'mdi-aspect-ratio', emitEvent: 'ratio-crop' },
        { id: 3, icon: 'mdi-magnify-plus', emitEvent: 'zoom-in' },
        { id: 4, icon: 'mdi-magnify-minus', emitEvent: 'zoom-out' },
        { id: 5, icon: 'mdi-rotate-right', emitEvent: 'rotate-right' },
        { id: 6, icon: 'mdi-rotate-left', emitEvent: 'rotate-left' },
        { id: 7, icon: 'mdi-flip-horizontal', emitEvent: 'flip-x' },
        { id: 8, icon: 'mdi-flip-vertical', emitEvent: 'flip-y' }
      ],
      wrapperDimension: [0, 0],
      isFirstAdd: false,
      stickerCanvas: null,
      photoCanvas: null
    };
  },
  methods: {
    importPhoto(e) {
      //To Do : 이미지 추가시 '이미지를 입력해주세요' 삭제
      this.userPhoto = URL.createObjectURL(e.target.files[0]);
    },
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
      //To Do : 스티커 다 지우기
      this.photoCanvas.reset();
    },
    zoomIn() {
      this.photoCanvas.zoomIn();
    },
    zoomOut() {
      this.photoCanvas.zoomOut();
    },
    crop() {
      this.photoCanvas.finishCrop();
      this.wrapperDimension = this.photoCanvas.getContainerDimension();
    },
    openEditor() {
      this.layout = 'image-detail-editor';
      this.photoCanvas = new PhotoEditor('user-photo', {
        zoomOnWheel: false,
        background: false,
        ready: () => {
          // To Do : 뷰포트 너비/높이가 변할 때마다 실행되어야 함
          this.wrapperDimension = this.photoCanvas.getContainerDimension();
        }
      });
      // 스티커 캔버스 열려있는데 edit으로 이동하면 스티커 캔버스 숨기기
      document.getElementById('sticker-wrapper').classList.add('hide');
      // //스티커 캔버스 열려있을 땐 edit 비활성화
      // this.photoCanvas.disable();
    },
    openSticker() {
      this.layout = 'sticker-editor';

      if (this.photoCanvas) {
        this.photoCanvas.clear();
      }

      const canvasWidth =
        this.wrapperDimension[0] || this.$refs.userPhoto.width;
      const canvasHeight =
        this.wrapperDimension[1] || this.$refs.userPhoto.height;

      if (this.isFirstAdd === false) {
        this.stickerCanvas = new StickerEditor(
          'sticker-canvas',
          canvasWidth,
          canvasHeight
        );
        this.isFirstAdd = true;
      }

      document.getElementById('sticker-wrapper').classList.remove('hide');
    },
    getResultImageSrc() {
      // case 1. 스티커 없이 편집만 해서 저장
      if (!this.stickerCanvas) {
        this.photoCanvas.saveEditedPhoto();
      }

      // case 2. 스티커만 붙여서 저장
      if (!this.photoCanvas) {
        this.stickerCanvas.saveResultImg(this.userPhoto);
      }

      // case 3. 편집, 스티커 둘 다 했을 때 저장
      if (this.photoCanvas && this.stickerCanvas) {
        this.stickerCanvas.saveResultImg(this.photoCanvas.saveEditedPhoto());
      }

      //결과물 src를 가지고 image 요소를 만들거나 files 인스턴스를 만들어서 form data에 싸서 서버로 post
    },
    deleteSticker() {
      this.stickerCanvas.removeSticker();
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

.photo-editor {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 100px;
  padding-bottom: 100px;
  background-color: black;
}

.file {
  display: none;
}
</style>
