import * as THREE from "three";
import * as dat from "dat.gui";

const vertexShader = `
varying vec2 vUv;
varying vec2 vCoordinates;
attribute vec3 aCoordinates;

void main(){
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;

  vCoordinates = aCoordinates.xy;
}
`;

const fragmentShader = `
uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 resolution;

uniform float moveX;
uniform float moveY;
uniform float zoom;
uniform float rotation;

uniform float details;
uniform float shine;
uniform float backgroundColor;

uniform float sinWave;
uniform float sinCrazy;
uniform float cosCrazy;
uniform float tanCrazy;
uniform float expCrazy;
uniform float spiral;
uniform float rays;
uniform float perpendicularWaves;
uniform float concentricCircles;

varying vec2 vUv;
varying vec4 vPosition;

mat4 rotationMatrix(vec3 axis, float angle){
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0
  );
}

vec3 rotate(vec3 v, vec3 axis, float angle){
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}

float sphere(vec3 p){
  return length(p) - 0.5;
}

float sdBox(vec3 p, vec3 b){
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float SineWave(vec3 p){
  return 1. - sin(p.x + sin(p.y + sin(p.z)));
}

float Rays(vec3 p) {
  float t = sin(p.x) + sin(p.y) + sin(p.z);
  float noise = sin(t * t * t);
  float rays = step(noise, 0.0);
  return rays;
}

float PerpendicularWaves(vec3 p) {
  return sin(p.x) * sin(p.y) + sin(p.y) * sin(p.z) + sin(p.z) * sin(p.x);
}

float Spiral(vec3 p) {
  float r = length(p.xy);
  float theta = atan(p.y, p.x);
  float spiral = sin(r + theta * 2.0);
  return spiral;
}

float ConcentricCircles(vec3 p) {
  float r = length(p.xy);
  float circle = mod(r, 1.0);
  return circle;
}

float SineCrazy(vec3 p){
  return 1. - (sin(p.x) + sin(p.y) + sin(p.z))/3.;
}

float CosineCrazy(vec3 p){
  return 1. - (cos(p.x) + cos(p.y) + cos(p.z))/3.;
}

float TanCrazy(vec3 p){
  return 1. - (tan(p.x) + tan(p.y) + tan(p.z))/3.;
}

float ExpCrazy(vec3 p){
  return 1. - (exp(-abs(p.x)) + exp(-abs(p.y)) + exp(-abs(p.z)))/3.;
}

float scene(vec3 p){
  if (rotation > 0.){
    vec3 p1 = rotate(p, vec3(1., 1., 1.), time/10.);

    float scale = 15. + 10. * sin(time/6.);

    if (sinWave > 0.){
      return max(sphere(p), (details - SineWave(p1 * scale))/scale);
    } else if (sinCrazy > 0.){
      return max(sphere(p), (details - SineCrazy(p1 * scale))/scale);
    } else if (cosCrazy > 0.){
      return max(sphere(p), (details - CosineCrazy(p1 * scale))/scale);
    } else if (tanCrazy > 0.){
      return max(sphere(p), (details - TanCrazy(p1 * scale))/scale);
    } else if (expCrazy > 0.){
      return max(sphere(p), (details - ExpCrazy(p1 * scale))/scale);
    } else if (spiral > 0.){
      return max(sphere(p), (details - Spiral(p1 * scale))/scale);
    } else if (rays > 0.){
      return max(sphere(p), (details - Rays(p1 * scale))/scale);
    } else if (perpendicularWaves > 0.){
      return max(sphere(p), (details - PerpendicularWaves(p1 * scale))/scale);
    } else if (concentricCircles > 0.){
      return max(sphere(p), (details - ConcentricCircles(p1 * scale))/scale);
    } else {
      return max(sphere(p), (details - PerpendicularWaves(p1 * scale))/scale);
    }
  } else {
    float scale = 15. + 10. * sin(time/6.);
    
    if (sinWave > 0.){
      return max(sphere(p), (details - SineWave(p * scale))/scale);
    } else if (sinCrazy > 0.){
      return max(sphere(p), (details - SineCrazy(p * scale))/scale);
    } else if (cosCrazy > 0.){
      return max(sphere(p), (details - CosineCrazy(p * scale))/scale);
    } else if (tanCrazy > 0.){
      return max(sphere(p), (details - TanCrazy(p * scale))/scale);
    } else if (expCrazy > 0.){
      return max(sphere(p), (details - ExpCrazy(p * scale))/scale);
    } else if (spiral > 0.){
      return max(sphere(p), (details - Spiral(p * scale))/scale);
    } else if (rays > 0.){
      return max(sphere(p), (details - Rays(p * scale))/scale);
    } else if (perpendicularWaves > 0.){
      return max(sphere(p), (details - PerpendicularWaves(p * scale))/scale);
    } else if (concentricCircles > 0.){
      return max(sphere(p), (details - ConcentricCircles(p * scale))/scale);
    } else {
      return max(sphere(p), (details - PerpendicularWaves(p * scale))/scale);
    }
  }
}

vec3 getNormal(vec3 p){
    vec2 e = vec2(0.001, 0.);
    return normalize(vec3(
      scene(p + e.xyy) - scene(p - e.xyy),
      scene(p + e.yxy) - scene(p - e.yxy),
      scene(p + e.yyx) - scene(p - e.yyx)
    ));
}

vec3 GetColor(float amount){
  vec3 col = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + amount));
  return col * amount;
}

vec3 GetColorAmount(vec3 p){
  float amount = clamp((backgroundColor - length(p))/2., 0., 1.);
  vec3 col = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + amount));
  return col * amount;
}

void main(){
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);

    vec2 p = newUV - vec2(0.5);

    p.x += moveX * 0.1;
    p.y += moveY * 0.1;

    vec3 camPos = vec3(0., 0., 3. - zoom * 0.5);

    vec3 ray = normalize(vec3(p, -1.));

    vec3 rayPos = camPos;

    float curDist = 0.;
    float rayLen = 0.;

    vec3 light = vec3(-1., 1., 1.);

    vec3 color = vec3(0.);

    for (int i = 0; i <= 64; i++) {
      curDist = scene(rayPos);
      rayLen += 0.6 * curDist;

      rayPos = camPos + ray * rayLen;

      if (abs(curDist) < 0.001) {

        vec3 n = getNormal(rayPos);

        float diff = dot(n, light);

        break;
      }
      color += 0.04 * GetColorAmount(rayPos);
    }
  gl_FragColor = vec4(color, 1.) * shine + vec4(color, 1.);
}
`;

