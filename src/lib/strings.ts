/**
 * Centralized static UI copy.
 *
 * Single source of truth for user-facing static text across the site. To change
 * a piece of copy, edit the value here — do NOT hardcode strings in components.
 *
 * Key convention: PAGENAME_COMPONENT_STRING (SCREAMING_SNAKE_CASE)
 *   e.g. HOMEPAGE_CONTACTREALTOR_TITLE, HOMEPAGE_CONTACTREALTOR_BODY
 *
 * Notes:
 *  - Only static, human-authored copy lives here. Dynamic/interpolated values
 *    (prices, names, counts) stay in components; where a string needs a value
 *    interpolated, a {placeholder} token is used.
 *  - Grouped by screen with section comments for readability. Keys remain flat.
 */
export const STRINGS = {
  // ─── Global · Navbar ────────────────────────────────────────────────────────
  NAV_LINK_HOME: 'Home',
  NAV_LINK_BUY: 'Buy',
  NAV_LINK_SELL: 'Sell',
  NAV_LINK_NEIGHBOURHOODS: 'Neighbourhoods',
  NAV_LINK_REALTORHUB: 'Realtor Hub',
  NAV_LINK_DASHBOARD: 'Dashboard',
  NAV_CTA_SIGNIN: 'Sign In',
  NAV_CTA_GETSTARTED: 'Get Started',
  NAV_MENU_TOGGLE_ARIA: 'Toggle menu',

  // ─── Global · Footer ────────────────────────────────────────────────────────
  FOOTER_TAGLINE:
    "Beyond data. The Vicinus standard — intelligent curation of Canada's finest properties.",
  FOOTER_EXPLORE_HEADING: 'Explore',
  FOOTER_EXPLORE_BUY: 'Buy',
  FOOTER_EXPLORE_SELL: 'Sell',
  FOOTER_EXPLORE_NEIGHBOURHOODS: 'Neighbourhoods',
  FOOTER_EXPLORE_REALTORHUB: 'Realtor Hub',
  FOOTER_LEGAL_HEADING: 'Legal',
  FOOTER_LEGAL_PRIVACY: 'Privacy Policy',
  FOOTER_CREA_ATTRIBUTION:
    'Listing data is provided by the Canadian Real Estate Association (CREA) Data Distribution Facility (DDF®). REALTOR®, MLS®, and the associated logos are trademarks owned by CREA and identify real estate professionals who are members of CREA.',
  FOOTER_COPYRIGHT: '© {year} Vicinus. All rights reserved.',

  // ─── Homepage · Metadata ────────────────────────────────────────────────────
  HOMEPAGE_META_TITLE: 'Vicinus | Luxury Canadian Real Estate',
  HOMEPAGE_META_DESCRIPTION:
    "Beyond data. The Vicinus standard — intelligent curation of Canada's finest properties.",

  // ─── Homepage · Hero ────────────────────────────────────────────────────────
  // Rendered with "You" as an accent span between the two fragments.
  HOMEPAGE_HERO_TITLE_LEAD: 'Bringing',
  HOMEPAGE_HERO_TITLE_ACCENT: 'You',
  HOMEPAGE_HERO_TITLE_TRAIL: 'Closer to Home.',

  // ─── Homepage · Hero search bar ─────────────────────────────────────────────
  HOMEPAGE_HEROSEARCH_LABEL: 'Find your home',
  HOMEPAGE_HEROSEARCH_INPUT_ARIA: 'Search by neighbourhood, city, or postal code',
  HOMEPAGE_HEROSEARCH_INPUT_PLACEHOLDER: 'Neighbourhood, City, or Postal Code',
  HOMEPAGE_HEROSEARCH_PRICE_ARIA: 'Price range',
  HOMEPAGE_HEROSEARCH_PRICE_DEFAULT: 'Price Range',
  HOMEPAGE_HEROSEARCH_PRICE_UNDER_1M: 'Under $1M',
  HOMEPAGE_HEROSEARCH_PRICE_1M_2M: '$1M – $2M',
  HOMEPAGE_HEROSEARCH_PRICE_2M_5M: '$2M – $5M',
  HOMEPAGE_HEROSEARCH_PRICE_5M_PLUS: '$5M+',
  HOMEPAGE_HEROSEARCH_SUBMIT: 'Search',

  // ─── Homepage · Property card ───────────────────────────────────────────────
  HOMEPAGE_PROPERTYCARD_BEDS: 'Beds',
  HOMEPAGE_PROPERTYCARD_BATHS: 'Baths',
  HOMEPAGE_PROPERTYCARD_SQFT: 'sqft',

  // ─── Homepage · Curated Highlights ──────────────────────────────────────────
  HOMEPAGE_HIGHLIGHTS_EYEBROW: 'Hand-picked',
  HOMEPAGE_HIGHLIGHTS_TITLE: 'Swipe. Connect. Own',
  HOMEPAGE_HIGHLIGHTS_SUBTITLE: 'Real estate, centred around you.',
  HOMEPAGE_HIGHLIGHTS_VIEWALL: 'View all',

  // ─── Homepage · Contextual Living (cities) ──────────────────────────────────
  HOMEPAGE_CITIES_TITLE: 'Understand the vicinity',
  HOMEPAGE_CITIES_BODY:
    'A new home means new streets, new neighbours, new cafes — a whole new way of living. Discover yours.',
  HOMEPAGE_CITIES_ALLLINK: 'All Neighbourhoods',
  HOMEPAGE_CITIES_BADGE_SINGULAR: 'Neighbourhood',
  HOMEPAGE_CITIES_BADGE_PLURAL: 'Neighbourhoods',

  // ─── Homepage · Expert / Contact-a-realtor CTA ──────────────────────────────
  HOMEPAGE_CONTACTREALTOR_TITLE: 'Expertise for the Discerning Buyer.',
  HOMEPAGE_CONTACTREALTOR_BODY:
    "Our agents aren't just salespeople. They are local curators and investment analysts who understand the nuances of architectural value.",
  HOMEPAGE_CONTACTREALTOR_BUTTON: 'Contact a Vicinus Advisor',

  // ─── Sell · Intro / valuation hero ──────────────────────────────────────────
  SELL_INTRO_EYEBROW: 'Curated Intelligent Valuation',
  SELL_INTRO_TITLE_LEAD: 'What is your',
  SELL_INTRO_TITLE_ACCENT: 'property worth?',
  SELL_INTRO_BODY:
    'Move beyond automated estimates. Access editorial-grade market intelligence, tailored to your home and your goals.',
  SELL_INTRO_ADDRESS_PLACEHOLDER: 'Enter your address (e.g., 759 Winona Ave)',
  SELL_INTRO_SUBMIT: 'Explore Value',
  SELL_INTRO_PULSE_LABEL: 'Live Market Pulse',
  SELL_INTRO_PULSE_CAPTION: 'Median Price · North Van',

  // ─── Realtor Hub · Hero ─────────────────────────────────────────────────────
  REALTORHUB_HERO_BADGE: 'Coming Soon · Early Access',
  REALTORHUB_HERO_TITLE: 'Vicinus is coming for real estate professionals.',
  REALTORHUB_HERO_BODY:
    "Consumer portals haven't evolved in a decade. Vicinus is the new intelligence layer built to give modern REALTORS® a distinct edge — before your competitors get there first.",
  REALTORHUB_HERO_CTA: 'Get Early Access',
  REALTORHUB_HERO_PREVIEW_HEAT_LABEL: 'Predictive Heat',
  REALTORHUB_HERO_PREVIEW_HEAT_VALUE: '+24% Intent',
  REALTORHUB_HERO_PREVIEW_WELCOME: 'Welcome back, Sarah',
  REALTORHUB_HERO_PREVIEW_SUBTITLE: "Here's your market pulse for Q2",
  REALTORHUB_HERO_PREVIEW_STAT_INTENSITY: 'Market Intensity',
  REALTORHUB_HERO_PREVIEW_STAT_MEDIAN: 'Median List Price',
  REALTORHUB_HERO_PREVIEW_STAT_DAYS: 'Days / Listing',
  REALTORHUB_HERO_PREVIEW_HEATMAP_LABEL: 'Neighbourhood Health',

  // ─── Realtor Hub · Features ─────────────────────────────────────────────────
  REALTORHUB_FEATURES_TITLE: 'Designed for those who curate the market.',
  REALTORHUB_FEATURES_BODY:
    'Stop relying on public tools. Use the intelligence engine built for the professional workflow.',
  REALTORHUB_FEATURES_1_TITLE: 'Augmented Neighbourhood Data',
  REALTORHUB_FEATURES_1_BODY:
    'See more than the listing. Get enriched, hyperlocal data on every neighbourhood you work — the context your clients are already asking for.',
  REALTORHUB_FEATURES_2_TITLE: 'Neighbourhood Bidding',
  REALTORHUB_FEATURES_2_BODY:
    'Know where demand is building before it shows up in the numbers. Access aggregate buyer intent by area, so you can prioritize where to spend your time.',
  REALTORHUB_FEATURES_3_TITLE: 'Short-Form Listing Content',
  REALTORHUB_FEATURES_3_BODY:
    'Bring your listings to life. Add short-form video and content directly to your listings on Vicinus — no extra platform, no extra login.',

  // ─── Realtor Hub · Founding Member band ─────────────────────────────────────
  REALTORHUB_FOUNDING_TITLE: 'Join as a Founding Member.',
  REALTORHUB_FOUNDING_BODY:
    "We're opening early access to a limited group of REALTORS® before public launch. Founding members get priority onboarding and exclusive pricing when Vicinus goes live.",
  REALTORHUB_FOUNDING_CTA: 'Limited Access',

  // ─── Realtor Hub · Waitlist form ────────────────────────────────────────────
  REALTORHUB_WAITLIST_NAME_LABEL: 'Full Name',
  REALTORHUB_WAITLIST_NAME_PLACEHOLDER: 'John Doe',
  REALTORHUB_WAITLIST_EMAIL_LABEL: 'Professional Email',
  REALTORHUB_WAITLIST_EMAIL_PLACEHOLDER: 'john@brokerage.com',
  REALTORHUB_WAITLIST_BROKERAGE_LABEL: 'Brokerage',
  REALTORHUB_WAITLIST_BROKERAGE_PLACEHOLDER: 'Luxury Real Estate Co.',
  REALTORHUB_WAITLIST_CITY_LABEL: 'City / Market',
  REALTORHUB_WAITLIST_CITY_PLACEHOLDER: 'Vancouver, Burnaby, Surrey…',
  REALTORHUB_WAITLIST_SUBMIT: 'Join the Waitlist',
  REALTORHUB_WAITLIST_SUBMITTING: 'Joining…',
  REALTORHUB_WAITLIST_ERROR_NAME: 'Please enter your full name.',
  REALTORHUB_WAITLIST_ERROR_EMAIL: 'Please enter a valid email address.',
  REALTORHUB_WAITLIST_ERROR_GENERIC: 'Something went wrong. Please try again.',
  REALTORHUB_WAITLIST_SUCCESS_TITLE: "You're on the list.",
  REALTORHUB_WAITLIST_SUCCESS_BODY:
    "Thanks for joining. We'll be in touch as founding-member spots open up.",

  // ─── Auth · Sign In ─────────────────────────────────────────────────────────
  SIGNIN_TAGLINE_TITLE: 'Curating space for the modern visionary.',
  SIGNIN_TAGLINE_BODY:
    'Enter a world where property data meets architectural intelligence. Vicinus provides a sophisticated platform for elite agents and discerning buyers.',
  SIGNIN_COPYRIGHT: '© {year} Curator Group',
  SIGNIN_PRIVACY: 'Privacy Policy',
  SIGNIN_BACK_HOME: '← Back to home',

  // ─── Auth · Sign Up ─────────────────────────────────────────────────────────
  SIGNUP_TAGLINE: 'The Intelligent Curator',
  SIGNUP_BACK_HOME: '← Back to home',

  // ─── Onboarding · Shared ────────────────────────────────────────────────────
  ONBOARDING_STEP_INDICATOR: 'Step {step} of {total}',
  ONBOARDING_SAVE_EXIT: 'Save & Exit',
  ONBOARDING_BACK: 'Back',
  ONBOARDING_PREVIOUS_STEP: 'Previous Step',
  ONBOARDING_SIDEBAR_TITLE: 'An intelligent curator for your real estate journey.',
  ONBOARDING_SIDEBAR_BODY:
    'We believe the home search should feel like an editorial experience — refined, intentional, and effortless.',
  ONBOARDING_SIDEBAR_TAG: 'The Intelligent Curator',

  // ─── Onboarding · Step 1: The Basics ────────────────────────────────────────
  ONBOARDING_STEP1_LABEL: 'The Basics',
  ONBOARDING_STEP1_TITLE:
    "Let's customize your experience. What are your real estate goals?",
  ONBOARDING_STEP1_Q1: 'Are you looking to buy, sell, rent, or just exploring the market?',
  ONBOARDING_STEP1_GOAL_BUY: 'Buy',
  ONBOARDING_STEP1_GOAL_SELL: 'Sell',
  ONBOARDING_STEP1_GOAL_RENT: 'Rent',
  ONBOARDING_STEP1_GOAL_EXPLORING: 'Just Exploring',
  ONBOARDING_STEP1_Q2: 'How soon are you looking to make a move?',
  ONBOARDING_STEP1_TIMELINE_3MO: 'Within 3 months',
  ONBOARDING_STEP1_TIMELINE_3_6MO: '3–6 months',
  ONBOARDING_STEP1_TIMELINE_6_12MO: '6–12 months',
  ONBOARDING_STEP1_TIMELINE_RESEARCHING: 'Just researching',
  ONBOARDING_STEP1_SKIP: 'Skip for now',
  ONBOARDING_STEP1_NEXT: 'Next: Location & Lifestyle',

  // ─── Onboarding · Step 2: Location & Lifestyle ──────────────────────────────
  ONBOARDING_STEP2_TITLE: 'Tell us about your ideal vibe.',
  ONBOARDING_STEP2_SUBTITLE:
    "Your location defines your lifestyle. Let's narrow down the patches of the city that feel like home to you.",
  ONBOARDING_STEP2_Q1: 'Which neighbourhoods or areas are you most interested in?',
  ONBOARDING_STEP2_ADD_AREA_PLACEHOLDER: '+ Add Area',
  ONBOARDING_STEP2_Q2: 'Are you open to nearby areas if the right property came up?',
  ONBOARDING_STEP2_NEARBY_YES_TITLE: 'Yes, show me options',
  ONBOARDING_STEP2_NEARBY_YES_SUBTITLE:
    'Our curator will suggest high-value matches in adjacent zones.',
  ONBOARDING_STEP2_NEARBY_NO_TITLE: "No, I'm set on these areas",
  ONBOARDING_STEP2_NEARBY_NO_SUBTITLE:
    'Strict adherence to your selected boundaries only.',
  ONBOARDING_STEP2_Q3: 'What matters most to you?',
  ONBOARDING_STEP2_Q3_HINT: '(Pick up to {max})',
  ONBOARDING_STEP2_LIFESTYLE_SCHOOLS_LABEL: 'Top Schools',
  ONBOARDING_STEP2_LIFESTYLE_SCHOOLS_SUBTITLE: 'Excellence in education proximity.',
  ONBOARDING_STEP2_LIFESTYLE_COMMUTE_LABEL: 'Easy Commute',
  ONBOARDING_STEP2_LIFESTYLE_COMMUTE_SUBTITLE: 'Quick highway & road access.',
  ONBOARDING_STEP2_LIFESTYLE_TRANSIT_LABEL: 'Near Transit',
  ONBOARDING_STEP2_LIFESTYLE_TRANSIT_SUBTITLE: 'Skytrain & bus accessibility.',
  ONBOARDING_STEP2_LIFESTYLE_PARKS_LABEL: 'Parks & Outdoors',
  ONBOARDING_STEP2_LIFESTYLE_PARKS_SUBTITLE: 'Proximity to green spaces.',
  ONBOARDING_STEP2_LIFESTYLE_DINING_LABEL: 'Dining & Nightlife',
  ONBOARDING_STEP2_LIFESTYLE_DINING_SUBTITLE: 'Vibrant food scene & bars.',
  ONBOARDING_STEP2_LIFESTYLE_WALKABILITY_LABEL: 'High Walkability',
  ONBOARDING_STEP2_LIFESTYLE_WALKABILITY_SUBTITLE: 'Daily errands on foot.',
  ONBOARDING_STEP2_LIFESTYLE_QUIET_LABEL: 'Quiet & Peaceful',
  ONBOARDING_STEP2_LIFESTYLE_QUIET_SUBTITLE: 'Minimal traffic and noise.',
  ONBOARDING_STEP2_LIFESTYLE_MORE_LABEL: 'More Coming Soon',
  ONBOARDING_STEP2_NEXT: 'Next: Property Specs',

  // ─── Onboarding · Step 3: Property Specs ────────────────────────────────────
  ONBOARDING_STEP3_TITLE: 'What does your dream home look like?',
  ONBOARDING_STEP3_HOMETYPE_Q: 'What type of home are you looking for?',
  ONBOARDING_STEP3_HOMETYPE_CONDO: 'Condo',
  ONBOARDING_STEP3_HOMETYPE_TOWNHOUSE: 'Townhouse',
  ONBOARDING_STEP3_HOMETYPE_DETACHED: 'Detached',
  ONBOARDING_STEP3_HOMETYPE_PRESALE: 'Presale',
  ONBOARDING_STEP3_HOMETYPE_ANY: 'Open to all',
  ONBOARDING_STEP3_BUDGET_Q: "What's your target budget range?",
  ONBOARDING_STEP3_BUDGET_UNDER_600K: 'Under $600K',
  ONBOARDING_STEP3_BUDGET_600K_1M: '$600K–$1M',
  ONBOARDING_STEP3_BUDGET_1M_2M: '$1M–$2M',
  ONBOARDING_STEP3_BUDGET_2M_PLUS: '$2M+',
  ONBOARDING_STEP3_BEDROOMS_Q: 'How many bedrooms?',
  ONBOARDING_STEP3_NEXT: 'Next: Buyer Readiness',

  // ─── Onboarding · Step 4: Buyer Readiness ───────────────────────────────────
  ONBOARDING_STEP4_EYEBROW: 'Buyer Readiness',
  ONBOARDING_STEP4_TITLE: 'Help us match you with the right opportunities.',
  ONBOARDING_STEP4_MORTGAGE_Q: 'Have you been pre-approved for a mortgage?',
  ONBOARDING_STEP4_MORTGAGE_APPROVED: 'Yes, all set',
  ONBOARDING_STEP4_MORTGAGE_IN_PROGRESS: 'In progress',
  ONBOARDING_STEP4_MORTGAGE_NOT_YET: 'No, not yet',
  ONBOARDING_STEP4_MORTGAGE_CASH: 'Paying cash 💰',
  ONBOARDING_STEP4_REALTOR_Q: 'Are you currently working with a REALTOR®?',
  ONBOARDING_STEP4_REALTOR_YES: 'Yes',
  ONBOARDING_STEP4_REALTOR_NO: 'No',
  ONBOARDING_STEP4_REALTOR_OPEN: 'Open to connecting with the right one',
  ONBOARDING_STEP4_NEXT: 'Next: Final Step',

  // ─── Onboarding · Step 5: Complete ──────────────────────────────────────────
  ONBOARDING_STEP5_TITLE: "You're all set.",
  ONBOARDING_STEP5_BODY:
    "Your curator profile is ready. We'll use your preferences to surface the listings that actually match your vision.",
  ONBOARDING_STEP5_CTA: 'Go to my Dashboard',
  ONBOARDING_STEP5_SAVING: 'Saving…',

  // ─── Dashboard · Metadata ───────────────────────────────────────────────────
  DASHBOARD_META_TITLE: 'My Dashboard',
  DASHBOARD_META_DESCRIPTION:
    'Your saved properties, recent visits, and curated recommendations.',

  // ─── Dashboard · Welcome banner ─────────────────────────────────────────────
  DASHBOARD_WELCOME_TITLE: 'Welcome back, {firstName}.',
  DASHBOARD_WELCOME_FALLBACK_NAME: 'there',
  // Honest fallback line, shown only when the IQ Brief is unavailable (fetch
  // failed). Never asserts a fabricated "new updates" count (closes JUL21FIX-11).
  DASHBOARD_WELCOME_FALLBACK_SAVED: 'Your curated portfolio holds {count} {noun}. Explore more in {cities}.',
  DASHBOARD_WELCOME_FALLBACK_EMPTY: 'Start your portfolio — explore homes in {cities}.',
  DASHBOARD_WELCOME_PROPERTY_ONE: 'property',
  DASHBOARD_WELCOME_PROPERTY_MANY: 'properties',
  DASHBOARD_NOFEATURED: 'No featured property yet — save a listing to get started.',

  // ─── Dashboard · Vicinus IQ Brief (BRIEF-09…12) ─────────────────────────────
  DASHBOARD_BRIEF_EYEBROW: 'Vicinus IQ Brief',
  DASHBOARD_BRIEF_REGION_LABEL: 'Vicinus IQ Brief',
  DASHBOARD_BRIEF_LOADING_ARIA: 'Preparing your brief',

  // ─── Dashboard · Recent searches ────────────────────────────────────────────
  DASHBOARD_RECENTSEARCHES_HEADING: 'Recent Searches',
  DASHBOARD_RECENTSEARCHES_EMPTY_PREFIX: 'No saved searches yet —',
  DASHBOARD_RECENTSEARCHES_EMPTY_LINK: 'start exploring',
  DASHBOARD_RECENTSEARCHES_UNNAMED: 'Unnamed Search',

  // ─── Dashboard · Featured property ──────────────────────────────────────────
  DASHBOARD_FEATURED_BADGE: 'Next Open House',
  DASHBOARD_FEATURED_ADD_CALENDAR: 'Add to Calendar',

  // ─── Dashboard · Notifications panel ────────────────────────────────────────
  DASHBOARD_NOTIFICATIONS_TITLE: 'Notifications',
  DASHBOARD_NOTIFICATIONS_TAB_ALL: 'All',
  DASHBOARD_NOTIFICATIONS_TAB_ALERTS: 'Alerts',
  DASHBOARD_NOTIFICATIONS_TAB_MESSAGES: 'Messages',
  DASHBOARD_NOTIFICATIONS_TAB_SCHEDULE: 'Schedule',
  DASHBOARD_NOTIFICATIONS_OPENHOUSE_LABEL: 'Upcoming Open House',
  DASHBOARD_NOTIFICATIONS_ADD_CALENDAR: 'Add to Calendar',
  DASHBOARD_NOTIFICATIONS_REPLY: '↩ Reply',
  DASHBOARD_NOTIFICATIONS_EMPTY_SCHEDULE: 'No upcoming open houses.',
  DASHBOARD_NOTIFICATIONS_EMPTY_ALERTS: 'No alerts yet.',
  DASHBOARD_NOTIFICATIONS_EMPTY_MESSAGES: 'No messages yet.',
  DASHBOARD_NOTIFICATIONS_EMPTY_ALL: 'No notifications yet.',
  DASHBOARD_NOTIFICATIONS_COUNT_ONE: '{count} notification',
  DASHBOARD_NOTIFICATIONS_COUNT_MANY: '{count} notifications',
  DASHBOARD_NOTIFICATIONS_MARK_READ: 'Mark all read →',

  // ─── Dashboard · Saved properties ───────────────────────────────────────────
  DASHBOARD_SAVED_TITLE: 'Saved Properties',
  DASHBOARD_SAVED_SUBTITLE:
    "Properties you've shortlisted for serious consideration.",
  DASHBOARD_SAVED_SCHEDULE_TOUR: 'Schedule Tour',
  DASHBOARD_SAVED_EMPTY_TITLE: "You haven't saved any properties yet",
  DASHBOARD_SAVED_EMPTY_BODY:
    "Start exploring and save the listings you love — they'll appear here.",
  DASHBOARD_SAVED_EMPTY_CTA: 'Start exploring →',

  // ─── Dashboard · Visited properties ─────────────────────────────────────────
  DASHBOARD_VISITED_TITLE: 'Visited Properties',
  DASHBOARD_VISITED_SUBTITLE: "Homes you've toured in person recently.",
  DASHBOARD_VISITED_ACTION_SHORTLIST: 'Shortlist',
  DASHBOARD_VISITED_ACTION_DOCS: 'Docs',
  DASHBOARD_VISITED_ACTION_OFFER: 'Offer',
  DASHBOARD_VISITED_EMPTY_TITLE: 'No recently visited properties',
  DASHBOARD_VISITED_EMPTY_BODY: 'Properties you tour will appear here.',
  DASHBOARD_VISITED_PRICE_ON_REQUEST: 'Price on request',
  DASHBOARD_VISITED_ADDRESS_UNAVAILABLE: 'Address not available',

  // ─── Dashboard · Editorial curations ────────────────────────────────────────
  DASHBOARD_EDITORIAL_EYEBROW: 'Intelligence Hub',
  DASHBOARD_EDITORIAL_TITLE: 'Editorial Curations',
  DASHBOARD_EDITORIAL_TAB_NEIGHBORHOODS: 'Neighborhoods',
  DASHBOARD_EDITORIAL_TAB_FEEDS: 'Feeds',

  // ─── Dashboard · Vicinus team panel ─────────────────────────────────────────
  DASHBOARD_TEAM_EYEBROW: 'Your Vicinus Team',
  DASHBOARD_TEAM_TITLE: 'Your dedicated agents.',
  DASHBOARD_TEAM_CONNECT: 'Connect',

  // ─── Dashboard · Intelligence panel ─────────────────────────────────────────
  DASHBOARD_INTELLIGENCE_TITLE: 'Intelligence',
  DASHBOARD_INTELLIGENCE_VIEWALL: 'View All Intelligence →',

  // ─── Search · Metadata ──────────────────────────────────────────────────────
  SEARCH_META_TITLE: 'Search Properties',
  SEARCH_META_DESCRIPTION:
    'Search luxury Canadian real estate listings — filter by city, price, bedrooms, and more.',

  // ─── Search · Search bar ────────────────────────────────────────────────────
  SEARCH_SEARCHBAR_PLACEHOLDER: 'Search by neighbourhood, city, or address...',
  SEARCH_SEARCHBAR_PLACEHOLDER_COMPACT: 'Search city, address…',
  SEARCH_SEARCHBAR_ARIA: 'Search location',
  SEARCH_SEARCHBAR_CLEAR_ARIA: 'Clear search',

  // ─── Search · Filter panel ──────────────────────────────────────────────────
  SEARCH_FILTER_BUTTON: 'Filter',
  SEARCH_FILTER_HEADING: 'Filters',
  SEARCH_FILTER_PRICE_RANGE: 'Price range',
  SEARCH_FILTER_MIN: 'Min',
  SEARCH_FILTER_MAX: 'Max',
  SEARCH_FILTER_ANY: 'Any',
  SEARCH_FILTER_BEDS: 'Beds',
  SEARCH_FILTER_BATHS: 'Baths',
  SEARCH_FILTER_EXACT_MATCH: 'Use exact match',
  SEARCH_FILTER_HOME_TYPE: 'Home type',
  SEARCH_FILTER_SIZE: 'Size (sqft)',
  SEARCH_FILTER_ADVANCED_HEADING: 'Advanced filters',
  SEARCH_FILTER_ADVANCED_NOTE:
    'Year built and parking filter live results. Other options below are coming soon.',
  SEARCH_FILTER_YEAR_BUILT: 'Year built',
  SEARCH_FILTER_YEAR_FROM: 'From',
  SEARCH_FILTER_YEAR_TO: 'To',
  SEARCH_FILTER_PARKING: 'Parking spots',
  SEARCH_FILTER_STORIES: 'Stories',
  SEARCH_FILTER_BASEMENT: 'Basement',
  SEARCH_FILTER_YES: 'Yes',
  SEARCH_FILTER_NO: 'No',
  SEARCH_FILTER_LISTING_STATUS: 'Listing status',
  SEARCH_FILTER_DAYS_ON_MARKET: 'Days on market (max)',
  SEARCH_FILTER_HAS_OPEN_HOUSE: 'Has open house',
  SEARCH_FILTER_COMING_SOON: 'Coming soon',
  SEARCH_FILTER_FINANCIAL: 'Financial',
  SEARCH_FILTER_MAX_MONTHLY_PAYMENT: 'Max monthly payment ($)',
  SEARCH_FILTER_MAX_HOA_FEE: 'Max HOA fee ($/month)',
  SEARCH_FILTER_RESET: 'Reset',
  SEARCH_FILTER_SHOW_RESULTS: 'Show results',
  SEARCH_FILTER_SHOW_N_RESULTS: 'Show {count} results',

  // ─── Search · View toggle ───────────────────────────────────────────────────
  SEARCH_VIEWTOGGLE_FEED: 'Feed',
  SEARCH_VIEWTOGGLE_MAP: 'Map',

  // ─── Search · Save search ───────────────────────────────────────────────────
  SEARCH_SAVE_CTA: 'Save Search',
  SEARCH_SAVE_SAVED: 'Saved!',
  SEARCH_SAVE_DIALOG_TITLE: 'Save this search',
  SEARCH_SAVE_DIALOG_BODY: 'Get notified when new listings match your criteria.',
  SEARCH_SAVE_DEFAULT_NAME: 'My saved search',
  SEARCH_SAVE_DEFAULT_NAME_WITH_QUERY: '{query} search',
  SEARCH_SAVE_EMAIL_ALERTS: 'Email alerts for new matches',
  SEARCH_SAVE_LIST_HEADING: 'Saved Searches ({count})',

  // ─── Search · Results list ──────────────────────────────────────────────────
  SEARCH_RESULTS_DEFAULT_LABEL: 'Results',
  SEARCH_RESULTS_COUNT: '{count} results found',
  SEARCH_RESULTS_PAGE_SUFFIX: '· page {page} of {total}',
  SEARCH_RESULTS_EMPTY_TITLE: 'No properties found',
  SEARCH_RESULTS_EMPTY_BODY:
    'No properties found in {location} — try a different city or adjust your filters.',
  SEARCH_RESULTS_EMPTY_CLEAR: 'Clear all filters',
  SEARCH_PAGINATION_PREV_ARIA: 'Previous page',
  SEARCH_PAGINATION_NEXT_ARIA: 'Next page',

  // ─── Search · Result card ───────────────────────────────────────────────────
  SEARCH_CARD_BADGE_NEW: 'New Featured',
  SEARCH_CARD_BADGE_COMING_SOON: 'Coming Soon',
  SEARCH_CARD_MATCH: '{score}% match',
  SEARCH_CARD_PRICE_ON_REQUEST: 'Price on request',
  SEARCH_CARD_BEDS_ABBR: 'bd',
  SEARCH_CARD_BATHS_ABBR: 'ba',
  SEARCH_CARD_SQFT: 'sqft',
  SEARCH_CARD_POWERED_BY: 'Powered by',
  SEARCH_CARD_REALTOR_CA: 'REALTOR.ca',
  SEARCH_CARD_DATA_CREA: 'Data provided by CREA',

  // ─── Search · Curator's Choice card ─────────────────────────────────────────
  SEARCH_CURATOR_HEADING: "The Curator's Choice",
  SEARCH_CURATOR_ACTION_SAVE: 'Save',
  SEARCH_CURATOR_ACTION_EXPAND: 'Expand',
  SEARCH_CURATOR_ACTION_SHARE: 'Share',
  SEARCH_CURATOR_VIEW_PROPERTY: 'View Property',

  // ─── Search · Feed view ─────────────────────────────────────────────────────
  SEARCH_FEED_PHONE_VIEW: 'Phone view',
  SEARCH_FEED_FULL_SCREEN: 'Full screen',
  SEARCH_FEED_TO_PHONE_ARIA: 'Switch to phone view',
  SEARCH_FEED_TO_FULL_ARIA: 'Switch to full screen',
  SEARCH_FEED_EMPTY: 'No listings found for these filters.',
  SEARCH_FEED_END: "You've seen everything.",

  // ─── Search · Map ───────────────────────────────────────────────────────────
  SEARCH_MAP_UNAVAILABLE: 'Map unavailable — Mapbox token not configured',
  SEARCH_MAP_POPUP_PRICE_ON_REQUEST: 'Price on request',
  SEARCH_MAP_POPUP_CLOSE_ARIA: 'Close',
  SEARCH_MAP_POPUP_SAVE_ARIA: 'Save listing',
  SEARCH_MAP_POPUP_UNSAVE_ARIA: 'Unsave listing',

  // ─── Neighbourhoods · Index metadata ────────────────────────────────────────
  NEIGHBOURHOODS_META_TITLE: 'Explore Neighbourhoods',
  NEIGHBOURHOODS_META_DESCRIPTION:
    "Explore Canada's most prestigious neighbourhoods — curated for discerning buyers.",

  // ─── Neighbourhoods · Index header ──────────────────────────────────────────
  NEIGHBOURHOODS_INDEX_EYEBROW: 'Curated by Vicinus',
  NEIGHBOURHOODS_INDEX_TITLE: 'Neighbourhoods.',
  NEIGHBOURHOODS_INDEX_SUBTITLE:
    "Canada's most prestigious enclaves — hand-selected for discerning buyers who expect more.",

  // ─── Neighbourhoods · Index filters / grid ──────────────────────────────────
  NEIGHBOURHOODS_FILTER_ALL_CANADA: 'All Canada',
  NEIGHBOURHOODS_FILTER_ALL_PROVINCE: 'All {province}',
  NEIGHBOURHOODS_FILTER_COLLAPSE: '‹ Collapse',
  NEIGHBOURHOODS_FILTER_SHOW_ALL: 'Show all {count} ›',
  NEIGHBOURHOODS_FEATURED_EDITORS_PICKS: "Editor's Picks",
  NEIGHBOURHOODS_FEATURED_PROVINCE_HIGHLIGHTS: '{province} Highlights',
  NEIGHBOURHOODS_GRID_HEADING: 'All Neighbourhoods',
  NEIGHBOURHOODS_CARD_MED_SUFFIX: 'med.',
  NEIGHBOURHOODS_INDEX_EMPTY_TITLE: 'No neighbourhoods available yet',
  NEIGHBOURHOODS_INDEX_EMPTY_BODY:
    "We're curating Canada's finest enclaves — check back soon.",
  NEIGHBOURHOODS_CITY_EMPTY_TITLE: 'No neighbourhoods in {city} yet',
  NEIGHBOURHOODS_CITY_EMPTY_BODY: "We're expanding our coverage — check back soon.",
  NEIGHBOURHOODS_CITY_EMPTY_BROWSE_ALL: 'Browse all {province}',
  NEIGHBOURHOODS_CITY_EMPTY_SEE: 'See {city}',

  // ─── Neighbourhood detail · Metrics ─────────────────────────────────────────
  NEIGHBOURHOOD_METRICS_EYEBROW: 'Neighbourhood',
  NEIGHBOURHOOD_METRICS_SUBTITLE: 'Key statistics at a glance',
  NEIGHBOURHOOD_METRICS_MEDIAN_PRICE: 'Median Price',
  NEIGHBOURHOOD_METRICS_WALK_SCORE: 'Walk Score',
  NEIGHBOURHOOD_METRICS_TRANSIT_SCORE: 'Transit Score',
  NEIGHBOURHOOD_METRICS_SCHOOL_GRADE: 'School Grade',
  NEIGHBOURHOOD_METRICS_SPECIALISTS_NOTE:
    'Area specialists on this page have an average of 11 active listings in {name}.',

  // ─── Neighbourhood detail · Bio / AI summary ────────────────────────────────
  NEIGHBOURHOOD_BIO_EYEBROW: 'About the Neighbourhood',
  NEIGHBOURHOOD_BIO_PLACEHOLDER:
    "A coveted enclave defined by grand historic estates, canopied streets, and an extraordinary quality of life. Residents enjoy proximity to premier schools, curated boutiques, and some of the city's finest dining — all within a neighbourhood that prizes privacy and prestige above all.",
  NEIGHBOURHOOD_AISUMMARY_FALLBACK:
    '{name} is a vibrant community in {city} known for its welcoming atmosphere and excellent quality of life.',
  NEIGHBOURHOOD_AISUMMARY_DISCLAIMER:
    'AI-generated summary · For informational context only',

  // ─── Neighbourhood detail · Flavors ─────────────────────────────────────────
  NEIGHBOURHOOD_FLAVORS_EYEBROW: 'Lifestyle & Culture',
  NEIGHBOURHOOD_FLAVORS_TITLE: '{name} Flavors.',
  NEIGHBOURHOOD_FLAVORS_DINING_TAG: 'Dining District',
  NEIGHBOURHOOD_FLAVORS_DINING_DESC:
    "Award-winning restaurants and intimate wine bars line the neighbourhood's heritage streets — from modern French bistros to Japanese omakase.",
  NEIGHBOURHOOD_FLAVORS_ART_TAG: 'The Art Scene',

  // ─── Neighbourhood detail · Local essentials ────────────────────────────────
  NEIGHBOURHOOD_ESSENTIALS_EYEBROW: 'For Your Family',
  NEIGHBOURHOOD_ESSENTIALS_TITLE: 'Local Essentials.',
  NEIGHBOURHOOD_ESSENTIALS_EDUCATION: 'Education',
  NEIGHBOURHOOD_ESSENTIALS_HEALTHCARE: 'Healthcare',
  NEIGHBOURHOOD_ESSENTIALS_PARKS: 'Nature & Parks',
  NEIGHBOURHOOD_ESSENTIALS_CHILDCARE: 'Child Care',
  NEIGHBOURHOOD_ESSENTIALS_NONE: 'None nearby',

  // ─── Neighbourhood detail · Live listings ───────────────────────────────────
  NEIGHBOURHOOD_LISTINGS_EYEBROW: 'Real Estate Results',
  NEIGHBOURHOOD_LISTINGS_TITLE: 'Live Listings.',
  NEIGHBOURHOOD_LISTINGS_EMPTY: 'No active listings at this time — check back soon.',
  NEIGHBOURHOOD_LISTINGS_SEE_ALL: 'See All →',
  NEIGHBOURHOOD_LISTINGS_REALTOR_CA: 'REALTOR.ca',
  NEIGHBOURHOOD_LISTINGS_DATA_CREA: 'Data provided by CREA',

  // ─── Neighbourhood detail · Area specialists ────────────────────────────────
  NEIGHBOURHOOD_SPECIALISTS_EYEBROW: 'In-Neighbourhood Experts',
  NEIGHBOURHOOD_SPECIALISTS_TITLE: 'Area Specialists.',
  NEIGHBOURHOOD_SPECIALISTS_NOTE:
    'Top local specialists with an average of 11 active listings in {name}.',
  NEIGHBOURHOOD_SPECIALISTS_ACTIVE_LISTINGS: '{count} active listings',
  NEIGHBOURHOOD_SPECIALISTS_CONTACT: 'Contact',

  // ─── Neighbourhood detail · CTA ─────────────────────────────────────────────
  NEIGHBOURHOOD_CTA_EYEBROW: 'Start Your Journey',
  NEIGHBOURHOOD_CTA_TITLE: 'Make {name} your home?',
  NEIGHBOURHOOD_CTA_EXPLORE: 'Explore Listings',
  NEIGHBOURHOOD_CTA_CONNECT: 'Connect with neighbourhood expert',

  // ─── Feed card (vertical listing feed) ──────────────────────────────────────
  FEED_CARD_SAVE: 'Save',
  FEED_CARD_SHARE: 'Share',
  FEED_CARD_INQUIRE: 'Inquire',
  FEED_CARD_INQUIRE_ARIA: 'Inquire about {address}',
  FEED_CARD_SEE_FULL: 'See full listing',
  FEED_CARD_MLS_PREFIX: 'MLS® {number}',
  FEED_CARD_MUTE: 'Mute',
  FEED_CARD_UNMUTE: 'Unmute',
  FEED_CARD_PAUSE_VIDEO: 'Pause video',
  FEED_CARD_RESUME_VIDEO: 'Resume video',
  FEED_CARD_VIDEO_TITLE: 'Property video tour',

  // ─── Sell · Page flow ───────────────────────────────────────────────────────
  SELL_LOADING_TITLE: 'Analyzing {address}',
  SELL_LOADING_BODY:
    'Our intelligence engine is generating your editorial-grade valuation. This takes a few seconds.',
  SELL_ERROR_VALUATION: 'We couldn’t generate your valuation just now. Please try again.',

  // ─── Sell · Wizard · Progress ───────────────────────────────────────────────
  SELL_WIZARD_STEP_INDICATOR: 'Step {step} of 3',
  SELL_WIZARD_PCT_COMPLETE: '{pct}% Complete',
  SELL_WIZARD_PREVIOUS_STEP: 'Previous step',
  SELL_WIZARD_BACK_TO_INTRO: 'Back to intro',
  SELL_WIZARD_SELECT_TO_CONTINUE: 'Select an option to continue',
  SELL_WIZARD_FILL_DETAILS: 'Fill in your details above',

  // ─── Sell · Wizard · Step 1 (priority) ──────────────────────────────────────
  SELL_WIZARD_STEP1_TITLE: 'What matters most to you in this selling process?',
  SELL_WIZARD_STEP1_BODY:
    'Tailoring your experience requires understanding your primary motivation. Select the path that aligns with your goals.',
  SELL_WIZARD_PRIORITY_PROFIT_TITLE: 'Maximize Profit',
  SELL_WIZARD_PRIORITY_PROFIT_DESC:
    'I want every penny of equity, even if it takes a bit longer to find the right buyer.',
  SELL_WIZARD_PRIORITY_SPEED_TITLE: 'Speed & Certainty',
  SELL_WIZARD_PRIORITY_SPEED_DESC:
    'I want a quick, guaranteed sale with zero showings and total convenience.',
  SELL_WIZARD_PRIORITY_TIMING_TITLE: 'Perfect Timing',
  SELL_WIZARD_PRIORITY_TIMING_DESC:
    'I need to coordinate selling this home with buying my next one seamlessly.',

  // ─── Sell · Wizard · Step 2 (hurdle) ────────────────────────────────────────
  SELL_WIZARD_STEP2_TITLE: 'What is the biggest hurdle we can help you solve right now?',
  SELL_WIZARD_STEP2_BODY:
    'We’re here to serve your specific needs and remove any friction.',
  SELL_WIZARD_HURDLE_PREP_TITLE: 'Property Prep & Repairs',
  SELL_WIZARD_HURDLE_PREP_DESC:
    'Optimization for market value through strategic cosmetic updates or structural fixes.',
  SELL_WIZARD_HURDLE_NEXTHOME_TITLE: 'Finding My Next Home First',
  SELL_WIZARD_HURDLE_NEXTHOME_DESC:
    'Bridge financing and buy-before-sell programs so you aren’t left between homes.',
  SELL_WIZARD_HURDLE_FEES_TITLE: 'Minimizing Fees & Commissions',
  SELL_WIZARD_HURDLE_FEES_DESC:
    'Transparent, high-intelligence models that preserve your equity without sacrificing service.',
  SELL_WIZARD_HURDLE_READY_TITLE: 'None, I’m Ready to Roll',
  SELL_WIZARD_HURDLE_READY_DESC:
    'Your property is staged, priced, and primed. You just need the world’s best exposure.',

  // ─── Sell · Wizard · Step 3 (advisory + lead form) ──────────────────────────
  SELL_WIZARD_STEP3_TITLE: 'How would you prefer to explore your home’s value and offers?',
  SELL_WIZARD_STEP3_BODY: 'Choose the level of advisory that fits your comfort and schedule.',
  SELL_WIZARD_ADVISORY_DIGITAL_TITLE: 'Digital First',
  SELL_WIZARD_ADVISORY_DIGITAL_DESC: 'Send a digital report to my email within minutes.',
  SELL_WIZARD_ADVISORY_PHONE_TITLE: 'Quick Phone Review',
  SELL_WIZARD_ADVISORY_PHONE_DESC:
    'Let an expert call me to answer questions and verify details.',
  SELL_WIZARD_ADVISORY_INPERSON_TITLE: 'In-Person Assessment',
  SELL_WIZARD_ADVISORY_INPERSON_DESC:
    'Schedule a walk-through for a firm, non-contingent cash offer.',
  SELL_WIZARD_PRELIM_LABEL: 'Preliminary Estimate',
  SELL_WIZARD_PRELIM_LOADING: 'Estimating your home’s value…',
  SELL_WIZARD_PRELIM_BODY:
    'An early range for {address}, based on comparable market activity. Share your details below to unlock your full editorial-grade analysis with confidence score and comparables.',
  SELL_WIZARD_LEAD_TITLE: 'Unlock your full analysis',
  SELL_WIZARD_LEAD_FIRSTNAME: 'First Name',
  SELL_WIZARD_LEAD_FIRSTNAME_PLACEHOLDER: 'John',
  SELL_WIZARD_LEAD_LASTNAME: 'Last Name',
  SELL_WIZARD_LEAD_LASTNAME_PLACEHOLDER: 'Doe',
  SELL_WIZARD_LEAD_EMAIL: 'Email Address',
  SELL_WIZARD_LEAD_EMAIL_PLACEHOLDER: 'john@example.com',
  SELL_WIZARD_LEAD_PHONE: 'Phone Number',
  SELL_WIZARD_LEAD_PHONE_PLACEHOLDER: '(555) 000-0000',
  SELL_WIZARD_LEAD_SUBMIT: 'Unlock My Valuation Dashboard',
  SELL_WIZARD_LEAD_DISCLAIMER:
    'Valuation for {address}. By continuing you agree to our terms of service and privacy policy.',

  // ─── Sell · Valuation report ────────────────────────────────────────────────
  SELL_VALUATION_STATUS_BADGE: 'Valuation Status: Confirmed',
  SELL_VALUATION_ESTIMATE_LABEL: 'Estimated Market Value',
  SELL_VALUATION_CONFIDENCE_LABEL: 'Confidence Score',
  SELL_VALUATION_ESTIMATE_NOTE:
    'Report generated based on live neural market analysis as of today.',
  SELL_VALUATION_STAT_PRICE_SQFT: 'Price / Sq.Ft',
  SELL_VALUATION_STAT_YIELD: 'Estimated Yield',
  SELL_VALUATION_STAT_DAYS: 'Days on Market',
  SELL_VALUATION_PULSE_TITLE: 'AI Market Pulse',
  SELL_VALUATION_CMA_TITLE: 'Comparative Market Analysis',
  SELL_VALUATION_CMA_SUBTITLE:
    'The most relevant recent sales used to validate this valuation.',
  SELL_VALUATION_CMA_SOLD: 'Sold',
  SELL_VALUATION_CTA_TITLE: 'Ready for a deeper perspective?',
  SELL_VALUATION_CTA_BODY:
    'Our local experts combine data with human intuition to refine your property’s potential. Schedule a private walkthrough today.',
  SELL_VALUATION_CTA_BUTTON: 'Schedule Walkthrough',

  // ─── Onboarding · Modal ─────────────────────────────────────────────────────
  ONBOARDING_MODAL_ARIA: 'Personalize your Vicinus experience',
  ONBOARDING_MODAL_DISMISS_ARIA: 'Dismiss',

  // ─── Property detail · Page / metadata / compliance ─────────────────────────
  PROPERTY_META_NOT_FOUND: 'Property not found',
  PROPERTY_BREADCRUMB_PROPERTIES: 'Properties',
  PROPERTY_COMPLIANCE_LISTING_BY: 'Listing provided by',
  PROPERTY_COMPLIANCE_FALLBACK_BROKERAGE: 'Listing Brokerage',
  PROPERTY_COMPLIANCE_MLS_DISCLAIMER:
    'MLS® {mls} · Data provided by CREA and may not reflect all available listings. Information is deemed reliable but not guaranteed.',
  PROPERTY_COMPLIANCE_POWERED_BY: 'Powered by',
  PROPERTY_COMPLIANCE_REALTOR_CA: 'REALTOR.ca',

  // ─── Property detail · Stats ────────────────────────────────────────────────
  PROPERTY_STATS_TYPE: 'Type',
  PROPERTY_STATS_PRICE: 'Price',
  PROPERTY_STATS_BEDS: 'Beds',
  PROPERTY_STATS_BATHS: 'Baths',
  PROPERTY_STATS_SIZE: 'Size',
  PROPERTY_STATS_PARKING: 'Parking',
  PROPERTY_STATS_PRICE_ON_REQUEST: 'Price on request',
  PROPERTY_STATS_BADGE_NEW: 'New',
  PROPERTY_STATS_MLS: 'MLS® {mls}',
  PROPERTY_STATS_BUILT: 'Built {year}',
  PROPERTY_STATS_DAYS_ON_MARKET: '{days} days on market',
  PROPERTY_STATS_BED_UNIT: 'Bed',
  PROPERTY_STATS_BATH_UNIT: 'Bath',
  PROPERTY_STATS_SPACE_UNIT: 'Space',
  PROPERTY_STATS_SPACES_UNIT: 'Spaces',
  PROPERTY_STATS_SQFT: 'sqft',

  // ─── Property detail · Gallery ──────────────────────────────────────────────
  PROPERTY_GALLERY_PHOTOS_COUNT: '{count} photos',
  PROPERTY_GALLERY_MORE: '+{count} more',

  // ─── Property detail · AI summary ───────────────────────────────────────────
  PROPERTY_SUMMARY_TITLE: 'Property Summary',
  PROPERTY_SUMMARY_BADGE: 'Powered by Vicinus',
  PROPERTY_SUMMARY_ABOUT: 'About the Property',
  PROPERTY_SUMMARY_LIFESTYLE: 'Lifestyle Fit',
  PROPERTY_SUMMARY_DISCLAIMER:
    'This AI-generated summary is for informational context only.',

  // ─── Property detail · Facts & features ─────────────────────────────────────
  PROPERTY_FACTS_TITLE: 'Facts & features',
  PROPERTY_FACTS_TAB_INTERIOR: 'Interior',
  PROPERTY_FACTS_TAB_EXTERIOR: 'Exterior',
  PROPERTY_FACTS_TAB_FINANCE: 'Finance',
  // Interior groups
  PROPERTY_FACTS_GROUP_BEDS_BATHS: 'Bedrooms & bathrooms',
  PROPERTY_FACTS_ROW_BEDS_ABOVE: 'Bedrooms above grade',
  PROPERTY_FACTS_ROW_BEDS_BELOW: 'Bedrooms below grade',
  PROPERTY_FACTS_ROW_BATHS_TOTAL: 'Bathrooms (total)',
  PROPERTY_FACTS_ROW_BATHS_FULL: 'Full bathrooms',
  PROPERTY_FACTS_ROW_BATHS_PARTIAL: 'Partial bathrooms',
  PROPERTY_FACTS_GROUP_ROOMS: 'Rooms',
  PROPERTY_FACTS_GROUP_APPLIANCES: 'Appliances',
  PROPERTY_FACTS_ROW_APPLIANCES: 'Appliances',
  PROPERTY_FACTS_GROUP_HEATING_COOLING: 'Heating & cooling',
  PROPERTY_FACTS_ROW_HEATING: 'Heating',
  PROPERTY_FACTS_ROW_COOLING: 'Cooling',
  PROPERTY_FACTS_GROUP_FLOORING: 'Flooring',
  PROPERTY_FACTS_ROW_FLOORING: 'Flooring',
  PROPERTY_FACTS_GROUP_BASEMENT: 'Basement',
  PROPERTY_FACTS_ROW_BASEMENT: 'Basement',
  PROPERTY_FACTS_GROUP_FIREPLACE: 'Fireplace',
  PROPERTY_FACTS_ROW_FIREPLACE: 'Fireplace',
  PROPERTY_FACTS_ROW_FIREPLACES_TOTAL: 'Fireplaces (total)',
  PROPERTY_FACTS_ROW_FEATURES: 'Features',
  PROPERTY_FACTS_GROUP_INTERIOR_AREA: 'Interior area',
  PROPERTY_FACTS_ROW_ABOVE_GRADE_FINISHED: 'Above grade finished',
  PROPERTY_FACTS_ROW_BELOW_GRADE_FINISHED: 'Below grade finished',
  PROPERTY_FACTS_GROUP_SECURITY: 'Security',
  PROPERTY_FACTS_ROW_SECURITY_FEATURES: 'Security features',
  // Exterior groups
  PROPERTY_FACTS_GROUP_PARKING: 'Parking',
  PROPERTY_FACTS_ROW_PARKING_SPACES: 'Parking spaces',
  PROPERTY_FACTS_ROW_PARKING_FEATURES: 'Parking features',
  PROPERTY_FACTS_GROUP_LOT: 'Lot',
  PROPERTY_FACTS_ROW_LOT_SIZE: 'Lot size',
  PROPERTY_FACTS_ROW_DIMENSIONS: 'Dimensions',
  PROPERTY_FACTS_ROW_FRONTAGE: 'Frontage',
  PROPERTY_FACTS_ROW_LOT_FEATURES: 'Lot features',
  PROPERTY_FACTS_GROUP_POOL: 'Pool',
  PROPERTY_FACTS_ROW_POOL_FEATURES: 'Pool features',
  PROPERTY_FACTS_GROUP_VIEW: 'View',
  PROPERTY_FACTS_ROW_VIEW: 'View',
  PROPERTY_FACTS_GROUP_EXTERIOR_FEATURES: 'Exterior features',
  PROPERTY_FACTS_ROW_EXTERIOR_FEATURES: 'Exterior features',
  PROPERTY_FACTS_GROUP_CONSTRUCTION: 'Construction',
  PROPERTY_FACTS_ROW_ARCH_STYLE: 'Architectural style',
  PROPERTY_FACTS_ROW_STRUCTURE_TYPE: 'Structure type',
  PROPERTY_FACTS_ROW_CONSTRUCTION_MATERIALS: 'Construction materials',
  PROPERTY_FACTS_ROW_YEAR_BUILT: 'Year built',
  PROPERTY_FACTS_ROW_STORIES: 'Stories',
  PROPERTY_FACTS_GROUP_UTILITIES: 'Utilities',
  PROPERTY_FACTS_ROW_SEWER: 'Sewer',
  PROPERTY_FACTS_ROW_WATER_SOURCE: 'Water source',
  PROPERTY_FACTS_GROUP_FENCING: 'Fencing',
  PROPERTY_FACTS_ROW_FENCING: 'Fencing',
  PROPERTY_FACTS_GROUP_ZONING: 'Zoning',
  PROPERTY_FACTS_ROW_ZONING: 'Zoning',
  PROPERTY_FACTS_ROW_ZONING_DESC: 'Zoning description',
  // Finance groups
  PROPERTY_FACTS_GROUP_PRICE: 'Price',
  PROPERTY_FACTS_ROW_LIST_PRICE: 'List price',
  PROPERTY_FACTS_ROW_PRICE_PER_SQFT: 'Price per sqft',
  PROPERTY_FACTS_GROUP_TAXES: 'Taxes',
  PROPERTY_FACTS_ROW_ANNUAL_TAX: 'Annual tax',
  PROPERTY_FACTS_ROW_TAX_YEAR: 'Tax year',
  PROPERTY_FACTS_GROUP_LISTING: 'Listing',
  PROPERTY_FACTS_ROW_DATE_ON_MARKET: 'Date on market',
  PROPERTY_FACTS_GROUP_OWNERSHIP: 'Ownership',
  PROPERTY_FACTS_ROW_COMMON_INTEREST: 'Common interest',
  PROPERTY_FACTS_GROUP_HOA: 'HOA',
  PROPERTY_FACTS_ROW_ASSOCIATION_FEE: 'Association fee',
  PROPERTY_FACTS_ROW_FEE_INCLUDES: 'Fee includes',
  PROPERTY_FACTS_GROUP_SUBDIVISION: 'Subdivision',
  PROPERTY_FACTS_ROW_SUBDIVISION: 'Subdivision',
  PROPERTY_FACTS_GROUP_PROPERTY_TYPE: 'Property type',
  PROPERTY_FACTS_ROW_PROPERTY_SUBTYPE: 'Property subtype',

  // ─── Property detail · Agent card ───────────────────────────────────────────
  PROPERTY_AGENT_FALLBACK: 'Listing Brokerage',
  PROPERTY_AGENT_MLS_LABEL: 'MLS® Number',
  PROPERTY_AGENT_SEND_MESSAGE: 'Send Message',
  PROPERTY_AGENT_VIEW_REALTOR_CA: 'View on REALTOR.ca',

  // ─── Property detail · Action bar ───────────────────────────────────────────
  PROPERTY_ACTIONBAR_SAVE: 'Save',
  PROPERTY_ACTIONBAR_SAVED: 'Saved',
  PROPERTY_ACTIONBAR_SHARE: 'Share',
  PROPERTY_ACTIONBAR_CONTACT_AGENT: 'Contact Agent',
  PROPERTY_ACTIONBAR_SAVE_ARIA: 'Save listing',
  PROPERTY_ACTIONBAR_UNSAVE_ARIA: 'Unsave listing',
  PROPERTY_SHARE_MODAL_TITLE: 'Share This Listing',
  PROPERTY_SHARE_COPY: 'Copy',
  PROPERTY_SHARE_EMAIL: 'Email',
  PROPERTY_SHARE_WHATSAPP: 'WhatsApp',
  PROPERTY_SHARE_X: 'X',

  // ─── Property detail · Mortgage analysis ────────────────────────────────────
  PROPERTY_MORTGAGE_TITLE: 'Mortgage Analysis',
  PROPERTY_MORTGAGE_SUBTITLE: 'Estimated monthly payment',
  PROPERTY_MORTGAGE_PER_MONTH: 'per month',
  PROPERTY_MORTGAGE_HOME_PRICE: 'Home price',
  PROPERTY_MORTGAGE_HOME_PRICE_PLACEHOLDER: 'Asking price',
  PROPERTY_MORTGAGE_RESET_ASKING: 'Reset to asking',
  PROPERTY_MORTGAGE_PRINCIPAL: 'Principal',
  PROPERTY_MORTGAGE_DOWN_PAYMENT: 'Down Payment',
  PROPERTY_MORTGAGE_PTT: 'Property Transfer Tax',
  PROPERTY_MORTGAGE_TOTAL_INTEREST: 'Total Interest',
  PROPERTY_MORTGAGE_INCLUDE_PTT: 'Include BC Property Transfer Tax',
  PROPERTY_MORTGAGE_CASH_AT_CLOSING: 'Cash at closing',
  PROPERTY_MORTGAGE_DOWN_SLIDER: 'Down Payment — {pct}%',
  PROPERTY_MORTGAGE_RATE_SLIDER: 'Interest Rate — {rate}%',
  PROPERTY_MORTGAGE_AMORT_SLIDER: 'Amortization — {years} yrs',
  PROPERTY_MORTGAGE_GET_PREAPPROVED: 'Get Pre-Approved',
  PROPERTY_MORTGAGE_CONNECT_AGENT: 'Connect with Agent',
  PROPERTY_MORTGAGE_DISCLAIMER:
    'Estimates are for illustrative purposes only. Actual payments may vary based on lender requirements, taxes, and insurance. Consult a licensed mortgage professional.',

  // ─── Property detail · Market context ───────────────────────────────────────
  PROPERTY_MARKET_TITLE: 'Market Context',
  PROPERTY_MARKET_DAYS_ON_MARKET: 'Days on Market',
  PROPERTY_MARKET_PRICE_SQFT: 'Price / sqft',
  PROPERTY_MARKET_PRICE_POSITION: 'Price Position',
  PROPERTY_MARKET_DEMAND: 'Demand',
  PROPERTY_MARKET_DEMAND_HIGH: 'High',
  PROPERTY_MARKET_DEMAND_MEDIUM: 'Moderate',
  PROPERTY_MARKET_DEMAND_LOW: 'Low',
  PROPERTY_MARKET_POSITION_ABOVE: 'Above area median',
  PROPERTY_MARKET_POSITION_AT: 'In line with area',
  PROPERTY_MARKET_POSITION_BELOW: 'Below area median',
  PROPERTY_MARKET_SUB_THIS_LISTING: 'this listing',
  PROPERTY_MARKET_SUB_VS_ACTIVE: 'vs. active listings',
  PROPERTY_MARKET_SUB_BUYER_COMPETITION: 'buyer competition',
  PROPERTY_MARKET_COMPETITION_INDEX: 'Buyer Competition Index',
  PROPERTY_MARKET_DESC_HIGH:
    'Listings here move faster than the area median — expect competition.',
  PROPERTY_MARKET_DESC_MEDIUM: 'Balanced market with room for negotiation.',
  PROPERTY_MARKET_DESC_LOW: 'Buyer-friendly market with extended negotiation windows.',
  PROPERTY_MARKET_DESC_NONE: 'Not enough comparable listings to gauge demand.',

  // ─── Property detail · Sales history ────────────────────────────────────────
  PROPERTY_SALES_TITLE: 'Sales History',
  PROPERTY_SALES_COL_DATE: 'Date',
  PROPERTY_SALES_COL_PRICE: 'Price',
  PROPERTY_SALES_COL_EVENT: 'Event',
  PROPERTY_SALES_COL_CHANGE: 'Change',
  PROPERTY_SALES_TYPE_MLS: 'MLS Sale',
  PROPERTY_SALES_TYPE_NEW: 'New Listing',
  PROPERTY_SALES_TYPE_PRICE_CHANGE: 'Price Change',
  PROPERTY_SALES_SOURCE: 'Source: MLS® data. Historical sales data provided by CREA.',

  // ─── Property detail · Assessment history ───────────────────────────────────
  PROPERTY_ASSESSMENT_TITLE: 'Assessment History',
  PROPERTY_ASSESSMENT_COL_YEAR: 'Year',
  PROPERTY_ASSESSMENT_COL_ASSESSED: 'Assessed Value',
  PROPERTY_ASSESSMENT_COL_LAND: 'Land Value',
  PROPERTY_ASSESSMENT_COL_BUILDING: 'Building Value',
  PROPERTY_ASSESSMENT_COL_TAXES: 'Property Taxes',
  PROPERTY_ASSESSMENT_SOURCE:
    'Source: BC Assessment Authority. Values are assessed, not market value.',

  // ─── Property detail · Open house schedule ──────────────────────────────────
  PROPERTY_OPENHOUSE_TITLE: 'Open House',
  PROPERTY_OPENHOUSE_TITLE_PLURAL: 'Open Houses',
  PROPERTY_OPENHOUSE_UPCOMING: '{count} upcoming',
  PROPERTY_OPENHOUSE_JOIN_LIVESTREAM: 'Join livestream',

  // ─── Property detail · Nearby open houses ───────────────────────────────────
  PROPERTY_NEARBY_TITLE: 'Nearby Open Houses',
  PROPERTY_NEARBY_BADGE: 'Open House',

  // ─── Property detail · Virtual tour ─────────────────────────────────────────
  PROPERTY_TOUR_TITLE: 'Video & virtual tour',
  PROPERTY_TOUR_OPEN_INTERACTIVE: 'Open interactive virtual tour',
  PROPERTY_TOUR_PLAY_ARIA: 'Play property video tour',

  // ─── Property detail · Neighbourhood context score ──────────────────────────
  PROPERTY_CONTEXT_TITLE: '{name} Context',
  PROPERTY_CONTEXT_VIEW_PROFILE: 'View full profile →',
  PROPERTY_CONTEXT_WALK_SCORE: 'Walk Score®',
  PROPERTY_CONTEXT_LIFESTYLE_SCORE: 'Lifestyle Score',
  PROPERTY_CONTEXT_WALK_PARADISE:
    "Walker's Paradise — daily errands do not require a car.",
  PROPERTY_CONTEXT_WALK_VERY:
    'Very Walkable — most errands can be accomplished on foot.',
  PROPERTY_CONTEXT_WALK_SOME:
    'Somewhat Walkable — some errands can be accomplished on foot.',
  PROPERTY_CONTEXT_LIFESTYLE_DEFAULT: 'Very Walkable',
  PROPERTY_MAP_LOADING: 'Loading map…',
  PROPERTY_MAP_PREVIEW_UNAVAILABLE: 'Map preview unavailable',

  // ─── Property detail · Location links ───────────────────────────────────────
  PROPERTY_LOCATION_STREET_VIEW: 'Street View',
  PROPERTY_LOCATION_VIEW_MAP: 'View on map',

  // ─── Property detail · Listing activity map ─────────────────────────────────
  PROPERTY_ACTIVITY_TITLE: 'Listing Activity Around this Property',
  PROPERTY_ACTIVITY_NEARBY_COUNT: '{count} nearby listings',
  PROPERTY_ACTIVITY_SOURCE:
    'Prices shown are list prices for active listings within a 1 km radius. Data sourced from MLS®.',
} as const

export type StringKey = keyof typeof STRINGS

/** Convenience accessor. Returns the key itself if missing (helps surface gaps). */
export function t(key: StringKey): string {
  return STRINGS[key] ?? key
}
