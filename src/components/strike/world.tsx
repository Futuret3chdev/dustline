import { BLOCKS, type Block } from "@/lib/strike/map";

const MAT: Record<Block["mat"], { color: string; rough: number; metal: number }> = {
  sand: { color: "#c4a574", rough: 0.95, metal: 0 },
  wall: { color: "#b0895a", rough: 0.88, metal: 0.02 },
  crate: { color: "#7a542e", rough: 0.78, metal: 0.04 },
  metal: { color: "#6d7168", rough: 0.42, metal: 0.55 },
  dark: { color: "#6e4f32", rough: 0.86, metal: 0.04 },
  trim: { color: "#8d6b42", rough: 0.7, metal: 0.08 },
};

function BlockMesh({ b }: { b: Block }) {
  const m = MAT[b.mat];
  return (
    <mesh position={[b.x, b.y, b.z]} castShadow receiveShadow userData={{ wall: b.h >= 1.4 }}>
      <boxGeometry args={[b.w, b.h, b.d]} />
      <meshStandardMaterial color={m.color} roughness={m.rough} metalness={m.metal} />
    </mesh>
  );
}

export function DustWorld() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 44]} />
        <meshStandardMaterial color="#c4a574" roughness={0.96} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[38, 8]} />
        <meshStandardMaterial color="#b48a55" roughness={0.94} />
      </mesh>
      {BLOCKS.map((b, i) => (
        <BlockMesh key={i} b={b} />
      ))}
      <mesh position={[-14, 4.6, 10]} castShadow>
        <boxGeometry args={[6, 0.25, 6]} />
        <meshStandardMaterial color="#8d6b42" roughness={0.8} />
      </mesh>
      <mesh position={[14, 4.6, 10]} castShadow>
        <boxGeometry args={[6, 0.25, 6]} />
        <meshStandardMaterial color="#8d6b42" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function RifleViewmodel({ kick }: { kick: number }) {
  return (
    <group position={[0.32, -0.22, -0.58]} rotation={[0.02 + kick * 0.4, 0.22, 0.06]} scale={0.72}>
      <mesh position={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[0.07, 0.09, 0.42]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.01, -0.52]}>
        <cylinderGeometry args={[0.018, 0.018, 0.55, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.12, -0.08]}>
        <boxGeometry args={[0.05, 0.18, 0.08]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, 0.18]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.06, 0.07, 0.22]} />
        <meshStandardMaterial color="#1f1f1f" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0.04, 0.07, -0.1]}>
        <boxGeometry args={[0.02, 0.04, 0.12]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.06, -0.28]}>
        <boxGeometry args={[0.04, 0.03, 0.16]} />
        <meshStandardMaterial color="#5a4632" roughness={0.65} />
      </mesh>
    </group>
  );
}
