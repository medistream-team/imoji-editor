<template>
  <imoji-editor :default-image="img" />
</template>

<script>
import ImojiEditor from '@/components/ImojiEditor.vue';

const testImage = new Image();
testImage.src =
  'https://images.unsplash.com/photo-1625019030798-a9734e456f79?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80';

export default {
  components: {
    'imoji-editor': ImojiEditor
  },
  data() {
    return {
      img: testImage
    };
  }
};
</script>

<style scoped></style>
