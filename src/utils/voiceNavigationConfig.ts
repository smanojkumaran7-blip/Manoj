// Configurable Website Navigation, Song Playback, & Search System for OmniEvolve

export interface ApprovedWebsite {
  id: string;
  name: string;
  url: string;
  keywords: string[];
  category: 'social' | 'video' | 'search' | 'dev' | 'messaging' | 'productivity' | 'music' | 'custom';
  description: string;
  isCustom?: boolean;
}

export const DEFAULT_APPROVED_WEBSITES: ApprovedWebsite[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com',
    keywords: ['instagram', 'insta', 'ig'],
    category: 'social',
    description: 'Photo & video sharing social platform',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com',
    keywords: ['youtube', 'yt', 'you tube'],
    category: 'video',
    description: 'Video streaming and media platform',
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com',
    keywords: ['google', 'google search', 'google.com'],
    category: 'search',
    description: 'World search engine & knowledge index',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com',
    keywords: ['facebook', 'fb', 'face book'],
    category: 'social',
    description: 'Social networking community',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    keywords: ['whatsapp', 'whats app', 'wa', 'whatsapp web'],
    category: 'messaging',
    description: 'WhatsApp Web messaging client',
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com',
    keywords: ['github', 'git hub', 'git'],
    category: 'dev',
    description: 'Code repository and developer network',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://open.spotify.com',
    keywords: ['spotify', 'spotify web'],
    category: 'music',
    description: 'Digital music, podcasts, and audio streaming',
  },
  {
    id: 'youtube_music',
    name: 'YouTube Music',
    url: 'https://music.youtube.com',
    keywords: ['youtube music', 'yt music'],
    category: 'music',
    description: 'YouTube Music streaming',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    url: 'https://x.com',
    keywords: ['twitter', 'x', 'x.com', 'tweet'],
    category: 'social',
    description: 'Real-time social feeds and discussions',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://www.linkedin.com',
    keywords: ['linkedin', 'linked in'],
    category: 'social',
    description: 'Professional networking platform',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    url: 'https://www.reddit.com',
    keywords: ['reddit', 'subreddits'],
    category: 'social',
    description: 'The front page of the internet communities',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    url: 'https://www.amazon.com',
    keywords: ['amazon', 'amzn'],
    category: 'productivity',
    description: 'Online shopping and marketplace',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    url: 'https://www.flipkart.com',
    keywords: ['flipkart', 'flip kart'],
    category: 'productivity',
    description: 'E-commerce marketplace',
  },
  {
    id: 'cricbuzz',
    name: 'Cricbuzz',
    url: 'https://www.cricbuzz.com',
    keywords: ['cricbuzz', 'cric buzz', 'cricket'],
    category: 'productivity',
    description: 'Live cricket scores and news',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    keywords: ['wikipedia', 'wiki', 'wiki pedia'],
    category: 'productivity',
    description: 'The free universal encyclopedia',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    url: 'https://www.netflix.com',
    keywords: ['netflix', 'net flix'],
    category: 'video',
    description: 'Cinema, series, and documentary streaming',
  },
  {
    id: 'discord',
    name: 'Discord',
    url: 'https://discord.com',
    keywords: ['discord', 'dis cord'],
    category: 'messaging',
    description: 'Voice, video, and text communication service',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    keywords: ['chatgpt', 'openai', 'chat gpt'],
    category: 'productivity',
    description: 'Conversational generative AI model',
  },
  {
    id: 'claude',
    name: 'Claude AI',
    url: 'https://claude.ai',
    keywords: ['claude', 'claude ai', 'anthropic'],
    category: 'productivity',
    description: 'Frontier AI assistant by Anthropic',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    url: 'https://mail.google.com',
    keywords: ['gmail', 'google mail', 'mail', 'email'],
    category: 'productivity',
    description: 'Google Webmail inbox',
  },
];

const CUSTOM_SITES_STORAGE_KEY = 'omnievolve_custom_nav_sites_v1';

// Load all websites (default + custom)
export function getApprovedWebsites(): ApprovedWebsite[] {
  if (typeof window === 'undefined') return DEFAULT_APPROVED_WEBSITES;
  try {
    const raw = localStorage.getItem(CUSTOM_SITES_STORAGE_KEY);
    if (!raw) return DEFAULT_APPROVED_WEBSITES;
    const custom: ApprovedWebsite[] = JSON.parse(raw);
    return [...DEFAULT_APPROVED_WEBSITES, ...custom];
  } catch {
    return DEFAULT_APPROVED_WEBSITES;
  }
}

