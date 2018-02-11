var Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xF5986E,
  brownDark: 0x23190f,
  blue: 0x68c3c0
};
var scene, camera, HEIGHT, WIDTH, renderer, container,
ambientLight, hemisphereLight, shadowLight,
sea, sky, airplane;
var mousePos = { x: 0, y: 0 };


window.addEventListener('onload', init, false);
function init () {
  // 创建场景，相机，渲染器，光源
  createScene();
  createLights();
  // 添加对象
  createPlane();
  createSea();
  createSky();

  // 添加监听器、鼠标移动
  window.addEventListener('mousemove', handleMouseMove, false);

  // 调用循环函数，在每一帧中 更新对象的位置 和 渲染场景
  loop();
}
init();

// 屏幕尺寸改变
function handleWindowResize () {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH/HEIGHT;
  camera.updateProjectionMatrix();
}

// 鼠标移动
function handleMouseMove (event) {
  // 把接收到的鼠标的值转换成归一化值，在-1与1之间变化
  // 2D 的 y 轴与 3D 的 y 轴方向相反
  var tx = -1 + (event.clientX / WIDTH) * 2;
  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };

}

// 创建场景，相机，渲染器
function createScene () {
  // 获取屏幕的宽和高，用它们设置相机的纵横比，还有渲染器的大小
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  
  // 创建场景
  scene = new THREE.Scene();

  // 在场景中添加雾的效果
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

  // 创建相机
  camera = new THREE.PerspectiveCamera(60, WIDTH/HEIGHT, 1, 10000);
  camera.position.x = 0;
  camera.position.y = 100;
  camera.position.z = 200;

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    alpha: true, 	// 背景色透明
    antialias: true		// 抗锯齿
  });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true; // 打开渲染器的阴影地图
  container = document.getElementById('world');
  console.log(container)
  container.appendChild(renderer.domElement);

  // 监听屏幕尺寸变化
  window.addEventListener('resize', handleWindowResize, false);

}

// 添加光源
function createLights () {

  // 环境光源修改场景中的全局颜色和使阴影更加柔和
  ambientLight = new THREE.AmbientLight(0xdc8874, .5);
  scene.add(ambientLight);

  // 半球光就是渐变的光
  // 第一个参数就是天空的颜色，第二个参数就是地上的颜色，三个参数是光源的强度
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);
  
  // 方向光
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);

  shadowLight.castShadow = true; // 开启光源投影

  // 定义可见域的投射阴影
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  // 定义阴影的分辨率
  shadowLight.shadow.mapSize.widht = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  // 将光源添加到场景中
  scene.add(hemisphereLight);
  scene.add(shadowLight);

}

// 定义一个 大海 对象
function Sea () {
  // 创建一个圆柱几何体
  // 参数为：顶面半径、底面半径、高度、半径分段、高度分段
  var geom = new THREE.CylinderGeometry( 600, 600, 800, 40, 10 );

  // 在 x 轴选转几何体
  geom.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI/2) );

  // 合并顶点，确保海浪的连续性
  geom.mergeVertices();

  var l = geom.vertices.length;  // 顶点长度
  this.waves = []; // 创建一个新数组存储与每个顶点关联的值
  for (var i = 0; i < l; i++) {
    var v = geom.vertices[i]; // 获取每个顶点
    this.waves.push({ // 存储一些关联的数值
      x: v.x,
      y: v.y,
      z: v.z,
      ang: Math.random() * Math.PI * 2, // 随机角度
      amp: 5 + Math.random() * 15,
      speed: .016 + Math.random() * .032  // 在 0.016 至 0.048 度每帧 之间的随机速度 
    });
  }

  // 创建材质
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: .6,
    flatShading : THREE.FlatShading
  });

  // 创建网格物体
  this.mesh = new THREE.Mesh(geom, mat);

  // 允许大海对象接收阴影
  this.mesh.receiveShadow = true;

  // 每帧中更新顶点位置来模拟海浪
  this.moveWaves = function () {
    var verts = this.mesh.geometry.vertices; // 获取顶点
    var l = verts.length;
    for (var i = 0; i < l; i++) {
      var v = verts[i];
      // 获取关联的值
      var vprops = this.waves[i];
      // 更新顶点的位置
      v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
      v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
      // 下一帧自增一个角度
      vprops.ang += vprops.speed;
    }
    // three.js 会缓存几何体而忽略一些修改。因此：
    this.mesh.geometry.verticesNeedUpdate = true;
  
    sea.mesh.rotation.z += .005;
  }

}


// 创建大海
function createSea () {
  sea = new Sea();
  // 在场景底部，稍微推挤一下
  sea.mesh.position.y = -600;

  scene.add(sea.mesh);
}

