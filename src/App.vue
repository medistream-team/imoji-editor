<template>
  <imoji-editor
    :default-image="defaultImage"
    :sticker-images="stickerImages"
    @done="test"
  />
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
  },
  methods: {
    test() {
      //이미지 객체를 return 받아서 그걸 알아서 씀
      console.log('저장');
    }
  }
};
</script>

<style scoped></style>
