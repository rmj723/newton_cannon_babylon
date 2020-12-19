class LoadUI {
    static #load_icon = document.getElementById("loader");
    static show() {
        this.#load_icon.style.display = 'block';
    }
    static hide() {
        this.#load_icon.style.display = 'none';
    }
}


class BRApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingsBuffer: true, stencil: true });
        this.scene = new BABYLON.Scene(this.engine);
        // this.scene.debugLayer.show({ showExplorer: true, embedMode: true });
        this.ball = new BABYLON.MeshBuilder.CreateSphere('virtual ball', { diameter: 0.8 }, this.scene);
        this.ball.position.z = 0.5;
        this.models = { earth: null, cloud: null, cannon: null, arrow: null, sat1: null, sat2: null };
        this.speed = 7250;
        this.stop = false;
        this.path = null;
        this.init();

        this.loadModel();
        // LoadUI.hide()
        this.animate();
    }

    init() {
        this.camTarget = new BABYLON.MeshBuilder.CreateSphere('camera target', { diameter: 0.01 }, this.scene);
        var s = new BABYLON.MeshBuilder.CreateSphere('virtual earth', { diameter: 35 }, this.scene);
        s.isVisible = false;

        var dome = new BABYLON.PhotoDome(
            'spaceDom',
            './assets/space.jpeg',
            { resolution: 64, size: 10000 },
            this.scene
        );
        var camera2 = new BABYLON.ArcRotateCamera("camera2", 0.2, 1.0, 50, new BABYLON.Vector3(0, 1, 0), this.scene);
        camera2.viewport = new BABYLON.Viewport(0.7, 0.5, 0.3, 0.5);
        camera2.lockedTarget = s;
        this.scene.activeCameras.push(camera2);

        var camera3 = new BABYLON.ArcRotateCamera("camera3", 1.60, 1.32, 70, new BABYLON.Vector3(0, 1, 0), this.scene);
        camera3.viewport = new BABYLON.Viewport(0.7, 0, 0.3, 0.5);
        this.scene.activeCameras.push(camera3);

        this.camera = new BABYLON.ArcRotateCamera("camera", 0.47, 0.97, 60, new BABYLON.Vector3(0, 1, 0), this.scene);
        this.camera.attachControl(this.canvas, true);
        // this.camera.lowerRadiusLimit = 20;
        this.camera.wheelPrecision = 10;
        this.camera.viewport = new BABYLON.Viewport(0, 0, 0.7, 1);
        this.scene.activeCameras.push(this.camera);

        this.scene.registerBeforeRender(() => {
            camera3.radius = 50 + this.speed / 100;
            var pos = this.ball.position.clone();
            pos.x += pos.x >= 0 ? 6 : -6;
            pos.y += pos.y >= 0 ? 6 : -6;
            camera2.position = pos;
        });

        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.scene.clearColor = new BABYLON.Color3(0, 0, 0);
        light.intensity = 0.6;
        light.specular = BABYLON.Color3.Black();
        var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./assets/environment.dds", this.scene);
        hdrTexture.gammaSpace = false;
        this.scene.environmentTexture = hdrTexture;

        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var panel = new BABYLON.GUI.StackPanel();
        panel.width = "300px";
        panel.height = '500px';
        panel.isVertical = true;
        panel.paddingRight = "20px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        panel.fontSize = 20;
        advancedTexture.addControl(panel);


        var header = new BABYLON.GUI.TextBlock();
        header.text = "Elevation: 6359 km \n Velocity: 7250 m/s";
        header.width = "500px";
        header.height = "100px";
        header.color = "white";
        panel.addControl(header);
        var slider = new BABYLON.GUI.Slider();
        slider.minimum = 2000;
        slider.maximum = 12000;
        slider.value = 7250;
        slider.step = 0.1;
        slider.height = "20px";
        slider.width = "500px";
        slider.color = 'yellow';
        slider.background = 'red';
        slider.onValueChangedObservable.add((value) => {
            header.text = "Elevation: 6359 km \n Velocity: " + value + " m/s";
            this.stop = true;
            this.speed = value - 100; // you can adjust here
            this.moveCamera(new BABYLON.Vector3(1, 21, 0), 80);
            this.camera.spinTo('alpha', 2.6, 50)
            this.camera.spinTo('beta', 1.09, 50)
            this.camera.spinTo('radius', 4, 50);
            this.camera.lowerRadiusLimit = 3;
            this.camera.upperBetaLimit = 1.09;
        });
        panel.addControl(slider);

        var button = BABYLON.GUI.Button.CreateSimpleButton('but', 'Fire', null);
        button.width = "180px";
        button.height = "70px";
        button.paddingTop = "40px";
        button.color = "white";
        button.background = "green";
        button.onPointerDownObservable.add(() => {
            this.stop = true;
            setTimeout(() => {
                this.stop = false;
                this.ball.isVisible = true;
                this.models.arrow.isVisible = true;
                this.moveBall();
                this.camera.spinTo('alpha', 1.57, 50);
                this.camera.spinTo('beta', 1.40, 50);
                this.camera.spinTo('radius', 68, 50);
                this.moveCamera(new BABYLON.Vector3(10, 20, 0), 80);
                setTimeout(() => {
                    this.moveCamera(new BABYLON.Vector3(0, 0, 0), 80);
                }, 1000)
                setTimeout(() => {
                    this.camera.lowerRadiusLimit = 30;
                    this.camera.upperBetaLimit = 2 * Math.PI * 2;
                }, 3000)
            }, 200);
        });
        panel.addControl(button);

        var panel1 = new BABYLON.GUI.StackPanel();
        panel1.width = "300px";
        panel1.height = '50px';
        panel1.isVertical = false;
        panel1.paddingRight = "20px";
        panel1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel1.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel1.fontSize = 20;
        advancedTexture.addControl(panel1);

        var checkbox = new BABYLON.GUI.Checkbox();
        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = true;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add((value) => {
            if (this.models.cloud) {
                this.models.cloud.isVisible = value;
            }
        });
        panel1.addControl(checkbox);

        var checkbox_Header = new BABYLON.GUI.TextBlock();
        checkbox_Header.text = "Atmosphere";
        checkbox_Header.width = "280px";
        checkbox_Header.marginLeft = "5px";
        checkbox_Header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        checkbox_Header.color = "white";
        panel1.addControl(checkbox_Header);

    }

    loadModel() {
        Promise.all([
            BABYLON.SceneLoader.ImportMeshAsync(null, "./assets/", "earth.glb", this.scene).then((result) => {
                let assets = result.meshes[0];
                assets.scaling = new BABYLON.Vector3(1.66, 1.66, 1.66)
                this.models.earth = assets._children[0];
                this.models.cloud = assets._children[2];
                this.models.sat1 = assets._children[4];
                this.models.sat2 = assets._children[5];
                this.models.cannon = assets._children[1];
                var allMeshes = assets._children[3].getChildMeshes();
                this.models.arrow = BABYLON.Mesh.MergeMeshes(allMeshes, true, true, undefined, true, true);
            }),
        ]).then(() => {
            LoadUI.hide();
            this.models.arrow.position.z = 0.4;
            this.models.arrow.setParent(this.ball)
            /* Initial Position of Camera */
            this.camTarget.position = new BABYLON.Vector3(1, 21, 0)
            this.camera.lockedTarget = this.camTarget;
            this.camera.alpha = 2.6;
            this.camera.beta = 1.09;
            this.camera.radius = 4;
            this.camera.lowerRadiusLimit = 3;
            this.camera.upperBetaLimit = 1.09;

            this.scene.registerBeforeRender(() => {
                this.models.cloud.rotate(new BABYLON.Vector3(1, 0, 0), 0.001, BABYLON.Space.WORLD);
                this.models.sat1.rotate(new BABYLON.Vector3(1, 0, 0), 0.01, BABYLON.Space.WORLD);
                this.models.sat2.rotate(new BABYLON.Vector3(1, 0, 0), 0.01, BABYLON.Space.WORLD);
            });

        });
    }

    moveBall() {
        var myPoints = []; // path line include these points
        var newtonG = 6.67e-11;			// gravitational constant in SI units
        var earthMass = 5.97e24;		// kilograms
        var earthRadius = 6371000;		// meters
        var metersPerPixel = 20 * earthRadius * 2 / (0.701 * 1000);		//1000:canvas.width,  draw earth @ 71% canvas width to match image
        var mountainHeight = earthRadius * 0.28;	// chosen to match image
        var x = 0;						// position of projectile
        var y = earthRadius + mountainHeight;
        var vx, vy;						// velocity of projectile
        var dt = 5;						// time step in seconds
        var timer;						// used for scheduling next call to moveProjectile
        // Function to fire projectile:
        x = 0;
        y = earthRadius + mountainHeight;
        vx = this.speed;
        vy = 0;
        var target = this.ball;
        var prevAngle = 0;
        var offsetAngle = 0;
        var drawStart = false;
        setTimeout(() => { drawStart = true }, 150);
        // Function to move the projectile:

        var moveProjectile = () => {
            var r = Math.sqrt(x * x + y * y);
            if (r > earthRadius) {
                var accel = newtonG * earthMass / (r * r);		// magnitude of the acceleration
                var ax = - accel * x / r;
                var ay = - accel * y / r;
                vx += ax * dt;
                vy += ay * dt;
                var lastx = x;			// so we can test for full orbit
                x += vx * dt;
                y += vy * dt;			// Euler-Cromer algorithm
                target.position.x = x / metersPerPixel;
                target.position.y = y / metersPerPixel;
                if (drawStart) {
                    myPoints.push(target.position.clone());
                    if (myPoints.length > 1) {
                        myPoints.push(target.position.clone());
                        var ptA = myPoints[myPoints.length - 1];
                        var ptB = myPoints[myPoints.length - 3];
                        var angle = Math.atan((ptA.y - ptB.y) / (ptA.x - ptB.x));
                        if (Math.abs(prevAngle - angle) < 0.5) {
                            prevAngle = angle;
                        } else {
                            offsetAngle += Math.PI;
                            prevAngle = angle;
                        }
                        this.models.arrow.rotation.z = angle + offsetAngle;
                    }
                    if (this.path == null) {
                        this.path = BABYLON.MeshBuilder.CreateLines("lines", { points: myPoints, updatable: true });
                    } else {
                        this.path.dispose()
                        this.path = BABYLON.MeshBuilder.CreateLines("lines", { points: myPoints, updatable: true });
                    }
                }

                if (!((lastx < 0) && (x > 0)) && !this.stop) {
                    timer = window.setTimeout(moveProjectile, 1000 / 120);	// delay is in milliseconds
                } else {
                    console.log('completed');
                    target.isVisible = false;
                    this.models.arrow.isVisible = false;
                }
            } else {
                console.log('crashed');
                target.isVisible = false;
                this.models.arrow.isVisible = false;
            }
        }
        moveProjectile();
    }


    animate() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    moveCamera(targetPos, speed) {
        var ease = new BABYLON.CubicEase();
        ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        BABYLON.Animation.CreateAndStartAnimation('at5', this.camera.lockedTarget, 'position', speed,
            120, this.camera.lockedTarget.position, targetPos, 0, ease)
    }


}
BABYLON.ArcRotateCamera.prototype.spinTo = function (whichprop, targetval, speed) {
    var ease = new BABYLON.CubicEase();
    ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    BABYLON.Animation.CreateAndStartAnimation('at4', this, whichprop, speed, 120, this[whichprop], targetval, 0, ease);
}

var a = new BRApp()