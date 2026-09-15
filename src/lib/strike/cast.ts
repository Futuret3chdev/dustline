export type Team = "ct" | "t";

export type Operator = {
  id: string;
  name: string;
  face: string;
  team: Team;
};

export const OPERATORS: Operator[] = [
  { id: "nico", name: "Nico", face: "/strike/cast/nico.jpg", team: "t" },
  { id: "omar", name: "Omar", face: "/strike/cast/omar.jpg", team: "t" },
  { id: "rex", name: "Rex", face: "/strike/cast/rex.jpg", team: "t" },
  { id: "cruz", name: "Cruz", face: "/strike/cast/cruz.jpg", team: "t" },
  { id: "kai", name: "Kai", face: "/strike/cast/kai.jpg", team: "t" },
  { id: "mira", name: "Mira", face: "/strike/cast/mira.jpg", team: "ct" },
  { id: "jade", name: "Jade", face: "/strike/cast/jade.jpg", team: "ct" },
];

export const KIT = {
  t: { vest: "#8a6a3b", pants: "#5c4630", boot: "#2a2118", trim: "#c9a227", strap: "#3d2c1a" },
  ct: { vest: "#2c3d52", pants: "#1c2836", boot: "#12181f", trim: "#5b8cbf", strap: "#243040" },
} as const;
