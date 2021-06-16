<template>
  <div>
    <slot name="imageEditor"></slot>
  </div>
</template>

<script>
export default {
  name: 'ImageEditor',
  data() {
    return {
      toggleEdit: false,
      toggleSticker: false,
      stickers: [
        {
          src:
            'https://stickershop.line-scdn.net/stickershop/v1/product/7120772/LINEStorePC/main.png;compress=s'
        },
        {
          src:
            'https://cdn0.iconfinder.com/data/icons/emoticon-35/32/20-512.png'
        },
        {
          src:
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCjd7GnLIxcqLfCPQhZX8D2FBAu6Xkrv7Gh0n1GtZV7Hf69rLokC1bxNjVLuJwRjn0Rh4&usqp=CAU'
        },
        {
          src:
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCjd7GnLIxcqLfCPQhZX8D2FBAu6Xkrv7Gh0n1GtZV7Hf69rLokC1bxNjVLuJwRjn0Rh4&usqp=CAU'
        }
      ]
    };
  }
};
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
  size: 30px;
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

i {
  color: #eaecef;
  font-size: 25px;
}

i:hover {
  color: grey;
}
</style>
