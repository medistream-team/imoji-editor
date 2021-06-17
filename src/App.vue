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
          <img id="user-photo" :src="userPhoto" />
        </div>
      </div>
    </template>
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
          />
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
            @click="addImage"
          >
            <label>
              <i class="mdi mdi-file-image"></i>
              <input type="file" class="file" @change="onChangePhoto" />
            </label>
          </button>

          <button
            class="image-editor-button"
            title="edit"
            @click="layout = 'image-detail-editor'"
          >
            Edit
          </button>

          <button
            class="image-editor-button"
            title="sticker"
            @click="layout = 'sticker-editor'"
          >
            Sticker
          </button>

          <button class="image-editor-button" title="complete">
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
import userPhoto from '/public/Image/photo.jpg';
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
      userPhoto: userPhoto,
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
  mounted() {
    this.photoCanvas = new PhotoEditor('user-photo', {
      zoomOnWheel: false,
      background: false,
      ready: () => {
        // To Do : 뷰포트 너비/높이가 변할 때마다 실행되어야 함
        this.wrapperDimension = this.photoCanvas.getContainerDimension();
      }
    });
  },
  methods: {
    addImage() {
      console.log('addImage');
    },
    onChangePhoto(e) {
      this.userPhoto = e.target.files[0];
    },
    addSticker(e) {
      if (this.isFirstAdd === false) {
        this.stickerCanvas = new StickerEditor(
          'sticker-canvas',
          this.wrapperDimension[0],
          this.wrapperDimension[1]
        );
        this.isFirstAdd = true;
      }
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
      this.photoCanvas.reset();
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
