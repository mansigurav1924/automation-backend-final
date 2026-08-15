async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mgurav2412@gmail.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
      console.log('Login failed:', loginData);
      return;
    }

    const previewRes = await fetch('http://localhost:5000/api/offers/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        candidateName: 'John Doe',
        candidateEmail: 'john@example.com',
        designation: 'Intern',
        startDate: '2026-08-10',
        endDate: '2026-10-10'
      })
    });

    const previewData = await previewRes.json();
    console.log('Status:', previewRes.status);
    if (!previewRes.ok) {
      console.log('Error data:', previewData);
    } else {
      console.log('Success, PDF length:', previewData.pdf.length);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
test();
