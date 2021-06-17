<template>
  <button class="image-detail-editor-button" @click="runDetailEdit">
    <i class="mdi" :class="detailEditor.icon"></i>
  </button>
</template>
<script>
export default {
  props: {
    detailEditor: {
      type: Object,
      required: true
    }
  },
  methods: {
    runDetailEdit() {
      this.$emit(this.detailEditor.emitEvent);
    }
  }
};
</script>
<style scoped>
.image-detail-editor-button {
  background-color: black;
  color: white;
  border-style: none;
  cursor: pointer;
}

i {
  color: #eaecef;
  font-size: 25px;
}

i:hover {
  color: grey;
}
</style>
