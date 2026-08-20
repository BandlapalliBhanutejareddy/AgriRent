const fs = require('fs');
const path = './web/src/app/dashboard/marketplace/page.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Replace state
lines.splice(38, 5,
`  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [bookingDrafts, setBookingDrafts] = useState<Record<string, { startDate: string; endDate: string; loading: boolean }>>({});
  const [isListening, setIsListening] = useState(false);`
);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Done");
