export function HomeView() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-12">
      <h1 className="text-3xl">bridgeIndexer</h1>
      <p className="text-muted-foreground">
        Search a Solana transaction to inspect its bridge transfers.
      </p>
    </section>
  );
}
