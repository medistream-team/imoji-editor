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
import { PhotoEditor } from '@/js/editor.js';

import userPhoto from '/public/Image/photo.jpg';

export default {
  data() {
    return {
      userPhoto: userPhoto,
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
  }
  // methods: {
  //   //To Do : 업로드 이미지 바꾸기
  //   addImage() {
  //     console.log('addImage');
  //   },
  //   onChangePhoto(e) {
  //     this.userPhoto = e.target.files[0];
  //   },
  //   addSticker(e) {
  //     if (this.isFirstAdd === false) {
  //       this.stickerCanvas = new StickerEditor(
  //         'sticker-canvas',
  //         this.wrapperDimension[0],
  //         this.wrapperDimension[1]
  //       );
  //       this.isFirstAdd = true;
  //     }
  //     this.stickerCanvas.addSticker(e.target.src);
  //   },
  //   rotateRight() {
  //     this.photoCanvas.rotate('+');
  //   },
  //   rotateLeft() {
  //     this.photoCanvas.rotate('-');
  //   },
  //   freeCrop() {
  //     this.photoCanvas.setFreeCrop();
  //   },
  //   ratioCrop() {
  //     this.photoCanvas.setCropRatio(16, 9);
  //   },
  //   flipX() {
  //     this.photoCanvas.flip('X');
  //   },
  //   flipY() {
  //     this.photoCanvas.flip('Y');
  //   },
  //   reset() {
  //     //To Do : 스티커 다 지우기
  //     this.photoCanvas.reset();
  //   },
  //   zoomIn() {
  //     this.photoCanvas.zoomIn();
  //   },
  //   zoomOut() {
  //     this.photoCanvas.zoomOut();
  //   },
  //   crop() {
  //     this.photoCanvas.crop();
  //   },
  //   openEditor() {
  //     this.layout = 'image-detail-editor';
  //     // 스티커 캔버스 열려있는데 edit으로 이동하면 스티커 캔버스 숨기기
  //     document.getElementById('sticker-wrapper').classList.add('hide');
  //     // //스티커 캔버스 열려있을 땐 edit 비활성화
  //     // this.photoCanvas.disable();
  //   },
  //   openSticker() {
  //     this.layout = 'sticker-editor';
  //     this.photoCanvas.clear();
  //     document.getElementById('sticker-wrapper').classList.remove('hide');
  //   }
  // }
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
