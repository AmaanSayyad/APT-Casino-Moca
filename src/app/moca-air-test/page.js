"use client";

import MocaAIRTest from '@/components/MocaAIR/MocaAIRTest';

export default function MocaAIRTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Moca AIR Integration
          </h1>
          <p className="text-gray-300">
            Test and verify your AIR credential system
          </p>
        </div>

        <MocaAIRTest />

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
