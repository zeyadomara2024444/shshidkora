// script.js - هذا الكود محسن وواضح لمحركات البحث والمطورين
// تم التركيز على أفضل أداء ممكن من جانب العميل مع الحفاظ على الوظائف والإعلانات
// والتأكد من إزالة أي عناصر قد تؤثر سلباً على الفهم من قبل محركات البحث
// تم تحديث هذا الإصدار لاستخدام iframe لمشغل الفيديو
// **هذا الإصدار معدل لموقع "شاهد كوره" ليعرض محتوى رياضي ويتوافق مع matches.json المرفق**
// **تم إصلاح مشكلة عدم عرض البيانات بسبب تهيئة عناصر DOM بعد حقن القوالب**

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Script execution started for "Shahed Kora".');

    // --- 1. Global DOM Element References (always present in the initial HTML) ---
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const homeNavLink = document.getElementById('home-nav-link-actual');
    const navLinks = document.querySelectorAll('.main-nav ul li a'); // All navigation links
    const heroSection = document.getElementById('hero-section');
    const watchNowBtn = document.getElementById('watch-now-btn');
    const contentDisplay = document.getElementById('content-display');
    const homeLogoLink = document.getElementById('home-logo-link');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Template elements (these are in the initial HTML but their content is cloned)
    const homeViewTemplate = document.getElementById('home-view-template');
    const liveMatchesTemplate = document.getElementById('live-matches-template');
    const upcomingMatchesTemplate = document.getElementById('upcoming-matches-template');
    const highlightsTemplate = document.getElementById('highlights-template');
    const newsTemplate = document.getElementById('news-template');
    const matchDetailsViewTemplate = document.getElementById('match-details-view-template');

    // --- References to DOM elements that will be dynamically created/assigned ---
    // These will be assigned inside the renderView function based on the active template
    let matchGridSection; // e.g., the <section id="match-grid-section">
    let mainMatchGrid;    // e.g., the <div id="main-match-grid">
    let homePrevPageBtn;  // e.g., the <button id="home-prev-page-btn">
    let homeNextPageBtn;  // e.g., the <button id="home-next-page-btn">
    let currentSectionTitleElement; // e.g., the <h2> element like "أبرز المباريات والجديد"

    // Match details elements (also assigned dynamically inside renderView when 'details' view is active)
    let matchDetailsSection;
    let backToHomeBtn;
    let videoContainer;
    let videoOverlay;
    let videoLoadingSpinner;
    let matchDetailsPoster;
    let matchDetailsTitleElement;
    let matchDetailsDescription;
    let matchDetailsDateTime;
    let matchDetailsLeague;
    let matchDetailsCommentators;
    let matchDetailsTeams;
    let matchDetailsStadium;
    let matchDetailsStatus;
    let matchDetailsScoreContainer;
    let matchDetailsScore;
    let matchDetailsHighlightsContainer;
    let matchDetailsHighlightsLink;
    let suggestedMatchGrid;
    let suggestedMatchesSection;
    
    // ****** Performance optimization: Movies per page ******
    const matchesPerPage = 30; 

    let currentPage = 1;
    let currentView = 'home'; 
    let currentFilteredMatches = []; 

    // --- 1.1. Critical DOM Element Verification (only for globally present elements) ---
    const globalRequiredElements = {
        '#menu-toggle': menuToggle,
        '#main-nav': mainNav,
        '#home-nav-link-actual': homeNavLink,
        '#hero-section': heroSection,
        '#watch-now-btn': watchNowBtn,
        '#home-logo-link': homeLogoLink,
        '#search-input': searchInput,
        '#search-button': searchButton,
        '#json-ld-schema': document.getElementById('json-ld-schema'),
        '#dynamic-title': document.getElementById('dynamic-title'),
        '#dynamic-description': document.getElementById('dynamic-description'),
        '#dynamic-keywords': document.getElementById('dynamic-keywords'),
        '#dynamic-canonical': document.getElementById('dynamic-canonical'),
        '#dynamic-og-type': document.getElementById('dynamic-og-type'),
        '#dynamic-og-url': document.getElementById('dynamic-og-url'),
        '#dynamic-og-title': document.getElementById('dynamic-og-title'),
        '#dynamic-og-description': document.getElementById('dynamic-og-description'),
        '#dynamic-og-image': document.getElementById('dynamic-og-image'),
        '#dynamic-og-image-alt': document.getElementById('dynamic-og-image-alt'),
        '#dynamic-twitter-card': document.getElementById('dynamic-twitter-card'),
        '#dynamic-twitter-url': document.getElementById('dynamic-twitter-url'),
        '#dynamic-twitter-title': document.getElementById('dynamic-twitter-title'),
        '#dynamic-twitter-description': document.getElementById('dynamic-twitter-description'),
        '#dynamic-twitter-image': document.getElementById('dynamic-twitter-image'),
        '#content-display': contentDisplay,
        '#home-view-template': homeViewTemplate,
        '#live-matches-template': liveMatchesTemplate,
        '#upcoming-matches-template': upcomingMatchesTemplate,
        '#highlights-template': highlightsTemplate,
        '#news-template': newsTemplate,
        '#match-details-view-template': matchDetailsViewTemplate
    };

    let criticalError = false;
    for (const [id, element] of Object.entries(globalRequiredElements)) {
        if (!element) {
            console.error(`❌ Critical Error: DOM element "${id}" not found. Please check your HTML file.`);
            criticalError = true;
        }
    }
    if (criticalError) {
        console.error('🛑 Script execution halted due to missing critical DOM elements. Fix your HTML!');
        document.body.innerHTML = '<div style="text-align: center; margin-top: 100px; color: #f44336; font-size: 20px;">' +
                                    'عذرًا، حدث خطأ فني. يرجى تحديث الصفحة أو المحاولة لاحقًا.' +
                                    '<p style="font-size: 14px; color: #ccc;">(عناصر الصفحة الرئيسية مفقودة)</p></div>';
        return;
    } else {
        console.log('✅ All critical DOM elements found.');
    }

    // --- 2. Adsterra Configuration ---
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/spqbhmyax?key=2469b039d4e7c471764bd04c57824cf2';
    const DIRECT_LINK_COOLDOWN_MATCH_CARD = 3 * 60 * 1000; // 3 minutes
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 10 * 1000; // 10 seconds

    let lastDirectLinkClickTimeMatchCard = 0;
    let lastDirectLinkClickTimeVideoInteraction = 0;

    function openAdLink(cooldownDuration, type) {
        let lastClickTime;
        let setLastClickTime;

        if (type === 'matchCard' || type === 'matchDetailsPoster') {
            lastClickTime = lastDirectLinkClickTimeMatchCard;
            setLastClickTime = (time) => lastDirectLinkClickTimeMatchCard = time;
        } else if (type === 'videoOverlay' || type === 'videoSeek' || type === 'videoPause' || type === 'videoEndedRestart') {
            lastClickTime = lastDirectLinkClickTimeVideoInteraction;
            setLastClickTime = (time) => lastDirectLinkClickTimeVideoInteraction = time;
        } else {
            console.error('Invalid ad type for openAdLink:', type);
            return false;
        }

        const currentTime = Date.now();
        if (currentTime - lastClickTime > cooldownDuration) {
            const newWindow = window.open(ADSTERRA_DIRECT_LINK_URL, '_blank');
            if (newWindow) {
                newWindow.focus();
                setLastClickTime(currentTime);
                console.log(`💰 [Ad Click - ${type}] Direct link opened successfully.`);
                return true;
            } else {
                console.warn(`⚠️ [Ad Click - ${type}] Pop-up blocked or failed to open direct link. Ensure pop-ups are allowed.`);
                return false;
            }
        } else {
            const timeLeft = (cooldownDuration - (currentTime - lastClickTime)) / 1000;
            console.log(`⏳ [Ad Click - ${type}] Direct link cooldown active. No new tab opened. Time left: ${timeLeft.toFixed(1)}s`);
            return false;
        }
    }

    // --- 3. Match Data & Video URL Handling ---
    let matchesData = []; // All loaded match data
    let currentDetailedMatch = null; // The match currently displayed in the details page
    
    // Helper to parse ISO 8601 duration (e.g., PT1H54M to seconds) - still useful for Schema
    function parseDurationToSeconds(isoDuration) {
        if (!isoDuration || typeof isoDuration !== 'string') return 0;
        const parts = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!parts) return 0;
        const hours = parseInt(parts[1] || 0);
        const minutes = parseInt(parts[2] || 0);
        const seconds = parseInt(parts[3] || 0);
        return hours * 3600 + minutes * 60 + seconds;
    }

    async function fetchMatchesData() {
        try {
            console.log('📡 Fetching match data from matches.json...');
            const response = await fetch('matches.json'); // Changed file name
            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status} - Failed to load matches.json. Check file path and server configuration.`);
            }
            matchesData = await response.json();
            if (!Array.isArray(matchesData)) {
                console.error('❌ Fetched data is not an array. Please check matches.json format. Expected array of match objects.');
                matchesData = [];
            } else if (matchesData.length === 0) {
                console.warn('⚠️ matches.json loaded, but it is empty.');
            }
            console.log('✅ Match data successfully loaded from matches.json', matchesData.length, 'matches found.');
            initialPageLoadLogic(); // Call initial load logic after data is fetched
        } catch (error) {
            console.error('❌ Failed to load match data:', error.message);
            // Fallback if data loading fails at any point
            const fallbackGrid = document.getElementById('main-match-grid'); // Attempt to get the main grid
            if (fallbackGrid) {
                fallbackGrid.innerHTML = '<p style="text-align: center; color: var(--text-color); margin-top: 50px;">Sorry, we couldn\'t load match data. Please try again later or check your matches.json file.</p>';
            } else {
                 // If even mainMatchGrid isn't in DOM yet, show error in contentDisplay
                 contentDisplay.innerHTML = '<p style="text-align: center; color: var(--text-color); margin-top: 50px;">Sorry, we couldn\'t load match data. Please try again later or check your matches.json file.</p>';
            }
            // Title element might not be available yet, so be cautious
            const currentTitleElement = document.querySelector('.section-title');
            if (currentTitleElement) {
                currentTitleElement.textContent = 'Error Loading Matches';
            }
        }
    }

    function createMatchCard(match) {
        const matchCard = document.createElement('div');
        matchCard.classList.add('movie-card'); // Keeping old CSS class for styling
        
        // FIX: Prioritize 'thumbnail' for image source as per your JSON
        const imgSrc = match.thumbnail || match.poster || ''; 
        const webpSource = imgSrc.replace(/\.(png|jpe?g)/i, '.webp');

        matchCard.innerHTML = `
            <picture>
                <source srcset="${webpSource}" type="image/webp" onerror="this.remove()">
                <img data-src="${imgSrc}" src="${imgSrc}" alt="${match.title}" class="lazyload" width="200" height="300" loading="lazy">
            </picture>
            <h3>${match.title}</h3>
            <p class="match-status">${match.status || 'غير معروف'}</p>
        `;
        matchCard.addEventListener('click', () => {
            console.log(`⚡ [Interaction] Match card clicked for ID: ${match.id}`);
            openAdLink(DIRECT_LINK_COOLDOWN_MATCH_CARD, 'matchCard');
            showMatchDetails(match.id);
        });
        return matchCard;
    }

    function initializeLazyLoad() {
        if ('IntersectionObserver' in window) {
            let lazyLoadImages = document.querySelectorAll('.lazyload');
            let imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        let image = entry.target;
                        if (image.dataset.src && (!image.src || image.src !== image.dataset.src)) {
                            image.src = image.dataset.src;
                            const pictureParent = image.closest('picture');
                            if (pictureParent) {
                                const sourceElement = pictureParent.querySelector('source');
                                if (sourceElement && sourceElement.dataset.srcset) {
                                    sourceElement.srcset = sourceElement.dataset.srcset;
                                }
                            }
                        }
                        image.classList.remove('lazyload');
                        observer.unobserve(image);
                    }
                });
            }, {
                rootMargin: '0px 0px 100px 0px'
            });

            lazyLoadImages.forEach(function(image) {
                imageObserver.observe(image);
            });
        } else {
            // Fallback for browsers that don't support Intersection Observer
            let lazyLoadImages = document.querySelectorAll('.lazyload');
            lazyLoadImages.forEach(function(image) {
                if (image.dataset.src) {
                    image.src = image.dataset.src;
                    const pictureParent = image.closest('picture');
                    if (pictureParent) {
                        const sourceElement = pictureParent.querySelector('source');
                        if (sourceElement && sourceElement.dataset.srcset) {
                            sourceElement.srcset = sourceElement.dataset.srcset;
                        }
                    }
                }
            });
        }
        console.log('🖼️ [Lazy Load] IntersectionObserver initialized for images (or fallback applied).');
    }

    function displayMatches(matchesToDisplay, targetGridElement) {
        if (!targetGridElement) {
            console.error('❌ displayMatches: Target grid element is null or undefined.');
            return;
        }
        targetGridElement.innerHTML = ''; // Clear old content

        if (!matchesToDisplay || matchesToDisplay.length === 0) {
            targetGridElement.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No matches found matching your criteria.</p>';
            console.log(`⚽ [Display] No matches to display in ${targetGridElement.id}.`);
            return;
        }

        console.log(`⚽ [Display] Displaying ${matchesToDisplay.length} matches in ${targetGridElement.id}.`);
        matchesToDisplay.forEach(match => {
            targetGridElement.appendChild(createMatchCard(match));
        });
        console.log(`⚽ [Display] Finished displaying ${matchesToDisplay.length} matches in ${targetGridElement.id}.`);
        initializeLazyLoad(); // Re-initialize lazy load for new elements
    }

    function paginateMatches(matchesArray, page) {
        if (!Array.isArray(matchesArray) || matchesArray.length === 0) {
            displayMatches([], currentMatchGridElement);
            updatePaginationButtons(0);
            return;
        }

        const startIndex = (page - 1) * matchesPerPage;
        const endIndex = startIndex + matchesPerPage;
        const paginatedMatches = matchesArray.slice(startIndex, endIndex);

        displayMatches(paginatedMatches, currentMatchGridElement);
        updatePaginationButtons(matchesArray.length);
        console.log(`➡️ [Pagination] Displaying page ${page}. Matches from index ${startIndex} to ${Math.min(endIndex, matchesArray.length)-1}.`);
    }

    function updatePaginationButtons(totalMatches) {
        if (currentPaginationPrevBtn) currentPaginationPrevBtn.disabled = currentPage === 1;
        if (currentPaginationNextBtn) currentPaginationNextBtn.disabled = currentPage * matchesPerPage >= totalMatches;
        console.log(`🔄 [Pagination] Buttons updated. Current page: ${currentPage}, Total matches: ${totalMatches}`);
    }

    function filterMatchesByCategory(category) {
        let filtered = [];
        let title = '';
        const now = new Date(); 

        if (category === 'home') {
            filtered = [...matchesData].sort((a, b) => new Date(b.date_time) - new Date(a.date_time)); 
            title = 'أبرز المباريات والجديد';
            console.log(`⚽ [Filter] Displaying recent/all matches for home view.`);
        } else if (category === 'live') {
            filtered = matchesData.filter(match => match.status && match.status.toLowerCase() === 'live' && new Date(match.date_time) <= now);
            title = 'مباريات كرة القدم مباشرة الآن';
            console.log(`⚽ [Filter] Displaying live matches.`);
        } else if (category === 'upcoming') {
            const today = new Date(); today.setHours(0,0,0,0);
            const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); tomorrow.setHours(0,0,0,0);
            
            // Default filter for upcoming is all future matches
            filtered = matchesData.filter(match => match.status && match.status.toLowerCase() === 'upcoming' && new Date(match.date_time) > now);
            filtered.sort((a, b) => new Date(a.date_time) - new Date(b.date_time)); 
            title = 'مواعيد مباريات كرة القدم القادمة';
            console.log(`⚽ [Filter] Displaying all upcoming matches.`);

        } else if (category === 'highlights') {
            filtered = matchesData.filter(match => match.highlights_url !== null && match.highlights_url !== '' && match.status && match.status.toLowerCase() === 'finished');
            filtered.sort((a, b) => new Date(b.date_time) - new Date(a.date_time)); 
            title = 'أهداف وملخصات المباريات';
            console.log(`⚽ [Filter] Displaying highlights.`);
        } else if (category === 'news') {
            filtered = []; 
            title = 'آخر أخبار كرة القدم';
            console.log(`📰 [Filter] Displaying news (placeholder).`);
        }
        
        if (currentSectionTitleElement) {
            currentSectionTitleElement.textContent = title;
        }

        currentFilteredMatches = filtered;
        currentPage = 1; 
        paginateMatches(currentFilteredMatches, currentPage);

        const currentSectionElement = document.getElementById(`${category}-section`);
        if (currentSectionElement) {
            const emptyState = currentSectionElement.querySelector('.empty-state');
            if (emptyState) {
                emptyState.style.display = filtered.length === 0 ? 'block' : 'none';
            }
            const paginationControls = currentSectionElement.querySelector('.pagination-controls');
            if (paginationControls) {
                paginationControls.style.display = filtered.length === 0 ? 'none' : 'flex';
            }
        }

    }


    function performSearch() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filtered = [];
        if (query) {
            filtered = matchesData.filter(match =>
                match.title.toLowerCase().includes(query) ||
                (match.league_name && match.league_name.toLowerCase().includes(query)) ||
                (match.home_team && match.home_team.toLowerCase().includes(query)) ||
                (match.away_team && match.away_team.toLowerCase().includes(query)) ||
                (Array.isArray(match.commentators) ? match.commentators.some(c => c.toLowerCase().includes(query)) : (match.commentators && String(match.commentators).toLowerCase().includes(query)))
            );
            if (currentSectionTitleElement) {
                currentSectionTitleElement.textContent = `نتائج البحث عن "${query}"`;
            }
            console.log(`🔍 [Search] Search performed for "${query}". Found ${filtered.length} results.`);
        } else {
            filterMatchesByCategory('home');
            return; 
        }
        currentPage = 1;
        currentFilteredMatches = filtered;
        paginateMatches(currentFilteredMatches, currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Function to render a specific view based on template
    function renderView(viewName) {
        console.log(`🔄 [View Render] Rendering view: ${viewName}`);
        contentDisplay.innerHTML = ''; // Clear current content

        let template;
        switch (viewName) {
            case 'home':
                template = homeViewTemplate;
                break;
            case 'live':
                template = liveMatchesTemplate;
                break;
            case 'upcoming':
                template = upcomingMatchesTemplate;
                break;
            case 'highlights':
                template = highlightsTemplate;
                break;
            case 'news':
                template = newsTemplate;
                break;
            case 'details':
                template = matchDetailsViewTemplate;
                break;
            default:
                console.error(`Invalid view name: ${viewName}. Falling back to home.`);
                template = homeViewTemplate;
                viewName = 'home';
        }

        if (template) {
            const clone = template.content.cloneNode(true);
            contentDisplay.appendChild(clone);
            currentView = viewName;

            // --- IMPORTANT: Update ALL dynamically assigned DOM references AFTER cloning the template ---
            if (viewName === 'home') {
                matchGridSection = document.getElementById('match-grid-section');
                mainMatchGrid = document.getElementById('main-match-grid');
                homePrevPageBtn = document.getElementById('home-prev-page-btn');
                homeNextPageBtn = document.getElementById('home-next-page-btn');
                currentSectionTitleElement = document.getElementById('home-matches-title');
                currentMatchGridElement = mainMatchGrid;
                currentPaginationPrevBtn = homePrevPageBtn;
                currentPaginationNextBtn = homeNextPageBtn;
                filterMatchesByCategory('home');
                
                // Re-attach listeners for home pagination buttons (remove old first)
                if (homePrevPageBtn) {
                    homePrevPageBtn.removeEventListener('click', handlePaginationClick); 
                    homePrevPageBtn.addEventListener('click', () => handlePaginationClick('prev'));
                }
                if (homeNextPageBtn) {
                    homeNextPageBtn.removeEventListener('click', handlePaginationClick); 
                    homeNextPageBtn.addEventListener('click', () => handlePaginationClick('next'));
                }

            } else if (viewName === 'details') {
                matchDetailsSection = contentDisplay.querySelector('.match-details-section');
                backToHomeBtn = document.getElementById('back-to-home-btn');
                videoContainer = document.getElementById('match-player-container');
                videoOverlay = document.getElementById('video-overlay');
                videoLoadingSpinner = document.getElementById('video-loading-spinner');
                matchDetailsPoster = document.getElementById('match-details-poster');
                matchDetailsTitleElement = document.getElementById('match-details-title-element');
                matchDetailsDescription = document.getElementById('match-details-description');
                matchDetailsDateTime = document.getElementById('match-details-date-time');
                matchDetailsLeague = document.getElementById('match-details-league');
                matchDetailsCommentators = document.getElementById('match-details-commentators');
                matchDetailsTeams = document.getElementById('match-details-teams');
                matchDetailsStadium = document.getElementById('match-details-stadium');
                matchDetailsStatus = document.getElementById('match-details-status');
                matchDetailsScoreContainer = document.getElementById('match-details-score-container');
                matchDetailsScore = document.getElementById('match-details-score');
                matchDetailsHighlightsContainer = document.getElementById('match-details-highlights-container');
                matchDetailsHighlightsLink = document.getElementById('match-details-highlights-link');
                suggestedMatchGrid = document.getElementById('suggested-match-grid');
                suggestedMatchesSection = document.querySelector('.suggested-matches-section');

                // Re-attach event listeners for elements inside details view
                if (backToHomeBtn) {
                    backToHomeBtn.removeEventListener('click', handleBackToHomeClick); 
                    backToHomeBtn.addEventListener('click', handleBackToHomeClick);
                }
                if (matchDetailsPoster) {
                    matchDetailsPoster.removeEventListener('click', handleMatchDetailsPosterClick);
                    matchDetailsPoster.addEventListener('click', handleMatchDetailsPosterClick);
                }
                if (videoOverlay) {
                    videoOverlay.removeEventListener('click', handleVideoOverlayClick);
                    videoOverlay.addEventListener('click', handleVideoOverlayClick);
                }

            } else { // For other category views like live, upcoming, highlights, news
                currentMatchGridElement = document.getElementById(`${viewName}-match-grid`) || document.getElementById(`${viewName}-grid`);
                currentSectionTitleElement = document.getElementById(`${viewName}-matches-title`) || document.getElementById(`${viewName}-title`);
                currentPaginationPrevBtn = document.getElementById(`${viewName}-prev-page-btn`);
                currentPaginationNextBtn = document.getElementById(`${viewName}-next-page-btn`);
                filterMatchesByCategory(viewName);

                // Re-attach listeners for pagination buttons in these views
                if (currentPaginationPrevBtn) {
                    currentPaginationPrevBtn.removeEventListener('click', handlePaginationClick);
                    currentPaginationPrevBtn.addEventListener('click', () => handlePaginationClick('prev'));
                }
                if (currentPaginationNextBtn) {
                    currentPaginationNextBtn.removeEventListener('click', handlePaginationClick);
                    currentPaginationNextBtn.addEventListener('click', () => handlePaginationClick('next'));
                }
                // Attach filter button listeners if they exist in the current view
                const filterBtns = contentDisplay.querySelectorAll('.filter-controls .filter-btn');
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        filterBtns.forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        const filterType = e.target.dataset.filterType;
                        const filterValue = e.target.dataset.filterValue;
                        handleFilterChange(filterType, filterValue, viewName);
                    });
                });
            }
            console.log(`✅ View "${viewName}" rendered successfully.`);
        } else {
            console.error(`❌ Template for view "${viewName}" not found.`);
        }
    }
    
    function handlePaginationClick(direction) {
        if (direction === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (direction === 'next') {
            const totalPages = Math.ceil(currentFilteredMatches.length / matchesPerPage);
            if (currentPage < totalPages) {
                currentPage++;
            }
        }
        paginateMatches(currentFilteredMatches, currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log(`➡️ [Pagination] Clicked ${direction}. Current page: ${currentPage}`);
    }

    function handleBackToHomeClick() {
        console.log('🔙 [Interaction] Back to Home button clicked.');
        showHomePage();
    }

    function handleMatchDetailsPosterClick() {
        console.log('🖼️ [Ad Click] Match details poster clicked. Attempting to open direct link.');
        openAdLink(DIRECT_LINK_COOLDOWN_MATCH_CARD, 'matchDetailsPoster');
    }

    async function handleVideoOverlayClick(e) {
        console.log('⏯️ [Ad Click] Video overlay clicked. Attempting to open direct link.');
        const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');

        if (adOpened) {
            if (videoOverlay) {
                videoOverlay.style.pointerEvents = 'none';
                videoOverlay.classList.add('hidden');
            }
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
            console.log('[Video Player] Overlay hidden, allowing iframe interaction after ad.');
        } else {
            console.log('[Video Overlay] Ad did not open due to cooldown. Overlay remains active.');
        }
        e.stopPropagation(); 
    }


    async function showMatchDetails(matchId) {
        console.log(`🔍 [Navigation] Displaying match details for ID: ${matchId}`);
        const match = matchesData.find(m => m.id === matchId);

        if (match) {
            currentDetailedMatch = match;
            renderView('details'); 

            // Populate details after template is rendered and elements are available
            if (matchDetailsTitleElement) matchDetailsTitleElement.textContent = match.title || 'غير متوفر';
            if (matchDetailsDescription) matchDetailsDescription.textContent = match.short_description || 'لا يوجد وصف متاح.';
            
            const matchDateTime = match.date_time ? new Date(match.date_time) : null;
            const formattedDateTime = matchDateTime ? matchDateTime.toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'غير متوفر';
            if (matchDetailsDateTime) matchDetailsDateTime.textContent = formattedDateTime;
            
            if (matchDetailsLeague) matchDetailsLeague.textContent = match.league_name || 'غير محدد';
            if (matchDetailsCommentators) matchDetailsCommentators.textContent = Array.isArray(match.commentators) ? match.commentators.join(', ') : match.commentators || 'غير متوفر';
            if (matchDetailsTeams) matchDetailsTeams.textContent = `${match.home_team || 'فريق غير معروف'} vs ${match.away_team || 'فريق غير معروف'}`;
            if (matchDetailsStadium) matchDetailsStadium.textContent = match.stadium || 'غير متوفر';
            if (matchDetailsStatus) matchDetailsStatus.textContent = match.status || 'غير معروف';

            if (match.status && match.status.toLowerCase() === 'finished' && match.score) {
                if (matchDetailsScoreContainer) matchDetailsScoreContainer.classList.remove('hidden');
                if (matchDetailsScore) matchDetailsScore.textContent = match.score;
            } else {
                if (matchDetailsScoreContainer) matchDetailsScoreContainer.classList.add('hidden');
            }

            if (match.highlights_url) {
                if (matchDetailsHighlightsContainer) matchDetailsHighlightsContainer.classList.remove('hidden');
                if (matchDetailsHighlightsLink) matchDetailsHighlightsLink.href = match.highlights_url;
            } else {
                if (matchDetailsHighlightsContainer) matchDetailsHighlightsContainer.classList.add('hidden');
            }

            if (matchDetailsPoster) {
                const posterSrc = match.thumbnail || match.poster || '';
                matchDetailsPoster.src = posterSrc;
                matchDetailsPoster.alt = match.title;
                matchDetailsPoster.setAttribute('width', '250'); 
                matchDetailsPoster.setAttribute('height', '180'); 
                console.log(`[Details] Poster set for ${match.title}`);
            }

            const videoUrl = match.embed_url;

            if (videoContainer) {
                videoContainer.innerHTML = ''; 
                if (videoUrl) {
                    const newIframeElement = document.createElement('iframe');
                    newIframeElement.id = 'match-player-iframe';
                    newIframeElement.setAttribute('src', videoUrl);
                    newIframeElement.setAttribute('frameborder', '0');
                    newIframeElement.setAttribute('allowfullscreen', '');
                    newIframeElement.setAttribute('scrolling', 'no');
                    newIframeElement.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
                    newIframeElement.style.width = '100%';
                    newIframeElement.style.height = '100%';
                    videoContainer.appendChild(newIframeElement);
                    console.log('[Video Player] New iframe created for player.');
                } else {
                    videoContainer.innerHTML = '<p style="text-align: center; color: var(--text-color); margin-top: 20px;">Sorry, video cannot be played (invalid link).</p>';
                    console.error(`❌ Failed to get video link for match ID: ${matchId}. Cannot initialize player.`);
                }
            }
            
            if (videoOverlay) {
                videoOverlay.style.pointerEvents = 'auto'; 
                videoOverlay.classList.remove('hidden');
                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'block';
            }
            setTimeout(() => {
                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
            }, 2000); 

            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.log('[Navigation] Scrolled to top.');

            const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const newUrl = new URL(window.location.origin);
            newUrl.searchParams.set('view', 'details');
            newUrl.searchParams.set('id', match.id);
            newUrl.searchParams.set('title', matchSlug);

            history.pushState({ view: 'details', id: match.id, slug: matchSlug }, match.title, newUrl.toString());
            console.log(`🔗 [URL] URL updated to ${newUrl.toString()}`);

            updatePageMetadata(match);
            generateAndInjectSchema(match);

            displaySuggestedMatches(match.id, match.league_name);
            console.log(`✨ [Suggestions] Calling displaySuggestedMatches for ID: ${match.id}`);

        } else {
            console.error('❌ [Navigation] Match not found for ID:', matchId, 'Redirecting to homepage.');
            showHomePage();
        }
    }

    // START: Updated function for Meta Tags
    function updatePageMetadata(match = null) {
        let canonicalLink = document.getElementById('dynamic-canonical');
        if (!canonicalLink) { 
            canonicalLink = document.querySelector('link[rel="canonical"]');
            if (!canonicalLink) {
                canonicalLink = document.createElement('link');
                canonicalLink.setAttribute('rel', 'canonical');
                document.head.appendChild(canonicalLink);
            }
        }

        let pageTitle, pageDescription, pageKeywords, ogUrl, ogTitle, ogDescription, ogImage, ogType;
        let twitterTitle, twitterDescription, twitterImage, twitterCard;

        if (match) {
            const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const matchUrl = `${window.location.origin}/view/?details&id=${match.id}&title=${matchSlug}`;
            canonicalLink.setAttribute('href', matchUrl);

            pageTitle = `${match.title} - مشاهدة أونلاين على شاهد كورة بجودة عالية`;
            const shortDescription = (match.short_description || `شاهد مباراة ${match.title} بث مباشر بجودة عالية على شاهد كورة. تابع أهداف وملخصات أقوى المباريات العالمية والمحلية.`).substring(0, 155);
            pageDescription = shortDescription + (match.short_description && match.short_description.length > 155 ? '...' : '');

            const matchKeywords = [
                match.title,
                match.league_name,
                match.home_team,
                match.away_team,
                match.status,
                'شاهد كورة', 'بث مباشر', 'مباراة اليوم', 'أهداف', 'ملخصات', 'كرة قدم', 'مشاهدة مجانية',
                'دوري', 'بطولة', 'اونلاين'
            ].filter(Boolean).join(', '); 
            pageKeywords = matchKeywords;

            ogUrl = matchUrl;
            ogTitle = `${match.title} - شاهد أونلاين على شاهد كورة`;
            ogDescription = pageDescription;
            ogImage = match.thumbnail || match.poster || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png'; 
            ogType = "video.other"; 

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = match.thumbnail || match.poster || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png'; 
            twitterCard = "summary_large_image";

        } else {
            pageTitle = 'شاهد كورة - Ultimate Pitch: تجربة كرة القدم النهائية';
            pageDescription = 'شاهد كورة - ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.';
            pageKeywords = 'شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch';

            ogUrl = window.location.origin + '/';
            canonicalLink.setAttribute('href', ogUrl);
            ogTitle = 'شاهد كورة - Ultimate Pitch: كل كرة القدم في مكان واحد';
            ogDescription = pageDescription;
            ogImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png';
            ogType = 'website';

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png';
            twitterCard = "summary_large_image";
        }

        if (document.getElementById('dynamic-title')) document.title = pageTitle; 
        if (document.getElementById('dynamic-title')) document.getElementById('dynamic-title').textContent = pageTitle; 
        if (document.getElementById('dynamic-description')) document.getElementById('dynamic-description').setAttribute('content', pageDescription);
        if (document.getElementById('dynamic-keywords')) document.getElementById('dynamic-keywords').setAttribute('content', pageKeywords);

        if (document.getElementById('dynamic-og-title')) document.getElementById('dynamic-og-title').setAttribute('content', ogTitle);
        if (document.getElementById('dynamic-og-description')) document.getElementById('dynamic-og-description').setAttribute('content', ogDescription);
        if (document.getElementById('dynamic-og-image')) document.getElementById('dynamic-og-image').setAttribute('content', ogImage);
        if (document.getElementById('dynamic-og-image-alt')) document.getElementById('dynamic-og-image-alt').setAttribute('content', ogTitle); 
        if (document.getElementById('dynamic-og-url')) document.getElementById('dynamic-og-url').setAttribute('content', ogUrl);
        if (document.getElementById('dynamic-og-type')) document.getElementById('dynamic-og-type').setAttribute('content', ogType);

        if (document.getElementById('dynamic-twitter-title')) document.getElementById('dynamic-twitter-title').setAttribute('content', twitterTitle);
        if (document.getElementById('dynamic-twitter-description')) document.getElementById('dynamic-twitter-description').setAttribute('content', twitterDescription);
        if (document.getElementById('dynamic-twitter-image')) document.getElementById('dynamic-twitter-image').setAttribute('content', twitterImage);
        if (document.getElementById('dynamic-twitter-card')) document.getElementById('dynamic-twitter-card').setAttribute('content', twitterCard);

        console.log('📄 [SEO] Meta tags updated.');
    }
    // END: Updated function for Meta Tags

    // START: Updated function for JSON-LD Schema
    function generateAndInjectSchema(match = null) {
        let schemaScriptElement = document.getElementById('json-ld-schema'); 
        if (!schemaScriptElement) {
            schemaScriptElement = document.createElement('script');
            schemaScriptElement.type = 'application/ld+json';
            schemaScriptElement.id = 'json-ld-schema';
            document.head.appendChild(schemaScriptElement);
        }

        if (!match) {
            schemaScriptElement.textContent = '';
            console.log('📄 [SEO] No JSON-LD schema for homepage.');
            return;
        }

        const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
        const matchUrl = `${window.location.origin}/view/?details&id=${match.id}&title=${matchSlug}`;

        let formattedUploadDate;
        if (match.date_time) {
            try {
                const date = new Date(match.date_time);
                if (!isNaN(date.getTime())) {
                    formattedUploadDate = date.toISOString();
                } else {
                    formattedUploadDate = new Date().toISOString(); 
                }
            } catch (e) {
                formattedUploadDate = new Date().toISOString(); 
            }
        } else {
            formattedUploadDate = new Date().toISOString(); 
        }

        const commentatorsArray = Array.isArray(match.commentators) ? match.commentators : String(match.commentators || '').split(',').map(s => s.trim()).filter(s => s !== '');
        const teamsArray = [match.home_team, match.away_team].filter(Boolean); 

        const schema = {
            "@context": "https://schema.org",
            "@type": "VideoObject", 
            "name": match.title,
            "description": match.short_description || `شاهد فيديو ${match.title} بجودة عالية على شاهد كوره.`,
            "thumbnailUrl": match.thumbnail || match.poster, 
            "uploadDate": formattedUploadDate,
            "contentUrl": match.embed_url, 
            "embedUrl": match.embed_url, 
            "interactionCount": "100000", 
            "publisher": {
                "@type": "Organization",
                "name": "شاهد كوره",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png", 
                    "width": 200,
                    "height": 50
                }
            },
            "potentialAction": {
                "@type": "WatchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": matchUrl,
                    "inLanguage": "ar",
                    "actionPlatform": [
                        "http://schema.org/DesktopWebPlatform",
                        "http://schema.org/MobileWebPlatform"
                    ]
                },
                "expectsAcceptanceOf": {
                    "@type": "Offer",
                    "name": "مشاهدة المباراة",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "http://schema.org/InStock",
                    "url": matchUrl
                }
            },
            "duration": match.duration || "PT2H", 

            "sport": "Football", 
            "event": { 
                "@type": "SportsEvent",
                "name": match.title,
                "startDate": formattedUploadDate,
                "location": {
                    "@type": "Place",
                    "name": match.stadium || "غير متوفر"
                },
                "competitor": teamsArray.map(teamName => ({
                    "@type": "SportsTeam",
                    "name": teamName
                })),
                "subEvent": match.league_name ? {
                    "@type": "SportsLeague",
                    "name": match.league_name
                } : undefined,
                "description": match.short_description || `مباراة كرة قدم بين ${match.home_team} و ${match.away_team}.`
            },
            "commentator": commentatorsArray.map(name => ({ "@type": "Person", "name": name }))
        };

        const ratingValue = parseFloat(match.rating);
        if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 10) {
            schema.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": ratingValue.toFixed(1),
                "bestRating": "10",
                "ratingCount": "10000" 
            };
        }
        

        schemaScriptElement.textContent = JSON.stringify(schema, null, 2); 
        console.log('📄 [SEO] New JSON-LD schema added/updated.');
    }
    // END: Updated function for JSON-LD Schema

    function displaySuggestedMatches(currentMatchId, currentLeagueName) {
        if (!suggestedMatchGrid) {
            console.error('❌ displaySuggestedMatches: suggestedMatchGrid is null or undefined. Cannot display suggested matches.');
            return;
        }

        let suggested = [];

        if (currentLeagueName) {
            suggested = matchesData.filter(match =>
                match.id !== currentMatchId &&
                match.league_name && match.league_name === currentLeagueName
            );
            suggested = suggested.sort(() => 0.5 - Math.random()); 
        }

        if (suggested.length < 24) {
            const otherMatches = matchesData.filter(match => 
                match.id !== currentMatchId && 
                !suggested.includes(match)
            );
            const shuffledOthers = otherMatches.sort(() => 0.5 - Math.random());
            const needed = 24 - suggested.length;
            suggested = [...suggested, ...shuffledOthers.slice(0, needed)];
        }

        const finalSuggested = suggested.slice(0, 24); 

        if (finalSuggested.length === 0) {
            suggestedMatchGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No suggested matches available currently.</p>';
            console.log('✨ [Suggestions] No suggested matches available after filtering.');
            return;
        }

        displayMatches(finalSuggested, suggestedMatchGrid);
        console.log(`✨ [Suggestions] Displayed ${finalSuggested.length} suggested matches in ${suggestedMatchGrid.id}.`);
    }

    function showHomePage() {
        console.log('🏠 [Navigation] Displaying homepage.');
        renderView('home'); 

        if (searchInput) searchInput.value = '';
        if (currentSectionTitleElement) currentSectionTitleElement.textContent = 'أبرز المباريات والجديد';

        currentFilteredMatches = matchesData.length > 0 ? [...matchesData].sort(() => 0.5 - Math.random()) : [];
        currentPage = 1;
        paginateMatches(currentFilteredMatches, currentPage);

        if (videoOverlay) {
            videoOverlay.style.pointerEvents = 'none';
            videoOverlay.classList.add('hidden');
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
        }

        if (videoContainer) {
            videoContainer.innerHTML = '';
            console.log('[Video Player] match-player-container cleared on homepage navigation.');
        }
        currentDetailedMatch = null; 

        const newUrl = new URL(window.location.origin);
        history.pushState({ view: 'home' }, 'شاهد كورة - الصفحة الرئيسية', newUrl.toString());
        console.log(`🔗 [URL] URL updated to ${newUrl.toString()}`);

        updatePageMetadata();
        generateAndInjectSchema();
    }

    // --- 5. Event Listeners ---
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('nav-open');
            console.log('☰ [Interaction] Menu toggled.');
        });
    }

    if (homeNavLink) {
        homeNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🏠 [Interaction] Home link in navigation clicked.');
            showHomePage();
            if (mainNav && mainNav.classList.contains('nav-open')) {
                mainNav.classList.remove('nav-open');
            }
        });
    }

    navLinks.forEach(link => {
        if (link.id !== 'home-nav-link-actual') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = e.target.dataset.targetView;
                if (targetView) {
                    console.log(`🔗 [Navigation] Nav link clicked for view: ${targetView}`);
                    renderView(targetView);
                    const newUrl = new URL(window.location.origin);
                    newUrl.searchParams.set('view', targetView);
                    history.pushState({ view: targetView }, `شاهد كورة - ${e.target.textContent}`, newUrl.toString());
                    console.log(`🔗 [URL] URL updated to ${newUrl.toString()}`);
                    updatePageMetadata(); 
                    generateAndInjectSchema();
                }
                if (mainNav && mainNav.classList.contains('nav-open')) {
                    mainNav.classList.remove('nav-open');
                    console.log('📱 [Interaction] Sub nav link clicked, menu closed.');
                } else {
                    console.log('📱 [Interaction] Sub nav link clicked.');
                }
            });
        }
    });

    if (watchNowBtn) {
        watchNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🎬 [Interaction] "Watch Matches Now" button clicked.');
            renderView('home'); 
            const currentMatchGridSection = document.getElementById('match-grid-section');
            if (currentMatchGridSection) {
                currentMatchGridSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
        console.log('🔍 [Event] Search button listener attached.');
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
                searchInput.blur(); 
            }
        });
        console.log('🔍 [Event] Search input keypress listener attached.');
    }
    
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        console.warn('🚫 [Security] Right-click disabled.');
    });

    document.addEventListener('keydown', e => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.metaKey && e.altKey && e.key === 'I')
        ) {
            e.preventDefault();
            console.warn(`🚫 [Security] Developer tools/source shortcut prevented: ${e.key}`);
        }
    });

    const devtoolsDetector = (() => {
        const threshold = 160;
        let isOpen = false;
        const checkDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            if (widthThreshold || heightThreshold) {
                if (!isOpen) {
                    isOpen = true;
                    console.warn('🚨 [Security] Developer tools detected! This action is discouraged.');
                }
            } else {
                if (isOpen) {
                    isOpen = false;
                    console.log('✅ [Security] Developer tools closed.');
                }
            }
        };

        window.addEventListener('resize', checkDevTools);
        setInterval(checkDevTools, 1000); 
        checkDevTools(); 
    })();

    // Initial page load logic based on URL
    function initialPageLoadLogic() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        const idParam = urlParams.get('id');

        if (viewParam === 'details' && idParam) {
            const matchId = parseInt(idParam);
            const match = matchesData.find(m => m.id === matchId);

            if (!isNaN(matchId) && match) {
                console.log(`🚀 [Initial Load] Attempting to load match details from URL: ID ${matchId}`);
                showMatchDetails(matchId);
            } else {
                console.warn('⚠️ [Initial Load] Invalid match ID in URL or match not found. Displaying homepage.');
                showHomePage();
            }
        } else if (viewParam && ['home', 'live', 'upcoming', 'highlights', 'news'].includes(viewParam)) {
            console.log(`🚀 [Initial Load] Loading view from URL: ${viewParam}`);
            renderView(viewParam); 
            updatePageMetadata(); 
            generateAndInjectSchema();
        } else {
            console.log('🚀 [Initial Load] No specific view in URL. Displaying homepage.');
            showHomePage();
        }
    }

    // Handle browser's back/forward buttons
    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] Browser history navigation detected.', event.state);
        if (matchesData.length === 0) {
            console.warn('[Popstate] Match data not yet loaded, attempting to fetch and apply state.');
            fetchMatchesData().then(() => {
                if (event.state && event.state.view === 'details' && event.state.id) {
                    const match = matchesData.find(m => m.id === event.state.id);
                    if (match) {
                        showMatchDetails(event.state.id);
                    } else {
                        console.warn('[Popstate] Match not found on popstate after data load. Displaying homepage.');
                        showHomePage();
                    }
                } else {
                    showHomePage();
                }
            }).catch(err => {
                console.error('[Popstate] Failed to fetch match data on popstate:', err);
                showHomePage();
            });
            return;
        }

        if (event.state && event.state.view === 'details' && event.state.id) {
            const match = matchesData.find(m => m.id === event.state.id);
            if (match) {
                showMatchDetails(event.state.id);
            } else {
                console.warn('[Popstate] Match not found on popstate. Displaying homepage.');
                showHomePage();
            }
        } else if (event.state && ['home', 'live', 'upcoming', 'highlights', 'news'].includes(event.state.view)) {
             renderView(event.state.view);
             updatePageMetadata(); 
             generateAndInjectSchema();
        }
        else {
            showHomePage();
        }
    });

    // Start fetching data when the script loads
    fetchMatchesData();
});
