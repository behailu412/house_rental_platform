
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'hrp_language';

const dictionary = {
  am: {
    // General & Navigation
    'House Rental': 'የቤት ኪራይ',
    'Renter services & Owner listing': 'የተከራይ አገልግሎቶች እና የባለቤቶች ማስታወቂያ',
    Language: 'ቋንቋ',
    Login: 'ግባ',
    Logout: 'ውጣ',
    'Sign up': 'ይመዝገቡ',
    'Sign In': 'ግባ',
    'Get Started': 'ይጀምሩ',
    Loading: 'በመጫን ላይ',
    'Loading...': 'በመጫን ላይ...',
    'Restoring session...': 'ክፍለ-ጊዜውን በመመለስ ላይ...',
    Home: 'መነሻ',
    Features: 'ባህሪያት',
    FAQ: 'ጥያቄና መልስ',
    'How it Works': 'እንዴት ይሰራል',
    'How It Works': 'እንዴት ይሰራል',

    // Search & Filter
    'Find Your Perfect Home': 'ምቹ ቤትዎን እዚህ ያግኙ',
    City: 'ከተማ',
    'Sub-city / Neighborhood': 'ክፍለ ከተማ / ሰፈር',
    'Property Type': 'የቤት አይነት',
    'Search Properties': 'ቤቶችን ፈልግ',
    'Search Results': 'የፍለጋ ውጤቶች',
    'No properties found': 'ምንም ቤት አልተገኘም',
    'Clear Filters': 'ማጣሪያዎችን አጽዳ',
    'No Photo Available': 'ፎቶ የለም',
    'View Details': 'ዝርዝር እይ',
    'Chat Owner': 'ባለቤቱን አነጋግር',
    'Property Information': 'ስለ ቤቱ መረጃ',
    Description: 'መግለጫ',
    'Rental Rules': 'የኪራይ ደንቦች',
    'Message Owner': 'ለባለቤቱ መልዕክት ላክ',
    'Add to Favorites': 'ወደ ተወዳጅ ጨምር',
    'Remove from Favorites': 'ከተወዳጅ አስወግድ',

    // Messages & Notifications
    Messages: 'መልዕክቶች',
    'No conversations yet': 'እስካሁን ምንም ውይይት የለም',
    'Active now': 'አሁን ንቁ',
    'Unknown user': 'ያልታወቀ ተጠቃሚ',
    'No messages yet.': 'እስካሁን ምንም መልዕክት የለም።',
    'Type a message...': 'መልዕክት ይፃፉ...',
    Send: 'ላክ',
    'Sending...': 'በመላክ ላይ...',
    'Notification Preferences': 'የማሳወቂያ ቅንብሮች',
    'Save Preferences': 'ቅንብሮችን አስቀምጥ',
    'Saving...': 'በማስቀመጥ ላይ...',
    Notifications: 'ማሳወቂያዎች',
    All: 'ሁሉም',
    Unread: 'ያልተነበቡ',
    'Mark all as read': 'ሁሉንም እንደተነበቡ ምልክት አድርግ',
    Read: 'አንብብ',
    Delete: 'ሰርዝ',
    'Just now': 'አሁን',
    'No notifications': 'ምንም ማሳወቂያ የለም',
    'All caught up!': 'ሁሉም ተነብቧል!',

    // Dashboard & Admin
    'Submit Complaint': 'ቅሬታ አቅርብ',
    Cancel: 'ሰርዝ',
    Title: 'ርዕስ',
    Category: 'ምድብ',
    Priority: 'ቅድሚያ',
    Status: 'ሁኔታ',
    Pending: 'በመጠባበቅ ላይ',
    Resolved: 'ተፈትቷል',
    Rejected: 'ውድቅ ተደርጓል',
    Closed: 'ተዘግቷል',
    Overview: 'አጠቃላይ እይታ',
    Complaints: 'ቅሬታዎች',
    Transactions: 'ግብይቶች',
    Users: 'ተጠቃሚዎች',
    'System Settings': 'የስርዓት ቅንብሮች',
    'Pending Listings': 'በመጠባበቅ ላይ ያሉ ዝርዝሮች',
    'Price Settings': 'የዋጋ ቅንብር',
    'Complaint Management': 'የቅሬታ አስተዳደር',
    Dashboard: 'ዳሽቦርድ',
    'Residential': 'የመኖሪያ ቤት',
    'Shop for Rent': 'የኪራይ ሱቅ',
    'Event Hall': 'የፕሮግራም አዳራሽ',
    'Manage your platform with ease': 'መድረክዎን በቀላሉ ያስተዳድሩ',
    'User Management': 'የተጠቃሚ አስተዳደር',
    'Manage platform users and permissions': 'የተጠቃሚዎችን ፈቃድ ያስተዳድሩ',
    'Property Statistics Overview': 'የቤቶች ስታቲስቲክስ አጠቃላይ እይታ',
    'Transaction History': 'የግብይት ታሪክ',
    'Price Settings (% Based)': 'የዋጋ ቅንብር (በመቶኛ)',
    'Configure global admin controls and account preferences.': 'አጠቃላይ የአስተዳዳሪ መቆጣጠሪያዎችን እና ምርጫዎችን ያቀናብሩ።',
    'Total Revenue': 'ጠቅላላ ገቢ',
    'Filters & Search': 'ማጣሪያዎች እና ፍለጋ',
    Previous: 'ቀዳሚ',
    Next: 'ቀጣይ',
    'Loading complaints...': 'ቅሬታዎች በመጫን ላይ...',
    'No complaints found': 'ምንም ቅሬታ አልተገኘም',
    'View and manage user complaints and feedback efficiently': 'የተጠቃሚዎችን ቅሬታ እና ግብረመልስ በአግባቡ ያስተዳድሩ',

    // Authentication
    'Welcome Back': 'እንኳን ደህና መጡ',
    'Create Account': 'መለያ ይፍጠሩ',
    'Phone Number': 'ስልክ ቁጥር',
    Password: 'የይለፍ ቃል',
    'Enter your password': 'የይለፍ ቃልዎን ያስገቡ',
    'Full Name': 'ሙሉ ስም',
    Role: 'ሚና',
    Renter: 'ተከራይ',
    Owner: 'ባለቤት',
    'Property Owner': 'የቤት ባለቤት',
    'Confirm Password': 'የይለፍ ቃል ያረጋግጡ',
    'Already have an account?': 'መለያ አለዎት?',
    "Don't have an account?": 'መለያ የለዎትም?',
    'Network error. Please try again.': 'የኔትወርክ ስህተት። እባክዎ እንደገና ይሞክሩ።',
    'Login failed': 'መግባት አልተሳካም',
    'Signup failed': 'ምዝገባ አልተሳካም',
    'Signing in...': 'በመግባት ላይ...',
    'Creating Account...': 'መለያ በመፍጠር ላይ...',
    'Sign in to continue to EthioRent': 'ለመቀጠል ወደ EthioRent ይግቡ',
    'Enter your full name': 'ሙሉ ስምዎን ያስገቡ',
    'Select your role': 'ሚናዎን ይምረጡ',
    'Create a password (min 6 characters)': 'የይለፍ ቃል ይፍጡ (ቢያንስ 6 ፊደላት)',
    'Confirm your password': 'የይለፍ ቃልዎን ያረጋግጡ',
    'I agree to Terms of Service and Privacy Policy': 'በአገልግሎት ውሎች እና የግላዊነት ፖሊሲ እስማማለሁ',
    'Enter a valid phone number and password.': 'ትክክለኛ የስልክ ቁጥር እና የይለፍ ቃል ያስገቡ።',
    'Please fill all required fields.': 'እባክዎ ሁሉንም የግዴታ ቦታዎች ይሙሉ።',
    'Passwords do not match.': 'የይለፍ ቃላቱ አይዛመዱም።',
    'Password must be at least 6 characters.': 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት።',
    'You must agree to Terms of Service and Privacy Policy.': 'በአገልግሎት ውሎች እና የግላዊነት ፖሊሲ መስማማት አለብዎት።',

    // Property Management
    'Searching...': 'በመፈለግ ላይ...',
    'No photos available': 'ምንም ፎቶ የለም',
    'Previous photo': 'ቀዳሚ ፎቶ',
    'Next photo': 'ቀጣይ ፎቶ',
    'Photo ': 'ፎቶ ',
    'See More Properties': 'ተጨማሪ ቤቶችን እይ',
    'Show Less Properties': 'ያነሱ ቤቶችን አሳይ',
    'Property Photos': 'የቤቱ ፎቶዎች',
    'Swipe to view all photos': 'ሁሉንም ፎቶዎች ለማየት ያንሸራትቱ',
    'No description provided': 'ምንም መግለጫ አልተሰጠም',
    'List Your Property': 'ቤትዎን ያስመዝግቡ',
    'Repost Property': 'እንደገና ያስመዝግቡ',
    Location: 'አካባቢ',
    'Property Details': 'የቤቱ ዝርዝር',
    Photos: 'ፎቶዎች',
    'Upload up to 3 photos': 'እስከ 3 ፎቶዎችን ይጫኑ',
    'Click to upload photos': 'ፎቶ ለመጫን እዚህ ይጫኑ',
    'or drag and drop': 'ወይም ይጎትቱና እዚህ ይልቀቁ',
    'Clear Form': 'ቅጹን አጽዳ',
    Processing: 'በሂደት ላይ',
    Error: 'ስህተት',
    'Notification preferences updated successfully!': 'የማሳወቂያ ቅንብሮች በተሳካ ሁኔታ ተዘምነዋል!',
    'Loading preferences...': 'ቅንብሮች በመጫን ላይ...',
    'Email Notifications': 'የኢሜይል ማሳወቂያዎች',
    'New Property Alerts': 'የአዲስ ቤት ማሳወቂያዎች',
    'Message Notifications': 'የመልዕክት ማሳወቂያዎች',
    'Property Updates': 'የቤት ዝመናዎች',
    'Payment Notifications': 'የክፍያ ማሳወቂያዎች',
    'Read more': 'ተጨማሪ ያንብቡ',

    // Hero Section & Stats
    'Trusted by 10,000+ renters across Ethiopia': 'በመላው ኢትዮጵያ ከ10,000 በላይ ተከራዮች የታመነ',
    'The Modern Way to': 'ቤትዎን ለማግኘት',
    'Find Your Home': 'ዘመናዊው መንገድ',
    'Connect directly with verified property owners. Browse premium listings, chat instantly, and secure your perfect rental—no agents, no commissions, no hassle.': 'ከተረጋገጡ የቤት ባለቤቶች ጋር በቀጥታ ይገናኙ። ምርጥ ቤቶችን ይመልከቱ፣ ወዲያውኑ ይወያዩ፣ እና የሚፈልጉትን ቤት ያለምንም ደላላ፣ ያለምንም ኮሚሽን እና ያለምንም እንግልት ይከራዩ።',
    'Start Your Search': 'ፍለጋ ይጀምሩ',
    'Active Properties': 'ንቁ ቤቶች',
    'Cities Covered': 'የተሸፈኑ ከተሞች',
    'Satisfaction Rate': 'የእርካታ መጠን',
    'Verified Listings': 'የተረጋገጡ ቤቶች',
    'Direct Communication': 'ቀጥተኛ ግንኙነት',
    'No Commission Fees': 'ያለ ኮሚሽን ክፍያ',
    'Simple 3-Step Process': 'ቀላል ባለ 3 ደረጃ ሂደት',
    'How EthioRent Works': 'EthioRent እንዴት ይሰራል?',
    'Get started in minutes and find your perfect home without any middlemen or hidden fees': 'በደቂቃዎች ውስጥ ይጀምሩ እና ያለምንም ደላላ ወይም ተጨማሪ ክፍያ ተስማሚ ቤትዎን ያግኙ',
    'Step 1': 'ደረጃ 1',
    'Step 2': 'ደረጃ 2',
    'Step 3': 'ደረጃ 3',
    'Browse & Chat': 'ይፈልጉ እና ይወያዩ',
    'Secure & Move': 'ያረጋግጡ እና ይግቡ',
    'Sign up in seconds as a renter or property owner. Verify your identity and start your journey.': 'በሰከንዶች ውስጥ እንደ ተከራይ ወይም ባለቤት ይመዝገቡ። ማንነትዎን ያረጋግጡና ጉዞዎን ይጀምሩ።',
    'Explore verified listings, use advanced filters, and connect directly with property owners through our built-in chat.': 'የተረጋገጡ ቤቶችን ይፈልጉ፣ የማጣሪያ አማራጮችን ይጠቀሙ፣ እና በውስጥ የውይይት መስመራችን አማካኝነት ከባለቤቶች ጋር በቀጥታ ይገናኙ።',
    'Complete secure payments, sign digital agreements, and get your keys. Your new home awaits!': 'ክፍያዎን በደህንነት ይፈጽሙ፣ ዲጂታል ውሎችን ይፈርሙ እና ቁልፍዎን ይረከቡ። አዲሱ ቤትዎ እየጠበቀዎት ነው!',

    // Features Section
    'Premium Features': 'ልዩ አገልግሎቶች',
    'Why Choose ': 'ለምን ይመረጣል ',
    'EthioRent': 'EthioRent',
    'Experience the future of property rental with cutting-edge features designed for your convenience': 'ለእርስዎ ምቾት ተብለው በተዘጋጁ ዘመናዊ አገልግሎቶች የቤት ኪራይን የወደፊት ቴክኖሎጂ ይለማመዱ',
    'Every property undergoes rigorous verification by our admin team, ensuring authenticity and your complete safety.': 'እያንዳንዱ ቤት በአስተዳዳሪ ቡድናችን ጥልቅ ምርመራ ይደረግበታል፤ ይህም ትክክለኛነቱን እና የእርስዎን ደህንነት ያረጋግጣል።',
    'Connect instantly with property owners through our real-time messaging system with read receipts and instant notifications.': 'መልዕክት እንደደረሰ በሚያሳውቅ የውይይት መስመራችን አማካኝነት ከቤት ባለቤቶች ጋር ወዲያውኑ ይገናኙ።',
    'Multiple payment options including Chapa and Telebirr with bank-level security and instant confirmation.': 'እንደ ቴሌብር እና ቻፓ ያሉ የክፍያ አማራጮችን በከፍተኛ የባንክ ደህንነት እና ፈጣን ማረጋገጫ ይጠቀሙ።',
    'Advanced filtering with city autocomplete, price ranges, property types, and AI-powered recommendations.': 'በከተማ፣ በዋጋ፣ በቤት አይነት እና በዘመናዊ የፍለጋ ዘዴዎች የሚፈልጉትን በቀላሉ ያግኙ።',
    'Save your favorite properties, track price changes, and receive alerts when matching properties become available.': 'የሚወዷቸውን ቤቶች ያስቀምጡ፣ የዋጋ ለውጦችን ይከታተሉ፣ እና የሚፈልጉት አይነት ቤት ሲገኝ ማሳወቂያ ይድረስዎት።',
    'Real-time notifications for new listings, messages, and property updates keep you ahead of the competition.': 'ለአዳዲስ ቤቶች፣ መልዕክቶች እና ዝመናዎች የሚላኩ ፈጣን ማሳወቂያዎች ሁሌም ቀዳሚ ያደርጉዎታል።',

    // FAQ Section
    'Got Questions?': 'ጥያቄ አለዎት?',
    'Frequently Asked Questions': 'ተደጋግመው የሚጠየቁ ጥያቄዎች',
    'Everything you need to know about EthioRent and how we can help you find your perfect home': 'ስለ EthioRent እና ቤትዎን በቀላሉ ለማግኘት እንዴት እንደምንረዳዎ ማወቅ የሚፈልጉት ነገር ሁሉ',
    'How do I start searching for properties?': 'ቤቶችን መፈለግ እንዴት እጀምራለሁ?',
    'Simply sign up for a free account, then browse our extensive listings. You can filter by location, price range, property type, and more. Our advanced search algorithms will help you find exactly what you\'re looking for.': 'በነጻ መለያ ይፍጠሩና ዝርዝሮቹን ይመልከቱ። በአካባቢ፣ በዋጋ፣ በቤት አይነት እና በሌሎችም ማጣራት ይችላሉ። የእኛ ዘመናዊ የፍለጋ ዘዴ የሚፈልጉትን በትክክል እንዲያገኙ ይረዳዎታል።',
    'Is it free to list my property?': 'ቤት ለማስመዝገብ ክፍያ አለ?',
    'Property owners can list their properties for free. There\'s only a small verification fee to ensure listing quality and security. This helps us maintain a trusted platform with legitimate listings only.': 'የቤት ባለቤቶች ቤታቸውን በነጻ ማስመዝገብ ይችላሉ። የዝርዝሩን ጥራትና ደህንነት ለመጠበቅ የሚከፈል ትንሽ የማረጋገጫ ክፍያ ብቻ አለ። ይህም መድረኩ የታመነ እና ትክክለኛ ቤቶች ብቻ እንዲኖሩት ይረዳል።',
    'How do I know the listings are legitimate?': 'ዝርዝሮቹ ትክክለኛ መሆናቸውን እንዴት አውቃለሁ?',
    'All properties go through our rigorous verification process. Our admin team reviews each listing, verifies ownership, and ensures accuracy. We also require property photos and documentation for verification.': 'ሁሉም ቤቶች ጥብቅ የማረጋገጫ ሂደት ያልፋሉ። የአስተዳዳሪ ቡድናችን የእያንዳንዱን ቤት ባለቤትነት እና ትክክለኛነት ያረጋግጣል። እንዲሁም ለምርመራ ፎቶዎችን እና ሰነዶችን እንጠይቃለን።',
    'Can I communicate directly with property owners?': 'ከቤት ባለቤቶች ጋር በቀጥታ መገናኘት እችላለሁ?',
    'Yes! Our platform enables direct communication between renters and property owners through our secure messaging system. You can chat instantly, share documents, and even schedule viewings.': 'አዎ! መድረካችን በደህንነቱ በተጠበቀ የውይይት መስመር ተከራዮች እና ባለቤቶች በቀጥታ እንዲገናኙ ያስችላል። ወዲያውኑ መወያየት፣ ሰነዶችን መለዋወጥ እና ቀጠሮ መያዝ ይችላሉ።',
    'What payment methods are supported?': 'የትኞቹ የክፍያ አማራጮች ይሰራሉ?',
    'We support multiple payment methods including Chapa, Telebirr, and bank transfers for your convenience and security. All transactions are encrypted and processed through our secure payment gateway.': 'ለእርስዎ ምቾት እና ደህንነት ሲባል ቻፓን፣ ቴሌብርን እና የባንክ ዝውውርን እንደግፋለን። ሁሉም ግብይቶች በከፍተኛ ምስጢራዊነት የተጠበቁ ናቸው።',
    'How quickly can I move into a property?': 'ቤት ውስጥ ለመግባት ምን ያህል ጊዜ ይወስዳል?',
    'Once you\'ve found your perfect property and completed the payment process, you can typically move in within 1-3 days, depending on the property owner\'s availability and any required preparations.': 'ተስማሚ ቤት አግኝተው ክፍያውን እንደጨረሱ፣ እንደ ባለቤቱ ዝግጁነት ከ1-3 ቀናት ውስጥ መግባት ይችላሉ።',

    // CTA & Footer
    'Still have questions?': 'ሌላ ጥያቄ አለዎት?',
    'Contact Support': 'ድጋፍ ሰጪ ቡድኑን ያግኙ',
    'Join 10,000+ Happy Users': 'ከ10,000 በላይ ደስተኛ ተጠቃሚዎችን ይቀላቀሉ',
    'Ready to Transform Your': 'የኪራይ ልምድዎን ለመለወጥ',
    'Rental Experience?': 'ዝግጁ ነዎት?',
    'Join thousands of satisfied renters and property owners who have already discovered the smarter way to rent and list properties in Ethiopia.': 'በኢትዮጵያ ቤት ለመከራየት እና ለማስከራየት የተሻለውን መንገድ የመረጡ በሺዎች የሚቆጠሩ ደስተኛ ደንበኞችን ይቀላቀሉ።',
    'Start Free Today': 'ዛሬ በነጻ ይጀምሩ',
    'Learn More': 'ተጨማሪ ይወቁ',
    'No Credit Card Required': 'የባንክ ካርድ አያስፈልግም',
    '5-Minute Setup': 'ባለ 5 ደቂቃ ዝግጅት',
    '24/7 Support': 'የ24/7 ድጋፍ',
    'Ethiopia\'s leading platform for direct property rentals. Connect with verified owners, browse premium listings, and find your perfect home without intermediaries.': 'በኢትዮጵያ ቀዳሚው የቀጥታ ቤት ኪራይ መድረክ። ከተረጋገጡ ባለቤቶች ጋር ይገናኙ፣ ምርጥ ቤቶችን ይመልከቱ፣ እና ያለምንም ደላላ ተስማሚ ቤትዎን ያግኙ።',
    'Platform': 'መድረክ',
    'Company': 'ኩባንያ',
    'Support': 'ድጋፍ',
    'About Us': 'ስለ እኛ',
    'Careers': 'ስራዎች',
    'Blog': 'ብሎግ',
    'Press': 'ዜና',
    'Help Center': 'የእርዳታ ማዕከል',
    'Contact Us': 'ያግኙን',
    'Privacy Policy': 'የግላዊነት ፖሊሲ',
    'Terms of Service': 'የአገልግሎት ውሎች',
    'Made with ❤️ in Ethiopia': 'በኢትዮጵያ በ ❤️ ተሠርቷል',
    '© 2018 EthioRent. All rights reserved.': '© 2018 EthioRent. መብቱ በህግ የተጠበቀ ነው።',
    '09XXXXXXXX or +2519XXXXXXXX': '09XXXXXXXX ወይም +2519XXXXXXXX',
    'Remove': 'አስወግድ',
    'ETB/month': 'ብር/ወር',
    'Renter Guide': 'የተከራይ መመሪያ',
    'Your complete resource for finding and securing the perfect rental home.': 'ተስማሚ የኪራይ ቤት ለማግኘትና ለመያዝ የሚያስፈልጉ ሙሉ መረጃዎች ያሉበት መመሪያ።',
    'Getting Started': 'ለመጀመር',
    'Welcome to your comprehensive renter dashboard. Our platform is designed to streamline your rental search by providing verified listings, direct owner communication, and powerful tools to manage your housing journey-all in one centralized location.': 'ወደ ተከራይ ዳሽቦርድዎ እንኳን ደህና መጡ። መድረካችን የተረጋገጡ ቤቶችን፣ ከባለቤቶች ጋር ቀጥተኛ ውይይትን እና ጠንካራ የአስተዳደር መሳሪያዎችን በአንድ ቦታ በማቅረብ ፍለጋዎን እንዲቀላጠፍ ተዘጋጅቷል።',
    '🏠 Discover Homes': '🏠 ቤቶችን ያግኙ',
    'Begin your search by exploring our curated collection of active rental listings. Utilize our advanced filtering system to narrow properties by location, type, and specific requirements. Click into any property to access detailed information including pricing, amenities, neighborhood insights, and owner contact details.': 'ፍለጋዎን በንቁ የኪራይ ማስታወቂያዎች ዝርዝር ላይ በመመርመር ይጀምሩ። በአካባቢ፣ በአይነት እና በልዩ ፍላጎቶችዎ መሠረት ቤቶችን ለማጣራት የላቀ ማጣሪያ ይጠቀሙ። የዋጋ መረጃ፣ አገልግሎቶች እና የባለቤት ዝርዝሮችን ለማየት በማንኛውም ቤት ላይ ይጫኑ።',
    '💬 Messages': '💬 መልዕክቶች',
    'Engage directly with property owners through our secure messaging platform. Discuss availability, rental terms, utility arrangements, and move-in timelines. The real-time chat system ensures prompt communication, while unread message indicators help you stay informed of all important responses.': 'በደህንነቱ በተጠበቀ የመልዕክት ስርዓታችን አማካኝነት ከቤት ባለቤቶች ጋር በቀጥታ ይገናኙ። ስለ ቤት መገኘት፣ የኪራይ ውሎች እና የመግቢያ ጊዜ ይወያዩ። የቀጥታ ውይይት ስርዓቱ ፈጣን ግንኙነት ያረጋግጣል።',
    '❤️ Favorites': '❤️ ተወዳጆች',
    'Save properties that interest you to your personal favorites collection. This feature enables efficient comparison of multiple options and creates a convenient shortlist, eliminating the need to repeat searches and helping you make informed decisions.': 'የሚስቡዎትን ቤቶች ወደ ተወዳጆች ዝርዝር ያስቀምጡ። ይህ ባህሪ አማራጮችን በቀላሉ ለማነፃፀር ያስችላል እና የተመረጠ ውሳኔ ለማድረግ ይረዳዎታል።',
    '⚙️ Settings': '⚙️ ቅንብሮች',
    'Personalize your experience by updating your profile information, modifying security credentials, and toggling between light and dark display modes for optimal viewing comfort during any time of day.': 'የመገለጫ መረጃዎን በማዘመን፣ የደህንነት መረጃዎችን በማሻሻል እና በብርሃን/ጨለማ ሁኔታዎች መካከል በመቀየር ተሞክሮዎን ያበጁ።',
    '🆘 Help & Support': '🆘 እገዛ እና ድጋፍ',
    'Access comprehensive support whenever you encounter technical issues or wish to provide feedback. Your input is valuable for enhancing platform functionality and maintaining a safe, reliable rental environment for all users.': 'ቴክኒካዊ ችግር ሲያጋጥምዎ ወይም ግብረ-መልስ ለመስጠት ሲፈልጉ ሙሉ ድጋፍ ያግኙ። የእርስዎ አስተያየት ለመድረኩ መሻሻል ጠቃሚ ነው።',
    '💡 Pro Tips for Success': '💡 ለስኬት ጠቃሚ ምክሮች',
    'Maximize your rental search efficiency by:': 'የኪራይ ፍለጋ ብቃትዎን ከፍ ለማድረግ:',
    '1) Shortlisting promising properties in Favorites': '1) ተስፋ የሚሰጡ ቤቶችን በተወዳጆች ውስጥ ያስቀምጡ',
    '2) Initiating conversations with multiple owners': '2) ከብዙ ባለቤቶች ጋር ውይይት ይጀምሩ',
    '3) Carefully comparing responses and terms': '3) ምላሾችን እና ውሎችን በጥንቃቄ ያነፃፅሩ',
    '4) Selecting the property that best aligns with your budget, location preferences, and lifestyle requirements.': '4) ከበጀትዎ እና ከፍላጎትዎ ጋር የሚስማማውን ቤት ይምረጡ።',
    'Owner Guide': 'የባለቤት መመሪያ',
    'Guide': 'መመሪያ',
    'Post a New Listing': 'አዲስ ማስታወቂያ ያቅርቡ',
    'Select a conversation': 'ውይይት ይምረጡ',
    'Short Description': 'አጭር መግለጫ',
    'Detailed Description': 'ዝርዝር መግለጫ',
    'Real Address': 'ትክክለኛ አድራሻ',
    'Email': 'ኢሜይል',
    'My Properties': 'ንብረቶቼ',
    'Discover Homes': 'ቤቶችን ያግኙ',
    'Renter Console': 'የተከራይ ዳሽቦርድ',
    'Find your perfect home': 'ተስማሚ የኪራይ ቤት ያግኙ',
    'Start chatting with renters to see messages here': 'ከእጩ ተከራዮች ጋር ውይይት ይጀምሩ እና መልዕክቶችን እዚህ ያያሉ',
    'Favorites': 'ተወዳጆች',
    'Help & Support': 'እገዛ እና ድጋፍ',
    'Private real-time chat with owners.': 'ከባለቤቶች ጋር የግል እና የቀጥታ ውይይት።',
    'Open Inbox': 'የመልዕክት ሳጥን ክፈት',
    'Choose a chat from the list to start messaging with renters': 'ከእጩ ተከራዮች ጋር ውይይት ለመጀመር ከዝርዝሩ ውስጥ ይምረጡ',
    'No favorites yet.': 'እስካሁን ምንም ተወዳጅ የለም።',
    'Report an Issue or Share Feedback': 'ችግር ያሳውቁ ወይም ግብረ-መልስ ያጋሩ',
    'Having problems with the platform? Want to share your experience or suggestions? We\'re here to help.': 'በመድረኩ ላይ ችግር አጋጥሞዎታል? አስተያየት ማጋራት ይፈልጋሉ? ለመርዳት እዚህ ነን።',
    'Submit Complaint or Feedback': 'ቅሬታ ወይም ግብረ-መልስ ያስገቡ',
    'Update your account details and personalize your renter experience.': 'የመለያዎን ዝርዝር አዘምኑ እና ተሞክሮዎን ያበጁ።',
    'Account Settings': 'የመለያ ቅንብሮች',
    'Owner Overview': 'የባለቤት አጠቃላይ እይታ',
    'Monitor your rental portfolio performance at a glance': 'የንብረቶችዎን አፈጻጸም በአንድ እይታ ይከታተሉ',
    'Track your property listings, monitor approval status, and analyze viewer engagement. This dashboard provides real-time insights into your rental business performance, helping you make informed decisions about property management and marketing strategies.': 'የንብረት ማስታወቂያዎችዎን ይከታተሉ እና የማፅደቅ ሁኔታን ይመልከቱ። ይህ ዳሽቦርድ ስለ ስራዎ የቀጥታ ግንዛቤ ይሰጥዎታል።',
    'Total': 'ጠቅላላ',
    'Properties Listed': 'የተዘረዘሩ ንብረቶች',
    'Live': 'ንቁ',
    'renter': 'ተከራይ',
    'admin': 'አስተዳዳሪ',
    'Active Listings': 'ንቁ ማስታወቂያዎች',
    'Review': 'በግምገማ ላይ',
    'Pending Approval': 'ማፅደቅ በመጠባበቅ ላይ',
    'Views': 'እይታዎች',
    'Total Views': 'ጠቅላላ እይታዎች',
    'Property Distribution': 'የንብረት ስርጭት',
    'No data': 'መረጃ የለም',
    'Active': 'ንቁ',
    'Other': 'ሌሎች',
    'Submit your property and complete listing fee payment.': 'ንብረትዎን ያስገቡ እና የማስታወቂያ ክፍያውን ያጠናቁ።',
    'No listings yet.': 'እስካሁን ማስታወቂያ የለም።',
    'views': 'እይታ',
    'Mark as Rented': 'እንደተከራየ ምልክት ያድርጉ',
    'Deleting...': 'በመሰረዝ ላይ...',
    'Repost': 'እንደገና ለጥፍ',
    'Repost (payment required)': 'እንደገና ለጥፍ (ክፍያ ያስፈልጋል)',
    'Repost (no extra payment)': 'እንደገና ለጥፍ (ተጨማሪ ክፍያ የለም)',
    'Update, Repost & Pay': 'አዘምን፣ እንደገና ለጥፍ እና ክፈል',
    'Update & Submit for Approval': 'አዘምን እና ለማፅደቅ አስገባ',
    'Having issues with listings or payments? Send feedback or a complaint.': 'በማስታወቂያ ወይም በክፍያ ችግር አለ? ግብረ-መልስ ወይም ቅሬታ ይላኩ።',
    'Get Support': 'ድጋፍ ያግኙ',
    'Manage your owner account, security, and dashboard appearance.': 'የባለቤት መለያዎን፣ ደህንነትን እና የዳሽቦርድ መልክን ያስተዳድሩ።',
    'Light Mode': 'የብርሃን ሁኔታ',
    'Dark Mode': 'የጨለማ ሁኔታ',
    'Owner Account Settings': 'የባለቤት መለያ ቅንብሮች',
    'Your full name': 'ሙሉ ስምዎ',
    'Change Password': 'የይለፍ ቃል ቀይር',
    'Current password': 'አሁን ያለው የይለፍ ቃል',
    'New password': 'አዲስ የይለፍ ቃል',
    'Confirm new password': 'አዲሱን የይለፍ ቃል ያረጋግጡ',
    'Comprehensive tools for managing listings, payments, and renter relationships.': 'ማስታወቂያዎችን እና ክፍያዎችን ለማስተዳደር የተሟላ መሳሪያዎች።',
    'Welcome to Your Owner Dashboard': 'ወደ የባለቤት ዳሽቦርድዎ እንኳን ደህና መጡ',
    'This professional workspace empowers you to efficiently manage your rental portfolio. From listing properties and tracking performance to communicating with potential renters, our platform provides all the essential tools you need to succeed in the rental market.': 'ይህ የሙያ የስራ ቦታ የኪራይ ንብረቶችዎን በብቃት ለማስተዳደር ያግዝዎታል።',
    '📊 Overview': '📊 አጠቃላይ እይታ',
    'Monitor your portfolio\'s performance at a glance with comprehensive metrics including total listings, active properties, pending approvals, and cumulative view counts. These insights help you assess market interest and optimize your listing strategy for maximum visibility and occupancy.': 'የንብረቶችዎን አፈጻጸም በፍጥነት ይከታተሉ። ይህ መረጃ የማስታወቂያ ስትራቴጂዎን ለማሻሻል ይረዳል።',
    '➕ Post a New Listing': '➕ አዲስ ማስታወቂያ ያቅርቡ',
    'Create compelling property listings with detailed descriptions, high-quality photographs, and accurate pricing. After submission, complete the secure payment process to activate admin review. Once approved, your listing becomes visible to our network of qualified renters.': 'ጥሩ የቤት ማስታወቂያ ይፍጠሩ። ክፍያውን ሲያጠናቅቁ በአስተዳዳሪ ተገምግሞ ለተከራዮች ይታያል።',
    '🏠 My Properties': '🏠 ንብረቶቼ',
    'Manage your entire property portfolio from this centralized hub. Update listing status as properties become rented, remove eligible listings, or repost previously rented/rejected properties with refreshed information to maintain an active and appealing presence.': 'ሁሉንም የንብረት ዝርዝርዎን ያስተዳድሩ። ቤቶች ሲከራዩ ሁኔታቸውን ያዘምኑ።',
    'Build trust and accelerate rental decisions through prompt, professional communication with prospective renters. Our real-time messaging system enables you to address inquiries quickly, provide additional information, and establish positive relationships that can convert interest into signed agreements.': 'ከእጩ ተከራዮች ጋር ፈጣን ግንኙነት በማድረግ እምነት ይገንቡ።',
    'Maintain your professional profile by updating contact information, strengthening account security with password changes, and customizing your interface with dark mode preferences for comfortable extended use during any time of day.': 'የመገኛ መረጃዎን በማዘመን እና የይለፍ ቃል በመቀየር ደህንነትዎን ይጠብቁ።',
    'Receive expert assistance for listing management, payment processing, approval procedures, or technical challenges. Our dedicated support team is committed to helping you resolve issues quickly and maximize your platform success.': 'ለማስታወቂያ አስተዳደር ወይም ቴክኒካዊ ችግር የባለሙያ ድጋፍ ያግኙ።',
    '💡 Best Practices for Success': '💡 ለስኬት ምርጥ ልምዶች',
    'Optimize your rental performance by:': 'የኪራይ አፈጻጸምዎን ለማሻሻል:',
    '1) Maintaining accurate, detailed listing information': '1) ትክክለኛ እና ዝርዝር መረጃ ይያዙ',
    '2) Uploading high-quality, recent photographs': '2) ጥራት ያላቸው ፎቶዎችን ይጫኑ',
    '3) Responding promptly to renter inquiries': '3) ለተከራዮች ጥያቄዎች በፍጥነት ምላሽ ይስጡ',
    '4) Regularly reviewing performance metrics to refine your strategy and improve occupancy rates.': '4) ስትራቴጂዎን ለማሻሻል አፈጻጸምዎን በተደጋጋሚ ይገምግሙ።',
  },
};