// 定义一个 云 对象
function Cloud () {
  // 创建一个空的容器放置不同形状的云
  this.mesh = new THREE.Object3D();

  // 这个正方体用来复制创建云
  var geom = new THREE.BoxGeometry( 20, 20, 20 );

  var mat = new THREE.MeshPhongMaterial( {color: Colors.white} );

  // 随机多次复制几何体
  var nBlocs = 3 + Math.floor( Math.random()*3 );
  for ( var i = 0; i < nBlocs; i++ ) {
    // 建立多个网格物体
    var m = new THREE.Mesh(geom, mat);

    // 随机位置和旋转角度
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2; 
    m.rotation.y = Math.random() * Math.PI * 2; 

    // 随机大小
    var s = .1 + Math.random() * .9;
    m.scale.set(s, s, s);

    // 允许每个正方体生成投影和接收阴影
    m.castShadow = true;
    m.receiveShadow = true;

    this.mesh.add(m);

  }

}

// 定义一个 天空 对象
function Sky () {
  // 创建一个空容器
  this.mesh = new THREE.Object3D();

  // 选取若干朵云飘散在天空
  this.nCloud = 20;

  // 把云均匀的散布，需要用统一的角度放置它们
  var stepAngle = Math.PI * 2 / this.nCloud;
  

  // 创建 nCloud 个云对象
  for (var i = 0; i < this.nCloud; i++) {
    var c = new Cloud();

    var a = stepAngle * i;  // 这是云的最终旋转角度
    var h = 750 + Math.random() * 200;  // 这是轴的中心和云本身之间的距离

    // 三角函数！
    // 我们简单地把极坐标转换成笛卡坐标
    c.mesh.position.x = Math.cos(a) * h; 
    c.mesh.position.y = Math.sin(a) * h;    

    // 根据云的位置旋转它
    c.mesh.rotation.z = a + Math.PI / 2;

    // 随机深度位置
    c.mesh.position.z = -400 - Math.random() * 400;

    // 随机大小
    var s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);

    this.mesh.add( c.mesh );
  }

}

// 实例化天空对象
function createSky () {
  sky = new Sky();
  sky.mesh.position.y = -600; // 将它放置在屏幕中间稍微偏下的位置
  scene.add(sky.mesh);
}

// 定义一个飞机对象
function AirPlane () {
  this.mesh = new THREE.Object3D();

  // 创建机舱
  var geomCockpit = new THREE.BoxGeometry( 60, 50, 50, 1, 1, 1 );
  var matCockpit = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: THREE.FlatShading
  });
  // 访问形状中的顶点数组中一组特定的顶点，移动它的 x,y,z 属性
  geomCockpit.vertices[4].y -= 10;
  geomCockpit.vertices[4].z += 20; 
  geomCockpit.vertices[5].y -= 10;
  geomCockpit.vertices[5].z -= 20; 
  geomCockpit.vertices[6].y += 30;
  geomCockpit.vertices[6].z += 20; 
  geomCockpit.vertices[7].y += 30;
  geomCockpit.vertices[7].z -= 20; 

  var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);

  // 创建引擎
  var geomEngine = new THREE.BoxGeometry( 20, 50, 50, 1, 1 );
  var matEngine = new THREE.MeshPhongMaterial({
    color: Colors.white,
    flatShading: THREE.FlatShading
  });
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 40;  
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);
  this.mesh.add(cockpit);

  // 创建机尾
  var geomTailplane = new THREE.BoxGeometry( 15, 20, 5, 1, 1 );
  var matTailplane = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: THREE.FlatShading
  });
  var tailplane = new THREE.Mesh(geomTailplane, matTailplane);
  tailplane.position.set(-30, 18, 0);  
  tailplane.castShadow = true;
  tailplane.receiveShadow = true;
  this.mesh.add(tailplane);
  this.mesh.add(cockpit);

  // 创建机翼
  var geomSideWing = new THREE.BoxGeometry( 40, 8, 150, 1, 1 );
  var matSideWing = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: THREE.FlatShading
  });
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);
  this.mesh.add(cockpit);

  // 创建螺旋桨
  var geomPropeller = new THREE.BoxGeometry( 20, 10, 10, 1, 1 );
  var matPropeller = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    flatShading: THREE.FlatShading
  });
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;
  // 创建螺旋桨叶
  var geomBlade = new THREE.BoxGeometry( 3, 85, 2, 1, 1 );
  var matBlade = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    flatShading: THREE.FlatShading
  });
  var blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
  this.propeller.position.set(50, 0, 0);
  this.mesh.add(this.propeller);

  // 创建飞机上的人物
  this.pilot = new Pilot();
  this.pilot.mesh.position.set(0,30,0);
  this.mesh.add(this.pilot.mesh);

} 

