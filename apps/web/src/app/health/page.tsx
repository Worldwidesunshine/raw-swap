export default function HealthPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <pre>{JSON.stringify({ ok: true, app: "rawswap-web" }, null, 2)}</pre>
    </div>
  );
}
