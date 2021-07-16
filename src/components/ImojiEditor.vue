<template>
  <imoji-editor-canvas
    ref="Imoji"
    :default-image="defaultImage"
    :sticker-reset-message="stickerResetMessage"
    :width="width"
    :height="height"
    :is-crop-mode="isCropMode"
    @off-croppable="offCroppable"
  >
    <template
      #controllerBar="{reset, stickerCanvas, onInputImage, crop, layout, photoCanvas, uploadedImageSrc}"
    >
      <div class="controller-bar-wrapper">
        <div class="controller-bar-buttons-wrapper">
          <button
            v-if="choosePhoto"
            class="controller-bar-button"
            title="image upload"
            @click="
              e => {
                e.target.querySelector('input[type=\'file\']') &&
                  e.target.querySelector('input[type=\'file\']').click();
              }
            "
          >
            <label>
              <file-image />
              <input
                type="file"
                class="file"
                accept="image/jpeg, image/png"
                @change="onInputImage"
              />
            </label>
          </button>

          <button
            class="controller-bar-button"
            title="reset"
            :disabled="uploadedImageSrc ? false : true"
            @click="reset"
          >
            <restore-icon />
          </button>

          <button
            v-show="isCropMode"
            class="controller-bar-button"
            title="move"
            @click="photoCanvas.setDragMode('move')"
          >
            <cursor-move />
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

          <div v-if="layout === 'tool-bar' && isCropMode" class="complete-crop">
            <button
              class="controller-bar-button"
              title="complete crop"
              @click="
                () => {
                  crop();
                  isCropMode = false;
                }
              "
            >
              <check-icon />
            </button>
          </div>

          <button
            v-if="!isCropMode"
            class="controller-bar-button"
            title="done"
            :disabled="uploadedImageSrc ? false : true"
            @click="done"
          >
            {{ doneLabel }}
            <download-icon v-if="!doneLabel" />
          </button>
        </div>
      </div>
    </template>
    <template #toolBar="{photoCanvas, layout, zoom, rotate, flip}">
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

          <button class="tool-bar-button" @click="flip('X')">
            <flip-horizontal />
          </button>

          <button class="tool-bar-button" @click="flip('Y')">
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
    <template
      #toolNavigation="{openImageEditor, openStickerEditor, uploadedImageSrc, layout}"
    >
      <div class="tool-navigation-wrapper">
        <button
          class="tool-navigation-button"
          title="Photo"
          :class="layout === 'tool-bar' ? 'activated' : undefined"
          :disabled="uploadedImageSrc ? false : true"
          @click="openImageEditor"
        >
          {{ photoEditLabel }}
        </button>

        <button
          class="tool-navigation-button"
          title="Emoji Sticker"
          :class="layout === 'sticker-tool-bar' ? 'activated' : undefined"
          :disabled="uploadedImageSrc ? false : true"
          @click="openStickerEditor"
        >
          {{ stickerEditLabel }}
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
    stickerResetMessage: {
      type: String,
      required: false,
      default: 'All stickers are deleted when you edit the photo'
    },
    choosePhoto: {
      type: Boolean,
      required: false,
      default: true
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
    photoEditLabel: {
      type: String,
      required: false,
      default: 'Photo'
    },
    stickerEditLabel: {
      type: String,
      required: false,
      default: 'Emoji Sticker'
    },
    doneLabel: {
      type: String,
      required: false,
      default: null
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
            // eslint-disable-next-line no-undef
            svg: require('@/static/medi-01.svg'),
            jpg: '',
            png: ''
          },
          {
            name: 'medi-02',
            // eslint-disable-next-line no-undef
            svg: require('@/static/medi-02.svg'),
            jpg: '',
            png: ''
          },
          {
            name: 'medi-03',
            // eslint-disable-next-line no-undef
            svg: require('@/static/medi-03.svg'),
            jpg: '',
            png: ''
          },
          {
            name: 'medi-04',
            // eslint-disable-next-line no-undef
            svg: require('@/static/medi-04.svg'),
            jpg: '',
            png: ''
          },
          {
            name: 'medi-05',
            // eslint-disable-next-line no-undef
            svg: require('@/static/medi-05.svg'),
            jpg: '',
            png: ''
          },
          {
            name: 'medi-06',
            // eslint-disable-next-line no-undef
            svg: require('@/static/medi-06.svg'),
            jpg: '',
            png: ''
          },
          {
            name: 'medi-07',
            // eslint-disable-next-line no-undef
            svg: require('@/static/medi-07.svg'),
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
      try {
        const resultImage = await this.$refs.Imoji.exportResultPhoto();

        if (this.$listeners.done) {
          this.$emit('done', resultImage);
          return;
        }

        const d = new Date();
        const dateString = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(
          2,
          '0'
        )}-${`${d.getDate()}`.padStart(2, '0')}`;

        const timeString = `${`${d.getHours()}`.padStart(
          2,
          '0'
        )}:${`${d.getMinutes()}`.padStart(
          2,
          '0'
        )}:${`${d.getSeconds()}`.padStart(2, '0')}`;

        const anchorEl = document.createElement('a');
        anchorEl.setAttribute('href', resultImage.src);
        anchorEl.setAttribute('download', `${dateString} ${timeString}.jpeg`);
        anchorEl.click();
      } catch (error) {
        this.$emit('error', error);
      }
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
  z-index: 2;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 10px 0px;
  background-color: rgba(0, 0, 0, 0.3);
}

.controller-bar-buttons-wrapper {
  position: relative;
  top: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
}

.controller-bar-button {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 28px;
  border-style: none;
  background-color: transparent;
  color: white;
  line-height: 0;
}

.tool-bar {
  justify-content: space-around;
  align-items: center;
  width: 100%;
  padding-top: 4px;
  padding-bottom: 4px;
  size: 1.938rem;
  z-index: 2;
}

.tool-bar-wrapper {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.tool-bar-button {
  border-radius: 28px;
  padding: 5px;
  border-style: none;
  color: white;
  background-color: transparent;
  line-height: 0;
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
  margin: 0 auto;
  padding: 10px;
  border-radius: 28px;
  border-style: none;
  color: white;
  background-color: transparent;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.6, 1);
}

.tool-navigation-button.activated {
  background-color: rgba(255, 255, 255, 0.2);
}

.sticker-tool-bar {
  display: grid;
  grid-auto-flow: column;
  justify-content: space-around;
  width: 100%;
  padding-top: 5px;
  padding-bottom: 6px;
  size: 1.938rem;
  z-index: 2;
  z-index: 2;
}

.ratio-crop-tool-bar {
  display: flex;
  justify-content: space-around;
  width: 100%;
  padding-top: 5px;
  padding-bottom: 10px;
  border-style: none;
  z-index: 2;
}

.ratio-crop-tool-bar-button {
  height: 1.938rem;
  padding: 5px;
  border-radius: 28px;
  border-style: none;
  color: white;
  background-color: transparent;
  font-size: 1rem;
}

img.image-sticker {
  width: 1.938rem;
}

i {
  color: #eaecef;
  font-size: 25px;
}

/* apply hover effect only on PC */
@media (hover: hover) {
  .controller-bar-button {
    cursor: pointer;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.6, 1);
  }

  .controller-bar-button label {
    cursor: pointer;
  }

  .controller-bar-button:not(:disabled):hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .controller-bar-button:disabled {
    color: grey;
    cursor: not-allowed;
  }

  .tool-bar-button {
    cursor: pointer;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.6, 1);
  }

  .tool-bar-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .tool-navigation-button {
    cursor: pointer;
  }

  .tool-navigation-button:disabled {
    color: grey;
    cursor: not-allowed;
  }

  .tool-navigation-button:not(:disabled):hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .ratio-crop-tool-bar-button {
    cursor: pointer;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.6, 1);
  }

  .ratio-crop-tool-bar-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  img.image-sticker {
    cursor: pointer;
    transition: transform 0.3s ease-in-out;
  }

  img.image-sticker:hover {
    transform: scale(1.3);
  }

  i:hover {
    color: grey;
  }
}
</style>
