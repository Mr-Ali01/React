import React from 'react';

export default function AmbientGradients() {
  return (
    <>
      <div className="fixed top-0 right-0 w-[550px] h-[550px] bg-orange-500/5 dark:bg-orange-400/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 -left-32 w-[580px] h-[580px] bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[160px] pointer-events-none -z-10" />
    </>
  );
}