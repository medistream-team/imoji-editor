<template>
  <photo-editor :default-image="defaultImage" />
</template>

<script>
import PhotoEditor from '@/components/PhotoEditor.vue';
import test from '@/assets/test.jpg';

const testImage = new Image();
testImage.src = test;

export default {
  components: {
    'photo-editor': PhotoEditor
  },
  data() {
    return {
      defaultImage: testImage
    };
  }
};
</script>

<style scoped></style>
