export default async function handler(req, res) {
  // Enable CORS for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { reference } = req.body;
  
  if (!reference) {
    return res.status(400).json({ error: 'Payment reference required' });
  }
  
  try {
    // Verify payment with Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.status && data.data.status === 'success') {
      return res.json({ 
        success: true, 
        reference: data.data.reference,
        amount: data.data.amount / 100 // Convert from kobo to naira/dollars
      });
    } else {
      return res.json({ success: false, error: 'Payment not found or failed' });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
