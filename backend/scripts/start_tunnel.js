const localtunnel = require('localtunnel');

(async () => {
  const tunnel = await localtunnel({ port: 4000, subdomain: 'agrorent-ai-webhook-dev' });

  console.log(`\n======================================================`);
  console.log(`✅ Webhook Tunnel Started!`);
  console.log(`\n🔗 Public URL: ${tunnel.url}`);
  console.log(`======================================================\n`);
  
  console.log(`Please configure this Webhook URL in your Razorpay Dashboard:`);
  console.log(`Webhook URL: ${tunnel.url}/api/payments/webhook`);
  console.log(`Secret: test_webhook_secret`);
  console.log(`Events to subscribe to: payment.captured, payment.failed, refund.processed`);
  console.log(`\nListening for webhooks on port 4000... (Press Ctrl+C to stop)`);

  tunnel.on('close', () => {
    console.log('Tunnel closed');
  });
})();
