<template>
  <imoji-editor :default-image="defaultImage" @done="test" />
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
      defaultImage: testImage
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
