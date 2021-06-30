<template>
  <imoji-editor-canvas
    ref="Imoji"
    :default-image="defaultImage"
    :error-message="errorMessage"
    :width="width"
    :height="height"
    :is-crop-mode="isCropMode"
    @off-croppable="offCroppable"
  >
    <template
      #controllerBar="{reset, stickerCanvas, getInputImage, crop, layout, photoCanvas}"
    >
      <div class="controller-bar-wrapper">
        <button
          class="controller-bar-button"
          title="image upload"
          accept="image/*"
        >
          <label>
            <file-image />
            <input type="file" class="file" @change="getInputImage" />
          </label>
        </button>

        <button
          v-show="isCropMode"
          class="controller-bar-button"
          title="move"
          @click="photoCanvas.setDragMode('move')"
        >
          <cursor-move />
        </button>

        <button class="controller-bar-button" title="reset" @click="reset">
          <restore-icon />
        </button>

        <div v-if="layout === 'sticker-tool-bar'" class="delete-sticker">
          <button
            class="controller-bar-button"
            title="delete sticker"
            @click="stickerCanvas.removeSticker()"
          >
            <delete-icon />
          </button>
        </div>

        <div v-if="layout === 'tool-bar'" class="complete-crop">
          <button
            class="controller-bar-button"
            title="complete crop"
            @click="crop"
          >
            <check-icon />
          </button>
        </div>

        <button class="controller-bar-button" title="done" @click="done">
          <download-icon />
        </button>
      </div>
    </template>
    <template #toolBar="{photoCanvas, layout, zoom, rotate, clearCrop}">
      <div v-if="layout === 'tool-bar'" class="tool-bar">
        <div v-show="isCropMode" class="ratio-crop-tool-bar">
          <button
            class="ratio-crop-tool-bar-button"
            @click="photoCanvas.setFreeCrop()"
          >
            Free
          </button>

          <button
            class="ratio-crop-tool-bar-button"
            @click="photoCanvas.setCropRatio(16, 9)"
          >
            16:9
          </button>

          <button
            class="ratio-crop-tool-bar-button"
            @click="photoCanvas.setCropRatio(4, 3)"
          >
            4:3
          </button>

          <button
            class="ratio-crop-tool-bar-button"
            @click="photoCanvas.setCropRatio(2, 3)"
          >
            2:3
          </button>

          <button
            class="ratio-crop-tool-bar-button"
            @click="photoCanvas.setCropRatio(1, 1)"
          >
            1:1
          </button>
        </div>

        <div class="tool-bar-wrapper">
          <button
            class="tool-bar-button"
            @click="
              [isCropMode ? photoCanvas.clear() : photoCanvas.setFreeCrop()], // eslint-disable-next-line vue/html-indent
                toggleCropModeButton()
            "
          >
            <crop-icon />
          </button>

          <button class="tool-bar-button" @click="zoom(0.1)">
            <magnify-plus />
          </button>

          <button class="tool-bar-button" @click="zoom(-0.1)">
            <magnify-minus />
          </button>

          <button class="tool-bar-button" @click="rotate('+')">
            <rotate-right />
          </button>

          <button class="tool-bar-button" @click="rotate('-')">
            <rotate-left />
          </button>

          <button
            class="tool-bar-button"
            @click="photoCanvas.flip('X'), clearCrop()"
          >
            <flip-horizontal />
          </button>

          <button
            class="tool-bar-button"
            @click="photoCanvas.flip('Y'), clearCrop()"
          >
            <flip-vertical />
          </button>
        </div>
      </div>
    </template>
    <template #stickerToolBar="{stickerCanvas , layout}">
      <div v-if="layout === 'sticker-tool-bar'" class="sticker-tool-bar">
        <img
          v-for="stickerImage in stickerImages"
          :key="stickerImage.name"
          :src="stickerImage.svg"
          class="image-sticker"
          @click="e => stickerCanvas.addSticker(e.target.src)"
        />
      </div>
    </template>
    <template #toolNavigation="{openPhotoEditor, openStickerEditor}">
      <div class="tool-navigation-wrapper">
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
// icons
import FileImage from 'icons/FileImage';
import CursorMove from 'icons/CursorMove';
import RestoreIcon from 'icons/Restore';
import DeleteIcon from 'icons/Delete';
import CheckIcon from 'icons/Check';
import DownloadIcon from 'icons/Download';
import CropIcon from 'icons/Crop';
import MagnifyPlus from 'icons/MagnifyPlus';
import MagnifyMinus from 'icons/MagnifyMinus';
import RotateRight from 'icons/RotateRight';
import RotateLeft from 'icons/RotateLeft';
import FlipHorizontal from 'icons/FlipHorizontal';
import FlipVertical from 'icons/FlipVertical';

export default {
  components: {
    'imoji-editor-canvas': ImojiEditorCanvas,
    FileImage,
    CursorMove,
    RestoreIcon,
    DeleteIcon,
    CheckIcon,
    DownloadIcon,
    CropIcon,
    MagnifyPlus,
    MagnifyMinus,
    RotateRight,
    RotateLeft,
    FlipHorizontal,
    FlipVertical
  },
  props: {
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
    },
    stickerImages: {
      type: Array,
      required: false,
      default: () => {
        return [
          {
            name: 'medi-01',
            svg: 'medi-01.svg',
            jpg: '',
            png: ''
          },
          {
            name: 'medi-02',
            svg: 'medi-02.svg',
            jpg: '',
            png: ''
          },
          {
            name: 'medi-03',
            svg: 'medi-03.svg',
            jpg: '',
            png: ''
          },
          {
            name: 'medi-04',
            svg: 'medi-04.svg',
            jpg: '',
            png: ''
          },
          {
            name: 'medi-05',
            svg: 'medi-05.svg',
            jpg: '',
            png: ''
          },
          {
            name: 'medi-06',
            svg: 'medi-06.svg',
            jpg: '',
            png: ''
          },
          {
            name: 'medi-07',
            svg: 'medi-07.svg',
            jpg: '',
            png: ''
          }
        ];
      }
    }
  },
  data() {
    return {
      isCropMode: false
    };
  },
  methods: {
    toggleCropModeButton() {
      this.isCropMode = !this.isCropMode;
    },
    offCroppable(test) {
      this.isCropMode = test;
    },
    async done() {
      const resultImage = await this.$refs.Imoji.exportResultPhoto();
      this.$emit('done', resultImage);
    }
  }
};
</script>

<style scoped>
.file {
  display: none;
}

.controller-bar-wrapper {
  position: absolute;
  top: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  padding: 10px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  z-index: 2;
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
  justify-content: space-around;
  align-items: center;
  width: 100%;
  padding: 4px;
  size: 1.938rem;
  z-index: 2;
}

.tool-bar-wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.tool-bar-button {
  background-color: transparent;
  color: white;
  border-style: none;
  cursor: pointer;
}

.tool-navigation-wrapper {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 50px;
  color: #152447;
  z-index: 2;
}

.tool-navigation-button {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 10px auto;
  size: 30px;
  color: white;
  background-color: transparent;
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
  width: 100%;
  height: 3rem;
  margin: 2px auto;
  padding: 8px 0;
  z-index: 2;
}

.ratio-crop-tool-bar {
  display: flex;
  justify-content: space-around;
  width: 100%;
  padding: 10px;
  border-style: none;
  z-index: 2;
}

.ratio-crop-tool-bar-button {
  height: 1.938rem;
  color: white;
  background-color: transparent;
  font-size: 1rem;
  border-style: none;
  cursor: pointer;
}

.ratio-crop-tool-bar-button:hover {
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
