[![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/stl-part-viewer)


# \<stl-part-viewer\>

> A web component that displays an STL part file with three.js, Polymer 3, and LitHTML.

![screenshot of stl-part-viewer](https://user-images.githubusercontent.com/643503/41803627-a4daf090-763f-11e8-9ef1-a2e11b0a34c6.png)

## Features

* Uses [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to load STL files when only in the viewport.
* Uses [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to pause rendering of scene when viewer is not in viewport
* Loads Binary and ASCII STL files
* Built as a web component on Polymer 3 / LitElement

## Install

This web component is built with Polymer 3 and ES modules in mind and is
available on NPM:

Install stl-part-viewer:

```sh
npm i stl-part-viewer --save
# or
yarn add stl-part-viewer
```

After install, import into your project:

```js
import 'stl-part-viewer';
```

Finally, use as required:

```html
<stl-part-viewer src="part.stl"></stl-part-viewer>
```

## Attributes
The web component allows certain attributes to be give a little additional
flexibility.

 | Name | Description | Default |
 | --- | --- | --- |
 | `src` | Location of the STL file you want the viewer to load | `` |
 | `fullscreen` | Text value of the full screen button | `Full Screen` |
 | `backgroundcolor` | Set the background color of the scene; rgb(), hsl(), or X11 color string | `0xf1f1f1` |
 | `floorcolor` | Set the floor plane color; rgb(), hsl(), or X11 color string | `0x666666` |
 | `modelcolor` | Set the model color; rgb(), hsl(), or X11 color string | `0xfffe57` |

## Polyfills Required
`stl-part-viewer` utilizes Custom Elements and Shadow DOM ([Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)), and [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). As you can see in the table below, you'll need some polyfills to make use of this across a wide range of browsers.

| Platform Support   | Chrome | Chrome for Android | Firefox | Safari | iOS Safari | Edge | IE 11 |
| ------------------ |:------:|:------:|:------:|:------:|:------:|:----:|:-----:|
| Supported          |✓|✓|✓|✓|✓|✓|✓|✓|
| Polyfill(s) Required |-|-|✓|✓|✓|✓|✓|✓|

Within your project, you can load them as such:

```html
<script src="../node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
<script src="../node_modules/intersection-observer/intersection-observer.js"></script>
```
