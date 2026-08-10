import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/offers');
    const offers = res.data;
    console.log('Offers fetched:', offers.length);

    let search = '';
    let sortMethod = 'name_asc';

    const candidateMap = {};
    [...offers].reverse().forEach(o => {
      const key = o.candidate_email || o.candidate_name;
      if (!candidateMap[key]) {
        candidateMap[key] = { email: o.candidate_email, name: o.candidate_name, offers: [] };
      }
      candidateMap[key].offers.push(o);
    });

    const candidates = Object.values(candidateMap)
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortMethod === 'name_asc') return a.name.localeCompare(b.name);
        if (sortMethod === 'name_desc') return b.name.localeCompare(a.name);
        if (sortMethod === 'offers_desc') return b.offers.length - a.offers.length;
        return 0;
      });

    console.log('Candidates processed:', candidates.length);

    candidates.forEach(c => {
      const char = c.name.charAt(0).toUpperCase();
      console.log('Valid candidate name:', c.name, '-> char:', char);

      c.offers.forEach(offer => {
        const dateStr = new Date(offer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        console.log('Offer date:', dateStr);
      });
    });

    console.log('Logic executed successfully');
  } catch (error) {
    console.error('Logic crashed:', error);
  }
}

test();
