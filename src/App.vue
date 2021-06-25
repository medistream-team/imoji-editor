<template>
  <imoji-editor :default-image="defaultImage" :sticker-images="stickerImages" />
</template>

<script>
import ImojiEditor from '@/components/ImojiEditor.vue';
import test from '@/assets/test.jpg';

const testImage = new Image();
testImage.src = test;

export default {
  components: {
    'imoji-editor': ImojiEditor
  },
  data() {
    return {
      defaultImage: testImage,
      stickerImages: [
        {
          name: 'surprised',
          svg: '',
          jpg: '',
          png: '01.png'
        },
        {
          name: 'happy',
          svg: '',
          jpg: '',
          png: '02.png'
        },
        {
          name: 'sad',
          svg: '',
          jpg: '',
          png: '03.png'
        },
        {
          name: 'cry',
          svg: '',
          jpg: '',
          png: '04.png'
        }
      ]
    };
  }
};
</script>

<style scoped></style>
