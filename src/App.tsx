import "./App.css";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize, Resolution } from "postprocessing";
function Wobbly() {
  const { camera } = useThree(); // 获取相机
  const listener = useRef(new THREE.AudioListener());
  const soundRef = useRef<THREE.Audio | null>(null); // 用于存储 sound 对象
  const analyserRef = useRef<THREE.AudioAnalyser | null>(null); // 用于存储 analyser 对象
  const planeRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.Mesh>(null);
  const [ready, setReady] = useState(false);
  const audioLoader = new THREE.AudioLoader();
  useEffect(() => {
    audioLoader.load("/Beats.mp3", (buffer) => {
      const sound = new THREE.Audio(listener.current);
      sound.setBuffer(buffer);
      sound.setLoop(true);
      soundRef.current = sound; // 将 sound 存储到 ref 中
      analyserRef.current = new THREE.AudioAnalyser(sound, 32);
      setReady(true);
    });
    return () => {
      soundRef.current?.stop();
    };
  }, []);
  useEffect(() => {
    camera.add(listener.current); // 将 AudioListener 添加到相机

    return () => {
      camera.remove(listener.current); // 清除 listener
    };
  }, [camera]);

  let geometry = mergeVertices(new THREE.IcosahedronGeometry(2.5, 50));
  geometry.computeTangents();
  const uniforms = {
    uTime: new THREE.Uniform(0),
    uAudioFrequency: new THREE.Uniform(0),
    uPositionFrequency: new THREE.Uniform(0.5),
    uTimeFrequency: new THREE.Uniform(0.2),
    uStrength: new THREE.Uniform(0.3),
    uWarpPositionFrequency: new THREE.Uniform(0.38),
    uWarpTimeFrequency: new THREE.Uniform(0.12),
    uWarpStrength: new THREE.Uniform(1.7),
    // Color
    uColorA: new THREE.Uniform(new THREE.Color("#6c6cd0")),
    uColorB: new THREE.Uniform(new THREE.Color("#d3d3d3")),
  };

  const material = new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    silent: true,
    uniforms,
    metalness: 0,
    roughness: 0.5,
    color: "#ffffff",
    transmission: 0,
    ior: 1.5,
    thickness: 1.5,
    transparent: true,
    wireframe: false,
  });

  const depthMaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: vertexShader,
    silent: true,
    uniforms,
    depthPacking: THREE.RGBADepthPacking,
  });

  useEffect(() => {
    planeRef.current?.lookAt(new THREE.Vector3(0, 0, 0));
  }, []);
  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    if (analyserRef.current) {
      const audioStrength = analyserRef.current.getAverageFrequency();
      uniforms.uAudioFrequency.value = audioStrength;
      uniforms.uTime.value = elapsedTime;
      if (geometryRef.current) {
        geometryRef.current.rotation.x = elapsedTime;
        geometryRef.current.rotation.y = elapsedTime;
      }
    }
  });
  const htmlRef = useRef<HTMLElement | null>(null);
  const clickPlay = () => {
    if (htmlRef.current) {
      htmlRef.current.style.opacity = "0";
    }
    if (soundRef.current) soundRef.current.play();
  };
  return (
    <>
      <Html as="div">
        <div className="overlay" ref={htmlRef as any}>
          <div style={{ alignItems: "center", height: "100%" }}>
            {ready && (
              <div onClick={clickPlay} className="webButton">
                Play Animation
              </div>
            )}
          </div>
        </div>
      </Html>
      <mesh
        ref={geometryRef}
        geometry={geometry}
        material={material}
        customDepthMaterial={depthMaterial}
        castShadow
        receiveShadow
      ></mesh>
    </>
  );
}
function Scene() {
  return (
    <>
      <Canvas
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [-3, 6, -10],
        }}
      >
        <color attach="background" args={["#202020"]} />
        <EffectComposer>
          <DepthOfField
            focusDistance={0}
            focalLength={0.02}
            bokehScale={2}
            height={480}
          />
          <Bloom
            intensity={31.0} // 绽放强度。
            blurPass={undefined} // 模糊通道。
            kernelSize={KernelSize.LARGE} // 模糊内核大小
            luminanceThreshold={0.9} // 亮度阈值。提高此值以掩盖场景中较暗的元素。
            luminanceSmoothing={0.025} // 亮度阈值的平滑度。范围为 [0, 1]
            mipmapBlur={false} // 启用或禁用 mipmap 模糊。
            resolutionX={Resolution.AUTO_SIZE} // 水平分辨率。
            resolutionY={Resolution.AUTO_SIZE} // 垂直分辨率。
          />
          <Noise
            opacity={0.4}
            premultiply // enables or disables noise premultiplication
            blendFunction={BlendFunction.ADD} // blend mode
          />
          <Environment files={"/urban_alley_01_1k.hdr"} />
          <Wobbly />
        </EffectComposer>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <directionalLight
          position={[0.25, 2, -2.25]}
          intensity={3}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={0.1}
          shadow-camera-far={30}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
      </Canvas>
    </>
  );
}
function App() {
  return (
    <>
      <Scene />
    </>
  );
}

export default App;
