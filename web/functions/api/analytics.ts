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
    await context.env.ANALYTICS_KV.put(key, "1");

    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 204 });
  }
};
