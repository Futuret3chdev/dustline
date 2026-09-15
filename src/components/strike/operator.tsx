import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { SRGBColorSpace, Texture, type Group } from "three";
import { KIT, type Team } from "@/lib/strike/cast";

function useFace(url: string) {
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const t = new Texture(img);
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
      t.needsUpdate = true;
      setTex((prev) => {
        prev?.dispose();
        return t;
      });
    };
    img.src = url;
    return () => {
      /* disposed on next set */
    };
  }, [url]);
  return tex;
}

export function OperatorMesh({
  face,
  team,
  state,
}: {
  face: string;
  team: Team;
  state?: { walking: boolean; aiming: boolean; dead: number };
}) {
  const kit = KIT[team];
  const tex = useFace(face);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const root = useRef<Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((stateClock) => {
    const walking = state?.walking ?? false;
    const aiming = state?.aiming ?? false;
    const dead = (state?.dead ?? 0) > 2.4;
    if (dead) {
      if (root.current) root.current.rotation.x = Math.min(1.2, root.current.rotation.x + 0.08);
      return;
    }
    if (root.current) root.current.rotation.x = 0;
    const t = stateClock.clock.elapsedTime + phase;
    const s = walking ? Math.sin(t * 8.2) : Math.sin(t * 1.6) * 0.08;
    if (hipL.current) hipL.current.rotation.x = s * (walking ? 0.65 : 0.08);
    if (hipR.current) hipR.current.rotation.x = -s * (walking ? 0.65 : 0.08);
    if (armL.current) armL.current.rotation.x = aiming ? -1.15 : -s * 0.45;
    if (armR.current) {
      armR.current.rotation.x = aiming ? -1.05 : s * 0.45;
      armR.current.rotation.z = aiming ? -0.18 : -0.08;
    }
  });

  return (
    <group ref={root}>
      <group ref={hipL} position={[-0.12, 0.72, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.22, 5, 8]} />
          <meshStandardMaterial color={kit.pants} roughness={0.78} />
        </mesh>
        <mesh position={[0, -0.42, 0.04]} castShadow>
          <boxGeometry args={[0.15, 0.1, 0.24]} />
          <meshStandardMaterial color={kit.boot} roughness={0.7} />
        </mesh>
      </group>
      <group ref={hipR} position={[0.12, 0.72, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.22, 5, 8]} />
          <meshStandardMaterial color={kit.pants} roughness={0.78} />
        </mesh>
        <mesh position={[0, -0.42, 0.04]} castShadow>
          <boxGeometry args={[0.15, 0.1, 0.24]} />
          <meshStandardMaterial color={kit.boot} roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[0, 1.02, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.38, 6, 10]} />
        <meshStandardMaterial color={kit.vest} roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 1.08, 0.12]} castShadow>
        <boxGeometry args={[0.34, 0.28, 0.08]} />
        <meshStandardMaterial color={kit.strap} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.92, -0.02]} castShadow>
        <boxGeometry args={[0.38, 0.12, 0.22]} />
        <meshStandardMaterial color={kit.trim} roughness={0.45} metalness={0.15} />
      </mesh>
      <group ref={armL} position={[-0.22, 1.18, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.28, 5, 8]} />
          <meshStandardMaterial color={kit.vest} roughness={0.65} />
        </mesh>
      </group>
      <group ref={armR} position={[0.22, 1.18, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.28, 5, 8]} />
          <meshStandardMaterial color={kit.vest} roughness={0.65} />
        </mesh>
        <mesh position={[0.02, -0.32, 0.22]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.55]} />
          <meshStandardMaterial color="#1c1c1c" metalness={0.55} roughness={0.35} />
        </mesh>
      </group>
      <mesh position={[0, 1.28, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
        <meshStandardMaterial color="#c9ae94" roughness={0.7} />
      </mesh>
      <group position={[0, 1.48, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.155, 16, 12]} />
          <meshStandardMaterial color="#c9ae94" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.01, 0.148]}>
          <circleGeometry args={[0.12, 20]} />
          <meshStandardMaterial map={tex ?? undefined} color={tex ? "#fff" : "#c9ae94"} roughness={0.5} />
        </mesh>
        {team === "ct" ? (
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.17, 0.08, 10]} />
            <meshStandardMaterial color="#243040" roughness={0.55} metalness={0.2} />
          </mesh>
        ) : (
          <mesh position={[0, 0.12, -0.02]} rotation={[0.15, 0, 0]} castShadow>
            <torusGeometry args={[0.14, 0.035, 6, 12]} />
            <meshStandardMaterial color="#5c4630" roughness={0.8} />
          </mesh>
        )}
      </group>
    </group>
  );
}
