export const input = {
  keys: new Set<string>(),
  lookX: 0,
  lookY: 0,
  fire: false,
  stickX: 0,
  stickY: 0,
  setKeys(codes: string[]) {
    this.keys.clear();
    for (const c of codes) this.keys.add(c);
  },
  consumeLook() {
    const x = this.lookX;
    const y = this.lookY;
    this.lookX = 0;
    this.lookY = 0;
    return { x, y };
  },
};

export function bindKeyboard() {
  const down = (e: KeyboardEvent) => {
    input.keys.add(e.code);
    if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyR") input.keys.add("Reload");
  };
  const up = (e: KeyboardEvent) => {
    input.keys.delete(e.code);
  };
  const blur = () => {
    input.keys.clear();
    input.fire = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
  };
}