const wordMapAm = {
  Search: 'ፈልግ',
  Properties: 'ቤቶች',
  Property: 'ቤት',
  Message: 'መልዕክት',
  Messages: 'መልዕክቶች',
  Notification: 'ማሳወቂያ',
  Notifications: 'ማሳወቂያዎች',
  Settings: 'ቅንብሮች',
  Dashboard: 'ዳሽቦርድ',
  Admin: 'አስተዳዳሪ',
  Owner: 'ባለቤት',
  Renter: 'ተከራይ',
  Submit: 'አስገባ',
  Update: 'አዘምን',
  Delete: 'ሰርዝ',
  Save: 'አስቀምጥ',
  Loading: 'በመጫን ላይ',
  Error: 'ስህተት',
  Success: 'ተሳክቷል',
  Contact: 'ያግኙን',
  Support: 'ድጋፍ',
  Terms: 'ውሎች',
  Privacy: 'ግላዊነት',
  Cookies: 'ኩኪዎች',
  City: 'ከተማ',
  Status: 'ሁኔታ',
  Type: 'አይነት',
  Priority: 'ቅድሚያ',
  Complaint: 'ቅሬታ',
  Feedback: 'ግብረመልስ',
  Suggestion: 'ጥቆማ',
  Filter: 'ማጣሪያ',
  Filters: 'ማጣሪያዎች',
  Overview: 'አጠቃላይ እይታ',
  Transactions: 'ግብይቶች',
  Users: 'ተጠቃሚዎች',
  Previous: 'ቀዳሚ',
  Next: 'ቀጣይ',
  Modern: 'ዘመናዊ',
  Way: 'መንገድ',
  Find: 'አግኝ',
  Home: 'ቤት',
  Works: 'እንዴት ይሰራል',
  Choose: 'ይምረጡ',
  Direct: 'ቀጥተኛ',
  Chat: 'ውይይት',
  Secure: 'አስተማማኝ',
  Payments: 'ክፍያ',
  Wishlist: 'ተወዳጆች',
  Live: 'ንቁ',
  Updates: 'ዝመናዎች',
  Smart: 'ብልህ',
  Frequently: 'ተደጋግመው',
  Asked: 'የሚጠየቁ',
  Questions: 'ጥያቄዎች',
  Ready: 'ዝግጁ',
  Transform: 'ለመለወጥ',
  Rental: 'ኪራይ',
  Experience: 'ተሞክሮ',
};

