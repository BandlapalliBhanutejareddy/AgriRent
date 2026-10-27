const token = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjUxZjBlMGI4LTczZWEtNGI1YS1hYjMzLWMzMmQ5YzNhZWVmNyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V6eWx4eXJ0bm9keHRoZGd5bnZuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjZDY1ODdjMC01ODM3LTQzMGMtYjMxMC02ZTVmYmNlMjM2NzEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkxMTk0NTM3LCJpYXQiOjE3OTExOTA5MzcsImVtYWlsIjoiZmFybWVyLmxpdmVAYWdyb3JlbnQuYWkiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiUmFtZXNoIEt1bWFyIChGYXJtZXIpIiwicGhvbmUiOiIrOTE5ODc2NTQzMjEwIiwicm9sZSI6IkZBUk1FUiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzkxMTkwOTM3fV0sInNlc3Npb25faWQiOiI5YjI4OWEyNS1jZWRjLTRhNjYtYTQ3Yi00YWJjMWYxNWVmMmIiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.KVS-N57TYW5M2oUp9HYM7yZzHPvenNe_sljXoabu-5-BGoWCZXYpeKq2Rk6A2c_3JgLDjUfQdH8Dpjd-PBSLRQ";

fetch('http://127.0.0.1:4000/api/payments/history', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => {
  console.log('Status:', r.status);
  return r.json();
}).then(t => console.log('Data:', t))
.catch(e => console.error(e));
