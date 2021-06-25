<template>
  <imoji-editor @done="done" />
</template>

<script>
import ImojiEditor from '@/components/ImojiEditor.vue';

export default {
  components: {
    'imoji-editor': ImojiEditor
  },
  data: function() {
    return {
      result: undefined
    };
  },
  methods: {
    done(a) {
      this.result = a;
    }
  }
};
</script>

<style scoped></style>
