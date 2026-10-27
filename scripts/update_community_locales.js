const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../mobile/lib/core/localization/app_localizations.dart');
let content = fs.readFileSync(targetPath, 'utf8');

const enInsert = `      'community_subtitle': 'Connect, share tips, and request equipment with verified farmers',
      'create_post': 'Create Post',
      'search_community_hint': 'Search posts, farmers, crops...',
      'category_all': 'All',
      'category_discussion': 'Discussions',
      'category_crops': 'Crops & Farming',
      'category_equipment_demand': 'Equipment Demand',
      'category_advice': 'Farming Advice',
      'like': 'Like',
      'comment': 'Comment',
      'reply': 'Reply',
      'comments': 'Comments',
      'no_posts_found': 'No community posts found',
      'no_posts_subtitle': 'Be the first farmer to share a tip, ask a question, or request equipment.',
      'write_something': "What's on your farm mind? Share tips, ask questions, or request equipment...",
      'select_category': 'Select Category',
      'post_published': 'Post published successfully!',
      'post_reply': 'Post Reply',
      'write_reply': 'Write a reply...',
      'clear_search': 'Clear search',
      'replying_to': 'Replying to',
      'equipment_needed': 'Equipment Needed',
`;

const teInsert = `      'community_subtitle': 'ధృవీకరించబడిన రైతులతో అనుసంధానం, సలహాలు మరియు పరికరాల అభ్యర్థన',
      'create_post': 'పోస్ట్ సృష్టించండి',
      'search_community_hint': 'పోస్టులు, రైతులు, పంటలను వెతకండి...',
      'category_all': 'అన్నీ',
      'category_discussion': 'చర్చలు',
      'category_crops': 'పంటలు & సాగు',
      'category_equipment_demand': 'పరికరాల డిమాండ్',
      'category_advice': 'వ్యవసాయ సలహాలు',
      'like': 'లైక్',
      'comment': 'వ్యాఖ్య',
      'reply': 'సమాధానం',
      'comments': 'వ్యాఖ్యలు',
      'no_posts_found': 'కమ్యూనిటీ పోస్టులు ఏవీ కనుగొనబడలేదు',
      'no_posts_subtitle': 'సలహా పంచుకోవడానికి లేదా పరికరం అభ్యర్థించడానికి మొదటి రైతుగా ఉండండి.',
      'write_something': 'మీ వ్యవసాయ ఆలోచనలు ఏమిటి? ప్రశ్నలు అడగండి లేదా పరికరాలను అభ్యర్థించండి...',
      'select_category': 'వర్గాన్ని ఎంచుకోండి',
      'post_published': 'పోస్ట్ విజయవంతంగా ప్రచురించబడింది!',
      'post_reply': 'సమాధానం పోస్ట్ చేయండి',
      'write_reply': 'సమాధానం రాయండి...',
      'clear_search': 'శోధనను క్లియర్ చేయండి',
      'replying_to': 'సమాధానం ఇస్తున్నారు',
      'equipment_needed': 'అవసరమైన పరికరం',
`;

const hiInsert = `      'community_subtitle': 'सत्यापित किसानों के साथ जुड़ें, सुझाव साझा करें और उपकरण का अनुरोध करें',
      'create_post': 'पोस्ट बनाएं',
      'search_community_hint': 'पोस्ट, किसान, फसलें खोजें...',
      'category_all': 'सभी',
      'category_discussion': 'चर्चाएं',
      'category_crops': 'फसलें और खेती',
      'category_equipment_demand': 'उपकरण की मांग',
      'category_advice': 'कृषि सलाह',
      'like': 'पसंद',
      'comment': 'टिप्पणी',
      'reply': 'जवाब दें',
      'comments': 'टिप्पणियाँ',
      'no_posts_found': 'कोई कम्युनिटी पोस्ट नहीं मिली',
      'no_posts_subtitle': 'सुझाव साझा करने या उपकरण का अनुरोध करने वाले पहले किसान बनें।',
      'write_something': 'आपके खेत में क्या चल रहा है? प्रश्न पूछें या उपकरण का अनुरोध करें...',
      'select_category': 'श्रेणी चुनें',
      'post_published': 'पोस्ट सफलतापूर्वक प्रकाशित हुआ!',
      'post_reply': 'जवाब पोस्ट करें',
      'write_reply': 'जवाब लिखें...',
      'clear_search': 'खोज साफ़ करें',
      'replying_to': 'जवाब दे रहे हैं',
      'equipment_needed': 'उपकरण की आवश्यकता',
`;

