<template>
  <imoji-editor @done="done" />
</template>

<script>
import ImojiEditor from '@/components/ImojiEditor.vue';

export default {
  components: {
    'imoji-editor': ImojiEditor
  },
  data() {
    return {
      result: undefined
    };
  },
  methods: {
    done(resultImage) {
      this.result = resultImage;
      console.log(resultImage);
    }
  }
};
</script>

<style scoped></style>