const regexReplacementsAm = [
  [/^Found\s+(\d+)\s+Properties$/i, 'የተገኙ ቤቶች: $1'],
  [/^(\d+)\s+unread$/i, '$1 ያልተነበቡ'],
  [/^Case\s+#(\d+)$/i, 'መዝገብ #$1'],
  [/^Step\s+(\d+)$/i, 'ደረጃ $1'],
  [/^Photo\s+(\d+)$/i, 'ፎቶ $1'],
  [/^(\d+)m ago$/i, 'ከ$1 ደቂቃ በፊት'],
  [/^(\d+)h ago$/i, 'ከ$1 ሰዓት በፊት'],
  [/^(\d+)d ago$/i, 'ከ$1 ቀን በፊት'],
  [/^Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)\s+results$/i, '$3 ውጤቶች ውስጥ ከ$1 እስከ $2 በማሳየት ላይ'],
  [/ETB\/month/gi, 'ብር/ወር'],
  [/ETB\/day/gi, 'ብር/ቀን'],
  [/No\s+Credit\s+Card\s+Required/gi, 'የባንክ ካርድ አያስፈልግም'],
  [/24\/7\s+Support/gi, 'የ24/7 ድጋፍ'],
  [/5-Minute Setup/gi, 'ባለ 5 ደቂቃ ዝግጅት'],
];

