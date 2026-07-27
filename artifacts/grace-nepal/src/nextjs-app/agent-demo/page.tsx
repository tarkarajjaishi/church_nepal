import React from 'react';

const AgentDemoPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Qwen Agent works ✅</h1>
        <p className="mb-4 text-gray-600">
          This page was generated automatically from task.txt by the Qwen coding agent.
        </p>
        <p className="text-sm text-gray-400">
          Edit task.txt and run run_task.bat to change the code.
        </p>
      </div>
    </div>
  );
};

export default AgentDemoPage;
