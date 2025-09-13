"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function SignupForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      alert("Check your email for confirmation link!");
      setEmail("");
      setPassword("");
    } catch (err) {
  if (err instanceof Error) {
    setErrorMsg(err.message);
  } else {
    setErrorMsg("Something went wrong!");
  }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm mx-auto mt-10">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border p-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2"
        required
      />
      <button
        type="submit"
        className={`p-2 rounded text-white ${loading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"}`}
        disabled={loading}
      >
        {loading ? "Signing up..." : "Sign Up"}
      </button>
      {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
    </form>
  );
}
