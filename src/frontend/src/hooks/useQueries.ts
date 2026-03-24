import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Score } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllScores() {
  const { actor, isFetching } = useActor();
  return useQuery<Score[]>({
    queryKey: ["scores"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllScores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsRegistered() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isRegistered"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isRegistered();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyHighScore() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["myHighScore"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getMyHighScore();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (score: bigint) => {
      if (!actor) throw new Error("No actor");
      // Ensure profile exists first
      const registered = await actor.isRegistered();
      if (!registered) {
        await actor.createProfile();
      }
      await actor.submitScore(score);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scores"] });
      queryClient.invalidateQueries({ queryKey: ["myHighScore"] });
    },
  });
}