// 创建飞机
function createPlane () {
  airplane = new AirPlane();
  airplane.mesh.scale.set(.25, .25, .25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

// 更新飞机位置
function updatePlane () {
  // 限制飞机移动范围 x：-100 ~ 100 ，y：25 ~ 175
  var targetX = normalize(mousePos.x, -.75, .75, -100, 100);
  var targetY = normalize(mousePos.y, -.75, .75, 25, 175);

  // // 更新飞机位置
  // airplane.mesh.position.x = targetX;
  // airplane.mesh.position.y = targetY;

  // 在每一帧通过添加剩余距离的一小部分的值移动飞机
  airplane.mesh.position.y += ( targetY - airplane.mesh.position.y ) * .1;
  
  // 剩余距离按比例转动飞机
  airplane.mesh.rotation.z = ( targetY - airplane.mesh.position.y ) * .0128;
  airplane.mesh.rotation.x = ( airplane.mesh.position.y - targetY ) * .0064;

  // 旋转螺旋桨
  airplane.propeller.children[0].rotation.x += 0.5;

}

// 变换数据
function normalize (v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin); // 限制 v 在 vmin 和 vmax 之间
  var dv = vmax - vmin; 
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + ( pc * dt );
  return tv;
}

// 定义一个飞行员
function Pilot () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = 'pilot';

  // angleHairs 是用于后面头发的动画的属性
  this.angleHairs = 0;

  // 身体
  var bodyGeom = new THREE.BoxGeometry( 15, 15, 15 );
  var bodymat = new THREE.MeshPhongMaterial({ color: Colors.brown, flatShading: THREE.FlatShading });
  var body = new THREE.Mesh(bodyGeom, bodymat);
  body.position.set(2, -12, 0);
  this.mesh.add(body);

  // 脸
  var faceGeom =  new THREE.BoxGeometry( 10, 10, 10 );
  var faceMat = new THREE.MeshPhongMaterial({ color: Colors.pink, flatShading: THREE.FlatShading });
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  // 头发
  var hairGeom = new THREE.BoxGeometry( 4, 4, 4 );
  var hairMat = new THREE.MeshPhongMaterial({ color: Colors.brown });
  var hair = new THREE.Mesh(hairGeom, hairMat);
  // 调整头发的形状到底部的边界，这将使它更容易扩展
  hair.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 2, 0) );

  // 创建一个头发的容器
  var hairs = new THREE.Object3D()

  // 创建一个头发顶部的容器（这将会有动画效果）
  this.hairsTop = new THREE.Object3D();
  // 创建头顶的头发并把它们放在一个 3*4 的网格中
  for (var i = 0; i < 12; i++) {
    var h = hair.clone();
    var col = i%3;
    var row = Math.floor(i/3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row*4, 0, startPosZ + col*4);
    this.hairsTop.add(h); 
  }
  this.hairsTop.position.set(-2, 5, 0);
  hairs.add(this.hairsTop);

  // 脸庞的头发
  var hairSideGeom = new THREE.BoxGeometry( 12, 4, 2 );
  hairSideGeom.applyMatrix( new THREE.Matrix4().makeTranslation(-6, 0, 0) );
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat); 
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8, -2, 6); 
  hairSideL.position.set(8, -2, -6);
  hairs.add(hairSideR); 
  hairs.add(hairSideL); 

  // 创建后脑勺的头发
  var hairBackGeom = new THREE.BoxGeometry( 2, 8, 10 );
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1, -4, 0);
  hairs.add(hairBack);

  this.mesh.add(hairs);

  // 玻璃
  var glassGeom = new THREE.BoxGeometry( 5, 5, 5 );
  var glassMat = new THREE.MeshPhongMaterial({ color: Colors.brown });
  var glassR = new THREE.Mesh(glassGeom, glassMat);
  glassR.position.set(6, 0, 3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z; 
  var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  // 耳朵
  var earGeom = new THREE.BoxGeometry(2, 3, 2);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0, 0, -6);
  var earR = earL.clone();
  earR.position.set(0, 0, 6);
  this.mesh.add(earL);
  this.mesh.add(earR);

  // 移动头发  
  this.updateHairs = function () {
    var hairs = this.hairsTop.children;
    // 根据 angleHairs 的角度更新头发
    var l = hairs.length;
    for (var i = 0; i < l; i++) {
      var h = hairs[i];
      // 每个头发周期性的在 75% ~ 100% 之间变换
      h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
    }
    this.angleHairs += .16;
  }

}

// 循环渲染
function loop () {
  // 转动大海和云
  // sea.mesh.rotation.z += .005;
  sky.mesh.rotation.z += .01;

  // 海浪
  sea.moveWaves();

  // 更新每一帧的飞机
  updatePlane();

  // 飞行员头发飘动
  airplane.pilot.updateHairs();

  // 渲染场景
  renderer.render(scene, camera);

  // 循环调用
  requestAnimationFrame(loop);
}