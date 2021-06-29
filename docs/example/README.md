## ✨ Example

### Using in Full Page

- Recommend : Mobile

```js
<imoji-editor @done="done"></imoji-editor>
```

### Using in Modal

- Recommend : Desktop

Please set width, height that fit with Modal's like this.

```js
<imoji-editor :width="640" :height="800" @done="done"></imoji-editor>
```

**⚠ You should check [Cropper JS's documentation](https://github.com/fengyuanchen/cropperjs)🔻 first.**

> If you are using in a modal, you should initialize the editor after the modal is shown completely. Otherwise, you will not get the correct crop.
