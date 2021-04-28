import { LitElement, html, css } from "lit";
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  CubeCamera,
  Vector3,
  Box3,
  Color,
  Fog,
  HemisphereLight,
  SpotLight,
  PointLight,
  GridHelper,
  PlaneGeometry,
  DoubleSide,
  Mesh,
  MeshPhongMaterial,
  SmoothShading,
} from "three";
import { StlLoader } from "./stl-loader";
import { OrbitControls } from "./orbit-controls";

/**
 * `stl-part-viewer`
 * A simple STL part viewer based on three.js.
 *
 * ```
 *  <stl-part-viewer src="sample.stl"></stl-part-viewer>
 * ```
 *
 * #### Attributes
 * | Name | Description | Default |
 * | --- | --- | --- |
 * | `src` | Location of the STL file you want the viewer to load | `` |
 * | `fullscreen` | Text value of the full screen button | `Full Screen` |
 * | `backgroundcolor` | Set the background color of the scene; rgb(), hsl(), or X11 color string | `0xf1f1f1` |
 * | `floorcolor` | Set the floor plane color; rgb(), hsl(), or X11 color string | `0x666666` |
 * | `modelcolor` | Set the model color; rgb(), hsl(), or X11 color string | `0xfffe57` |
 *
 * @polymer
 * @extends HTMLElement
 * @demo demo/index.html
 */
