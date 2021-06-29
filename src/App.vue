<template>
  <imoji-editor :width="width" :height="height" @done="done" />
</template>

<script>
import ImojiEditor from '@/components/ImojiEditor.vue';

export default {
  components: {
    'imoji-editor': ImojiEditor
  },
  data() {
    return {
      result: undefined,
      width: 400,
      height: 600
    };
  },
  methods: {
    done(resultImage) {
      this.result = resultImage;
    }
  }
};
</script>

<style scoped></style>
