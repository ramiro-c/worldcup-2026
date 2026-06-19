interface Env {
  ANALYTICS_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    if (context.request.method !== "POST") {
      return new Response(null, { status: 405 });
    }

    const body = (await context.request.json()) as {
      path?: string;
      matchId?: string;
      timestamp?: string;
    };

    if (!body.path) {
      return new Response(null, { status: 204 });
    }

    const key = `page_view:${body.path.replace(/\//g, ":")}:${new Date().toISOString().slice(0, 10)}`;
    // KV no tiene incremento atómico: este read-modify-write puede perder
    // increments bajo concurrencia. Aceptable para bajo volumen; si hiciera
    // falta exactitud, migrar a Durable Objects o D1 (UPDATE ... count + 1).
    const current = parseInt((await context.env.ANALYTICS_KV.get(key)) ?? "0", 10);
    await context.env.ANALYTICS_KV.put(key, String(Number.isNaN(current) ? 1 : current + 1));

    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 204 });
  }
};
