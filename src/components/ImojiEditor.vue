<template>
  <imoji-editor-canvas
    ref="test"
    :default-image="defaultImage"
    :error-message="errorMessage"
    :width="width"
    :height="height"
  >
    <template
      #controllerBar="{reset, stickerCanvas, changePhoto, crop, layout, photoCanvas}"
    >
      <div class="controller-bar-wrapper">
        <button
          class="controller-bar-button"
          title="image upload"
          accept="image/*"
        >
          <label>
            <i class="mdi mdi-file-image"></i>
            <input type="file" class="file" @change="changePhoto" />
          </label>
        </button>

        <button
          v-show="isActiveMove"
          class="controller-bar-button"
          title="move"
          @click="photoCanvas.setDragMode('move')"
        >
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

        <button class="controller-bar-button" title="done" @click="done">
          <i class="mdi mdi-download"></i>
        </button>
      </div>
    </template>
    <template #toolBar="{photoCanvas, layout, zoom, rotate}">
      <div v-if="layout === 'tool-bar'" class="tool-bar">
        <div v-show="isActiveRatioCrop" class="ratio-crop-tool-bar">
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
            @click="toggleCropModeButton(), photoCanvas.setFreeCrop()"
          >
            <i class="mdi mdi-crop"> </i>
          </button>

          <button class="tool-bar-button" @click="zoom(0.1)">
            <i class="mdi mdi-magnify-plus"></i>
          </button>

          <button class="tool-bar-button" @click="zoom(-0.1)">
            <i class="mdi mdi-magnify-minus"></i>
          </button>

          <button class="tool-bar-button" @click="rotate('+')">
            <i class="mdi mdi-rotate-right"></i>
          </button>

          <button class="tool-bar-button" @click="rotate('-')">
            <i class="mdi mdi-rotate-left"></i>
          </button>

          <button class="tool-bar-button" @click="photoCanvas.flip('X')">
            <i class="mdi mdi-flip-horizontal"></i>
          </button>

          <button class="tool-bar-button" @click="photoCanvas.flip('Y')">
            <i class="mdi mdi-flip-vertical"></i>
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
      <!-- 이미지 잘 저장되는지 테스트용 -->
      <div id="testA">
        <image id="testB" />
      </div>
    </template>
  </imoji-editor-canvas>
</template>

<script>
import ImojiEditorCanvas from '@/components/ImojiEditorCanvas.vue';

export default {
  components: {
    'imoji-editor-canvas': ImojiEditorCanvas
  },
  props: {
    errorMessage: {
      type: Array,
      required: false,
      default: () => {
        return [
          '편집할 사진을 선택해주세요',
          '스티커를 붙일 사진을 선택해주세요'
        ];
      }
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
      isActiveRatioCrop: false,
      isActiveMove: false
    };
  },
  methods: {
    toggleCropModeButton() {
      this.isActiveRatioCrop = !this.isActiveRatioCrop;
      this.isActiveMove = !this.isActiveMove;
    },
    done() {
      //이미지 잘 저장되는지 테스트용
      const resultImage = this.$refs.test.getResultImage();
      const d = document.getElementById('testA');
      d.appendChild(resultImage);
      // d.outerHTML = resultImage.outerHTML;

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
  width: 100vw;
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
  width: 100vw;
  padding: 4px;
  size: 1.938rem;
  z-index: 2;
}

.tool-bar-wrapper {
  display: flex;
  justify-content: space-between;
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
  width: 100vw;
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
  width: 100vw;
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
