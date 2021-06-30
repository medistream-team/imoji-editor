# Imoji

The compact image editor with add sticker feature !

<p align="center">
<div>
<img src="https://img.shields.io/static/v1?label=version&message=0.1.0&color=red">
<img src="https://img.shields.io/static/v1?label=javascript&message=ES6&color=yellow">
<img src="https://img.shields.io/static/v1?label=vue&message=2.x&color=green">
</div>
<img width="250px" src="public/editor2.gif">
</p>

## Documentation

[👉🏻 **Documentation**](https://medistream-team.github.io/imoji-editor/)

## Installation

```jsx
npm install imoji-editor
```

## Usage

```jsx
import ImojiEditor from 'imoji-editor';

Vue.use(ImojiEditor);
```

## Options

### Example

```jsx
<imoji-editor
    :default-image="importedImage"
    :sticker-images="stickerImages"
    :error-message="errorMessage"
    :width="width"
    :height="height"
    @done="done"
  />
```

### default-image

Use this props to put image from outside of editor. `Vue watch` will detect it.

- Default : undefined
- Type : Image Object (`new Image()`)

### sticker-images

Use this props to use sticker images what you want.

⚠ In version 1.0, we only support 1 set. So If you pass this props, default (Medigi Set) will be gone.

- Recommend : SVG files, because **png/jpg will show law quality** when user import big size photo.
- Default : Medigi character set
- Type : Array, svg, jpg, png

  > ### ⚠ Checkout Medigi chracter License
  >
  > ![](public/by-nc-nd.svg)  
  > ©Medistream 2021. All right reserved.

### width, height

The size of photo editor. You should set this option when using in modal. Checkout more information about using in modal [here](###using-in-modal).

Imoji's size always same as photo editor canvas's size. Also, sticker-canvas's size will be automatically fit with photo editor.

- Default : document clientHeight
- Type : number

### done

You can customize action of output button. This custom event will return result image object (`new Image()`) by done event's argument. You can handle this object like download, enroll, or post to server whatever you want.

- Recommend : please destroy editor after user click done button.
- Default : null
- Type : event
- Argument : result image object (`new Image()`) by data64 png

### error-message

You can set error message that come with alert when user click `edit` button or `sticker` button although image not exists

- Default : korean
- Type : string

## Example

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

## Features

### Free Crop

```js
this.photoCanvas.setFreeCrop();
```

When user click crop button, Free Crop will set automatically.

### Ratio Crop

```js
this.photoCanvas.setCropRatio(x, y);
this.photoCanvas.setCropRatio(16, 9); // set crop ratio to 16:9
```

- default : 16:9, 4:3, 2:3, 1:1

### Flip

```js
this.photoCanvas.flip(direction);
this.photoCanvas.flip('X'); // flip x-axis
```

- default : Y flip, X flip

### Rotate

```js
this.photoCanvas.rotate(sign);
this.photoCanvas.rotate('+'); // rotate 90 degree
```

- default : +90 degree, -90 degree

### Zoom

```js
this.photoCanvas.zoom(ratio);
this.photoCanvas.zoom(-0.1); // zoom out 10%
```

- default : + 0.1 , - 0.1

When user click sticker mode, zoom will be initialized. If you want save zoom state, you should crop it before open sticker mode by using crop tool.

### Add Sticker

```js
this.stickerCanvas.addSticker(src, [options]);
```

You need sticker images's url. Options are optional, and you can check in fabric.js

- Recommend : SVG files
- Default : medigi character set
- Delete : delete button just delete activate sticker one by one
- Reset : delete all sticker, but photo edit will be reset too.

### Remove Sticker

```js
this.stickerCanvas.removeSticker(src, [options]);
```

Delete activate(=clicked by user) sticker

### Reset Sticker

```js
this.stickerCanvas.removeAllSticker(src, [options]);
```

Delete all sticker

## How To Save Result Image

## Mobile Touch

- Support touch move only in crop mode.
- We didn't support touch zoom because of stability. Instead of it, you can use zoom buttons

You can use all of Cropper JS's options, But in this editor debugging not support perfectly

## Contributors

- [medistream](https://github.com/medistream-team)
- [emewjin](https://github.com/emewjin)
- [junchi211](https://github.com/junchi211)

## 🙏🏻 Bugs

Please write [Issues](https://github.com/medistream-team/imoji-editor/issues) on our github repository
