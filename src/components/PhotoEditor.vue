<template>
  <photo-editor-canvas>
    <template #imageController>
      <div class="image-controller-wrap">
        <button class="image-control-button">
          <i class="mdi mdi-undo"></i>
        </button>

        <button class="image-control-button">
          Reset
        </button>

        <button class="image-control-button">
          <i class="mdi mdi-redo"></i>
        </button>
      </div>
    </template>
    <template #detailEditor>
      <div v-if="layout === 'image-detail-editor'" class="image-detail-editor">
        <button class="image-detail-editor-button">
          <i class="mdi mdi-crop"></i>
        </button>

        <button
          class="image-detail-editor-button"
          @click="layout = 'aspect-ratio'"
        >
          <i class="mdi mdi-aspect-ratio"></i>
        </button>

        <button class="image-detail-editor-button">
          <i class="mdi mdi-magnify-plus"></i>
        </button>

        <button class="image-detail-editor-button">
          <i class="mdi mdi-magnify-minus"></i>
        </button>

        <button class="image-detail-editor-button">
          <i class="mdi mdi-rotate-right"></i>
        </button>

        <button class="image-detail-editor-button">
          <i class="mdi mdi-rotate-left"></i>
        </button>

        <button class="image-detail-editor-button">
          <i class="mdi mdi-flip-horizontal"></i>
        </button>

        <button class="image-detail-editor-button">
          <i class="mdi mdi-flip-vertical"></i>
        </button>
      </div>
    </template>
    <template #aspectRatioCrop>
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
    </template>

    <template #sticker>
      <div v-if="layout === 'sticker-editor'" class="sticker-editor">
        <img
          v-for="StickerImage in StickerImages"
          :key="StickerImage.id"
          :src="StickerImage.src"
          class="image-sticker"
        />
      </div>
    </template>

    <template #imageEditor>
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

        <button class="image-editor-button" title="complete">
          <i class="mdi mdi-check"></i>
        </button>
      </div>
    </template>
  </photo-editor-canvas>
</template>

<script>
import PhotoEditorCanvas from '@/components/PhotoEditorCanvas.vue';
import StickerImages from '@/assets/StickerImages.js';

export default {
  components: {
    'photo-editor-canvas': PhotoEditorCanvas
  },
  data() {
    return {
      layout: '',
      StickerImages: StickerImages
    };
  },

  methods: {
    openEditor() {
      this.layout = 'image-detail-editor';
    },
    openSticker() {
      this.layout = 'sticker-editor';
      // this.photoCanvas.clear();
      // document.getElementById('sticker-wrapper').classList.remove('hide');
    },
    addImage() {
      console.log('addImage');
    },
    onChangePhoto(e) {
      this.userPhoto = e.target.files[0];
    }
    // addSticker(e) {
    //   if (this.isFirstAdd === false) {
    //     this.stickerCanvas = new StickerEditor(
    //       'sticker-canvas',
    //       this.wrapperDimension[0],
    //       this.wrapperDimension[1]
    //     );
    //     this.isFirstAdd = true;
    //   }
    //   this.stickerCanvas.addSticker(e.target.src);
    // }
  }
};
</script>

<style scoped>
/* body {
  position: relative;
} */

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

.image-controller-wrap {
  position: absolute;
  z-index: 2;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px;
  border: none;
  width: 100vw;
}

.image-control-button {
  background-color: transparent;
  color: aliceblue;
  border-style: none;
  cursor: pointer;
}

.image-control-button:hover {
  color: grey;
}

.imageEditorWrap {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 50px;
  color: #152447;
  position: absolute;
  z-index: 2;
  bottom: 0;
  width: 100vw;
}

.image-detail-editor {
  position: absolute;
  z-index: 2;
  bottom: 3rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  size: 1.938rem;
  margin: 10px auto;
  width: 100vw;
}

.image-editor-button {
  display: flex;
  justify-content: space-around;
  align-items: center;
  size: 30px;
  margin: 10px auto;
  background-color: transparent;
  color: white;
  border-style: none;
  cursor: pointer;
}

.image-editor-button:hover {
  color: grey;
}

.sticker-editor {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin: 10px auto;
  position: absolute;
  z-index: 2;
  bottom: 3rem;
  width: 100vw;
}

.aspect-ratio-editor {
  display: flex;
  justify-content: space-around;
  border-style: none;
  margin: 10px auto;
  position: absolute;
  z-index: 2;
  bottom: 3rem;
  width: 100vh;
}

.image-ratio-editor-button {
  height: 1.938rem;
  background-color: black;
  color: white;
  border-style: none;
  cursor: pointer;
  font-size: 1rem;
}

.image-ratio-editor-button:hover {
  color: grey;
}

.image-detail-editor-button {
  background-color: transparent;
  color: white;
  border-style: none;
  cursor: pointer;
}

img.image-sticker {
  width: 1.938rem;
  cursor: pointer;
}

i {
  color: #eaecef;
  font-size: 25px;
}

i:hover {
  color: grey;
}
</style>
