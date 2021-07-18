<div align="center"><img width="250px" src="https://github.com/medistream-team/imoji-editor/raw/develop/public/imoji-editor-symbol.svg"></div>
<h1 align="center">✨ imoji Editor</h1>
<p align="center">
The image editor with a feature that you can add stickers to images!
</p>
<p align="center">
<img src="https://img.shields.io/npm/v/imoji-editor?color=red">
<img src="https://img.shields.io/static/v1?label=javascript&message=ES6&color=yellow">
<img src="https://img.shields.io/static/v1?label=vue&message=2.x&color=green">
<img src="https://img.shields.io/static/v1?label=license&message=MIT,CC&color=blue">
</p>
<p align="center">
<img width="350px" src="https://user-images.githubusercontent.com/76927618/125900138-03737084-4325-4a5b-b47c-02c97346fdbe.gif">
</p>

## Documentation

[👉🏻 **Checkout here!**](https://medistream-team.github.io/imoji-editor/)

## Table of contents

- [Installation](##installation)
- [Usage](##usage)
- [Options](##options)
- [Example](##example)
- [Features](##features)
- [Contributors](##contributors)
- [Bug Report](##🙏🏻-bug-report)

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
    :width="600"
    :height="480"
    @done="image => {
      // Do what you want
    }"
    :photo-selection-disabled="true"
  />
```

### default-image

Use this prop to put image from outside of editor. `Vue watch` will detect it.

- Default : undefined
- Type : Image Object (`new Image()`)

### sticker-images

Use this prop to use sticker images what you want.

⚠ In version 1.0, we are supporting only 1 set. So, if you pass this prop, default (Medigi Set) will disappear.

- Recommend : SVG files, because **png/jpg will show law quality** when user import big size photo.
- Default : Medigi character set
- Type : Array, svg, jpg, png

  > ### ⚠ Checkout Medigi character License
  >
  > Although Imoji is open source, the Medigi character's copyright is subject to the following:
  >
  > <img src="https://github.com/medistream-team/imoji-editor/raw/master/public/by-nc-nd.svg">
  >
  > ©Medistream 2021. All right reserved.

### width, height

Set size of the photo editor. You should set this option when using in modal. Checkout more information about using in modal [here](###using-in-modal).

Imoji’s size is always same as the photo editor canvas’s size. Also, the sticker canvas’s size will automatically fit with photo editor.

- Default : document clientHeight
- Type : number

### done

You can customize outcome when you click the button however you want. This custom event will return result Image Object (`new Image()`) as argument of the event.

- Recommend : Please **destroy editor** after user click done button.
- Default : download result edited image
- Type : event
- Argument : result Image Object (`new Image()`) by data64 PNG

> ---
>
> 🔻 Below are added in version 0.1.6

### photo-selection-disabled

Use this prop to prevent user change/select photo in editor.

- Default : false
- Type : Boolean

### error

You can handle error when you use `done` event.

- Default : null
- Type : event
- Argument : error about get result image

### sticker-reset-message

Use this prop to change the warning message that the stickers will be reset when the `Edit` button is clicked.

- Default : `All stickers are deleted when you edit the photo`
- Type : string

### photo-edit-label

Use this prop to change 'Photo' mode's text what you want.

- Default : 'Photo'
- Type : String

### sticker-edit-label

Use this prop to change 'Emoji Sticker' mode's text what you want.

- Default : 'Emoji Sticker'
- Type : String

### done-label

Use this prop to change download icon to text what you want.

- Default : null
- Type : String

## Example

### Using in Full Page

- Recommend : In Mobile

```jsx
<imoji-editor></imoji-editor>
```

### Using in Modal

- Recommend : In Desktop

Please set width, height that fit with Modal's like this.

```jsx
<imoji-editor :width="640" :height="800"></imoji-editor>
```

**⚠ You should check [Cropper JS's documentation](https://github.com/fengyuanchen/cropperjs) first 🔻**

> If you are using in a modal, you should initialize the editor after the modal is shown completely. Otherwise, you will not get the correct crop.

## Features

### Change Image

If you want to change the target image to another image, just click image icon button and select new image.

<p align="center">
<img width="250px" src="https://github.com/medistream-team/imoji-editor/raw/master/public/change.gif">
</p>

### Free Crop

User can set crop area by drag or touch(mobile).

When user clicks crop button, Free Crop will set automatically. If you click crop button again, crop area will be cleared.

Please click ✅ button to complete the crop. Also, if you switch to sticker mode while the crop area is active, crop will be done automatically.

```jsx
// ImojiEditor.js
this.photoCanvas.setFreeCrop();
```

### Ratio Crop

- default : 16:9, 4:3, 2:3, 1:1

```jsx
// ImojiEditor.js
this.photoCanvas.setCropRatio(x, y);
this.photoCanvas.setCropRatio(16, 9); // set crop ratio to 16:9
```

### Flip

- default : Y flip, X flip

```jsx
// ImojiEditor.js
this.photoCanvas.flip(direction);
this.photoCanvas.flip('X'); // flip x-axis
```

### Rotate

- default : +90 degree, -90 degree

```jsx
// ImojiEditor.js
this.photoCanvas.rotate(sign);
this.photoCanvas.rotate('+'); // rotate 90 degree
```

### Zoom

- default : + 0.1 , - 0.1

When user clicks sticker mode, zoom will be initialized. If you want to save zoom state, you should finish crop before switching to sticker mode.

```jsx
// ImojiEditor.js
this.photoCanvas.zoom(ratio);
this.photoCanvas.zoom(-0.1); // zoom out 10%
```

### Move

User can move image to crop more easily by drag or touch (mobile) ONLY when move button is clicked. Move icon button is ONLY supported during crop mode.

<p align="center">
<img width="250px" src="https://github.com/medistream-team/imoji-editor/raw/master/public/move.gif">
</p>

```jsx
// ImojiEditor.js
this.photoCanvas.setDragMode('move');
```

### Reset

User can reset photo to init state by click reset icon button.

- default : reset to initial photo state.

```jsx
// ImojiEditor.js
this.photoCanvas.reset();
```

### Add Sticker

User can add sticker by clicking each sticker. We support rotate, flip, and resizing of sticker by drag or touch.

- Recommend : SVG files
- Default : medigi character set

```jsx
// ImojiEditor.js
this.stickerCanvas.addSticker(src, [options]);
```

### Remove Sticker

User can delete sticker by clicking trash can icon button. It will delete activate(=clicked by user) sticker one by one.

<p align="center">
<img width="250px" src="https://github.com/medistream-team/imoji-editor/raw/master/public/removeone.gif">
</p>

```jsx
// ImojiEditor.js
this.stickerCanvas.removeSticker(src, [options]);
```

### Reset Sticker

User can delete all stickers by clicking reset icon button, but photo edit will also reset.

```jsx
// ImojiEditor.js
this.stickerCanvas.removeAllSticker(src, [options]);
```

### Export Result Image

Click download icon button to export result image. Image size will be based on the natural size of the original image.

- Type : Image Object(`new Image()`), data 64 PNG

### Mobile Touch

- Support touch move only in crop mode.
- We didn't support touch zoom because of stability. Instead of it, you can use zoom buttons.

## Contributors

- [medistream](https://github.com/medistream-team)
- [emewjin](https://github.com/emewjin)
- [junchi211](https://github.com/junchi211)

## 🙏🏻 Bug Report

[👉🏻 Issues](https://github.com/medistream-team/imoji-editor/issues)
: Please give us feedback on our github repository if there are any issues!
