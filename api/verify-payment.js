export default async function handler(req, res) {
  console.log('🔍 Payment verification request received');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { reference, checkRecent, afterTimestamp } = req.body;
  console.log('📥 Request params:', { reference, checkRecent, afterTimestamp });
  
  try {
    if (checkRecent) {
      console.log('🔎 Checking recent transactions...');
      const response = await fetch('https://api.paystack.co/transaction?perPage=20', {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`📊 Found ${data.data?.length || 0} transactions`);
      
      const recentSuccess = data.data?.find(tx => {
        const txTime = new Date(tx.paid_at).getTime();
        const isSuccess = tx.status === 'success';
        const isAfterTimestamp = !afterTimestamp || txTime >= afterTimestamp;
        console.log(`  Transaction: ${tx.reference}, Status: ${tx.status}, Time: ${txTime}, After: ${isAfterTimestamp}`);
        return isSuccess && isAfterTimestamp;
      });
      
      if (recentSuccess) {
        console.log('✅ Valid payment found:', recentSuccess.reference);
        return res.json({ 
          success: true, 
          reference: recentSuccess.reference,
          amount: recentSuccess.amount / 100
        });
      } else {
        console.log('❌ No valid payment found');
        return res.json({ success: false, error: 'No recent payment found' });
      }
    } else if (reference) {
      console.log(`🔎 Verifying specific reference: ${reference}`);
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📊 Verification result:', data.data?.status);
      
      if (data.status && data.data.status === 'success') {
        console.log('✅ Payment verified');
        return res.json({ 
          success: true, 
          reference: data.data.reference,
          amount: data.data.amount / 100
        });
      } else {
        console.log('❌ Payment not verified');
        return res.json({ success: false, error: 'Payment not found or failed' });
      }
    } else {
      return res.status(400).json({ error: 'Reference or checkRecent required' });
    }
    
  } catch (error) {
    console.error('💥 Payment verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
