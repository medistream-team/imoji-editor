<template>
  <div class="photo-editor">
    <image-controller>
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
    </image-controller>
    <!-- <image-loader /> -->
    <image-canvas />
    <image-editor>
      <template #imageEditor>
        <div
          v-if="layout === 'image-detail-editor'"
          class="image-detail-editor"
        >
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
          />
        </div>

        <div class="imageEditorWrap">
          <button class="image-editor-button" title="image upload">
            <i class="mdi mdi-file-image"></i>
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
import ImageController from '@/components/ImageController.vue';
// import ImageLoader from './components/ImageLoader.vue';
import ImageCanvas from '@/components/ImageCanvas.vue';
import ImageEditor from '@/components/ImageEditor.vue';

export default {
  components: {
    'image-controller': ImageController,
    // 'image-loader': ImageLoader,
    'image-canvas': ImageCanvas,
    'image-editor': ImageEditor
  },

  data() {
    return {
      layout: '',
      // toggleEdit: false,
      // toggleSticker: false,
      stickers: [
        {
          id: 1,
          src:
            'https://stickershop.line-scdn.net/stickershop/v1/product/7120772/LINEStorePC/main.png;compress=s'
        },
        {
          id: 2,
          src:
            'https://stickershop.line-scdn.net/stickershop/v1/product/7120772/LINEStorePC/main.png;compress=s'
        },
        {
          id: 3,
          src:
            'https://stickershop.line-scdn.net/stickershop/v1/product/7120772/LINEStorePC/main.png;compress=s'
        },
        {
          id: 4,
          src:
            'https://stickershop.line-scdn.net/stickershop/v1/product/7120772/LINEStorePC/main.png;compress=s'
        },
        {
          id: 5,
          src:
            'https://stickershop.line-scdn.net/stickershop/v1/product/7120772/LINEStorePC/main.png;compress=s'
        },
        {
          id: 6,
          src:
            'https://stickershop.line-scdn.net/stickershop/v1/product/7120772/LINEStorePC/main.png;compress=s'
        },
        {
          id: 7,
          src:
            'https://stickershop.line-scdn.net/stickershop/v1/product/7120772/LINEStorePC/main.png;compress=s'
        }
      ]
    };
  }
};
</script>

<style scoped>
.photo-editor {
  background-color: black;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 100px;
  padding-bottom: 100px;
}
</style>
