"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function RobotScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let renderer: THREE.WebGLRenderer | any;
    let controls: OrbitControls;

    async function init() {
      // ---------- Scene / Renderer / Camera ----------
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0e14);
      scene.fog = new THREE.Fog(0x0a0e14, 20, 60);

      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        200
      );
      camera.position.set(7, 4, 9);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });

      if (disposed) {
        renderer.dispose();
        return;
      }

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 1.5, 0);
      controls.minDistance = 4;
      controls.maxDistance = 30;

      // ---------- Lighting ----------
      const ambient = new THREE.AmbientLight(0x8899bb, 0.5);
      ambient.name = "ambientLight";
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.name = "keyLight";
      keyLight.position.set(8, 12, 6);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(512, 512);
      keyLight.shadow.camera.left = -15;
      keyLight.shadow.camera.right = 15;
      keyLight.shadow.camera.top = 15;
      keyLight.shadow.camera.bottom = -15;
      keyLight.shadow.bias = -0.001;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x4a6fff, 0.6);
      rimLight.name = "rimLight";
      rimLight.position.set(-8, 5, -8);
      scene.add(rimLight);

      // ---------- Ground ----------
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x1c1f26,
        roughness: 0.95,
        metalness: 0.05,
      });
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(30, 48),
        groundMat
      );
      ground.name = "ground";
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const gridHelper = new THREE.GridHelper(30, 30, 0x2a3550, 0x1a2030);
      gridHelper.name = "gridHelper";
      gridHelper.position.y = 0.01;
      scene.add(gridHelper);

      // ---------- Canvas texture helpers for battle-damage armor ----------
      function makeArmorTexture(baseHex: string, scratchDensity = 26) {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = baseHex;
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, (i / 6) * size + Math.random() * 10);
          ctx.lineTo(size, (i / 6) * size + Math.random() * 10);
          ctx.stroke();
        }

        for (let i = 0; i < 18; i++) {
          const x = Math.random() * size,
            y = Math.random() * size;
          const r = 8 + Math.random() * 28;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
          grad.addColorStop(0, "rgba(90,55,30,0.35)");
          grad.addColorStop(1, "rgba(90,55,30,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        for (let i = 0; i < scratchDensity; i++) {
          const x1 = Math.random() * size,
            y1 = Math.random() * size;
          const len = 10 + Math.random() * 60;
          const ang = Math.random() * Math.PI * 2;
          const x2 = x1 + Math.cos(ang) * len;
          const y2 = y1 + Math.sin(ang) * len;
          ctx.strokeStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.2})`;
          ctx.lineWidth = 0.6 + Math.random() * 1.6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        for (let i = 0; i < 10; i++) {
          const x = Math.random() * size,
            y = Math.random() * size;
          const r = 4 + Math.random() * 10;
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = "rgba(0,0,0,0.4)";
        for (let i = 0; i < 24; i++) {
          const x = 20 + Math.random() * (size - 40);
          const y = 20 + Math.random() * (size - 40);
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        return tex;
      }

      function makeHullTexture(baseHex: string, stripeHex: string) {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = baseHex;
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(0, (i / 8) * size);
          ctx.lineTo(size, (i / 8) * size);
          ctx.stroke();
        }
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo((i / 6) * size, 0);
          ctx.lineTo((i / 6) * size, size);
          ctx.stroke();
        }

        ctx.fillStyle = stripeHex;
        ctx.fillRect(0, size * 0.45, size, size * 0.08);

        for (let i = 0; i < 8; i++) {
          const x = Math.random() * size,
            y = Math.random() * size;
          const r = 6 + Math.random() * 16;
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
      }

      const armorTexDark = makeArmorTexture("#3a4048", 30);
      const armorTexMid = makeArmorTexture("#4a5058", 22);
      const hullTex = makeHullTexture("#7f93ab", "#274a7a");

      // ---------- ROBOT ----------
      const robot = new THREE.Group();
      robot.name = "robot";
      robot.position.set(-3, 0, 0);
      scene.add(robot);

      const darkMetal = new THREE.MeshStandardMaterial({
        map: armorTexDark,
        roughness: 0.55,
        metalness: 0.8,
      });
      const midMetal = new THREE.MeshStandardMaterial({
        map: armorTexMid,
        roughness: 0.5,
        metalness: 0.85,
      });
      const jointMetal = new THREE.MeshStandardMaterial({
        color: 0x20242c,
        roughness: 0.6,
        metalness: 0.7,
      });
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x2255ff,
        emissive: 0x1144ff,
        emissiveIntensity: 1.4,
        roughness: 0.2,
        metalness: 0.2,
      });
      const goldTrim = new THREE.MeshStandardMaterial({
        color: 0x8a7748,
        roughness: 0.4,
        metalness: 0.9,
      });

      // Torso
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.9, 0.9),
        darkMetal
      );
      torso.name = "robotTorso";
      torso.position.y = 2.3;
      torso.castShadow = true;
      torso.receiveShadow = true;
      robot.add(torso);

      // Chest plate detail
      const chestPlate = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.0, 0.15),
        midMetal
      );
      chestPlate.name = "chestPlate";
      chestPlate.position.set(0, 2.55, 0.5);
      chestPlate.castShadow = true;
      robot.add(chestPlate);

      const chestCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.1, 20),
        visorMat
      );
      chestCore.name = "chestCore";
      chestCore.rotation.x = Math.PI / 2;
      chestCore.position.set(0, 2.55, 0.58);
      robot.add(chestCore);

      // Waist
      const waist = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.65, 0.5, 12),
        jointMetal
      );
      waist.name = "robotWaist";
      waist.position.y = 1.25;
      waist.castShadow = true;
      robot.add(waist);

      // Hips / pelvis armor
      const pelvis = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.5, 0.8),
        darkMetal
      );
      pelvis.name = "robotPelvis";
      pelvis.position.y = 1.1;
      pelvis.castShadow = true;
      robot.add(pelvis);

      // Head group with helmet
      const headGroup = new THREE.Group();
      headGroup.name = "headGroup";
      headGroup.position.y = 3.55;
      robot.add(headGroup);

      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.75),
        midMetal
      );
      helmet.name = "helmet";
      helmet.castShadow = true;
      headGroup.add(helmet);

      const helmetBack = new THREE.Mesh(
        new THREE.SphereGeometry(0.43, 20, 16),
        darkMetal
      );
      helmetBack.name = "helmetBack";
      helmetBack.scale.set(1, 1, 0.85);
      helmetBack.position.z = -0.05;
      helmetBack.castShadow = true;
      headGroup.add(helmetBack);

      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.16, 0.12),
        visorMat
      );
      visor.name = "visor";
      visor.position.set(0, 0.02, 0.36);
      headGroup.add(visor);

      const helmetRidge = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.5, 0.46),
        goldTrim
      );
      helmetRidge.name = "helmetRidge";
      helmetRidge.position.set(0, 0.28, 0.02);
      headGroup.add(helmetRidge);

      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.4, 8),
        jointMetal
      );
      antenna.name = "antenna";
      antenna.position.set(0.15, 0.55, -0.1);
      antenna.rotation.z = -0.2;
      headGroup.add(antenna);
      const antennaTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff3355,
          emissive: 0xff3355,
          emissiveIntensity: 1.2,
        })
      );
      antennaTip.name = "antennaTip";
      antennaTip.position.set(0.185, 0.75, -0.13);
      headGroup.add(antennaTip);

      // jaw / lower face vents
      for (let i = -1; i <= 1; i++) {
        const vent = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.1, 0.06),
          jointMetal
        );
        vent.name = `jawVent${i + 1}`;
        vent.position.set(i * 0.13, -0.18, 0.34);
        headGroup.add(vent);
      }

      // Shoulders (pauldrons)
      function makeShoulder(side: string) {
        const group = new THREE.Group();
        group.name = `shoulderGroup_${side}`;
        const pauldronOuter = new THREE.Mesh(
          new THREE.SphereGeometry(0.38, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
          midMetal
        );
        pauldronOuter.name = `pauldronOuter_${side}`;
        pauldronOuter.castShadow = true;
        group.add(pauldronOuter);
        const pauldronRim = new THREE.Mesh(
          new THREE.TorusGeometry(0.32, 0.04, 8, 16, Math.PI),
          goldTrim
        );
        pauldronRim.name = `pauldronRim_${side}`;
        pauldronRim.rotation.x = Math.PI / 2;
        pauldronRim.position.y = -0.02;
        group.add(pauldronRim);
        return group;
      }
      const shoulderL = makeShoulder("L");
      shoulderL.position.set(0.98, 3.05, 0);
      robot.add(shoulderL);
      const shoulderR = makeShoulder("R");
      shoulderR.position.set(-0.98, 3.05, 0);
      robot.add(shoulderR);

      // Arms with plasma guns
      function makeArm(side: string) {
        const sign = side === "L" ? 1 : -1;
        const armGroup = new THREE.Group();
        armGroup.name = `armGroup_${side}`;
        armGroup.position.set(sign * 0.98, 2.85, 0);

        const upperArm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.19, 0.17, 0.75, 10),
          darkMetal
        );
        upperArm.name = `upperArm_${side}`;
        upperArm.position.y = -0.4;
        upperArm.castShadow = true;
        armGroup.add(upperArm);

        const elbow = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 12, 10),
          jointMetal
        );
        elbow.name = `elbow_${side}`;
        elbow.position.y = -0.78;
        armGroup.add(elbow);

        const forearmGroup = new THREE.Group();
        forearmGroup.name = `forearmGroup_${side}`;
        forearmGroup.position.y = -0.78;
        armGroup.add(forearmGroup);

        const forearm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.17, 0.15, 0.7, 10),
          midMetal
        );
        forearm.name = `forearm_${side}`;
        forearm.position.y = -0.35;
        forearm.castShadow = true;
        forearmGroup.add(forearm);

        const gunGroup = new THREE.Group();
        gunGroup.name = `plasmaGun_${side}`;
        gunGroup.position.set(0, -0.65, 0.1);
        forearmGroup.add(gunGroup);

        const gunBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.22, 0.55),
          jointMetal
        );
        gunBody.name = `gunBody_${side}`;
        gunBody.castShadow = true;
        gunGroup.add(gunBody);

        const gunBarrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.08, 0.4, 10),
          darkMetal
        );
        gunBarrel.name = `gunBarrel_${side}`;
        gunBarrel.rotation.x = Math.PI / 2;
        gunBarrel.position.z = 0.45;
        gunGroup.add(gunBarrel);

        const emitterMat = new THREE.MeshStandardMaterial({
          color: 0x66ffee,
          emissive: 0x33ffdd,
          emissiveIntensity: 2.2,
          roughness: 0.3,
        });
        const emitter = new THREE.Mesh(
          new THREE.CylinderGeometry(0.075, 0.075, 0.06, 12),
          emitterMat
        );
        emitter.name = `gunEmitter_${side}`;
        emitter.rotation.x = Math.PI / 2;
        emitter.position.z = 0.66;
        gunGroup.add(emitter);

        return { armGroup, forearmGroup, gunGroup };
      }
      const armL = makeArm("L");
      robot.add(armL.armGroup);
      const armR = makeArm("R");
      robot.add(armR.armGroup);

      // Legs
      function makeLeg(side: string) {
        const sign = side === "L" ? 1 : -1;
        const legGroup = new THREE.Group();
        legGroup.name = `legGroup_${side}`;
        legGroup.position.set(sign * 0.32, 0.9, 0);

        const thigh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.19, 0.75, 10),
          darkMetal
        );
        thigh.name = `thigh_${side}`;
        thigh.position.y = -0.38;
        thigh.castShadow = true;
        legGroup.add(thigh);

        const knee = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 12, 10),
          jointMetal
        );
        knee.name = `knee_${side}`;
        knee.position.y = -0.76;
        legGroup.add(knee);

        const shin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.15, 0.75, 10),
          midMetal
        );
        shin.name = `shin_${side}`;
        shin.position.y = -1.15;
        shin.castShadow = true;
        legGroup.add(shin);

        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.16, 0.5),
          jointMetal
        );
        foot.name = `foot_${side}`;
        foot.position.set(0, -1.58, 0.1);
        foot.castShadow = true;
        legGroup.add(foot);

        return legGroup;
      }
      const legL = makeLeg("L");
      robot.add(legL);
      const legR = makeLeg("R");
      robot.add(legR);

      // ---------- SPACESHIP ----------
      const ship = new THREE.Group();
      ship.name = "spaceship";
      ship.position.set(3.5, 2.6, -1.5);
      ship.rotation.y = -0.4;
      scene.add(ship);

      const hullMat = new THREE.MeshStandardMaterial({
        map: hullTex,
        roughness: 0.45,
        metalness: 0.6,
      });
      const hullMatGrey = new THREE.MeshStandardMaterial({
        color: 0x6b7686,
        roughness: 0.5,
        metalness: 0.65,
      });
      const accentBlue = new THREE.MeshStandardMaterial({
        color: 0x1c4d8f,
        roughness: 0.35,
        metalness: 0.7,
      });
      const cockpitGlass = new THREE.MeshStandardMaterial({
        color: 0x1a2a44,
        roughness: 0.05,
        metalness: 0.1,
        transparent: true,
        opacity: 0.7,
      });
      const engineMat = new THREE.MeshStandardMaterial({
        color: 0x113355,
        emissive: 0x3388ff,
        emissiveIntensity: 1.6,
        roughness: 0.3,
      });

      // Fuselage
      const fuselage = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.55, 3.2, 8, 16),
        hullMat
      );
      fuselage.name = "fuselage";
      fuselage.rotation.z = Math.PI / 2;
      fuselage.castShadow = true;
      fuselage.receiveShadow = true;
      ship.add(fuselage);

      // Nose cone
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.0, 16),
        hullMatGrey
      );
      nose.name = "nose";
      nose.rotation.z = -Math.PI / 2;
      nose.position.x = 2.1;
      nose.castShadow = true;
      ship.add(nose);

      // Cockpit canopy
      const cockpit = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
        cockpitGlass
      );
      cockpit.name = "cockpit";
      cockpit.rotation.x = Math.PI;
      cockpit.rotation.z = Math.PI / 2;
      cockpit.position.set(0.6, 0.4, 0);
      ship.add(cockpit);

      // Straight wings
      function makeWing(side: string) {
        const sign = side === "L" ? 1 : -1;
        const wingGroup = new THREE.Group();
        wingGroup.name = `wingGroup_${side}`;

        const shape = new THREE.Shape();
        shape.moveTo(0, -0.5);
        shape.lineTo(2.6, -0.35);
        shape.lineTo(2.6, 0.1);
        shape.lineTo(0, 0.5);
        shape.lineTo(0, -0.5);
        const extrudeSettings = {
          depth: 0.12,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.02,
          bevelSegments: 2,
        };
        const wingGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        wingGeo.center();

        const wing = new THREE.Mesh(wingGeo, hullMatGrey);
        wing.name = `wing_${side}`;
        wing.castShadow = true;
        wing.receiveShadow = true;
        wing.scale.x = sign;
        wing.rotation.x = Math.PI / 2;
        wingGroup.add(wing);

        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.02, 0.14),
          accentBlue
        );
        stripe.name = `wingStripe_${side}`;
        stripe.position.set(sign * 1.1, 0.065, 0);
        wingGroup.add(stripe);

        const thruster = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.16, 0.35, 12),
          engineMat
        );
        thruster.name = `wingThruster_${side}`;
        thruster.rotation.z = Math.PI / 2;
        thruster.position.set(sign * 2.35, 0, 0);
        wingGroup.add(thruster);

        return wingGroup;
      }
      const wingL = makeWing("L");
      wingL.position.set(-0.3, 0, 0.55);
      ship.add(wingL);
      const wingR = makeWing("R");
      wingR.position.set(-0.3, 0, -0.55);
      ship.add(wingR);

      // Tail fin
      const tailFin = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.7, 0.08),
        hullMatGrey
      );
      tailFin.name = "tailFin";
      tailFin.position.set(-1.6, 0.5, 0);
      tailFin.rotation.z = -0.15;
      tailFin.castShadow = true;
      ship.add(tailFin);

      const tailStripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.12, 0.09),
        accentBlue
      );
      tailStripe.name = "tailStripe";
      tailStripe.position.set(-1.55, 0.55, 0);
      ship.add(tailStripe);

      // Rear main engines
      function makeMainEngine(offsetZ: number) {
        const eng = new THREE.Group();
        eng.name = `mainEngineGroup_${offsetZ > 0 ? "R" : "L"}`;
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.32, 0.7, 14),
          hullMatGrey
        );
        body.name = `mainEngineBody_${offsetZ > 0 ? "R" : "L"}`;
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        eng.add(body);
        const nozzle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.26, 0.15, 14),
          engineMat
        );
        nozzle.name = `mainEngineNozzle_${offsetZ > 0 ? "R" : "L"}`;
        nozzle.rotation.z = Math.PI / 2;
        nozzle.position.x = -0.42;
        eng.add(nozzle);
        eng.position.set(-1.9, -0.1, offsetZ);
        return eng;
      }
      ship.add(makeMainEngine(0.3));
      ship.add(makeMainEngine(-0.3));

      // Panel greebles on fuselage
      for (let i = 0; i < 5; i++) {
        const greeble = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.06, 0.4),
          accentBlue
        );
        greeble.name = `hullGreeble${i}`;
        greeble.position.set(-0.5 + i * 0.5, 0.45, 0);
        ship.add(greeble);
      }

      // ---------- Plasma bolt projectiles ----------
      const bolts: { mesh: THREE.Mesh; direction: THREE.Vector3; life: number }[] = [];
      const boltGeo = new THREE.SphereGeometry(0.12, 10, 8);
      const boltMat = new THREE.MeshStandardMaterial({
        color: 0x66ffee,
        emissive: 0x33ffdd,
        emissiveIntensity: 4,
      });

      const MAX_BOLTS = 20;
      let fireTimer = 0;
      const FIRE_DURATION = 0.6;

      function fireBolt(fromWorldPos: THREE.Vector3, direction: THREE.Vector3) {
        if (bolts.length >= MAX_BOLTS) {
          const old = bolts.shift()!;
          scene.remove(old.mesh);
        }
        const mesh = new THREE.Mesh(boltGeo, boltMat);
        mesh.name = `plasmaBolt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        mesh.position.copy(fromWorldPos);
        scene.add(mesh);
        bolts.push({ mesh, direction: direction.clone(), life: 0 });
      }

      function getWorldPos(obj: THREE.Object3D) {
        const v = new THREE.Vector3();
        obj.getWorldPosition(v);
        return v;
      }

      // ---------- Laser sound ----------
      let audioCtx: AudioContext | null = null;
      function playLaserSound() {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
        const now = audioCtx.currentTime;

        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        osc2.type = "square";
        osc2.frequency.setValueAtTime(800, now);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.2);
        osc2.stop(now + 0.2);
      }

      function fireBothGuns() {
        fireTimer = FIRE_DURATION;
        playLaserSound();
        const gunForward = new THREE.Vector3(0, 0, 1);
        const dirL = gunForward.clone().applyQuaternion(armL.gunGroup.getWorldQuaternion(new THREE.Quaternion()));
        const dirR = gunForward.clone().applyQuaternion(armR.gunGroup.getWorldQuaternion(new THREE.Quaternion()));
        fireBolt(getWorldPos(armL.gunGroup), dirL);
        fireBolt(getWorldPos(armR.gunGroup), dirR);
      }

      renderer.domElement.tabIndex = 0;
      renderer.domElement.style.outline = "none";
      renderer.domElement.focus();

      function onPointerDown(e: PointerEvent) {
        if (e.target !== renderer.domElement) return;
        renderer.domElement.focus();
        fireBothGuns();
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.code === "Space" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          fireBothGuns();
        }
      }

      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("keydown", onKeyDown);
      renderer.domElement.addEventListener("keydown", onKeyDown);

      // ---------- Instructions overlay ----------
      const info = document.createElement("div");
      info.style.cssText = `
        position: fixed; top: 16px; left: 16px; right: 16px;
        max-width: 360px;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        color: #cfd6e4;
        background: rgba(20,22,28,0.55);
        border: 1px solid rgba(255,255,255,0.08);
        padding: 12px 14px;
        border-radius: 8px;
        box-sizing: border-box;
        pointer-events: none;
        line-height: 1.5;
      `;
      info.textContent = `WebGL | Click or press SPACE to fire plasma guns. Drag to orbit, scroll to zoom.`;
      document.body.appendChild(info);

      const linkEl = document.createElement("link");
      linkEl.rel = "stylesheet";
      linkEl.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap";
      document.head.appendChild(linkEl);

      // ---------- FPS monitor + adaptive quality ----------
      let fpsFrames = 0;
      let fpsAccum = 0;
      let currentFPS = 60;
      let qualityLevel = 2;
      let qualityCheckTimer = 0;

      const fpsDisplay = document.createElement("div");
      fpsDisplay.style.cssText = `
        position: fixed; bottom: 12px; left: 12px;
        font-family: 'Inter', monospace; font-size: 12px;
        color: #88ff88; background: rgba(0,0,0,0.4);
        padding: 4px 8px; border-radius: 4px;
        pointer-events: none; z-index: 10;
      `;
      document.body.appendChild(fpsDisplay);

      function applyQuality(level: number) {
        if (level === qualityLevel) return;
        qualityLevel = level;
        if (level <= 0) {
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 0.5));
          keyLight.castShadow = false;
        } else if (level === 1) {
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 0.75));
          keyLight.shadow.mapSize.set(512, 512);
          keyLight.castShadow = true;
        } else {
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
          keyLight.shadow.mapSize.set(512, 512);
          keyLight.castShadow = true;
        }
        keyLight.shadow.map.needsUpdate = true;
      }

      // ---------- Animation loop ----------
      const clock = new THREE.Clock();

      function animate() {
        const t = clock.getElapsedTime();
        const dt = clock.getDelta();

        fpsFrames++;
        fpsAccum += dt;
        qualityCheckTimer += dt;
        if (fpsAccum >= 0.5) {
          currentFPS = Math.round(fpsFrames / fpsAccum);
          fpsDisplay.textContent = `${currentFPS} FPS | Q${qualityLevel} | WebGL | ${bolts.length} bolts`;
          fpsFrames = 0;
          fpsAccum = 0;
        }

        if (qualityCheckTimer >= 2) {
          qualityCheckTimer = 0;
          if (currentFPS < 30 && qualityLevel > 0) {
            applyQuality(qualityLevel - 1);
          } else if (currentFPS > 55 && qualityLevel < 2) {
            applyQuality(qualityLevel + 1);
          }
        }

        robot.position.y = Math.sin(t * 1.2) * 0.03;
        visor.material.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.4;
        chestCore.material.emissiveIntensity = 1.0 + Math.sin(t * 2.5) * 0.5;
        antennaTip.material.emissiveIntensity = 0.9 + Math.sin(t * 6) * 0.5;

        if (fireTimer > 0) fireTimer -= dt;
        const fireBlend = Math.max(0, fireTimer / FIRE_DURATION);
        const ease = fireBlend * fireBlend * (3 - 2 * fireBlend);

        armL.armGroup.rotation.x = Math.sin(t * 1.2) * 0.05 - ease * 1.1;
        armR.armGroup.rotation.x = Math.sin(t * 1.2 + Math.PI) * 0.05 - ease * 1.1;

        const emitterL = armL.gunGroup.getObjectByName("gunEmitter_L");
        const emitterR = armR.gunGroup.getObjectByName("gunEmitter_R");
        const glowIntensity = 2.2 + ease * 3;
        if (emitterL) {
          const matL = (emitterL as THREE.Mesh).material as THREE.MeshStandardMaterial;
          matL.emissiveIntensity = glowIntensity;
        }
        if (emitterR) {
          const matR = (emitterR as THREE.Mesh).material as THREE.MeshStandardMaterial;
          matR.emissiveIntensity = glowIntensity;
        }

        ship.position.y = 2.6 + Math.sin(t * 0.8) * 0.15;
        ship.rotation.z = Math.sin(t * 0.6) * 0.03;
        ship.rotation.x = Math.sin(t * 0.5 + 1) * 0.015;

        for (let i = bolts.length - 1; i >= 0; i--) {
          const b = bolts[i];
          b.mesh.position.addScaledVector(b.direction, dt * 14);
          b.life += dt;
          const s = 1 + Math.sin(b.life * 20) * 0.1;
          b.mesh.scale.setScalar(s);
          if (b.life > 2.2) {
            scene.remove(b.mesh);
            bolts.splice(i, 1);
          }
        }

        controls.update();
        renderer.render(scene, camera);
      }
      renderer.setAnimationLoop(animate);

      // ---------- Resize ----------
      function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener("resize", onResize);

      // ---------- Cleanup ----------
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keydown", onKeyDown);
        renderer.domElement.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("resize", onResize);
        renderer.setAnimationLoop(null);
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        if (info.parentNode) info.parentNode.removeChild(info);
        if (fpsDisplay.parentNode) fpsDisplay.parentNode.removeChild(fpsDisplay);
        if (linkEl.parentNode) linkEl.parentNode.removeChild(linkEl);
        controls.dispose();
      };
    }

    let cleanupFn: (() => void) | undefined;
    init().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      disposed = true;
      if (cleanupFn) cleanupFn();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
