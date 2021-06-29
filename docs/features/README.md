## ✨ Features

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

- Default : medigi character set
- Delete : delete button just delete activate sticker one by one
- Reset : delete all sticker, but photo edit will be reset too.

### Mobile Touch

- Support touch move only in crop mode.
- We didn't support touch zoom because of stability. Instead of it, you can use zoom buttons