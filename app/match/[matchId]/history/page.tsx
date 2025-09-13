"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface PlayerAnswer {
  id: string;
  match_id: string;
  player_id: string;
  question_id: string;
  is_correct: boolean;
  response_time: number; 
  created_at: string;
  flashcard: Flashcard;
}

interface PageProps {
  params: Promise<{ matchId: string }>; 
}

export default function MatchHistoryPage({ params }: PageProps) {
  const { matchId } = use(params);

  const [player1Id, setPlayer1Id] = useState<string | null>(null);
  const [player2Id, setPlayer2Id] = useState<string | null>(null);

  const [player1Answers, setPlayer1Answers] = useState<PlayerAnswer[]>([]);
  const [player2Answers, setPlayer2Answers] = useState<PlayerAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  const [winner, setWinner] = useState<string | null>(null);

  
  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("player1, player2")
        .eq("id", matchId)
        .single();

      if (error) {
        console.error("Error fetching match:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setPlayer1Id(data.player1);
        setPlayer2Id(data.player2);
      }
    };

    fetchMatch();
  }, [matchId]);

  
  useEffect(() => {
    if (!player1Id || !player2Id) return;

    const fetchAnswers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("player_answers")
        .select(
          `
          *,
          flashcard:flashcards(id, question, answer)
        `
        )
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching answers:", error);
        setLoading(false);
        return;
      }

      if (data) {
        const p1 = data.filter((a) => a.player_id === player1Id);
        const p2 = data.filter((a) => a.player_id === player2Id);

        setPlayer1Answers(p1);
        setPlayer2Answers(p2);

        
        const p1Correct = p1.filter((a) => a.is_correct).length;
        const p2Correct = p2.filter((a) => a.is_correct).length;

        if (p1Correct > p2Correct) {
          setWinner("Player 1");
        } else if (p2Correct > p1Correct) {
          setWinner("Player 2");
        } else {
          
          const p1Time = p1
            .filter((a) => a.is_correct)
            .reduce((acc, a) => acc + (a.response_time || 0), 0);
          const p2Time = p2
            .filter((a) => a.is_correct)
            .reduce((acc, a) => acc + (a.response_time || 0), 0);

          if (p1Time < p2Time) setWinner("Player 1");
          else if (p2Time < p1Time) setWinner("Player 2");
          else setWinner("Tie");
        }
      }
      setLoading(false);
    };

    fetchAnswers();
  }, [matchId, player1Id, player2Id]);

  if (loading) return <p>Loading match history...</p>;

  const maxQuestions = Math.max(player1Answers.length, player2Answers.length);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#b594d0] to-[#f9de90] text-white">
      <h1 className="text-3xl font-bold mb-6">Match History</h1>

      
      {winner && (
        <div className="mb-6 p-4 rounded bg-yellow-600 text-black font-bold text-xl">
          {winner === "Tie" ? " It's a Tie!" : ` Winner: ${winner}`}
        </div>
      )}

      <div className="flex gap-8">
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Player 1</h2>
          {Array.from({ length: maxQuestions }).map((_, idx) => {
            const ans = player1Answers[idx];
            return ans ? (
              <div
                key={ans.id}
                className={`mb-4 p-3 rounded ${
                  ans.is_correct ? "bg-green-700" : "bg-red-700"
                }`}
              >
                <p className="font-semibold">Q: {ans.flashcard.question}</p>
                <p>
                  Your Answer: {ans.is_correct ? " Correct" : " Wrong"}
                </p>
                <p>Correct Answer: {ans.flashcard.answer}</p>
                <p>Time Taken: {ans.response_time}s</p>
              </div>
            ) : null;
          })}
        </div>

        
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Player 2</h2>
          {Array.from({ length: maxQuestions }).map((_, idx) => {
            const ans = player2Answers[idx];
            return ans ? (
              <div
                key={ans.id}
                className={`mb-4 p-3 rounded ${
                  ans.is_correct ? "bg-green-700" : "bg-red-700"
                }`}
              >
                <p className="font-semibold">Q: {ans.flashcard.question}</p>
                <p>
                  Your Answer: {ans.is_correct ? "Correct" : " Wrong"}
                </p>
                <p>Correct Answer: {ans.flashcard.answer}</p>
                <p>Time Taken: {ans.response_time}s</p>
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
