"use client";
import SlotBoard from "./components/SlotBoard";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/ui/city.png')" }}
      />

      {/* Foreground content */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <SlotBoard />
      </div>
    </main>
  );
}