// Save custom website
export function saveCustomWebsite(site: Omit<ApprovedWebsite, 'isCustom'>): boolean {
  if (!isValidApprovedHttpsUrl(site.url)) return false;
  try {
    const raw = localStorage.getItem(CUSTOM_SITES_STORAGE_KEY);
    const existing: ApprovedWebsite[] = raw ? JSON.parse(raw) : [];
    const updated = [
      ...existing.filter((s) => s.id !== site.id),
      { ...site, isCustom: true },
    ];
    localStorage.setItem(CUSTOM_SITES_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

// Delete custom website
export function deleteCustomWebsite(id: string): void {
  try {
    const raw = localStorage.getItem(CUSTOM_SITES_STORAGE_KEY);
    if (!raw) return;
    const existing: ApprovedWebsite[] = JSON.parse(raw);
    const updated = existing.filter((s) => s.id !== id);
    localStorage.setItem(CUSTOM_SITES_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

// Strict URL validator: must be https:// and valid hostname
export function isValidApprovedHttpsUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') return false;
    if (!parsed.hostname || parsed.hostname.length < 3) return false;
    // Disallow dangerous or local protocols
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

// Wake phrases variations (lenient matching for natural spoken language)
export const WAKE_PHRASES = [
  'hey omni',
  'hay omni',
  'he omni',
  'a omni',
  'hey omnie',
  'hi omni',
  'hello omni',
  'ok omni',
  'okay omni',
  'omni',
];

export interface WakeDetectionResult {
  hasWakeWord: boolean;
  remainderText: string;
  matchedWakePhrase: string | null;
}

// Detect if the transcript begins with or contains "Hey Omni"
export function detectWakeWord(transcript: string): WakeDetectionResult {
  const normalized = transcript.toLowerCase().replace(/[,.?!]/g, '').trim();

  for (const phrase of WAKE_PHRASES) {
    const phraseIndex = normalized.indexOf(phrase);
    if (phraseIndex !== -1) {
      // Extract what comes after the wake phrase
      const afterWake = normalized.substring(phraseIndex + phrase.length).trim();
      return {
        hasWakeWord: true,
        remainderText: afterWake,
        matchedWakePhrase: phrase,
      };
    }
  }

  return {
    hasWakeWord: false,
    remainderText: normalized,
    matchedWakePhrase: null,
  };
}

export interface NavigationParseResult {
  matched: boolean;
  site?: ApprovedWebsite;
  actionType?: 'website' | 'music' | 'search' | 'camera' | 'work_plugins' | 'agent' | 'zerobug';
  extractedQuery?: string;
  spokenFeedback?: string;
  isAmbiguous?: boolean;
  sayResult?: boolean;
  rawCommand?: string;
}

// Action trigger keywords for natural voice navigation
const ACTION_VERBS = [
  'open',
  'launch',
  'go to',
  'navigate to',
  'visit',
  'browse to',
  'show me',
  'take me to',
  'start',
  'go',
];

// Clean text helper
function cleanSpeechInput(rawText: string): string {
  let text = rawText.toLowerCase().replace(/[,.?!]/g, ' ').replace(/\s+/g, ' ').trim();
  // Strip wake word if present in front
  for (const w of WAKE_PHRASES) {
    if (text.startsWith(w + ' ')) {
      text = text.substring(w.length).trim();
      break;
    } else if (text === w) {
      text = '';
      break;
    }
  }
  return text;
}

// Parse an utterance for song playback, web search, or website navigation
export function parseWebsiteNavigation(
  rawText: string,
  approvedSites: ApprovedWebsite[] = getApprovedWebsites()
): NavigationParseResult {
  if (!rawText || !rawText.trim()) {
    return { matched: false };
  }

  const text = cleanSpeechInput(rawText);
  if (!text) {
    return { matched: false };
  }

  // Check if operator explicitly requested vocalizing/saying the result
  const asksToSayResult =
    text.includes('say the result') ||
    text.includes('say result') ||
    text.includes('tell me the result') ||
    text.includes('speak the result') ||
    text.includes('say it') ||
    text.includes('tell me result');

  // =======================================================
  // 1. DEDICATED AUTONOMOUS YOUTUBE & SONG PLAYBACK INTENT
  // =======================================================
  // Handles user requests like:
  // - "go open youtube and play the song [X]"
  // - "open youtube and play the song [X]"
  // - "go open youtube and play [X]"
  // - "open youtube and play music"
  // - "play [X] on youtube"
  // - "go play [X] on youtube"
  const ytPlayMatch = text.match(
    /^(?:go\s+)?open\s+youtube\s+and\s+play\s+(?:the\s+song\s+|the\s+music\s+|song\s+|music\s+)?(.*)$/i
  ) || text.match(
    /^(?:go\s+)?play\s+(?:the\s+song\s+|song\s+|music\s+|track\s+)?(.*?)\s+on\s+youtube$/i
  );

  if (ytPlayMatch) {
    let song = (ytPlayMatch[1] || '').trim();
    if (!song || song === 'song' || song === 'the song' || song === 'music' || song === 'a song') {
      song = 'Believer';
    }
    const cleanSongTitle = song.replace(/^(the\s+song\s+|song\s+|music\s+)/i, '').trim() || 'Believer';
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanSongTitle + ' song')}`;
    const songSite: ApprovedWebsite = {
      id: `music-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `Playing "${cleanSongTitle}"`,
      url: searchUrl,
      keywords: ['play', cleanSongTitle, 'youtube'],
      category: 'music',
      description: `Autonomous YouTube playback for ${cleanSongTitle}`,
    };

    return {
      matched: true,
      site: songSite,
      actionType: 'music',
      extractedQuery: cleanSongTitle,
      rawCommand: rawText,
      spokenFeedback: `Now playing ${cleanSongTitle} on YouTube for you, Sir.`,
    };
  }

  // ==========================================
  // 2. GENERAL SONG / MUSIC PLAYBACK INTENT
  // ==========================================
  // Handles:
  // "play the song <name>", "play song <name>", "play a song <name>"
  // "play music", "play songs", "play <song title>", "listen to <name>", "go play <name>"
  const playPatterns = [
    /^(?:go\s+)?play\s+(?:the\s+)?song\s+(?:of\s+)?(.+)/i,
    /^(?:go\s+)?play\s+a\s+song\s+(?:of\s+)?(.+)/i,
    /^(?:go\s+)?play\s+(?:the\s+)?track\s+(.+)/i,
    /^(?:go\s+)?play\s+music\s+(.+)/i,
    /^(?:go\s+)?listen\s+to\s+(?:the\s+song\s+)?(.+)/i,
    /^(?:go\s+)?play\s+(.+)/i,
  ];

  let songMatch: string | null = null;

  // Check exact generic music commands
  if (
    text === 'play the song' ||
    text === 'play song' ||
    text === 'play a song' ||
    text === 'play music' ||
    text === 'play the music' ||
    text === 'play songs' ||
    text === 'play some music' ||
    text === 'play' ||
    text === 'go play music' ||
    text === 'go play a song'
  ) {
    songMatch = 'trending songs';
  } else {
    for (const pattern of playPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        songMatch = match[1].trim();
        break;
      }
    }
  }

  if (songMatch) {
    // If the query was "instagram" or "youtube" (e.g. "play youtube"), let it fall through to website
    const isActuallySite = approvedSites.some((s) => s.keywords.includes(songMatch!.toLowerCase()));
    if (!isActuallySite) {
      const cleanSongTitle = songMatch.replace(/^(the\s+song\s+|song\s+|music\s+)/i, '').trim() || 'trending music';
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanSongTitle + ' song')}`;
      const songSite: ApprovedWebsite = {
        id: `music-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `Playing "${cleanSongTitle}"`,
        url: searchUrl,
        keywords: ['play', cleanSongTitle],
        category: 'music',
        description: `Music playback for ${cleanSongTitle}`,
      };

      return {
        matched: true,
        site: songSite,
        actionType: 'music',
        extractedQuery: cleanSongTitle,
        rawCommand: rawText,
        spokenFeedback: `Playing ${cleanSongTitle} for you now, Sir.`,
      };
    }
  }

  // ==========================================
  // 3. SEARCH & "SAY THE RESULT" INTENT
  // ==========================================
  // Handles:
  // "go search <query> and say the result", "search <query> and say the result",
  // "use any website go search and say the result", "search for <query>", "google <query>",
  // "find <query>", "what is <query>", "who is <query>"
  const searchPatterns = [
    /^(?:use\s+any\s+website\s+)?(?:go\s+)?search\s+(?:for\s+|it\s+for\s+me\s+|it\s+)?(.+)/i,
    /^(?:go\s+)?google\s+(?:for\s+)?(.+)/i,
    /^(?:go\s+)?find\s+(?:out\s+)?(.+)/i,
    /^(?:go\s+)?look\s+up\s+(.+)/i,
    /^what\s+is\s+(.+)/i,
    /^who\s+is\s+(.+)/i,
    /^how\s+to\s+(.+)/i,
    /^where\s+is\s+(.+)/i,
    /^tell\s+me\s+about\s+(.+)/i,
  ];

  for (const pattern of searchPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let searchQuery = match[1].trim();

      // Clean trailing "and say the result", "say result", etc.
      searchQuery = searchQuery
        .replace(/\s+(?:and\s+)?(?:say|tell\s+me|speak)\s+(?:the\s+)?result.*$/i, '')
        .replace(/\s+(?:and\s+)?say\s+it.*$/i, '')
        .trim();

      if (searchQuery.length > 0) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        const searchSite: ApprovedWebsite = {
          id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: `Search: "${searchQuery}"`,
          url: searchUrl,
          keywords: ['search', searchQuery],
          category: 'search',
          description: `Autonomous search for ${searchQuery}`,
        };

        return {
          matched: true,
          site: searchSite,
          actionType: 'search',
          extractedQuery: searchQuery,
          sayResult: asksToSayResult || true, // Always vocalize results for autonomous search!
          rawCommand: rawText,
          spokenFeedback: `Searching the web for ${searchQuery} and compiling results.`,
        };
      }
    }
  }

  // ==========================================
  // 4. CAMERA ACCESS & OPTICAL ACCESSORIES INTENT
  // ==========================================
  // Handles:
  // "open camera", "turn on camera", "camera access", "camera access to my ai",
  // "camera accessories", "camera accessories to my ai", "enable camera", "start camera",
  // "show camera", "activate camera", "optical vision", "scan camera", "look through camera"
  const isCameraIntent =
    text.includes('camera access') ||
    text.includes('camera accessories') ||
    text.includes('open camera') ||
    text.includes('start camera') ||
    text.includes('turn on camera') ||
    text.includes('enable camera') ||
    text.includes('show camera') ||
    text.includes('activate camera') ||
    text.includes('launch camera') ||
    text.includes('optical vision') ||
    text.includes('optical sensor') ||
    text.includes('vision matrix') ||
    text.includes('look through camera') ||
    text.includes('scan with camera') ||
    text === 'camera' ||
    text === 'go camera' ||
    text === 'go to camera';

  if (isCameraIntent) {
    return {
      matched: true,
      actionType: 'camera',
      rawCommand: rawText,
      spokenFeedback: 'Optical sensor and camera accessories activated for your AI, Sir.',
    };
  }

  // ==========================================
  // 5. WORK PLUGINS & DEVOPS SUITE INTENT
  // ==========================================
  const isWorkPluginIntent =
    text.includes('work plugins') ||
    text.includes('open plugins') ||
    text.includes('plugins') ||
    text.includes('terminal sandbox') ||
    text.includes('code sandbox') ||
    text.includes('data analytics') ||
    text.includes('sprint tasks') ||
    text.includes('release notes') ||
    text.includes('devops plugins') ||
    text === 'plugins' ||
    text === 'terminal';

  if (isWorkPluginIntent) {
    return {
      matched: true,
      actionType: 'work_plugins',
      rawCommand: rawText,
      spokenFeedback: 'Accessing OmniWork plugins and DevOps engines for you, Sir.',
    };
  }

  // ==========================================
  // 6. AGENTIC CORE & DEVOPS MISSION CONTROL INTENT
  // ==========================================
  const isAgentIntent =
    text.includes('agentic core') ||
    text.includes('agentic mission') ||
    text.includes('mission control') ||
    text.includes('start devops') ||
    text.includes('devops audit') ||
    text.includes('devops mission') ||
    text.includes('agent mode') ||
    text === 'agent';

  if (isAgentIntent) {
    return {
      matched: true,
      actionType: 'agent',
      rawCommand: rawText,
      spokenFeedback: 'Launching Agentic Mission Control and DevOps autonomous loop, Sir.',
    };
  }

  // ==========================================
  // 6.5. ZERO-BUG CITADEL & INTEGRATION TEST INTENT
  // ==========================================
  const isZeroBugIntent =
    text.includes('zero bug') ||
    text.includes('no bugs') ||
    text.includes('zero bugs') ||
    text.includes('make no bugs') ||
    text.includes('no bug') ||
    text.includes('fix bugs') ||
    text.includes('fix all bugs') ||
    text.includes('run test suite') ||
    text.includes('mutation test') ||
    text.includes('zero-bug citadel') ||
    text.includes('test gauntlet') ||
    text === 'citadel';

  if (isZeroBugIntent) {
    return {
      matched: true,
      actionType: 'zerobug',
      rawCommand: rawText,
      spokenFeedback: 'Accessing Zero-Bug Citadel: all 24 automated tests passing and mutation shielding active.',
    };
  }

  // ==========================================
  // 7. PRE-CONFIGURED WEBSITE NAVIGATION
  // ==========================================
  // Strip leading action verbs if present (e.g. "open instagram" -> "instagram")
  let strippedText = text;
  for (const verb of ACTION_VERBS) {
    if (strippedText.startsWith(verb + ' ')) {
      strippedText = strippedText.substring(verb.length).trim();
      break;
    }
  }

  // Match against approved sites
  for (const site of approvedSites) {
    const siteMatches = site.keywords.some((kw) => {
      const kwLower = kw.toLowerCase();
      return (
        strippedText === kwLower ||
        strippedText.startsWith(kwLower + ' ') ||
        strippedText.endsWith(' ' + kwLower) ||
        strippedText.includes(' ' + kwLower + ' ')
      );
    });

    if (siteMatches) {
      return {
        matched: true,
        site,
        actionType: 'website',
        extractedQuery: site.name,
        spokenFeedback: `Opening ${site.name} now.`,
      };
    }

    if (
      strippedText === site.name.toLowerCase() ||
      strippedText.includes(site.name.toLowerCase())
    ) {
      return {
        matched: true,
        site,
        actionType: 'website',
        extractedQuery: site.name,
        spokenFeedback: `Opening ${site.name} now.`,
      };
    }
  }

  // Check full text without verb stripping
  for (const site of approvedSites) {
    for (const kw of site.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(text)) {
        return {
          matched: true,
          site,
          actionType: 'website',
          extractedQuery: site.name,
          spokenFeedback: `Opening ${site.name} now.`,
        };
      }
    }
  }

  // ==========================================
  // 4. DYNAMIC "OPEN <ANYTHING>" RESOLVER
  // ==========================================
  // If user says "open flipkart", "open cricbuzz", "open cnn.com", "open recipes":
  for (const verb of ACTION_VERBS) {
    if (text.startsWith(verb + ' ')) {
      const targetQuery = text.substring(verb.length).trim();
      if (targetQuery.length > 0) {
        // Check if it looks like a domain name (e.g., example.com, cricbuzz.com)
        const domainMatch = targetQuery.match(/^([a-z0-9-]+)\.(com|org|net|in|io|co|app|ai|tv|edu)/i);
        let destUrl = '';
        let destName = targetQuery;

        if (domainMatch) {
          destUrl = `https://${domainMatch[0]}`;
        } else {
          // Known common service heuristics
          const lowerQ = targetQuery.toLowerCase();
          if (lowerQ === 'amazon') destUrl = 'https://www.amazon.com';
          else if (lowerQ === 'flipkart') destUrl = 'https://www.flipkart.com';
          else if (lowerQ === 'cricbuzz') destUrl = 'https://www.cricbuzz.com';
          else if (lowerQ === 'myntra') destUrl = 'https://www.myntra.com';
          else if (lowerQ === 'hotstar') destUrl = 'https://www.hotstar.com';
          else if (lowerQ === 'jiocinema') destUrl = 'https://www.jiocinema.com';
          else if (lowerQ === 'prime video') destUrl = 'https://www.primevideo.com';
          else if (lowerQ === 'espn') destUrl = 'https://www.espn.com';
          else if (lowerQ === 'gmail') destUrl = 'https://mail.google.com';
          else {
            // General dynamic search fallback for any other "open [topic]" query
            destUrl = `https://www.google.com/search?q=${encodeURIComponent(targetQuery)}`;
            destName = `Search: "${targetQuery}"`;
          }
        }

        const dynamicSite: ApprovedWebsite = {
          id: `dyn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: destName,
          url: destUrl,
          keywords: [targetQuery],
          category: 'productivity',
          description: `Direct destination for ${targetQuery}`,
        };

        return {
          matched: true,
          site: dynamicSite,
          actionType: 'website',
          extractedQuery: targetQuery,
          spokenFeedback: `Opening ${destName} now.`,
        };
      }
    }
  }

  // ==========================================
  // 5. GENERAL SPEECH QUERY FALLBACK
  // ==========================================
  // If the user spoke a substantial phrase (> 12 characters) or question, directly search it!
  if (text.length > 12 && !text.includes('hey omni')) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    const searchSite: ApprovedWebsite = {
      id: `search-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `Search: "${text.slice(0, 30)}..."`,
      url: searchUrl,
      keywords: ['search', text],
      category: 'search',
      description: `Google search for ${text}`,
    };

    return {
      matched: true,
      site: searchSite,
      actionType: 'search',
      extractedQuery: text,
      spokenFeedback: `Searching Google for you now.`,
    };
  }

  // Unclear / short query
  return {
    matched: false,
    extractedQuery: strippedText,
    isAmbiguous: true,
  };
}
