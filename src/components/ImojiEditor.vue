<template>
  <imoji-editor-canvas>
    <template
      #controllerBar="{reset, stickerCanvas, importPhoto, crop, layout}"
    >
      <div class="controller-bar-wrap">
        <button
          class="controller-bar-button"
          title="image upload"
          accept="image/*"
        >
          <label>
            <i class="mdi mdi-file-image"></i>
            <input type="file" class="file" @change="importPhoto" />
          </label>
        </button>

        <button class="controller-bar-button" title="move" @click="reset">
          <i class="mdi mdi-cursor-move"></i>
        </button>

        <button class="controller-bar-button" title="reset" @click="reset">
          <i class="mdi mdi-restore"></i>
        </button>

        <div v-if="layout === 'sticker-tool-bar'" class="delete-sticker">
          <button
            class="controller-bar-button"
            title="delete sticker"
            @click="stickerCanvas.removeSticker()"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>

        <div v-if="layout === 'tool-bar'" class="complete-crop">
          <button
            class="controller-bar-button"
            title="complete crop"
            @click="crop"
          >
            <i class="mdi mdi-check"></i>
          </button>
        </div>

        <button class="controller-bar-button" title="complete">
          <i class="mdi mdi-download"></i>
        </button>
      </div>
    </template>
    <template #toolBar="{photoCanvas, layout}">
      <div v-if="layout === 'tool-bar'" class="tool-bar">
        <div v-show="isActiveRatioCrop" class="aspect-ratio-tool-bar">
          <button
            class="aspect-ratio-tool-bar-button"
            @click="photoCanvas.setFreeCrop()"
          >
            Free
          </button>

          <button
            class="aspect-ratio-tool-bar-button"
            @click="photoCanvas.setCropRatio(16, 9)"
          >
            16:9
          </button>

          <button
            class="aspect-ratio-tool-bar-button"
            @click="photoCanvas.setCropRatio(4, 3)"
          >
            4:3
          </button>

          <button
            class="aspect-ratio-tool-bar-button"
            @click="photoCanvas.setCropRatio(2, 3)"
          >
            2:3
          </button>

          <button
            class="aspect-ratio-tool-bar-button"
            @click="photoCanvas.setCropRatio(1, 1)"
          >
            1:1
          </button>
        </div>

        <button
          class="tool-bar-button"
          @click="isActiveRatioCrop = !isActiveRatioCrop"
        >
          <i class="mdi mdi-crop"> </i>
        </button>

        <button class="tool-bar-button" @click="photoCanvas.zoomIn()">
          <i class="mdi mdi-magnify-plus"></i>
        </button>

        <button class="tool-bar-button" @click="photoCanvas.zoomOut()">
          <i class="mdi mdi-magnify-minus"></i>
        </button>

        <button class="tool-bar-button" @click="photoCanvas.rotate('+')">
          <i class="mdi mdi-rotate-right"></i>
        </button>

        <button class="tool-bar-button" @click="photoCanvas.rotate('-')">
          <i class="mdi mdi-rotate-left"></i>
        </button>

        <button class="tool-bar-button" @click="photoCanvas.flip('X')">
          <i class="mdi mdi-flip-horizontal"></i>
        </button>

        <button class="tool-bar-button" @click="photoCanvas.flip('Y')">
          <i class="mdi mdi-flip-vertical"></i>
        </button>
      </div>
    </template>

    <template #stickerToolBar="{stickerCanvas , layout}">
      <div v-if="layout === 'sticker-tool-bar'" class="sticker-tool-bar">
        <img
          v-for="StickerImage in StickerImages"
          :key="StickerImage.id"
          :src="StickerImage.src"
          class="image-sticker"
          @click="e => stickerCanvas.addSticker(e.target.src)"
        />
      </div>
    </template>
    <template #toolNavigation="{openPhotoEditor, openStickerEditor}">
      <div class="tool-navigation-wrap">
        <button
          class="tool-navigation-button"
          title="edit"
          @click="openPhotoEditor"
        >
          Edit
        </button>

        <button
          class="tool-navigation-button"
          title="sticker"
          @click="openStickerEditor"
        >
          Sticker
        </button>
      </div>
    </template>
  </imoji-editor-canvas>
</template>

<script>
import ImojiEditorCanvas from '@/components/ImojiEditorCanvas.vue';
import StickerImages from '@/assets/StickerImages.js';

export default {
  components: {
    'imoji-editor-canvas': ImojiEditorCanvas
  },
  data() {
    return {
      isActiveRatioCrop: false,
      StickerImages: StickerImages
    };
  }
};
</script>

<style scoped>
.file {
  display: none;
}

.controller-bar-wrap {
  position: absolute;
  z-index: 2;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px;
  border: none;
  width: 100vw;
  background: rgba(0, 0, 0, 0.1);
}

.controller-bar-button {
  background-color: transparent;
  color: aliceblue;
  border-style: none;
  cursor: pointer;
}

.controller-bar-button:hover {
  color: grey;
}

.tool-bar {
  position: absolute;
  bottom: 3rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 2px auto;
  padding-top: 8px;
  width: 100vw;
  size: 1.938rem;
  background: rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.tool-bar-button {
  background-color: transparent;
  color: white;
  border-style: none;
  cursor: pointer;
}

.tool-navigation-wrap {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 50px;
  color: #152447;
  position: absolute;
  z-index: 2;
  bottom: 0;
  width: 100vw;
  background: rgba(0, 0, 0, 0.1);
}

.tool-navigation-button {
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

.tool-navigation-button:hover {
  color: grey;
}

.sticker-tool-bar {
  display: grid;
  grid-auto-flow: column;
  justify-content: space-around;
  margin: 10px auto;
  position: absolute;
  z-index: 2;
  margin: 2px auto;
  padding-top: 8px;
  bottom: 3rem;
  width: 100vw;
  height: 3rem;
  background: rgba(0, 0, 0, 0.1);
}

.aspect-ratio-tool-bar {
  display: flex;
  justify-content: space-around;
  border-style: none;
  padding: 10px;
  position: absolute;
  z-index: 2;
  bottom: 2.43rem;
  width: 100%;
  background: rgba(0, 0, 0, 0.1);
}

.aspect-ratio-tool-bar-button {
  height: 1.938rem;
  background-color: transparent;
  color: white;
  border-style: none;
  cursor: pointer;
  font-size: 1rem;
}

.aspect-ratio-tool-bar-button:hover {
  color: grey;
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
