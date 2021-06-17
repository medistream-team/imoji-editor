<template>
  <div>
    <slot name="imageEditor"></slot>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.imageEditorWrap {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 50px;
  color: #152447;
}

.image-detail-editor {
  display: flex;
  justify-content: space-around;
  align-items: center;
  size: 1.938rem;
  margin: 10px auto;
}

.image-detail-editor-button {
  background-color: black;
  color: white;
  border-style: none;
  cursor: pointer;
}

.image-editor-button {
  display: flex;
  justify-content: space-around;
  align-items: center;
  size: 30px;
  margin: 10px auto;
  background-color: black;
  color: white;
  border-style: none;
  cursor: pointer;
}

.image-editor-button:hover {
  color: grey;
}
.sticker-editor {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin: 10px auto;
}

.aspect-ratio-editor {
  display: flex;
  justify-content: space-around;
  border-style: none;
  margin: 10px auto;
}

.image-ratio-editor-button {
  height: 1.938rem;
  background-color: black;
  color: white;
  border-style: none;
  cursor: pointer;
}

.image-ratio-editor-button:hover {
  color: grey;
}

img.image-sticker {
  width: 1.938rem;
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
