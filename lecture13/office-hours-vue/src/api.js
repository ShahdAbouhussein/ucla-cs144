export async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}

export async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(url) {
  const res = await fetch(url, { method: "DELETE" });
  return res.json();
}
