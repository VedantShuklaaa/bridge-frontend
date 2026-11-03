export function TxView({ hash }: { hash: string }) {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-12">
      <h1 className="text-3xl">Transaction</h1>
      <p className="break-all font-mono text-sm text-muted-foreground">{hash}</p>
    </section>
  );
}
