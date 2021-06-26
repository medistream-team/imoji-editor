<template>
  <imoji-editor :sticker-images="stickerImages" @done="done" />
</template>

<script>
import ImojiEditor from '@/components/ImojiEditor.vue';

export default {
  components: {
    'imoji-editor': ImojiEditor
  },
  data() {
    return {
      stickerImages: [
        {
          name: 'surprised',
          svg: '',
          jpg: '',
          png: 'test.svg'
        },
        {
          name: 'happy',
          svg: '',
          jpg: '',
          png: 'medi-01.svg'
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
      ],
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
