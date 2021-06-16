<template>
  <div>
    <slot name="imageController"></slot>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.image-controller-wrap {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px;
  border: none;
}

.image-control-button {
  background-color: black;
  color: aliceblue;
  border-style: none;
  cursor: pointer;
}

.image-control-button:hover {
  color: grey;
}

i {
  color: aliceblue;
  font-size: 25px;
}

i:hover {
  color: grey;
}
</style>
