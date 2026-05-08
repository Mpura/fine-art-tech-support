// Vercel serverless function — keeps the Airtable token server-side only.
// The frontend calls /api/airtable instead of Airtable directly.

const BASE_ID = "appUqkCfnsOo2Jf7z";
const AT_URL = `https://api.airtable.com/v0/${BASE_ID}`;

export default async function handler(req, res) {
  // Only allow POST from the app itself
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PAT = process.env.AIRTABLE_PAT;
  if (!PAT) {
    return res.status(500).json({ error: "API token not configured on server" });
  }

  const { table, method, params, recordId, fields } = req.body || {};

  if (!table || !method) {
    return res.status(400).json({ error: "Missing table or method" });
  }

  const headers = {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
  };

  let url;
  let options = { headers };

  try {
    if (method === "GET") {
      const u = new URL(`${AT_URL}/${table}`);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            v.forEach((val, i) => {
              if (val !== null && typeof val === "object") {
                // nested object array e.g. sort[0][field]=X&sort[0][direction]=Y
                Object.entries(val).forEach(([sk, sv]) =>
                  u.searchParams.append(`${k}[${i}][${sk}]`, sv)
                );
              } else {
                u.searchParams.append(k, val);
              }
            });
          } else {
            u.searchParams.set(k, v);
          }
        });
      }
      url = u.toString();
      options.method = "GET";

    } else if (method === "POST") {
      url = `${AT_URL}/${table}`;
      options.method = "POST";
      options.body = JSON.stringify({ fields });

    } else if (method === "PATCH") {
      if (!recordId) return res.status(400).json({ error: "Missing recordId for PATCH" });
      url = `${AT_URL}/${table}/${recordId}`;
      options.method = "PATCH";
      options.body = JSON.stringify({ fields });

    } else if (method === "DELETE") {
      if (!recordId) return res.status(400).json({ error: "Missing recordId for DELETE" });
      url = `${AT_URL}/${table}/${recordId}`;
      options.method = "DELETE";

    } else {
      return res.status(400).json({ error: "Invalid method — use GET, POST, PATCH, or DELETE" });
    }

    const response = await fetch(url, options);
    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (e) {
    return res.status(500).json({ error: "Failed to reach Airtable", detail: e.message });
  }
}
