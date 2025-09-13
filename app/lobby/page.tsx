"use client";

import { useAuth } from "@/context/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";

// Define the Match type properly
interface Match {
  id: string;
  player1: string;
  player2: string;
  round: number;
  score1: number;
  score2: number;
  status: "pending" | "active" | "finished";
  created_at?: string;
}

interface OnlineUser {
  id: string;
  username?: string;
  email?: string;
}

export default function LobbyPage() {
  const { user } = useAuth();
  useOnlineStatus(user?.id, user?.email); 
  const onlineUsers = useOnlineUsers(user?.id) as OnlineUser[];
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase.from("matches").select("*");
      if (!error && data) setMatches(data as Match[]);
    };
    fetchMatches();

    const channel = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          const match = payload.new as Match;
          setMatches((prev) => {
            const updated = prev.filter((m) => m.id !== match.id);
            return [...updated, match];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleJoinMatch = async () => {
    if (!user || !selectedUserId) {
      alert("Please select a player to start the match.");
      return;
    }

    try {
      const { data: existing, error } = await supabase
        .from("matches")
        .select("*")
        .or(
          `and(player1.eq.${user.id},player2.eq.${selectedUserId},status.eq.pending),and(player1.eq.${selectedUserId},player2.eq.${user.id},status.eq.pending)`
        )
        .limit(1);

      if (error) throw error;

      let matchId: string;

      if (existing && existing.length > 0) {
        const match = existing[0] as Match;
        matchId = match.id;

        await supabase
          .from("matches")
          .update({ status: "active" })
          .eq("id", match.id);

        router.push(`/game/${matchId}`);
        return;
      }

      const { data: newMatch, error: createError } = await supabase
        .from("matches")
        .insert([
          {
            player1: user.id,
            player2: selectedUserId,
            round: 1,
            score1: 0,
            score2: 0,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (createError || !newMatch) {
        console.error("Failed to create match:", createError);
        return;
      }

      matchId = (newMatch as Match).id;
      router.push(`/game/${matchId}`);
    } catch (err) {
      console.error("Error joining match:", err);
    }
  };

  const uniqueOnlineUsers = Array.from(
    new Map(onlineUsers.map((u) => [u.id, u])).values()
  ).filter((u) => u.id !== user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#b594d0] to-[#f9de90] text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Lobby</h1>

      <h2 className="text-xl mb-2">Matches</h2>
      {matches.length === 0 ? (
        <p className="text-gray-400">No matches yet.</p>
      ) : (
        <ul className="mb-6 w-full max-w-md">
          {matches.map((m) => (
            <li
              key={m.id}
              className="bg-gray-800 p-4 rounded mb-2 flex justify-between"
            >
              <div>
                Match: {m.id.slice(0, 6)} — {m.status}
              </div>
              {m.status === "pending" && (
                <button
                  className="bg-pink-600 text-black px-3 py-1 rounded"
                  onClick={() => router.push(`/game/${m.id}`)}
                >
                  Join
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-xl mb-2">Players Online</h2>
      {uniqueOnlineUsers.length === 0 ? (
        <p className="text-gray-400">No other users online.</p>
      ) : (
        <ul className="flex flex-col gap-4 w-full max-w-md">
          {uniqueOnlineUsers.map((u) => (
            <li
              key={u.id}
              className={`flex justify-between items-center bg-gray-800 p-4 rounded ${
                selectedUserId === u.id ? "border-2 border-yellow-500" : ""
              }`}
            >
              <div>
                <span>{u.username || "Unnamed User"}</span>
                <br />
                <small className="text-gray-400">ID: {u.id.slice(0, 8)}...</small>
              </div>
              <button
                className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600"
                onClick={() => setSelectedUserId(u.id)}
              >
                {selectedUserId === u.id ? "Selected" : "Select"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        className="mt-6 bg-pink-500 text-black px-6 py-3 rounded hover:bg-green-600"
        onClick={handleJoinMatch}
      >
        Join Match
      </button>
    </div>
  );
}
