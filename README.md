[![npm version](https://badge.fury.io/js/%40justinribeiro%2Fstl-part-viewer.svg)](https://badge.fury.io/js/%40justinribeiro%2Fstl-part-viewer)

# \<stl-part-viewer\>

> A web component that displays an STL model with [three.js](https://threejs.org/) and [Lit](https://lit.dev/).

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
npm i @justinribeiro/stl-part-viewer
# or
yarn add @justinribeiro/stl-part-viewer
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
`stl-part-viewer` utilizes Custom Elements and Shadow DOM ([Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)), and [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). You may need the [Lit polyfill-support](https://lit.dev/docs/releases/upgrade/#load-polyfill-support-when-using-web-components-polyfills) depending on what you're trying to target.

Within your project, you can load them as such:

```html
<script src="../node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
<script src="../node_modules/lit/platform-support.js">
<script src="../node_modules/intersection-observer/intersection-observer.js"></script>
```
