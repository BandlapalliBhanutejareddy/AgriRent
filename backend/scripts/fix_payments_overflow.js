const fs = require('fs');

function fixFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  // replace Column with Expanded(child: Column(...))
  c = c.replace(
`                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Booking: \${item.bookingId}',
                      style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                    ),`,
`                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Booking: \${item.bookingId}',
                        style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),`
  );
  c = c.replace(
`                    Text(
                      dateStr,
                      style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                    ),
                  ],
                ),
                Column(`,
`                    Text(
                      dateStr,
                      style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                    ),
                  ],
                ),
                ),
                const SizedBox(width: 8),
                Column(`
  );

  c = c.replace(
`                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ref: \${item.transactionRef}',
                      style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                    ),`,
`                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ref: \${item.transactionRef}',
                        style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),`
  );

  fs.writeFileSync(filePath, c, 'utf8');
  console.log('Fixed', filePath);
}

fixFile('../mobile/lib/features/payments/ui/owner_payments_received_screen.dart');
fixFile('../mobile/lib/features/payments/ui/farmer_payment_history_screen.dart');
