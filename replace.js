const fs = require('fs');
const path = './web/src/app/dashboard/marketplace/page.tsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Replace state
content = content.replace(
`  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [bookingDrafts, setBookingDrafts] = useState<Record<string, { startDate: string; endDate: string; loading: boolean }>>({});
  const [isListening, setIsListening] = useState(false);`,
`  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [bookingDrafts, setBookingDrafts] = useState<Record<string, { startDate: string; endDate: string; loading: boolean }>>({});
  const [isListening, setIsListening] = useState(false);`
);

// Replace fetchEquipment & hooks
content = content.replace(
`  // Read URL search params on mount
  useEffect(() => {
    fetchEquipment();
  }, []);

  async function fetchEquipment() {
    try {
      const response = await api.get('/equipment');
      const data = response.data || [];
      
      // Seed with comprehensive initial reviews, contacts, distances, and deposits if missing
      const enriched = data.map((item: any, idx: number) => ({
        ...item,
        owner: item.owner || { name: 'Teja Bhanu', phone: '+91 87654 32109' },
        rating: item.rating || (4.7 + (idx % 3) * 0.1).toFixed(1),
        reviewCount: item.reviewCount || (8 + idx * 3),
        distance: item.distance || (5.4 + idx * 3.2).toFixed(1),
        securityDeposit: item.securityDeposit || (1500 + idx * 1000),
        reviews: [
          { author: 'Ramesh K.', rating: 5, text: 'Fantastic tractor. Harvested my 4-acre plot in Nellore without any issue!' },
          { author: 'Harish R.', rating: 4, text: 'Clean and well-maintained implement. Owner was very prompt in answering calls.' }
        ]
      }));

      // In case backend returns nothing, we should show empty state
      setEquipment(enriched);
      setupDrafts(enriched);
    } catch (error) {
      console.error('Failed to load equipment', error);
      showToast('Unable to load equipment. Please try again.', 'error');
      setEquipment([]);
      setupDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract query parameter if passed e.g., ?search=Tractor
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearch(query);
    }
  }, [searchParams]);`,
`  // Read URL search params on mount
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearch(query);
    }
  }, [searchParams]);

  // Fetch when filters change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEquipment();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, category, page]);

  async function fetchEquipment() {
    try {
      setLoading(true);
      const response = await api.get('/equipment', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          category: category === 'All Categories' || category === (t('categories.all') || 'All Categories') ? undefined : category
        }
      });
      const data = response.data?.data || [];
      const pagination = response.data?.pagination || { page: 1, totalPages: 1, total: 0 };
      
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.total);
      
      // Seed with comprehensive initial reviews, contacts, distances, and deposits if missing
      const enriched = data.map((item: any, idx: number) => ({
        ...item,
        owner: item.owner || { name: 'AgroRent Owner', phone: '+91 00000 00000' },
        rating: item.rating || (4.7 + (idx % 3) * 0.1).toFixed(1),
        reviewCount: item.reviewCount || (8 + idx * 3),
        distance: item.distance || (5.4 + idx * 3.2).toFixed(1),
        securityDeposit: item.securityDeposit || (1500 + idx * 1000),
        reviews: [
          { author: 'Ramesh K.', rating: 5, text: 'Fantastic equipment. Did the job perfectly!' },
          { author: 'Harish R.', rating: 4, text: 'Clean and well-maintained. Owner was very prompt.' }
        ]
      }));

      setEquipment(enriched);
      setupDrafts(enriched);
    } catch (error) {
      console.error('Failed to load equipment', error);
      showToast('Unable to load equipment. Please try again.', 'error');
      setEquipment([]);
      setupDrafts([]);
    } finally {
      setLoading(false);
    }
  };`
);

// Replace categories and filteredEquipment
content = content.replace(
`  const categories = useMemo(() => {
    const values = Array.from(new Set(equipment.map((item) => item.category || 'Other')));
    return [t('categories.all') || 'All Categories', ...values];
  }, [equipment, t]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch = search ? (
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.owner?.name?.toLowerCase().includes(search.toLowerCase())
      ) : true;
      const matchesCategory = category === 'All Categories' || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [equipment, search, category]);`,
`  const categories = useMemo(() => {
    return [
      t('categories.all') || 'All Categories',
      'TRACTOR', 'HARVESTER', 'IMPLEMENT', 'ROTAVATOR', 'CULTIVATOR', 'SEED DRILL', 'SPRAYER', 'POWER TILLER', 'RICE TRANSPLANTER'
    ];
  }, [t]);

  const filteredEquipment = equipment; // Filters are applied on backend`
);

content = content.replace(
`              <button 
                onClick={() => { setSearch(''); setCategory('All Categories'); }}`,
`              <button 
                onClick={() => { setSearch(''); setCategory('All Categories'); setPage(1); }}`
);

content = content.replace(
`            </div>
            );
          })}
        </div>`,
`            </div>
            );
          })}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="col-span-full flex items-center justify-between mt-8 p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase rounded-xl transition-colors"
              >
                {t('previous')}
              </button>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t('page')} {page} {t('of')} {totalPages} <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">{totalItems} {t('items')}</span>
              </div>
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase rounded-xl transition-colors"
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Done. Replaced " + content.indexOf("totalPages") + " index.");
