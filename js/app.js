import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { TimelineMax } from "gsap";

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

float SineCrazy(vec3 p){
  return 1. - (sin(p.x) + sin(p.y) + sin(p.z))/3.;
}

float scene(vec3 p){    
    vec3 p1 = rotate(p, vec3(1., 1., 1.), time/4.);

    float scale = 15. + 10. * sin(time/6.);
    
    return max(sphere(p), (0.85 - SineCrazy(p1 * scale))/scale);
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

void main(){
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);

    vec2 p = newUV - vec2(0.5);

    vec3 camPos = vec3(0., 0., 2.);

    vec3 ray = normalize(vec3(p, -1.));

    vec3 rayPos = camPos;

    float curDist = 0.;
    float rayLen = 0.;

    vec3 light = vec3(-1., 1., 1.);

    vec3 color = vec3(0.);

    for (int i = 0; i <= 64; i++) {
        curDist = scene(rayPos);
        rayLen += curDist;

        rayPos = camPos + ray * rayLen;

        //SE EU COLOCAR UM || rayLen > ?. O FUNDO FICA LOCO
        if (abs(curDist) < 0.001) {

          vec3 n = getNormal(rayPos);

          float diff = dot(n, light);

          //color = GetColor(diff);
          // color = GetColor(2. * length(rayPos));
          break;
        }
        //LUZ DE DENTRO
        color += 0.005* GetColor(5. * length(rayPos));

    }

    gl_FragColor = vec4(color, 1.);
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
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.paused = false;

    this.setupResize();

    this.addObjects();
    this.resize();
    this.render();
    this.mouseEvents();
    // this.settings();
  }

  mouseEvents() {
    let that = this;
    this.mouse = new THREE.Vector2();
    function onMouseMove(event) {
      that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      that.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      that.material.uniforms.mouse.value = that.mouse;
    }
    window.addEventListener("mousemove", onMouseMove, false);
  }

  settings() {
    let that = this;
    this.settings = {
      time: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "time", 0, 100, 0.01);
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

    // // if(w/h>1) {
    // if (this.width / this.height > 1) {
    //   this.plane.scale.x = this.camera.aspect;
    //   // this.plane.scale.y = this.camera.aspect;
    // } else {
    //   this.plane.scale.y = 1 / this.camera.aspect;
    // }

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        mouse: { type: "v2", value: new THREE.Vector2(0, 0) },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  render() {
    if (!this.paused) {
      this.time += 0.05;
      this.material.uniforms.time.value = this.time;
      if (this.mouse) {
        this.material.uniforms.mouse.value = this.mouse;
      }
    }

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
