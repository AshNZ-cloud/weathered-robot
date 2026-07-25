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

      // Legs — articulated with thigh and shin groups for walking
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

        // Shin group — pivots from the knee position for bending
        const shinGroup = new THREE.Group();
        shinGroup.name = `shinGroup_${side}`;
        shinGroup.position.y = -0.76;
        legGroup.add(shinGroup);

        const shin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.15, 0.75, 10),
          midMetal
        );
        shin.name = `shin_${side}`;
        shin.position.y = -0.39;
        shin.castShadow = true;
        shinGroup.add(shin);

        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.16, 0.5),
          jointMetal
        );
        foot.name = `foot_${side}`;
        foot.position.set(0, -0.82, 0.1);
        foot.castShadow = true;
        shinGroup.add(foot);

        return { legGroup, shinGroup };
      }
      const legL = makeLeg("L");
      robot.add(legL.legGroup);
      const legR = makeLeg("R");
      robot.add(legR.legGroup);

      // ---------- ROBOT DOG ----------
      const dog = new THREE.Group();
      dog.name = "robotDog";
      dog.position.set(-5.5, 0, 1);
      scene.add(dog);

      // Dog materials — cleaner than the robot, fewer scratches
      const dogBodyMat = new THREE.MeshStandardMaterial({
        color: 0x5a6470,
        roughness: 0.45,
        metalness: 0.75,
      });
      const dogHeadMat = new THREE.MeshStandardMaterial({
        color: 0x6a7480,
        roughness: 0.4,
        metalness: 0.8,
      });
      const dogBoltMat = new THREE.MeshStandardMaterial({
        color: 0x8a9aaa,
        roughness: 0.3,
        metalness: 0.9,
      });
      const dogJointMat = new THREE.MeshStandardMaterial({
        color: 0x3a4048,
        roughness: 0.6,
        metalness: 0.7,
      });
      const dogEyeMat = new THREE.MeshStandardMaterial({
        color: 0x33ffaa,
        emissive: 0x22ffaa,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });

      // Body — boxy ribcage
      const dogBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.55, 0.5),
        dogBodyMat
      );
      dogBody.name = "dogBody";
      dogBody.position.y = 0.55;
      dogBody.castShadow = true;
      dogBody.receiveShadow = true;
      dog.add(dogBody);

      // A few scratches on the body
      for (let i = 0; i < 4; i++) {
        const scratch = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.02, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.6 })
        );
        scratch.name = `dogScratch${i}`;
        scratch.position.set(
          -0.3 + i * 0.2,
          0.55 + (Math.random() - 0.5) * 0.3,
          0.26
        );
        scratch.rotation.z = (Math.random() - 0.5) * 0.5;
        dog.add(scratch);
      }

      // Chest plate with bolts
      const dogChest = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.4, 0.1),
        dogBoltMat
      );
      dogChest.name = "dogChest";
      dogChest.position.set(0.4, 0.55, 0);
      dog.add(dogChest);

      // Bolts on chest plate
      for (let i = 0; i < 4; i++) {
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.04, 6),
          dogJointMat
        );
        bolt.name = `dogChestBolt${i}`;
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(0.46, 0.45 + (i % 2) * 0.2, -0.08 + Math.floor(i / 2) * 0.16);
        dog.add(bolt);
      }

      // Head
      const dogHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.38, 0.38),
        dogHeadMat
      );
      dogHead.name = "dogHead";
      dogHead.position.set(0.6, 0.72, 0);
      dogHead.castShadow = true;
      dog.add(dogHead);

      // Snout
      const dogSnout = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.18, 0.24),
        dogBodyMat
      );
      dogSnout.name = "dogSnout";
      dogSnout.position.set(0.85, 0.65, 0);
      dog.add(dogSnout);

      // Nose
      const dogNose = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.5 })
      );
      dogNose.name = "dogNose";
      dogNose.position.set(0.98, 0.68, 0);
      dog.add(dogNose);

      // Eyes
      const dogEyeL = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 10, 10),
        dogEyeMat
      );
      dogEyeL.name = "dogEyeL";
      dogEyeL.position.set(0.72, 0.8, 0.12);
      dog.add(dogEyeL);
      const dogEyeR = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 10, 10),
        dogEyeMat
      );
      dogEyeR.name = "dogEyeR";
      dogEyeR.position.set(0.72, 0.8, -0.12);
      dog.add(dogEyeR);

      // Floppy ears — hanging down on sides of head
      function makeDogEar(side: string) {
        const sign = side === "L" ? 1 : -1;
        const earGroup = new THREE.Group();
        earGroup.name = `dogEar_${side}`;
        earGroup.position.set(0.55, 0.88, sign * 0.2);

        const ear = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.3, 0.08),
          dogBodyMat
        );
        ear.name = `ear_${side}`;
        ear.position.y = -0.13;
        ear.castShadow = true;
        earGroup.add(ear);

        // Bolt at ear base
        const earBolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.05, 6),
          dogBoltMat
        );
        earBolt.name = `earBolt_${side}`;
        earBolt.rotation.x = Math.PI / 2;
        earBolt.position.z = sign * 0.04;
        earGroup.add(earBolt);

        return earGroup;
      }
      const earL = makeDogEar("L");
      dog.add(earL);
      const earR = makeDogEar("R");
      dog.add(earR);

      // Neck bolts
      for (let i = 0; i < 2; i++) {
        const neckBolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.05, 6),
          dogBoltMat
        );
        neckBolt.name = `dogNeckBolt${i}`;
        neckBolt.rotation.z = Math.PI / 2;
        neckBolt.position.set(0.5, 0.65, -0.1 + i * 0.2);
        dog.add(neckBolt);
      }

      // Legs — 4 bolted legs with visible bolts at joints
      function makeDogLeg(side: string, front: boolean) {
        const sign = side === "L" ? 1 : -1;
        const x = front ? 0.3 : -0.3;
        const legGroup = new THREE.Group();
        legGroup.name = `dogLeg_${side}_${front ? "F" : "B"}`;
        legGroup.position.set(x, 0.35, sign * 0.22);

        const upper = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.06, 0.35, 8),
          dogBodyMat
        );
        upper.name = `dogUpperLeg_${side}_${front ? "F" : "B"}`;
        upper.position.y = -0.17;
        upper.castShadow = true;
        legGroup.add(upper);

        // Joint bolt at knee
        const kneeBolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.08, 6),
          dogBoltMat
        );
        kneeBolt.name = `dogKneeBolt_${side}_${front ? "F" : "B"}`;
        kneeBolt.rotation.x = Math.PI / 2;
        kneeBolt.position.set(0, -0.34, sign * 0.04);
        legGroup.add(kneeBolt);

        const lower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.05, 0.3, 8),
          dogHeadMat
        );
        lower.name = `dogLowerLeg_${side}_${front ? "F" : "B"}`;
        lower.position.y = -0.5;
        lower.castShadow = true;
        legGroup.add(lower);

        // Paw
        const paw = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.06, 0.12),
          dogJointMat
        );
        paw.name = `dogPaw_${side}_${front ? "F" : "B"}`;
        paw.position.set(0.02, -0.66, 0);
        paw.castShadow = true;
        legGroup.add(paw);

        return legGroup;
      }
      dog.add(makeDogLeg("L", true));
      dog.add(makeDogLeg("R", true));
      dog.add(makeDogLeg("L", false));
      dog.add(makeDogLeg("R", false));

      // Tail — reasonably upright, segmented with bolts
      const tailBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.04, 0.25, 8),
        dogBodyMat
      );
      tailBase.name = "dogTailBase";
      tailBase.position.set(-0.5, 0.75, 0);
      tailBase.rotation.z = 0.6;
      tailBase.castShadow = true;
      dog.add(tailBase);

      const tailMid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.03, 0.22, 8),
        dogHeadMat
      );
      tailMid.name = "dogTailMid";
      tailMid.position.set(-0.68, 0.92, 0);
      tailMid.rotation.z = 0.6;
      dog.add(tailMid);

      const tailTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.15, 8),
        dogBoltMat
      );
      tailTip.name = "dogTailTip";
      tailTip.position.set(-0.82, 1.05, 0);
      tailTip.rotation.z = 0.6;
      dog.add(tailTip);

      // Tail bolts at joints
      const tailBolt1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6),
        dogBoltMat
      );
      tailBolt1.name = "dogTailBolt1";
      tailBolt1.position.set(-0.58, 0.83, 0);
      tailBolt1.rotation.z = 0.6;
      dog.add(tailBolt1);

      const tailBolt2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.05, 6),
        dogBoltMat
      );
      tailBolt2.name = "dogTailBolt2";
      tailBolt2.position.set(-0.75, 0.99, 0);
      tailBolt2.rotation.z = 0.6;
      dog.add(tailBolt2);

      // Body bolts along the spine
      for (let i = 0; i < 3; i++) {
        const spineBolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.04, 6),
          dogBoltMat
        );
        spineBolt.name = `dogSpineBolt${i}`;
        spineBolt.position.set(-0.2 + i * 0.2, 0.85, 0);
        dog.add(spineBolt);
      }

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
      const pressedKeys = new Set<string>();
      let walkPhase = 0;
      const WALK_SPEED = 2.5;

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

      mount.tabIndex = 0;
      mount.style.outline = "none";
      mount.focus();

      function onPointerDown(e: PointerEvent) {
        mount.focus();
        fireBothGuns();
      }

      function onKeyDown(e: KeyboardEvent) {
        const key = e.code || e.key;
        pressedKeys.add(key);
        if (key === "Space" || key === " ") {
          e.preventDefault();
          e.stopPropagation();
          fireBothGuns();
        } else if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      function onKeyUp(e: KeyboardEvent) {
        const key = e.code || e.key;
        pressedKeys.delete(key);
      }

      function onBlur() {
        pressedKeys.clear();
      }

      mount.addEventListener("pointerdown", onPointerDown);
      mount.addEventListener("keydown", onKeyDown);
      mount.addEventListener("keyup", onKeyUp);
      mount.addEventListener("blur", onBlur);
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);

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
      info.textContent = `WebGL | SPACE to fire. Arrow keys to walk (UP/DOWN/LEFT/RIGHT). Click scene first. Drag to orbit, scroll to zoom.`;
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

        // ---------- Walk animation ----------
        const moveForward = pressedKeys.has("ArrowUp") ? 1 : (pressedKeys.has("ArrowDown") ? -1 : 0);
        const moveStrafe = pressedKeys.has("ArrowRight") ? 1 : (pressedKeys.has("ArrowLeft") ? -1 : 0);
        const isMoving = moveForward !== 0 || moveStrafe !== 0;

        if (isMoving) {
          walkPhase += dt * WALK_SPEED;
          robot.position.z += moveForward * dt * 1.5;
          robot.position.x += moveStrafe * dt * 1.5;
          robot.position.z = Math.max(-12, Math.min(12, robot.position.z));
          robot.position.x = Math.max(-12, Math.min(12, robot.position.x));
        } else {
          walkPhase *= 0.85;
        }

        const walkActive = Math.abs(walkPhase) > 0.01 || isMoving;
        const swing = Math.sin(walkPhase);
        const swing2 = Math.sin(walkPhase + Math.PI);

        if (walkActive) {
          legL.legGroup.rotation.x = swing * 0.5;
          legR.legGroup.rotation.x = swing2 * 0.5;
          legL.shinGroup.rotation.x = Math.max(0, -swing * 0.6);
          legR.shinGroup.rotation.x = Math.max(0, -swing2 * 0.6);
        } else {
          legL.legGroup.rotation.x *= 0.85;
          legR.legGroup.rotation.x *= 0.85;
          legL.shinGroup.rotation.x *= 0.85;
          legR.shinGroup.rotation.x *= 0.85;
        }

        ship.position.y = 2.6 + Math.sin(t * 0.8) * 0.15;
        ship.rotation.z = Math.sin(t * 0.6) * 0.03;
        ship.rotation.x = Math.sin(t * 0.5 + 1) * 0.015;

        // ---------- Dog idle animation ----------
        dog.position.y = Math.sin(t * 2) * 0.02;
        earL.rotation.z = Math.sin(t * 3) * 0.15;
        earR.rotation.z = -Math.sin(t * 3) * 0.15;
        tailBase.rotation.y = Math.sin(t * 5) * 0.3;
        tailMid.rotation.y = Math.sin(t * 5 + 0.3) * 0.3;
        tailTip.rotation.y = Math.sin(t * 5 + 0.6) * 0.3;
        dogEyeL.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.4;
        dogEyeR.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.4;

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
        mount.removeEventListener("pointerdown", onPointerDown);
        mount.removeEventListener("keydown", onKeyDown);
        mount.removeEventListener("keyup", onKeyUp);
        mount.removeEventListener("blur", onBlur);
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("keyup", onKeyUp);
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
