
//Globals TODO: Move these to a globals file
function rgb(r, g, b) {
  return ~~ (r * 255) << 16 ^ ~~ (g * 255) << 8 ^ ~~ (b * 255);
}
function rgb256(r, g, b) {
  return ~~ (r) << 16 ^ ~~ (g) << 8 ^ ~~ (b);
}
Math.tween = function(p1, p2, a) {
  return p1 * (1.0 - a) + p2 * a;
};

var FIREFOX = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
var IE = !!navigator.userAgent.match(/Trident.*rv[ :]*11\./);
var EDGE = window.navigator.userAgent.indexOf("Edge") > -1;

var FONT_NAME = "HelveticaNeue";
var SUB_FONT_NAME = "Orena";

/*
TODO:
[ ] render cart HUD
*/

//== threejs
var camera, stats;
var scene;
var container;
var raycaster;
var renderer;
var load_obj;
var load_tex;

var transformControls, cubeControls, orbitControls;

//== input
var mouse_at = new THREE.Vector2(-1, -1);
var win_dem = new THREE.Vector2(0, 0);

var mouse_touch = [];

var mouse_pressed = false;
var on_mouse_pressed = false;
var on_mouse_unpressed = false;
var mouse_pressed_last = false;

var rmouse_pressed = false;
var on_rmouse_pressed = false;
var on_rmouse_unpressed = false;
var rmouse_pressed_last = false;

var cur_last = -1;
var cur_skip = 0;


//== window
var canvas;

//== misc
var colors = [
  rgb256(64, 64, 64),
  rgb256(131, 224, 212),
  rgb256(131, 224, 212)
];

var meshes = [];
var emitters = [];

var gui = undefined;

viewcubeCanvas = '#viewcube';

var selectedComponent = false;

var lineYHelperGeometry = new THREE.BufferGeometry();
lineYHelperGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0,  0, 3, 0 ], 3 ) );
var lineYHelperMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 1 } );
var lineYHelper = new THREE.Line( lineYHelperGeometry, lineYHelperMaterial);

function calc_bb(obj) {
  var minX = 0.0;
  var minY = 0.0;
  var minZ = 0.0;
  var maxX = 0.0;
  var maxY = 0.0;
  var maxZ = 0.0;
  var first = true;

  obj.traverse (function (mesh) {
      if (mesh instanceof THREE.Mesh) {
          mesh.geometry.computeBoundingBox ();
          var bBox = mesh.geometry.boundingBox;

          if (first) {
              minX = bBox.min.x;
              minY = bBox.min.y;
              minZ = bBox.min.z;
              maxX = bBox.max.x;
              maxY = bBox.max.y;
              maxZ = bBox.max.z;

              first = false;
          } else {
              minX = Math.min(minX, bBox.min.x);
              minY = Math.min(minY, bBox.min.y);
              minZ = Math.min(minZ, bBox.min.z);
              maxX = Math.max(maxX, bBox.max.x);
              maxY = Math.max(maxY, bBox.max.y);
              maxZ = Math.max(maxZ, bBox.max.z);
          }
      }
  });

  var bb = {
      min: new THREE.Vector3(minX, minY, minZ),
      max: new THREE.Vector3(maxX, maxY, maxZ),
      dem: new THREE.Vector3(maxX - minX, maxY - minY, maxZ - minZ)
  };
  return bb;
}

function apply_matrix(obj, mat) {
  obj.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
          child.geometry.applyMatrix(mat);
      }
  });
}

function redefineMaterial(options){
  return new THREE.MeshPhongMaterial({
      color: options.color || rgb(1,1,1),
      specular: options.specular || rgb(0.15, 0.15, 0.15),
      shininess: options.shininess || 20,
      emissive: options.emissive || 0x0,
      map: options.map || new THREE.Texture()
  });
}

