import Image from "next/image";
import Link from "next/link";
import { BrainCircuit, Gamepad2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#b594d0] to-[#f9de90] text-white flex flex-col items-center">
      
      <header className="w-full flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-10 w-12 text-purple-600 " />
          <h1 className="text-2xl font-extrabold tracking-wide">
            <span className="text-yellow-400"></span> FlashCard Frenzy
          </h1>
        </div>
        <Link href="/signup">
          <button className="bg-[#f9de90] text-violet-700 font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-green-600 transition-transform transform hover:scale-105">
            Sign Up
          </button>
        </Link>
      </header>

      
      <main className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
  <div className="bg-[#d176ac]/80 backdrop-blur-md p-12 rounded-2xl shadow-xl max-w-lg w-full border border-gray-700 hover:border-amber-400 transition flex flex-col justify-center items-center">
    <BrainCircuit className="h-16 w-16 text-purple-600 mb-6 animate-pulse" />
    <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
      Welcome to <span className="text-pink-500">FlashBlitz</span>
    </h2>
    <p className="text-white mb-8 leading-relaxed">
      The ultimate{" "}
      <span className="text-violet-700 font-semibold">multiplayer flashcard showdown</span>.  
      Race against others to test your knowledge and reflexes!
    </p>
    
    <Link href="/login" className="w-full flex justify-center">
      <button className="bg-[#f9de90] text-violet-700 font-semibold px-8 py-3 rounded-xl shadow-md hover:bg-yellow-600 transition-transform transform hover:scale-105 flex items-center gap-3 justify-center">
        <Gamepad2 size={22} /> Login to Play
      </button>
    </Link>
  </div>
</main>

    </div>
  );
}