const taInsert = `      'community_subtitle': 'சரிபார்க்கப்பட்ட விவசாயிகளுடன் இணையுங்கள், ஆலோசனைகளைப் பகிருங்கள்',
      'create_post': 'பதிவை உருவாக்கவும்',
      'search_community_hint': 'பதிவுகள், விவசாயிகள், பயிர்களைத் தேடுங்கள்...',
      'category_all': 'அனைத்தும்',
      'category_discussion': 'கலந்துரையாடல்கள்',
      'category_crops': 'பயிர்கள் & விவசாயம்',
      'category_equipment_demand': 'உபகரண தேவை',
      'category_advice': 'விவசாய ஆலோசனை',
      'like': 'விருப்பம்',
      'comment': 'கருத்து',
      'reply': 'பதிலளி',
      'comments': 'கருத்துகள்',
      'no_posts_found': 'சமூகப் பதிவுகள் எதுவும் கிடைக்கவில்லை',
      'no_posts_subtitle': 'ஆலோசனை பகிர அல்லது உபகரணம் கோர முதல் விவசாயியாக இருங்கள்.',
      'write_something': 'உங்கள் விவசாய சிந்தனை என்ன? கேள்விகள் கேளுங்கள் அல்லது உபகரணம் கோருங்கள்...',
      'select_category': 'வகையைத் தேர்ந்தெடுக்கவும்',
      'post_published': 'பதிவு வெற்றிகரமாக வெளியிடப்பட்டது!',
      'post_reply': 'பதிலை இடுகையிடவும்',
      'write_reply': 'பதில் எழுதவும்...',
      'clear_search': 'தேடலை அழிக்கவும்',
      'replying_to': 'பதிலளிக்கிறார்',
      'equipment_needed': 'தேவையான உபகரணம்',
`;

const knInsert = `      'community_subtitle': 'ದೃಢೀಕರಿಸಿದ ರೈತರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ, ಸಲಹೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
      'create_post': 'ಪೋಸ್ಟ್ ರಚಿಸಿ',
      'search_community_hint': 'ಪೋಸ್ಟ್‌ಗಳು, ರೈತರು, ಬೆಳೆಗಳನ್ನು ಹುಡುಕಿ...',
      'category_all': 'ಎಲ್ಲಾ',
      'category_discussion': 'ಚರ್ಚೆಗಳು',
      'category_crops': 'ಬೆಳೆಗಳು & ಕೃಷಿ',
      'category_equipment_demand': 'ಉಪಕರಣಗಳ ಬೇಡಿಕೆ',
      'category_advice': 'ಕೃಷಿ ಸಲಹೆ',
      'like': 'ಇಷ್ಟ',
      'comment': 'ಪ್ರತಿಕ್ರಿಯೆ',
      'reply': 'ಉತ್ತರಿಸಿ',
      'comments': 'ಪ್ರತಿಕ್ರಿಯೆಗಳು',
      'no_posts_found': 'ಯಾವುದೇ ಸಮುದಾಯ ಪೋಸ್ಟ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
      'no_posts_subtitle': 'ಸಲಹೆಯನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಅಥವಾ ಉಪಕರಣವನ್ನು ವಿನಂತಿಸಲು ಮೊದಲ ರೈತರಾಗಿರಿ.',
      'write_something': 'ನಿಮ್ಮ ಕೃಷಿ ಚಿಂತನೆಗಳೇನು? ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ ಅಥವಾ ಉಪಕರಣವನ್ನು ಕೋರಿ...',
      'select_category': 'ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      'post_published': 'ಪೋಸ್ಟ್ ಯಶಸ್ವಿಯಾಗಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ!',
      'post_reply': 'ಉತ್ತರವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ',
      'write_reply': 'ಉತ್ತರವನ್ನು ಬರೆಯಿರಿ...',
      'clear_search': 'ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ',
      'replying_to': 'ಉತ್ತರಿಸಲಾಗುತ್ತಿದೆ',
      'equipment_needed': 'ಅಗತ್ಯವಿರುವ ಉಪಕರಣ',
`;

// Insert into EN
content = content.replace(
  /'community_chat': 'Community Chat',/,
  `'community_chat': 'Community Chat',\n${enInsert}`
);

// Insert into TE
content = content.replace(
  /'community_chat': 'సంఘం చాట్',/,
  `'community_chat': 'సంఘం చాట్',\n${teInsert}`
);

// Insert into HI
content = content.replace(
  /'community_chat': 'समुदाय चैट',/,
  `'community_chat': 'समुदाय चैट',\n${hiInsert}`
);

// Insert into TA
content = content.replace(
  /'community_chat': 'சமூக அரட்டை',/,
  `'community_chat': 'சமூக அரட்டை',\n${taInsert}`
);

// Insert into KN
content = content.replace(
  /'community_chat': 'ಸಮುದಾಯ ಚಾಟ್',/,
  `'community_chat': 'ಸಮುದಾಯ ಚಾಟ್',\n${knInsert}`
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated app_localizations.dart with community redesign translations!');
