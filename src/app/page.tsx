import GraphPrototype from "@/components/GraphPrototype";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Context, made visible</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your context-visualizer</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            A transparent view of the details an AI learns from conversation, with room to inspect and correct them.
          </p>
        </header>

        <GraphPrototype />
      </div>
    </main>
  );
}
