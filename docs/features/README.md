## Change Image

If you want to change the target image to another image, just click image icon button and select new image.

<p align="center">
<img width="250px" src="https://github.com/medistream-team/imoji-editor/raw/master/public/change.gif">
</p>

## Free Crop

User can set crop area by drag or touch(mobile).

When user clicks crop button, Free Crop will set automatically. If you click crop button again, crop area will be cleared.

Please click ✅ button to complete the crop. Also, if you switch to sticker mode while the crop area is active, crop will be done automatically.

```jsx
// ImojiEditor.js
this.photoCanvas.setFreeCrop();
```

## Ratio Crop

- default : 16:9, 4:3, 2:3, 1:1

```jsx
// ImojiEditor.js
this.photoCanvas.setCropRatio(x, y);
this.photoCanvas.setCropRatio(16, 9); // set crop ratio to 16:9
```

## Flip

- default : Y flip, X flip

```jsx
// ImojiEditor.js
this.photoCanvas.flip(direction);
this.photoCanvas.flip('X'); // flip x-axis
```

## Rotate

- default : +90 degree, -90 degree

```jsx
// ImojiEditor.js
this.photoCanvas.rotate(sign);
this.photoCanvas.rotate('+'); // rotate 90 degree
```

## Zoom

- default : + 0.1 , - 0.1

When user clicks sticker mode, zoom will be initialized. If you want to save zoom state, you should finish crop before switching to sticker mode.

```jsx
// ImojiEditor.js
this.photoCanvas.zoom(ratio);
this.photoCanvas.zoom(-0.1); // zoom out 10%
```

## Move

User can move image to crop more easily by drag or touch (mobile) ONLY when move button is clicked. Move icon button is ONLY supported during crop mode.

<p align="center">
<img width="250px" src="https://github.com/medistream-team/imoji-editor/raw/master/public/move.gif">
</p>

```jsx
// ImojiEditor.js
this.photoCanvas.setDragMode('move');
```

## Reset

User can reset photo to init state by click reset icon button.

- default : reset to initial photo state.

```jsx
// ImojiEditor.js
this.photoCanvas.reset();
```

## Add Sticker

User can add sticker by clicking each sticker. We support rotate, flip, and resizing of sticker by drag or touch.

- Recommend : SVG files
- Default : medigi character set

```jsx
// ImojiEditor.js
this.stickerCanvas.addSticker(src, [options]);
```

## Remove Sticker

User can delete sticker by clicking trash can icon button. It will delete activate(=clicked by user) sticker one by one.

<p align="center">
<img width="250px" src="https://github.com/medistream-team/imoji-editor/raw/master/public/removeone.gif">
</p>

```jsx
// ImojiEditor.js
this.stickerCanvas.removeSticker(src, [options]);
```

## Reset Sticker

User can delete all stickers by clicking reset icon button, but photo edit will also reset.

```jsx
// ImojiEditor.js
this.stickerCanvas.removeAllSticker(src, [options]);
```

## Export Result Image

Click download icon button to export result image. Image size will be based on the natural size of the original image.

- Type : Image Object(`new Image()`), data 64 PNG

## Mobile Touch

- Support touch move only in crop mode.
- We didn't support touch zoom because of stability. Instead of it, you can use zoom buttons.
