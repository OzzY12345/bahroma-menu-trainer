export function getServerConfig(env = process.env) {
  return {
    host: env.HOST || "0.0.0.0",
    port: Number(env.PORT || 4173)
  };
}
