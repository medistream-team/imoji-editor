## ✨ Options

### Example

```jsx
<imoji-editor
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

Use this props to enroll sticker images what you want.  
⚠ In version 1.0, we only support 1 set. So If you pass this props, default Medigi set will be gone.

- Recommend : We recommend svg files, because png/jpg will have law quality when user import big size photo.
- Default : Medigi character set

  > Medigi chracter is copyright of Medistream - ©Medistream 2021. All right reserved. Any redistribution or reproduction of part or all of contents in any forms is prohibited other than the following :
  >
  > - You may print or download to a local hard disk extracts for your personal and non-commerial use only
  >
  > You may not, except with our express written permission, distribute or commercially exploit the content. Nor may you transmiit it or store it in any other website or other form of electronic retrieval system.)

- Type : Array, svg, jpg, png

### width, height

The size of photo editor. You should set this option when using in modal. The more information about usage in modal is [here](###Using-in-Modal).

Imoji-editor's size always same as photo editor canvas's size. Also, sticker-canvas's size will be automatically fit with photo editor.

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