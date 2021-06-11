<template>
  <div class="canvas">
    <!-- <image-controller>
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
    </image-controller> -->

    <img ref="image" :alt="mockimage" :src="pic" />

    <!-- <image-editor>
      <template #imageEditor>
        <div v-show="toggleEdit" class="image-detail-editor">
          <button class="image-detail-editor-button">
            <span class="material-icons">
              crop
            </span>
          </button>

          <button class="image-detail-editor-button">
            <span class="material-icons">
              zoom_in
            </span>
          </button>

          <button class="image-detail-editor-button">
            <span class="material-icons">
              zoom_out
            </span>
          </button>

          <button class="image-detail-editor-button">
            <span class="material-icons-round">
              rotate_right
            </span>
          </button>

          <button class="image-detail-editor-button">
            <span class="material-icons-round">
              rotate_left
            </span>
          </button>

          <v-btn class="mx-2" fab dark small color="primary">
            <v-icon dark>
              mdi-flip-horizontal
            </v-icon>
          </v-btn>

          <v-btn class="mx-2" fab dark small color="primary">
            <v-icon dark>
              mdi-flip-vertical
            </v-icon>
          </v-btn>
        </div>

        <div v-show="toggleSticker" class="sticker-editor">
          <v-avatar
            v-for="(sticker, i) in stickers"
            :key="i"
            src="sticker.src"
          />
        </div>

        <div class="imageEditorWrap">
          <button class="image-editor-button" title="image upload">
            <i class="mdi mdi-file-image"></i>
          </button>

          <button
            class="image-editor-button"
            title="edit"
            @click="toggleEdit = !toggleEdit"
          >
            Edit
          </button>

          <button
            class="image-editor-button"
            title="sticker"
            @click="toggleSticker = !toggleSticker"
          >
            Sticker
          </button>

          <button class="image-editor-button" title="complete">
            <i class="mdi mdi-check"></i>
          </button>
        </div>
      </template>
    </image-editor> -->
    <!-- <image-loader /> -->
  </div>
</template>
<script>
import pic from '../../public/Image/photo-1534274867514-d5b47ef89ed7.jpg';
// import ImageController from '@/components/ImageController.vue';
// import ImageEditor from './components/ImageEditor.vue';
// import ImageEditor from './ImageEditor.vue';

export default {
  components: {
    // 'image-controller': ImageController,
    //   'image-loader': ImageLoader,
    // 'image-editor': ImageEditor
  },
  data() {
    return {
      pic: pic
    };
  }
};
</script>

<style>
.canvas {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  margin: 10px auto;
}
.canvas > img {
  max-height: 100%;
  max-width: 100%;
}
</style>
