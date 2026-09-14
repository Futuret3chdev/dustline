import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/pop/game-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <GameApp />;
}
