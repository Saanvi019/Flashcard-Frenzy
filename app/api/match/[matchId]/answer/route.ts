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
  { params }: { params: Promise<{ matchId: string }> }
) {
  
  const { matchId } = await params;
  const body: Body = await req.json();
  const { userId, flashcardId, selectedOption, timeTaken } = body;
     
  if (!selectedOption) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }
  /*if (!userId || !flashcardId || !selectedOption) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }*/
      
 
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError || !matchData) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  
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

 
  let newScore1 = matchData.score1;
  let newScore2 = matchData.score2;

  if (isCorrect) {
    if (userId === matchData.player1) newScore1 += 1;
    if (userId === matchData.player2) newScore2 += 1;
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({ score1: newScore1, score2: newScore2 })
    .eq("id", matchId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }


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
    updatedScores: { player1: newScore1, player2: newScore2 },
  });
}