function create_mesh(callback, mesh_path, texture_path) {
  load_tex.load(texture_path, function(tex) {
      load_obj.load(mesh_path, function (obj) {
        
          obj.traverse(function (child) {
              if (child instanceof THREE.Mesh) {
                  child.material = new THREE.MeshPhongMaterial({
                      specular: rgb(0.15, 0.15, 0.15),
                      shininess: 20,
                      flatShading: false,

                      color: rgb(1,1,1),

                      map: tex
                      //opacity: 1.0,
                      //transparent: true
                  });

                  child.receiveShadow = true;
                  child.castShadow = true;
              }
          });

          var bb = calc_bb(obj);

          var center = true;
          if (center) {
              //var scale = 1.0 / Math.max(bb.dem.x, Math.max(bb.dem.y, bb.dem.z));
              var scale = 1.0 / Math.max(bb.dem.x, Math.max(bb.dem.y, bb.dem.z));
              var center_pos = new THREE.Vector3(-(bb.max.x + bb.min.x) * 0.5, -(bb.max.y + bb.min.y) * 0.5, -(bb.max.z + bb.min.z) * 0.5);

              var mat = new THREE.Matrix4().makeScale(scale, scale, scale);
              mat.multiply(new THREE.Matrix4().makeTranslation(center_pos.x, center_pos.y, center_pos.z));
              apply_matrix(obj, mat);

              obj.bb = bb;
              bb.min.add(center_pos);
              bb.max.add(center_pos);
              bb.min.multiplyScalar(scale);
              bb.max.multiplyScalar(scale);
              bb.dem.multiplyScalar(scale);
          } else {
              obj.bb = bb;
          }

          //obj.fade = new Fade_Obj(obj);
          /*for (let mesh of obj.children) {
              mesh.addEventListener('click', (e) => {

                      if (selectedComponent === false) {
                          selectedComponent = e.target;
                          selectedComponent.material = redefineMaterial({
                              emissive: 0x575757,
                              map: tex
                          });
                          scene.add(transformControls);
                          transformControls.attach(selectedComponent.parent);
                          scene.add(lineYHelper);
                          selectedComponent.lineHelper = lineYHelper;

                      }
                      else if (selectedComponent !== e.target) {
                          transformControls.detach();
                          scene.remove(transformControls);
                          scene.remove(lineYHelper);
                          selectedComponent.material = redefineMaterial({ map: tex });

                          selectedComponent = e.target;
                          selectedComponent.material = redefineMaterial({ emissive: 0x575757, map: tex });
                          scene.add(transformControls);
                          transformControls.attach(selectedComponent.parent);
                          scene.add(lineYHelper);
                          selectedComponent.lineHelper = lineYHelper;
                      }

              });
          }*/
          
      //console.log(obj);
      /*obj.scale.x=5;
      obj.scale.y=3;
      obj.scale.z=1;*/
      boundingBox = new THREE.Box3().setFromObject(obj);
    size = boundingBox.getSize();
    //console.log(boundingBox);
    console.log(size);
    //console.log(obj);

    meshes.push(obj);	
          container.add(obj);
         
          if (callback !== undefined) {
              callback(obj);
          }
      });
  });
}

function initialize(c) {
  canvas = c;

  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.3, 100);
  camera.position.set(0, 1.15, 4.15);
  //camera.position.set(0, -5, 2);


  raycaster = new THREE.Raycaster();

  function raycast(eve, object) {
      var mouseToRaycaster = new THREE.Vector2(((eve.offsetX / renderer.domElement.offsetWidth ) * 2) - 1, -(( eve.offsetY / renderer.domElement.offsetHeight ) * 2) + 1);
      raycaster.setFromCamera(mouseToRaycaster, camera);
      intersects = raycaster.intersectObjects(object.children, true);

      if (selectedComponent && intersects.length == 0) {
          transformControls.detach();
          selectedComponent.material = redefineMaterial({ map: selectedComponent.material.map });
          scene.remove(transformControls);
          scene.remove(lineYHelper);
          selectedComponent = false;
      }
  }

  //scene
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: false,
      antialias: false,
      depth: false,
      logarithmicDepthBuffer: true,
      gammaFactor: 1
  });
  renderer.setClearColor(rgb256(255, 255, 255));
  
  transformControls = new THREE.TransformControls(camera, renderer.domElement);


  // SETTINGS FOR KEYBOARD EVENTS
  window.addEventListener('keydown', function (event) {

      switch (event.keyCode) {

          case 81: // Q
              transformControls.setSpace(transformControls.space === "local" ? "world" : "local");
              break;

          case 82: // R
              transformControls.setMode("rotate");
              transformControls.setSpace("local");
              break;

          case 84: // T
              transformControls.setMode("translate");
              transformControls.setSpace("world");
              break;

          case 187:
          case 107: // +, =, num+
              transformControls.setSize(transformControls.size + 0.1);
              break;

          case 189:
          case 109: // -, _, num-
              transformControls.setSize(Math.max(transformControls.size - 0.1, 0.1));
              break;
      }
  });

  var manager = new THREE.LoadingManager();
  load_obj = new THREE.OBJLoader(manager);
  load_tex = new THREE.TextureLoader();

  //lighting
  var ambient = new THREE.AmbientLight(rgb256(41, 57, 90));
  scene.add(ambient);

  var light1 = new THREE.DirectionalLight(rgb256(255, 255, 255), 0.75);
  light1.castShadow = false;
  light1.shadow.camera.near = 0;
  light1.shadow.camera.far = 30;
  light1.shadow.camera.left = -5.5;
  light1.shadow.camera.right = 5.5;
  light1.shadow.camera.top = 5.5;
  light1.shadow.camera.bot…