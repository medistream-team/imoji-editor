<template>
  <imoji-editor :default-image="defaultImage" />
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
  }
};
</script>

<style scoped></style>
