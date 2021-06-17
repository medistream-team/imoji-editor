<template>
  <div class="vue-photo-editor-wrapper">
    <canvas
      id="sticker-canvas"
      style="position: absolute; top: 0; left: 0; z-index: 1;"
    ></canvas>
    <img
      id="user-photo"
      :src="pic"
      style="position: absolute; top: 0; left: 0;"
    />
  </div>
</template>
<script>
import { PhotoEditor, StickerEditor } from '../js/editor.js';
// To Do : 사진 가져올 때 src import해야만 사용 가능?
import userPhoto from '/public/Image/photo.jpg';
import stickerImg from '/src/assets/01.png';

export default {
  data() {
    return { pic: userPhoto };
  },
  mounted() {
    const photoCanvas = new PhotoEditor('user-photo', {
      zoomOnWheel: false,
      background: false,
      ready: () => {
        // To Do : 뷰포트 너비/높이가 변할 때마다 실행되어야 함
        const wrapperDimension = photoCanvas.getContainerDimension();
        console.log(wrapperDimension);
        // To Do : 스티커 버튼 눌렀을 때 붙일 것 (이벤트 붙이기 전 임시 테스트용)
        const stickerCanvas = new StickerEditor(
          'sticker-canvas',
          wrapperDimension[0],
          wrapperDimension[1]
        );
        stickerCanvas.addSticker(stickerImg);
      }
    });
  }
};
</script>

<style>
.vue-photo-editor-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
}

.cropper-container {
  position: absolute;
  top: 0;
  left: 0;
}

.hide {
  display: none;
}
</style>
