import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">FlowSocial</h1>
        <p className="text-lg text-gray-500 mb-8">
          Turn your brand into a week of premium Instagram content — automatically.
        </p>
        <Link
          href="/onboarding"
          className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}