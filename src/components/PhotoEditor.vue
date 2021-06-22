<template>
  <photo-editor-canvas>
    <template #imageController="{reset}">
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
    <template #detailEditor="{photoCanvas, layout}">
      <div v-if="layout === 'image-detail-editor'" class="image-detail-editor">
        <button
          class="image-detail-editor-button"
          @click="photoCanvas.setFreeCrop()"
        >
          <i class="mdi mdi-crop"> </i>
        </button>

        <button
          class="image-detail-editor-button"
          @click="layout = 'aspect-ratio'"
        >
          <i class="mdi mdi-aspect-ratio"></i>
        </button>

        <button
          class="image-detail-editor-button"
          @click="photoCanvas.zoomIn()"
        >
          <i class="mdi mdi-magnify-plus"></i>
        </button>

        <button
          class="image-detail-editor-button"
          @click="photoCanvas.zoomOut()"
        >
          <i class="mdi mdi-magnify-minus"></i>
        </button>

        <button
          class="image-detail-editor-button"
          @click="photoCanvas.rotate('+')"
        >
          <i class="mdi mdi-rotate-right"></i>
        </button>

        <button
          class="image-detail-editor-button"
          @click="photoCanvas.rotate('-')"
        >
          <i class="mdi mdi-rotate-left"></i>
        </button>

        <button
          class="image-detail-editor-button"
          @click="photoCanvas.flip('X')"
        >
          <i class="mdi mdi-flip-horizontal"></i>
        </button>

        <button
          class="image-detail-editor-button"
          @click="photoCanvas.flip('Y')"
        >
          <i class="mdi mdi-flip-vertical"></i>
        </button>
      </div>
    </template>
    <template #aspectRatioCrop="{ratioCrop , layout}">
      <div v-if="layout === 'aspect-ratio'" class="aspect-ratio-editor">
        <button
          class="image-ratio-editor-button"
          @click="layout = 'image-detail-editor'"
        >
          <i class="mdi mdi-arrow-left"></i>
        </button>

        <button class="image-ratio-editor-button" @click="ratioCrop(16, 9)">
          16:9
        </button>

        <button class="image-ratio-editor-button" @click="ratioCrop(4, 3)">
          4:3
        </button>

        <button class="image-ratio-editor-button" @click="ratioCrop(2, 3)">
          2:3
        </button>

        <button class="image-ratio-editor-button" @click="ratioCrop(1, 1)">
          1:1
        </button>
      </div>
    </template>
    <template #sticker="{addSticker , layout}">
      <div v-if="layout === 'sticker-editor'" class="sticker-editor">
        <img
          v-for="StickerImage in StickerImages"
          :key="StickerImage.id"
          :src="StickerImage.src"
          class="image-sticker"
          @click="addSticker"
        />
      </div>
    </template>
    <template
      #imageEditor="{openPhotoEditor, importPhoto, openStickerEditor, crop}"
    >
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

        <button
          class="image-editor-button"
          title="edit"
          @click="openPhotoEditor"
        >
          Edit
        </button>

        <button
          class="image-editor-button"
          title="sticker"
          @click="openStickerEditor"
        >
          Sticker
        </button>

        <button class="image-editor-button" title="complete" @click="crop">
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
      StickerImages: StickerImages
    };
  }
};
</script>

<style scoped>
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
