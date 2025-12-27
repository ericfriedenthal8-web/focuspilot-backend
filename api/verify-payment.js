export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { reference, checkRecent } = req.body;
  
  try {
    if (checkRecent) {
      // List recent transactions
      const response = await fetch('https://api.paystack.co/transaction?perPage=10', {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      // Find most recent successful payment
      const recentSuccess = data.data?.find(tx => tx.status === 'success');
      
      if (recentSuccess) {
        return res.json({ 
          success: true, 
          reference: recentSuccess.reference,
          amount: recentSuccess.amount / 100
        });
      } else {
        return res.json({ success: false, error: 'No recent payment found' });
      }
    } else if (reference) {
      // Verify specific reference
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
          amount: data.data.amount / 100
        });
      } else {
        return res.json({ success: false, error: 'Payment not found or failed' });
      }
    } else {
      return res.status(400).json({ error: 'Reference or checkRecent required' });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