class StlPartViewer extends LitElement {
  static get properties() {
    return {
      /**
       * Set to location of an STL file
       */
      src: String,

      /**
       * Set the full screen button text
       */
      fullscreen: String,

      /**
       * Set the background color of the scene;
       * Use rgb(), hsl(), or X11 color string
       */
      backgroundcolor: String,

      /**
       * Set the floor plane color;
       * Use rgb(), hsl(), or X11 color string
       */
      floorcolor: String,

      /**
       * Set the color of the model file loaded;
       * Use rgb(), hsl(), or X11 color string
       */
      modelcolor: String,
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        width: 100%;
        min-height: 400px;
        line-height: 0;
      }
      canvas {
        width: 100%;
        min-height: 400px;
      }
      button {
        position: absolute;
        top: 20px;
        right: 20px;
        border-radius: 3px;
        border: 1px solid #ccc;
        padding: 5px;
      }
    `;
  }

  render() {
    return html`
      <button @click="${this.__enterFullscreen}">
        ${this.fullscreen}
      </button>
      <canvas></canvas>
    `;
  }

  constructor() {
    super();

    this._modelLoaded = false;
    this._pauseRender = false;

    this.fullscreen = "Full Screen";
    this.backgroundcolor = 0xf1f1f1;
    this.floorcolor = 0x666666;
    this.modelcolor = 0xfffe57;
  }

  connectedCallback() {
    super.connectedCallback();

    this._scene = new Scene();
    this._scene.background = new Color(this.backgroundcolor);
    this._scene.fog = new Fog(this.backgroundcolor);

    this.__setReflection();
    this.__setGrid();
    this.__setLights();
  }

  /**
   * lit-element: Called after the element DOM is rendered for the first time.
   */
  firstUpdated() {
    // because composed DOM is one microtask after the dom mutates;
    // we need to sync the composition so that we can get offsetWidth for the
    // render, otherwise will return 0 (incorrectly)
    // only valid for the ShadyDOM polyfill; this won't run when Shadow in use
    try {
      ShadyDOM.flush();
    } catch (e) {
      // no shadydom for you
    }

    this.__initRender();
  }

  /**
   * Fire up the renderer
   */
  __initRender() {
    const canvas = this.shadowRoot.querySelector("canvas");

    this._renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);

    this.__setCameraAndRenderDimensions();
    this.__setControls();

    this.__initIntersectionObserver();
    this.__initFullScreenApi();

    // TODO blah, this is dumb, polyfill ResizeObserver and use that
    window.addEventListener("resize", (e) => {
      try {
        ShadyDOM.flush();
      } catch (e) {
        // no shadydom for you
      }

      this.__setProjectionMatrix(this.offsetWidth, this.offsetHeight);
    });
  }

  /**
   * Setup the Intersection Observer to load the defined model for the viewer
   * and pause rendering when not in view
   * @memberof StlPartViewer
   * @private
   */
  __initIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this._modelLoaded) {
          this.__loadModel();
        }

        if (!entry.isIntersecting) {
          this._pauseRender = true;
        } else {
          this._pauseRender = false;
        }

        // The intersection observer starts the renderer
        if (!this._pauseRender) {
          this.__render();
        }
      });
    }, options);

    observer.observe(this);
  }

  /**
   * Check if there is a full screen element
   * @returns {boolean}
   * @memberof StlPartViewer
   * @private
   */
  __isFullScreenElement() {
    return (
      document.webkitFullScreenElement ||
      document.webkitCurrentFullScreenElement ||
      document.mozFullScreenElement ||
      document.fullScreenElement
    );
  }

  /**
   * Setup the full screen api event listener so that we can chnage the
   * projection matrix of the render viewport as needed
   * @memberof StlPartViewer
   * @private
   */
  __initFullScreenApi() {
    const canvas = this.shadowRoot.querySelector("canvas");

    canvas.onfullscreenchange = canvas.onwebkitfullscreenchange = canvas.onmozfullscreenchange = (
      event
    ) => {
      if (this.__isFullScreenElement()) {
        // TODO why is full screen so slow on calc? innerWidth/Height are
        // wrong, doesn't render correctly
        setTimeout(
          () =>
            this.__setProjectionMatrix(window.innerWidth, window.innerHeight),
          200
        );
      } else {
        setTimeout(
          () =>
            this.__setProjectionMatrix(
              this._elementDimensions.width,
              this._elementDimensions.height
            ),
          200
        );
      }
    };
  }

  /**
   * Take the current rendering canvas for our web component and request full
   * screen via the Full Screen API
   * @memberof StlPartViewer
   * @private
   */
  __enterFullscreen() {
    const canvas = this.shadowRoot.querySelector("canvas");

    this._pauseRender = false;
    this.__render();

    if (canvas.mozRequestFullScreen) {
      canvas.mozRequestFullScreen();
    } else if (canvas.webkitRequestFullScreen) {
      canvas.webkitRequestFullScreen();
    } else {
      canvas.requestFullscreen();
    }
  }

  /**
   * Define the reflection camera and plane and add them to the scene so we have
   * a cool mirror-like effect
   * @memberof StlPartViewer
   * @private
   */
  __setReflection() {
    this._reflectionCamera = new CubeCamera(0.1, 1000, 512);
    this._scene.add(this._reflectionCamera);

    this._reflectionPlane = new Mesh(
      new PlaneGeometry(
        1000,
        1000,
        Math.floor(1000 / 30),
        Math.floor(1000 / 30)
      ),
      new MeshPhongMaterial({
        color: new Color(this.floorcolor),
        wireframe: false,
        envMap: this._reflectionCamera.renderTarget.texture,
      })
    );
    this._reflectionPlane.name = "reflection";
    this._reflectionPlane.receiveShadow = true;
    this._scene.add(this._reflectionPlane);
  }

  /**
   * Setup the box grid for the bottom plane
   * @memberof StlPartViewer
   * @private
   */
  __setGrid() {
    this._gridHelper = new GridHelper(1000, 50, 0xffffff, 0xffffff);
    this._gridHelper.geometry.rotateX(Math.PI / 2);
    this._gridHelper.lookAt(new Vector3(0, 0, 1));
    this._scene.add(this._gridHelper);
  }

  /**
   * Define our scene lighting
   * @memberof StlPartViewer
   * @private
   */
  __setLights() {
    const hemiphereLight = new HemisphereLight(0xffffbb, 0x080820, 0.5);
    this._scene.add(hemiphereLight);

    const spotLightFront = new SpotLight(0xffffff, 0.5, 0);
    spotLightFront.position.set(-500, 500, 500);
    this._scene.add(spotLightFront);

    const lightbulb = new PointLight(0xffffff, 0.5, 0);
    lightbulb.position.set(2000, -2000, 2000);
    this._scene.add(lightbulb);
  }

  /**
   * Set the render size and camera aspect ratio as needed based on display
   * height and width. Important for resize and full screen events (otherwise
   * we'll be blurring and stretched).
   * @param {Number} width
   * @param {Number} height
   * @memberof StlPartViewer
   * @private
   */
  __setProjectionMatrix(width, height) {
    this._renderer.setSize(width, height);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
  }

  /**
   * Define our single camera and its position
   * @memberof StlPartViewer
   * @private
   */
  __setCameraAndRenderDimensions() {
    // This is for the fullscreen exit; the offset is incorrect when checked
    // immediately, so we just cache it for speed
    // TODO track this on potential element resizing
    this._elementDimensions = {
      width: this.offsetWidth,
      height: this.offsetHeight,
    };

    this._camera = new PerspectiveCamera(
      36,
      this.offsetWidth / this.offsetHeight,
      0.1,
      1000
    );
    this._camera.position.set(-350, -100, 100);
    this._camera.up = new Vector3(0, 0, 1);

    this.__setProjectionMatrix(this.offsetWidth, this.offsetHeight);
  }

  /**
   * Setup of user interface controls
   * @memberof StlPartViewer
   * @private
   */
  __setControls() {
    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 1.2;
  }

  /**
   * Use the StlLoader() to loa and ASCII or BINARY STL file
   * @memberof StlPartViewer
   * @private
   */
  __loadModel() {
    new StlLoader().load(this.src, (geometry) => {
      this.__addModel(geometry);
      this._modelLoaded = true;
    });
  }

  /**
   * Add a model to the scene
   * @param {Float32Array} geometry
   * @memberof StlPartViewer
   * @private
   */
  __addModel(geometry) {
    const material = new MeshPhongMaterial({
      color: new Color(this.modelcolor),
      specular: 0xc6c6c6,
      flatShading: SmoothShading,
      shininess: 25,
      fog: false,
      side: DoubleSide,
    });

    const model = new Mesh(geometry, material);

    model.geometry.computeBoundingBox();

    const boundingBoxMin = model.geometry.boundingBox.min;
    const boundingBoxMax = model.geometry.boundingBox.max;
    const dimensions = boundingBoxMax.clone().sub(boundingBoxMin);
    const scale = 100 / Math.max(dimensions.x, dimensions.y, dimensions.z);

    model.position.x = -((boundingBoxMin.x + boundingBoxMax.x) / 2) * scale;
    model.position.y = -((boundingBoxMin.y + boundingBoxMin.y) / 2) * scale;
    model.position.z = -boundingBoxMin.z * scale;
    this._scene.add(model);

    this.__centerCamera();
  }

  /**
   * Determine where our model is in the scene and center the camera.
   * @memberof StlPartViewer
   * @private
   */
  __centerCamera() {
    const offset = 1.25;

    this._scene.traverse((object) => {
      if (object instanceof Mesh) {
        if (object.name === "reflection") {
          return;
        }

        const boundingBox = new Box3();
        const boundingBoxCenter = new Vector3();
        const boundingBoxSize = new Vector3();

        boundingBox.setFromObject(object);
        boundingBox.getCenter(boundingBoxCenter);
        boundingBox.getSize(boundingBoxSize);

        const dimension = Math.max(
          boundingBoxSize.x,
          boundingBoxSize.y,
          boundingBoxSize.z
        );
        const fov = this._camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs((dimension / 4) * Math.tan(fov * 2)) * offset;

        let cameraToFarEdge;
        if (boundingBox.min.z < 0) {
          cameraToFarEdge = -boundingBox.min.z + cameraZ;
        } else {
          cameraToFarEdge = cameraZ - boundingBox.min.z;
        }

        this._camera.position.z = cameraZ;
        this._camera.far = cameraToFarEdge * 3.5;
        this._camera.updateProjectionMatrix();

        if (this._controls) {
          this._controls.target = boundingBoxCenter;
          this._controls.maxDistance = cameraToFarEdge * 2.5;
          this._controls.saveState();
          this._controls.update();
        } else {
          this._camera.lookAt(boundingBoxCenter);
        }
      }
    });
  }

  /**
   * Update the reflection plane camera with a mirror of the model
   * @memberof StlPartViewer
   * @private
   */
  __updateReflection() {
    this._reflectionCamera.position.z = -this._camera.position.z;
    this._reflectionCamera.position.y = this._camera.position.y;
    this._reflectionCamera.position.x = this._camera.position.x;

    this._scene.traverse((object) => {
      if (object.name == "reflection") {
        object.visible = false;
      }
    });

    this._reflectionCamera.update(this._renderer, this._scene);

    this._scene.traverse((object) => {
      if (object.name == "reflection") {
        object.visible = true;
      }
    });
  }

  /**
   * Render all the things
   * @returns
   * @memberof StlPartViewer
   * @private
   */
  __render() {
    // The render will pause when the intersection observer says it's not in
    // view; we override this for the odd case where the canvas goes full screen
    if (this._pauseRender && !this.__isFullScreenElement()) {
      return;
    }
    this.__updateReflection();
    requestAnimationFrame(() => this.__render());
    this._renderer.render(this._scene, this._camera);
  }
}

window.customElements.define("stl-part-viewer", StlPartViewer);
