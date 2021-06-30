## Example

```jsx
<imoji-editor
    :default-image="importedImage"
    :sticker-images="stickerImages"
    :error-message="'please choose image first'"
    :width="600"
    :height="480"
    @done="image => {
      // Do what you want
    }"
  />
```

## default-image

Use this prop to put image from outside of editor. `Vue watch` will detect it.

- Default : undefined
- Type : Image Object (`new Image()`)

## sticker-images

Use this prop to use sticker images what you want.

⚠ In version 1.0, we are supporting only 1 set. So, if you pass this prop, default (Medigi Set) will disappear.

- Recommend : SVG files, because **png/jpg will show law quality** when user import big size photo.
- Default : Medigi character set
- Type : Array, svg, jpg, png

  > ## ⚠ Checkout Medigi character License
  >
  > Although Imoji is open source, the Medigi character's copyright is subject to the following:
  >
  > ![](/by-nc-nd.svg)  
  > ©Medistream 2021. All right reserved.

## error-message

Use this prop to write an error message to show if the user clicks `edit` or `sticker` button even if there is no image to edit.

- Default : korean
- Type : string

## width, height

Set size of the photo editor. You should set this option when using in modal. Checkout more information about using in modal [here](##using-in-modal).

Imoji’s size is always same as the photo editor canvas’s size. Also, the sticker canvas’s size will automatically fit with photo editor.

- Default : document clientHeight
- Type : number

## done

You can customize outcome when you click the button however you want. This custom event will return result Image Object (`new Image()`) as argument of the event.

- Recommend : Please **destroy editor** after user click done button.
- Default : null
- Type : event
- Argument : result Image Object (`new Image()`) by data64 PNG
