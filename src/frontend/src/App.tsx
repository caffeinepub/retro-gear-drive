import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import GamePage from "./pages/GamePage";
import HomePage from "./pages/HomePage";

const queryClient = new QueryClient();

export type Page = "home" | "game";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [finalScore, setFinalScore] = useState<bigint | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      {page === "home" ? (
        <HomePage onPlay={() => setPage("game")} lastScore={finalScore} />
      ) : (
        <GamePage
          onExit={(score) => {
            setFinalScore(score);
            setPage("home");
          }}
        />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}