export default class Sketch {
  constructor(selector) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);

    this.container = document.getElementById("container");
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 2);
    this.time = 0;

    this.paused = false;

    this.setupResize();

    this.addObjects();
    this.resize();
    this.render();
    this.settings();
    this.hexToRgb();
  }

  hexToRgb() {
    let that = this;
    function hexToRgb(hex) {
      if (!hex) {
        return undefined;
      }
      // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
      });

      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
        that.settings.colorA
      );

      return result
        ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255,
          ]
        : null;
    }
    that.settings.colorA = hexToRgb(that.settings.colorA);
  }

  settings() {
    let that = this;
    that.settings = {
      moveX: 0,
      moveY: 0,
      zoom: 0,
      rotation: false,
      details: 1,
      shine: 0,
      backgroundColor: 0.7,
      sinWave: false,
      sinCrazy: false,
      cosCrazy: false,
      tanCrazy: false,
      expCrazy: false,
      spiral: false,
      perpendicularWaves: true,
      rays: false,
      concentricCircles: false,
    };
    that.gui = new dat.GUI();
    const moveObject = that.gui.addFolder("Move Object");
    moveObject.add(that.settings, "moveX", -1, 1, 0.01);
    moveObject.add(that.settings, "moveY", -1, 1, 0.01);
    moveObject.add(that.settings, "zoom", -4, 4, 0.01);
    moveObject.add(that.settings, "rotation", true, false, true);
    moveObject.open();
    const details = that.gui.addFolder("Details");
    details.add(that.settings, "details", 0, 1, 0.01);
    details.add(that.settings, "shine", 0, 2, 0.01);
    details.add(that.settings, "backgroundColor", 0.7, 5, 0.01);
    details.open();
    const typesSphere = that.gui.addFolder("Types of Sphere");
    typesSphere.add(that.settings, "sinWave", true, false, true);
    typesSphere.add(that.settings, "sinCrazy", true, false, true);
    typesSphere.add(that.settings, "cosCrazy", true, false, true);
    typesSphere.add(that.settings, "tanCrazy", true, false, true);
    typesSphere.add(that.settings, "expCrazy", true, false, true);
    typesSphere.add(that.settings, "spiral", true, false, true);
    typesSphere.add(that.settings, "perpendicularWaves", true, false, true);
    typesSphere.add(that.settings, "rays", true, false, true);
    typesSphere.add(that.settings, "concentricCircles", true, false, true);
    typesSphere.open();
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.imageAspect = 1;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (this.height / this.width) * this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    // optional - cover width
    const dist = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

    if (this.width / this.height > 1) {
      this.plane.scale.x = this.camera.aspect;
    } else {
      this.plane.scale.y = 1 / this.camera.aspect;
    }

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    that.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        moveX: { type: "f", value: 0 },
        moveY: { type: "f", value: 0 },
        zoom: { type: "f", value: 0 },
        rotation: { type: "f", value: 0 },
        details: { type: "f", value: 0 },
        shine: { type: "f", value: 0 },
        backgroundColor: { type: "f", value: 0 },
        sinWave: { type: "f", value: 0 },
        sinCrazy: { type: "f", value: 0 },
        cosCrazy: { type: "f", value: 0 },
        tanCrazy: { type: "f", value: 0 },
        expCrazy: { type: "f", value: 0 },
        spiral: { type: "f", value: 0 },
        perpendicularWaves: { type: "f", value: 0 },
        rays: { type: "f", value: 0 },
        concentricCircles: { type: "f", value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    that.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    that.plane = new THREE.Mesh(that.geometry, that.material);
    that.scene.add(that.plane);
  }

  render() {
    if (!this.paused) {
      this.time += 0.05;

      this.material.uniforms.time.value = this.time;

      this.material.uniforms.moveX.value = this.settings.moveX;
      this.material.uniforms.moveY.value = this.settings.moveY;
      this.material.uniforms.zoom.value = this.settings.zoom;
      this.material.uniforms.rotation.value = this.settings.rotation;

      this.material.uniforms.details.value = this.settings.details;
      this.material.uniforms.shine.value = this.settings.shine;
      this.material.uniforms.backgroundColor.value =
        this.settings.backgroundColor;
    }

    this.material.uniforms.sinWave.value = this.settings.sinWave;
    this.material.uniforms.sinCrazy.value = this.settings.sinCrazy;
    this.material.uniforms.cosCrazy.value = this.settings.cosCrazy;
    this.material.uniforms.tanCrazy.value = this.settings.tanCrazy;
    this.material.uniforms.expCrazy.value = this.settings.expCrazy;
    this.material.uniforms.spiral.value = this.settings.spiral;
    this.material.uniforms.perpendicularWaves.value =
      this.settings.perpendicularWaves;
    this.material.uniforms.rays.value = this.settings.rays;
    this.material.uniforms.concentricCircles.value =
      this.settings.concentricCircles;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