const I18nContext = createContext(null);

function getInitialLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'am') return saved;
  return 'en';
}

function translateText(input, lang) {
  if (lang !== 'am' || !input) return input;
  const map = dictionary.am;
  const text = String(input);

  // First try exact phrase matching
  if (map[text]) return map[text];
  const trimmed = text.trim();
  if (map[trimmed]) {
    return text.replace(trimmed, map[trimmed]);
  }

  let out = text;
  
  // Apply regex replacements first
  for (const [pattern, replacement] of regexReplacementsAm) {
    out = out.replace(pattern, replacement);
  }

  // Apply phrase-level replacements (sorted by length to prioritize longer phrases)
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (!key || !out.includes(key)) continue;
    out = out.split(key).join(map[key]);
  }

  // Only apply word-by-word replacements if no phrase replacements were found
  // This prevents mixed language strings
  const hasPhraseReplacement = keys.some(key => key && text.includes(key) && map[key]);
  if (!hasPhraseReplacement) {
    for (const [word, replacement] of Object.entries(wordMapAm)) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'g');
      out = out.replace(re, replacement);
    }
  }

  return out;
}

function shouldSkipNode(parent) {
  if (!parent) return true;
  const tag = parent.nodeName;
  return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'PRE';
}

function applyTranslation(root, lang, originalTextsRef) {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const parent = node.parentElement;
    if (shouldSkipNode(parent) || parent?.closest('[data-no-translate="true"]')) continue;
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) continue;
    if (!originalTextsRef.current.has(node)) originalTextsRef.current.set(node, raw);
    const original = originalTextsRef.current.get(node);
    node.nodeValue = lang === 'am' ? translateText(original, lang) : original;
  }

  const attrs = ['placeholder', 'title', 'aria-label'];
  const elements = root.querySelectorAll('*');
  for (const el of elements) {
    if (el.closest('[data-no-translate="true"]')) continue;
    for (const attr of attrs) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      const key = `data-i18n-orig-${attr}`;
      if (!el.getAttribute(key)) el.setAttribute(key, value);
      const original = el.getAttribute(key) || value;
      el.setAttribute(attr, lang === 'am' ? translateText(original, lang) : original);
    }
  }
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);
  const originalTextsRef = useRef(new WeakMap());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'am' ? 'am' : 'en';
  }, [lang]);

  useEffect(() => {
    applyTranslation(document.body, lang, originalTextsRef);
    const observer = new MutationObserver(() => {
      applyTranslation(document.body, lang, originalTextsRef);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (text) => translateText(text, lang),
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return ctx;
}

export function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} data-no-translate="true">
      <label htmlFor="language-switcher" className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        {t('Language')}
      </label>
      <select
        id="language-switcher"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 cursor-pointer hover:border-gray-400 dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/25"
      >
        <option value="en" className="text-gray-900 font-medium">English</option>
        <option value="am" className="text-gray-900 font-medium">አማርኛ</option>
      </select>
    </div>
  );
}