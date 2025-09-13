import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface Body {
  userId: string;
  flashcardId: string;
  selectedOption: string;
  timeTaken: number; 
}

export async function POST(
  req: NextRequest, 
  { params }: { params: { matchId: string } }
) {
  const { matchId } = params;
  const body: Body = await req.json();
  const { userId, flashcardId, selectedOption, timeTaken } = body;

  if (!selectedOption) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Fetch match
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError || !matchData) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Fetch flashcard
  const { data: flashcard, error: flashError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .single();

  if (flashError || !flashcard) {
    return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
  }

  const correct = flashcard.answer;
  const isCorrect = selectedOption === correct;

  // Ensure scores are numbers
  const newScore1 = Number(matchData.score1 ?? 0);
  const newScore2 = Number(matchData.score2 ?? 0);

  const updatedScores = {
    player1: userId === matchData.player1 && isCorrect ? newScore1 + 1 : newScore1,
    player2: userId === matchData.player2 && isCorrect ? newScore2 + 1 : newScore2,
  };

  // Update match scores
  const { error: updateError } = await supabase
    .from("matches")
    .update({ score1: updatedScores.player1, score2: updatedScores.player2 })
    .eq("id", matchId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }

  // Insert player's answer
  const { error: answerError } = await supabase
    .from("player_answers")
    .insert([
      {
        match_id: matchId,
        player_id: userId,
        question_id: flashcardId,
        is_correct: isCorrect,
        response_time: timeTaken,
      },
    ]);

  if (answerError) {
    console.error("Failed to insert player answer:", answerError);
  }

  return NextResponse.json({
    yourAnswerCorrect: isCorrect,
    correct,
    result: isCorrect ? "correct" : "wrong",
    updatedScores,
  });
}
