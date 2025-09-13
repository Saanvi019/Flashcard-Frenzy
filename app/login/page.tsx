import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6cae6] text-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        <LoginForm />
        <p className="text-black mt-4 text-center">
          Don’t have an account?{" "}
          <a href="/signup" className="text-pink-600 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}