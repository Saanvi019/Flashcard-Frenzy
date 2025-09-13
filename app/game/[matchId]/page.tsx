"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { use } from "react";
import { useRouter } from "next/navigation";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';



interface Flashcard {
  id: string;
  question: string;
  options: string[];
  correctOption: string;
}

interface Match {
  id: string;
  scores: Record<string, string>;
  firstAnswer?: Record<string, string>;
}

export default function GamePage({ params }: { params: Promise<{ matchId: string }> }) {
  const router = useRouter();
  const { matchId } = use(params);
  const { user } = useAuth();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [match, setMatch] = useState<Match | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [answered, setAnswered] = useState(false);

  
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());


useEffect(() => {
  setQuestionStartTime(Date.now());
  setTimeLeft(10);
  setAnswered(false); 
}, [currentIndex]);

 
  useEffect(() => {
    const fetchFlashcards = async () => {
      const { data, error } = await supabase.from("flashcards").select("*");
      if (error) return console.error("Error fetching flashcards:", error);
      if (data) setFlashcards(data);
    };
    fetchFlashcards();
  }, []);

  
  useEffect(() => {
    if (!matchId) return;
    const subscription = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        (payload: RealtimePostgresChangesPayload<any>) => {
          setMatch(payload.new);

          if (payload.new.scores && flashcards.length > 0) {
            const answeredIds = Object.keys(payload.new.scores);
            const nextIndex = flashcards.findIndex((f) => !answeredIds.includes(f.id));
            if (nextIndex !== -1) {
              setCurrentIndex(nextIndex);
              setTimeLeft(10);
              setFeedback({ message: "New question!", type: "info" });
            } else {
              setFeedback({ message: "Game Over!", type: "info" });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [matchId, flashcards]);

  
  useEffect(() => {
  if (timeLeft <= 0) {
    const currentFlashcard = flashcards[currentIndex];
    if (currentFlashcard && user) {
      
      handleAnswer("").then(() => {
        
        const nextIndex = currentIndex + 1;
        if (nextIndex < flashcards.length) {
          setCurrentIndex(nextIndex);
          setTimeLeft(10);
          setFeedback({ message: "Next question!", type: "info" });
        } else {
          setFeedback({ message: "🎉 Game Over!", type: "info" });
          setTimeout(() => {
    router.push(`/match/${matchId}/history`);
  }, 2000);
        }
      });
    }
    return;
  }

  timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);

  return () => clearTimeout(timerRef.current!);
}, [timeLeft, currentIndex, flashcards]);

  
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleAnswer = async (selectedOption: string) => {
    if (answered) return; 
  setAnswered(true);

  
    const timeTaken = (Date.now() - questionStartTime) / 1000; 
    if (!user || !flashcards.length) return;
    
    const currentFlashcard = flashcards[currentIndex];
    const js=JSON.stringify({
          userId: user.id,
          flashcardId: currentFlashcard.id,
          selectedOption,
          timeTaken,
        });
        console.log(js);
    try {
      const res = await fetch(`/api/match/${matchId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          flashcardId: currentFlashcard.id,
          selectedOption,
          timeTaken,
        }),
      });

      const result = await res.json();

      if (result.result === "too late") {
        setFeedback({ message: `Too late! Correct answer: ${result.correct}`, type: "error" });
      } else if (result.yourAnswerCorrect) {
        setFeedback({ message: "✅ Correct!", type: "success" });
      } else {
        setFeedback({ message: `❌ Wrong! Correct answer: ${result.correct}`, type: "error" });
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setFeedback({ message: "Something went wrong!", type: "error" });
    }
  };

  if (!flashcards.length) return <p>Loading questions...</p>;
  const currentFlashcard = flashcards[currentIndex];
  if (!currentFlashcard) return <p>🎉 Game Over!</p>;

  const firstPlayerId = match?.firstAnswer?.[currentFlashcard.id];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#b594d0] to-[#f9de90] text-white flex flex-col items-center p-6 relative">
      <h2 className="text-4xl font-bold mb-2">{currentFlashcard.question}</h2>
      <p className="mb-4 text-gray-300">Time left: {timeLeft}s</p>

      <div className="flex flex-col gap-3">
        {currentFlashcard.options.map((opt) => (
          <button
            key={opt}
            className={`px-4 py-2 rounded ${
              firstPlayerId === user?.id ? "bg-pink-500 text-black" : "bg-[#d176ac] text-black"
            } hover:bg-yellow-600`}
            onClick={() => handleAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold"></h3>
        {match &&
          Object.entries(match.scores).map(([flashId, playerId]) => (
            <p key={flashId}>
              Flashcard {flashId}: {playerId}
            </p>
          ))}
      </div>

      
      {feedback && (
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg transition ${
            feedback.type === "success"
              ? "bg-green-600 text-white"
              : feedback.type === "error"
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
