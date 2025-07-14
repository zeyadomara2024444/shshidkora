// script.js - الكود النهائي والمحسّن لموقع "شاهد كورة"
// هذا الكود يدمج جميع التحسينات والإصلاحات التي ناقشناها، مع التركيز على الأداء، SEO، وتجربة المستخدم.

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Shahid Kora script execution started.');

    // --- 1. DOM Element References (Static Elements) ---
    // هذه العناصر موجودة في HTML مباشرة ولا تتغير عند تبديل العروض
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const homeLogoLink = document.getElementById('home-logo-link');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const contentDisplay = document.getElementById('content-display'); // الحاوية الرئيسية للعروض الديناميكية
    const heroSection = document.getElementById('hero-section');
    const watchNowBtn = document.getElementById('watch-now-btn');
    const homeNavLinkActual = document.getElementById('home-nav-link-actual');

    // --- Variables for Dynamic DOM Elements ---
    // هذه المتغيرات سيتم ربطها بالعناصر الجديدة بعد كل عملية "renderView"
    let mainMatchGrid, homeMatchesTitle, homePrevPageBtn, homeNextPageBtn;
    let liveMatchGrid, liveEmptyState, livePrevPageBtn, liveNextPageBtn, liveMatchesTitle, liveFilterBtns;
    let upcomingMatchGrid, upcomingEmptyState, upcomingPrevPageBtn, upcomingNextPageBtn, upcomingMatchesTitle, upcomingFilterBtns;
    let highlightsGrid, highlightsEmptyState, highlightsPrevPageBtn, highlightsNextPageBtn, highlightsTitle;
    let newsGrid, newsEmptyState, newsPrevPageBtn, newsNextPageBtn, newsTitle;
    let matchDetailsSection, backToHomeBtn, matchDetailsTitleElement, matchPlayerContainer, videoOverlay, videoLoadingSpinner;
    let matchDetailsPoster, matchDetailsDescription, matchDetailsDateTime, matchDetailsLeague, matchDetailsCommentators, matchDetailsTeams, matchDetailsStadium, matchDetailsStatus, matchDetailsScoreContainer, matchDetailsScore, matchDetailsHighlightsContainer, matchDetailsHighlightsLink;
    let suggestedMatchGrid;

    // --- Application State Variables ---
    const itemsPerPage = 20; // Number of items to display per page
    let currentView = 'home'; // Tracks the currently active view
    let currentDataForPagination = []; // Data subset for current pagination
    let currentPage = 1;
    let matchesData = []; // Stores all fetched match data from matches.json
    let newsData = []; // Stores all fetched news data from news.json
    let currentDetailedMatch = null; // Stores data of the currently viewed detailed match

    // --- 1.1. Critical Static DOM Element Verification ---
    // Ensures essential unchanging HTML elements are present on page load.
    const requiredStaticElements = {
        '#menu-toggle': menuToggle,
        '#main-nav': mainNav,
        '#home-logo-link': homeLogoLink,
        '#search-input': searchInput,
        '#search-button': searchButton,
        '#content-display': contentDisplay,
        '#hero-section': heroSection,
        '#watch-now-btn': watchNowBtn,
        '#home-nav-link-actual': homeNavLinkActual
    };

    let criticalStaticError = false;
    for (const [id, element] of Object.entries(requiredStaticElements)) {
        if (!element) {
            console.error(`❌ Fatal Error: Static DOM element with ID "${id}" not found. Please check your HTML file.`);
            criticalStaticError = true;
        }
    }
    if (criticalStaticError) {
        console.error('🛑 Script execution halted due to missing critical static DOM elements. Fix your HTML!');
        document.body.innerHTML = '<div style="text-align: center; margin-top: 100px; color: #f44336; font-size: 20px;">' +
                                    'Sorry, a technical error occurred. Please refresh the page or try again later.' +
                                    '<p style="font-size: 14px; color: #ccc;">(Missing core page elements)</p></div>';
        return; // Stop script execution here
    } else {
        console.log('✅ All critical static DOM elements found.');
    }

    // --- 2. Adsterra Configuration ---
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/spqbhmyax?key=2469b039d4e7c471764bd04c57824cf2'; // **IMPORTANT: Update this Adsterra direct link**
    const DIRECT_LINK_COOLDOWN_CARD_CLICK = 3 * 60 * 1000; // 3 minutes cooldown for card/poster clicks
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 10 * 1000; // 10 seconds cooldown for video player interactions

    let lastDirectLinkClickTimeCard = 0;
    let lastDirectLinkClickTimeVideoInteraction = 0;

    function openAdLink(cooldownDuration, type) {
        let lastClickTime;
        let setLastClickTime;

        if (type === 'card' || type === 'detailsPoster') {
            lastClickTime = lastDirectLinkClickTimeCard;
            setLastClickTime = (time) => lastDirectLinkClickTimeCard = time;
        } else if (type === 'videoOverlay' || type === 'videoInteraction') {
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

    // --- 3. Data Fetching and Management ---

    async function fetchData(url) {
        try {
            console.log(`📡 Fetching data from ${url}...`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status} - Failed to load ${url}.`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error(`❌ Fetched data from ${url} is not an array. Expected an array of objects.`);
                return [];
            }
            console.log(`✅ Successfully loaded data from ${url}: ${data.length} items found.`);
            return data;
        } catch (error) {
            console.error(`❌ Failed to load data from ${url}:`, error.message);
            if (contentDisplay) {
                contentDisplay.innerHTML = '<p style="text-align: center; color: var(--text-color); margin-top: 50px;">Sorry, we couldn\'t load the data. Please try again later or check your JSON files.</p>';
            }
            return [];
        }
    }

    async function loadAllData() {
        // Ensure matches.json and news.json are in the same directory as script.js
        matchesData = await fetchData('matches.json');
        newsData = await fetchData('news.json');
        
        // After all data is loaded, proceed with initial page load logic
        initialPageLoadLogic();
    }

    // --- 4. Content Creation & Display Functions ---

    function createMatchCard(match) {
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card');
        const webpSource = match.thumbnail ? match.thumbnail.replace(/\.(png|jpe?g)/i, '.webp') : '';
        const team1Logo = match.team1_logo ? `<img src="${match.team1_logo}" alt="${match.team1} Logo" class="team-logo" width="40" height="40" loading="lazy">` : '';
        const team2Logo = match.team2_logo ? `<img src="${match.team2_logo}" alt="${match.team2} Logo" class="team-logo" width="40" height="40" loading="lazy">` : '';
        
        let scoreDisplay = '';
        if (match.status === 'finished' && match.score) {
            scoreDisplay = `<span class="match-score">${match.score}</span>`;
        } else if (match.status === 'live') {
            scoreDisplay = `<span class="live-indicator">مباشر <i class="fas fa-circle"></i></span>`;
        }

        const matchTitle = match.title || `${match.team1 || 'Team 1'} vs ${match.team2 || 'Team 2'}`;
        const defaultThumbnail = '/images/default-match-thumbnail.jpg'; // Fallback image
        const displayThumbnail = match.thumbnail || defaultThumbnail;

        matchCard.innerHTML = `
            <picture>
                ${webpSource ? `<source srcset="${webpSource}" type="image/webp" onerror="this.remove()">` : ''}
                <img data-src="${displayThumbnail}" src="${displayThumbnail}" alt="${matchTitle}" class="lazyload" width="300" height="180" loading="lazy">
            </picture>
            <div class="match-card-content">
                <h3 class="match-card-title">${matchTitle}</h3>
                <p class="match-card-league">${match.league || 'Unknown League'}</p>
                <p class="match-card-teams">
                    ${team1Logo} ${match.team1 || 'Unknown Team'} ${scoreDisplay} ${match.team2 || 'Unknown Team'} ${team2Logo}
                </p>
                <p class="match-card-time">${match.date_time ? new Date(match.date_time).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Time N/A'}</p>
                <button class="btn btn-primary btn-watch" data-match-id="${match.id}">شاهد الآن</button>
            </div>
        `;
        // Event listeners for card and button are now handled via Event Delegation in `attachDynamicEventListeners`
        return matchCard;
    }

    function createNewsCard(newsItem) {
        const newsCard = document.createElement('div');
        newsCard.classList.add('news-card');
        const webpSource = newsItem.image ? newsItem.image.replace(/\.(png|jpe?g)/i, '.webp') : '';
        const defaultNewsImage = '/images/default-news-image.jpg'; // Fallback image
        const displayImage = newsItem.image || defaultNewsImage;

        newsCard.innerHTML = `
            <picture>
                ${webpSource ? `<source srcset="${webpSource}" type="image/webp" onerror="this.remove()">` : ''}
                <img data-src="${displayImage}" src="${displayImage}" alt="${newsItem.title}" class="lazyload" width="300" height="200" loading="lazy">
            </picture>
            <div class="news-card-content">
                <h3 class="news-card-title">${newsItem.title}</h3>
                <p class="news-card-date">${newsItem.date ? new Date(newsItem.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date N/A'}</p>
                <p class="news-card-summary">${newsItem.summary || (newsItem.description ? newsItem.description.substring(0, 100) + '...' : 'No summary available.')}</p>
                <a href="${newsItem.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-read-more">اقرأ المزيد <i class="fas fa-external-link-alt"></i></a>
            </div>
        `;
        // Event listeners handled via Event Delegation
        return newsCard;
    }

    function displayItems(itemsToDisplay, targetGridElement, type = 'match') {
        if (!targetGridElement) {
            console.error(`❌ displayItems: Target grid element (ID: ${targetGridElement ? targetGridElement.id : 'N/A'}) is null or undefined for view: ${currentView}, item type: ${type}`);
            return;
        }
        targetGridElement.innerHTML = ''; // Clear old content

        if (!itemsToDisplay || itemsToDisplay.length === 0) {
            // Empty state handled by the calling function (e.g., showView or performSearch)
            console.log(`🎬 [Display] No items to display in ${targetGridElement.id}.`);
            return;
        }

        console.log(`🎬 [Display] Rendering ${itemsToDisplay.length} items in ${targetGridElement.id}.`);
        const fragment = document.createDocumentFragment(); // Use DocumentFragment for performance
        itemsToDisplay.forEach(item => {
            if (type === 'match') {
                fragment.appendChild(createMatchCard(item));
            } else if (type === 'news') {
                fragment.appendChild(createNewsCard(item));
            }
        });
        targetGridElement.appendChild(fragment); // Append all items at once
        console.log(`🎬 [Display] Rendered ${itemsToDisplay.length} items in ${targetGridElement.id}.`);
        initializeLazyLoad(); // Re-initialize lazy loading for new elements
    }

    function paginateItems(itemsArray, page, targetGridElement, type) {
        if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
            displayItems([], targetGridElement, type); // Clear the grid
            return;
        }

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = itemsArray.slice(startIndex, endIndex);

        displayItems(paginatedItems, targetGridElement, type);
        console.log(`➡️ [Pagination] Displaying page ${page}. Items from index ${startIndex} to ${Math.min(endIndex, itemsArray.length) - 1}.`);
    }

    function updatePaginationButtons(totalItems, currentPageNum, prevBtn, nextBtn) {
        // Ensure buttons exist before trying to access their properties
        if (prevBtn) prevBtn.disabled = currentPageNum === 1;
        if (nextBtn) nextBtn.disabled = currentPageNum * itemsPerPage >= totalItems;
        console.log(`🔄 [Pagination] Buttons updated. Current page: ${currentPageNum}, Total items: ${totalItems}`);
    }

    function performSearch() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filteredItems = [];
        let sectionTitle = '';
        let targetGrid, prevBtn, nextBtn, emptyStateElement, typeOfItems;

        // Determine which data to search based on the current view
        if (currentView === 'news') {
            filteredItems = newsData.filter(item =>
                item.title.toLowerCase().includes(query) ||
                (item.summary && item.summary.toLowerCase().includes(query)) ||
                (item.description && item.description.toLowerCase().includes(query))
            );
            sectionTitle = query ? `نتائج البحث عن "${query}" في الأخبار` : 'آخر أخبار كرة القدم';
            targetGrid = newsGrid;
            prevBtn = newsPrevPageBtn;
            nextBtn = newsNextPageBtn;
            emptyStateElement = newsEmptyState;
            typeOfItems = 'news';
        } else { // Search in matches (includes home, live, upcoming, highlights)
            const allMatches = matchesData;
            filteredItems = allMatches.filter(match =>
                match.title.toLowerCase().includes(query) ||
                (match.team1 && match.team1.toLowerCase().includes(query)) ||
                (match.team2 && match.team2.toLowerCase().includes(query)) ||
                (match.league && match.league.toLowerCase().includes(query)) ||
                (match.commentators && match.commentators.toLowerCase().includes(query)) ||
                (match.stadium && match.stadium.toLowerCase().includes(query))
            );
            
            // Determine the correct grid based on the current view
            switch(currentView) {
                case 'home':
                    targetGrid = mainMatchGrid;
                    prevBtn = homePrevPageBtn;
                    nextBtn = homeNextPageBtn;
                    sectionTitle = query ? `نتائج البحث عن "${query}" في المباريات` : 'أبرز المباريات والجديد';
                    break;
                case 'live':
                    filteredItems = filteredItems.filter(m => m.status === 'live');
                    targetGrid = liveMatchGrid;
                    prevBtn = livePrevPageBtn;
                    nextBtn = liveNextPageBtn;
                    emptyStateElement = liveEmptyState;
                    sectionTitle = query ? `نتائج البحث عن "${query}" في المباريات المباشرة` : 'مباريات كرة القدم مباشرة الآن';
                    break;
                case 'upcoming':
                    filteredItems = filteredItems.filter(m => m.status === 'upcoming');
                    targetGrid = upcomingMatchGrid;
                    prevBtn = upcomingPrevPageBtn;
                    nextBtn = upcomingNextPageBtn;
                    emptyStateElement = upcomingEmptyState;
                    sectionTitle = query ? `نتائج البحث عن "${query}" في المباريات القادمة` : 'مواعيد مباريات كرة القدم القادمة';
                    break;
                case 'highlights':
                    filteredItems = filteredItems.filter(m => m.highlights_url);
                    targetGrid = highlightsGrid;
                    prevBtn = highlightsPrevPageBtn;
                    nextBtn = highlightsNextPageBtn;
                    emptyStateElement = highlightsEmptyState;
                    sectionTitle = query ? `نتائج البحث عن "${query}" في الأهداف والملخصات` : 'أهداف وملخصات المباريات';
                    break;
                default:
                    targetGrid = mainMatchGrid; // Fallback to home grid
                    prevBtn = homePrevPageBtn;
                    nextBtn = homeNextPageBtn;
                    sectionTitle = 'أبرز المباريات والجديد';
                    break;
            }
            typeOfItems = 'match';
        }

        // Update the section title
        if (currentView === 'home' && homeMatchesTitle) homeMatchesTitle.textContent = sectionTitle;
        if (currentView === 'live' && liveMatchesTitle) liveMatchesTitle.textContent = sectionTitle;
        if (currentView === 'upcoming' && upcomingMatchesTitle) upcomingMatchesTitle.textContent = sectionTitle;
        if (currentView === 'highlights' && highlightsTitle) highlightsTitle.textContent = sectionTitle;
        if (currentView === 'news' && newsTitle) newsTitle.textContent = sectionTitle;
        
        currentPage = 1;
        currentDataForPagination = filteredItems; // Set for current pagination
        paginateItems(currentDataForPagination, currentPage, targetGrid, typeOfItems);
        updatePaginationButtons(currentDataForPagination.length, currentPage, prevBtn, nextBtn);
        if (emptyStateElement) {
            emptyStateElement.style.display = filteredItems.length === 0 ? 'block' : 'none';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log(`🔍 [Search] Search for "${query}" executed. Found ${filteredItems.length} results in ${currentView} view.`);
    }

    function showMatchDetails(matchId) {
        console.log(`🔍 [Navigation] Displaying match details for ID: ${matchId}`);
        const match = matchesData.find(m => m.id === matchId);

        if (!match) {
            console.error('❌ [Navigation] Match not found for ID:', matchId, '. Redirecting to homepage.');
            showView('home');
            return;
        }

        currentDetailedMatch = match;
        currentView = 'details';
        renderView('match-details-view-template'); // Render the details template first

        // --- IMPORTANT: Re-bind DOM elements AFTER template is rendered and appended ---
        matchDetailsSection = contentDisplay.querySelector('.match-details-section');
        backToHomeBtn = document.getElementById('back-to-home-btn');
        matchDetailsTitleElement = document.getElementById('match-details-title-element');
        matchPlayerContainer = document.getElementById('match-player-container');
        videoOverlay = document.getElementById('video-overlay');
        videoLoadingSpinner = document.getElementById('video-loading-spinner');
        matchDetailsPoster = document.getElementById('match-details-poster');
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

        // Verify critical elements for details view after binding
        if (!checkDynamicElementsForDetailsView()) {
            console.error('Some critical match details elements are missing after binding. Check your HTML template.');
            return; // Stop function if elements aren't found
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('[Navigation] Scrolled to top.');

        matchDetailsTitleElement.textContent = match.title || `${match.team1} vs ${match.team2}` || 'Match Details';
        matchDetailsDescription.textContent = match.description || 'No description available for this match.';
        matchDetailsDateTime.textContent = match.date_time ? new Date(match.date_time).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
        matchDetailsLeague.textContent = match.league || 'N/A';
        matchDetailsCommentators.textContent = match.commentators || 'N/A';
        matchDetailsTeams.textContent = `${match.team1 || 'Team One'} vs ${match.team2 || 'Team Two'}`;
        matchDetailsStadium.textContent = match.stadium || 'N/A';
        matchDetailsStatus.textContent = match.status || 'N/A';

        if (match.status === 'finished' && match.score) {
            matchDetailsScoreContainer.classList.remove('hidden');
            matchDetailsScore.textContent = match.score;
        } else {
            matchDetailsScoreContainer.classList.add('hidden');
        }

        if (match.highlights_url) {
            matchDetailsHighlightsContainer.classList.remove('hidden');
            matchDetailsHighlightsLink.href = match.highlights_url;
        } else {
            matchDetailsHighlightsContainer.classList.add('hidden');
        }

        if (matchDetailsPoster) {
            const displayThumbnail = match.thumbnail || '/images/default-match-thumbnail.jpg';
            matchDetailsPoster.src = displayThumbnail;
            matchDetailsPoster.alt = match.title;
            matchDetailsPoster.setAttribute('width', '250');
            matchDetailsPoster.setAttribute('height', '180');
            console.log(`[Details] Thumbnail set for ${match.title}`);
        }

        if (matchPlayerContainer) {
            matchPlayerContainer.innerHTML = ''; // Clear previous iframe
            const newIframeElement = document.createElement('iframe');
            newIframeElement.id = 'match-player-iframe';
            newIframeElement.setAttribute('src', match.embed_url);
            newIframeElement.setAttribute('frameborder', '0');
            newIframeElement.setAttribute('allowfullscreen', '');
            newIframeElement.setAttribute('scrolling', 'no');
            newIframeElement.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
            newIframeElement.style.width = '100%';
            newIframeElement.style.height = '100%';
            matchPlayerContainer.appendChild(newIframeElement);
            console.log('[Video Player] New iframe player created.');
        }

        if (videoOverlay) {
            videoOverlay.style.pointerEvents = 'auto'; // Enable click for ad
            videoOverlay.classList.remove('hidden');
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'block';
        }
        setTimeout(() => {
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
        }, 2000); // Hide spinner after 2 seconds (estimated load)

        const matchSlug = (match.title || `${match.team1}-vs-${match.team2}`).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
        const newUrl = new URL(window.location.origin);
        newUrl.searchParams.set('view', 'details');
        newUrl.searchParams.set('id', match.id);
        newUrl.searchParams.set('title', matchSlug);

        history.pushState({ view: 'details', id: match.id }, match.title, newUrl.toString());
        console.log(`🔗 [URL] URL updated to ${newUrl.toString()}`);

        updatePageMetadata(match, 'match');
        generateAndInjectSchema(match, 'match');
        displaySuggestedMatches(match.id);
        attachDynamicEventListeners(); // Re-attach dynamic listeners for this view
    }

    // --- Dynamic Elements Verification for Details View ---
    // Called after `match-details-view-template` is rendered and elements are rebound
    function checkDynamicElementsForDetailsView() {
        const requiredDynamicElements = {
            '#match-details-title-element': matchDetailsTitleElement,
            '#match-player-container': matchPlayerContainer,
            '#video-overlay': videoOverlay,
            '#video-loading-spinner': videoLoadingSpinner,
            '#match-details-poster': matchDetailsPoster,
            '#match-details-description': matchDetailsDescription,
            '#match-details-date-time': matchDetailsDateTime,
            '#match-details-league': matchDetailsLeague,
            '#match-details-commentators': matchDetailsCommentators,
            '#match-details-teams': matchDetailsTeams,
            '#match-details-stadium': matchDetailsStadium,
            '#match-details-status': matchDetailsStatus,
            '#suggested-match-grid': suggestedMatchGrid,
            '#back-to-home-btn': backToHomeBtn
        };

        let criticalError = false;
        for (const [id, element] of Object.entries(requiredDynamicElements)) {
            if (!element) {
                console.error(`❌ Fatal Error: Dynamic element with ID "${id}" not found in details view after binding. Please check your HTML template.`);
                criticalError = true;
            }
        }
        return !criticalError;
    }


    // --- SEO Functions ---

    // START: Updated function for Meta Tags
    function updatePageMetadata(item = null, type = 'home') { // type can be 'match', 'news', or 'home'
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }

        let pageTitle, pageDescription, pageKeywords, ogUrl, ogTitle, ogDescription, ogImage, ogType;
        let twitterTitle, twitterDescription, twitterImage, twitterCard;

        if (item && type === 'match') {
            const itemSlug = (item.title || `${item.team1}-vs-${item.team2}`).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const itemUrl = `${window.location.origin}/?view=details&id=${item.id}&title=${itemSlug}`;
            canonicalLink.setAttribute('href', itemUrl);

            pageTitle = `${item.title || `${item.team1} vs ${item.team2}`} - بث مباشر وملخصات على شاهد كورة`;
            const shortDescription = (item.description || `شاهد بث مباشر وملخصات مباراة ${item.title || `${item.team1} ضد ${item.team2}`} بجودة عالية على شاهد كورة. تابع آخر أخبار كرة القدم، المباريات المباشرة والقادمة، والأهداف.`).substring(0, 155);
            pageDescription = shortDescription + (item.description && item.description.length > 155 ? '...' : '');

            pageKeywords = [
                item.title, item.team1, item.team2, item.league, item.commentators,
                'شاهد كورة', 'بث مباشر', 'مباريات اليوم', 'أهداف', 'ملخصات', 'أخبار كرة قدم',
                'كرة القدم', 'مشاهدة مجانية', 'Ultimate Pitch'
            ].filter(Boolean).join(', ');

            ogUrl = itemUrl;
            ogTitle = `${item.title || `${item.team1} vs ${item.team2}`} - شاهد كورة`;
            ogDescription = pageDescription;
            ogImage = item.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png'; // Fallback OG image
            ogType = "video.other"; // A general video type suitable for sports events
            
            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image";

        } else if (item && type === 'news') {
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const itemUrl = `${window.location.origin}/?view=news&id=${item.id}&title=${itemSlug}`;
            canonicalLink.setAttribute('href', itemUrl);

            pageTitle = `${item.title} - آخر أخبار كرة القدم على شاهد كورة`;
            const shortDescription = (item.summary || item.description).substring(0, 155);
            pageDescription = shortDescription + ((item.summary || item.description).length > 155 ? '...' : '');

            pageKeywords = [
                item.title, 'أخبار كرة قدم', 'شاهد كورة', 'آخر الأخبار', 'الدوريات العالمية',
                'انتقالات اللاعبين', 'تحليل كروي'
            ].filter(Boolean).join(', ');

            ogUrl = itemUrl;
            ogTitle = `${item.title} - شاهد كورة: أخبار كرة القدم`;
            ogDescription = pageDescription;
            ogImage = item.image || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png'; // Fallback OG image
            ogType = "article";
            
            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image";

        } else { // Default home page or general view without specific item details
            pageTitle = 'شاهد كورة - Ultimate Pitch: تجربة كرة القدم النهائية | بث مباشر وأهداف';
            pageDescription = 'شاهد كورة - ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.';
            pageKeywords = 'شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch';

            ogUrl = window.location.origin + '/';
            canonicalLink.setAttribute('href', ogUrl);
            ogTitle = 'شاهد كورة - Ultimate Pitch: كل كرة القدم في مكان واحد';
            ogDescription = pageDescription;
            ogImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png'; // Default OG image for homepage
            ogType = 'website';

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png'; // Default Twitter image for homepage
            twitterCard = "summary_large_image";
        }

        // Update all meta tags using their IDs
        document.title = pageTitle;
        document.getElementById('dynamic-title').textContent = pageTitle;
        document.getElementById('dynamic-description').setAttribute('content', pageDescription);
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (keywordsMeta) keywordsMeta.setAttribute('content', pageKeywords);

        document.getElementById('dynamic-og-title').setAttribute('content', ogTitle);
        document.getElementById('dynamic-og-description').setAttribute('content', ogDescription);
        document.getElementById('dynamic-og-image').setAttribute('content', ogImage);
        document.getElementById('dynamic-og-image-alt').setAttribute('content', ogTitle);
        document.getElementById('dynamic-og-url').setAttribute('content', ogUrl);
        const ogTypeMeta = document.querySelector('meta[property="og:type"]');
        if (ogTypeMeta) ogTypeMeta.setAttribute('content', ogType);

        document.getElementById('dynamic-twitter-title').setAttribute('content', twitterTitle);
        document.getElementById('dynamic-twitter-description').setAttribute('content', twitterDescription);
        document.getElementById('dynamic-twitter-image').setAttribute('content', twitterImage);
        const twitterCardMeta = document.querySelector('meta[property="twitter:card"]');
        if (twitterCardMeta) twitterCardMeta.setAttribute('content', twitterCard);

        document.getElementById('dynamic-canonical').setAttribute('href', canonicalLink.getAttribute('href'));

        console.log('📄 [SEO] Meta tags updated.');
    }
    // END: Updated function for Meta Tags

    // START: Updated function for JSON-LD Schema
    function generateAndInjectSchema(item = null, type = 'home') { // type can be 'match', 'news', or 'home'
        let schemaScriptElement = document.getElementById('json-ld-schema');
        if (!schemaScriptElement) {
            schemaScriptElement = document.createElement('script');
            schemaScriptElement.type = 'application/ld+json';
            schemaScriptElement.id = 'json-ld-schema';
            document.head.appendChild(schemaScriptElement);
        }

        if (!item) {
            schemaScriptElement.textContent = ''; // Clear any schema if no specific item
            console.log('📄 [SEO] No JSON-LD schema for homepage or general view.');
            return;
        }

        let schema = {};

        if (type === 'match') {
            const itemSlug = (item.title || `${item.team1}-vs-${item.team2}`).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const itemUrl = `${window.location.origin}/?view=details&id=${item.id}&title=${itemSlug}`;
            const formattedDate = item.date_time ? new Date(item.date_time).toISOString() : new Date().toISOString();

            schema = {
                "@context": "https://schema.org",
                "@type": "SportsEvent", // Appropriate type for sports matches
                "name": item.title || `${item.team1} vs ${item.team2}`,
                "description": item.description || `Watch live stream and highlights of ${item.title || `${item.team1} vs ${item.team2}`} on Shahid Kora.`,
                "startDate": formattedDate,
                "location": {
                    "@type": "Place",
                    "name": item.stadium || "Unknown Stadium"
                },
                "competitor": [
                    { "@type": "SportsTeam", "name": item.team1, "image": item.team1_logo || undefined },
                    { "@type": "SportsTeam", "name": item.team2, "image": item.team2_logo || undefined }
                ],
                "eventStatus": "http://schema.org/EventScheduled", // Default status
                "url": itemUrl,
                "image": item.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png',
                "organizer": {
                    "@type": "Organization",
                    "name": "شاهد كورة",
                    "url": "https://shahidkora.online"
                },
                "video": { // Include VideoObject as a property of the SportsEvent
                    "@type": "VideoObject",
                    "name": item.title || `${item.team1} vs ${item.team2} - Live Stream`,
                    "description": item.description || `Live stream video for ${item.title || `${item.team1} vs ${item.team2}`}.`,
                    "thumbnailUrl": item.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png',
                    "uploadDate": formattedDate,
                    "contentUrl": item.embed_url, // Actual video URL
                    "embedUrl": item.embed_url,   // Same as contentUrl if embedded
                    "publisher": {
                        "@type": "Organization",
                        "name": "شاهد كورة",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png", // Your site's logo
                            "width": 200, "height": 50
                        }
                    }
                }
            };

            // Add score if the match is finished
            if (item.status === 'finished' && item.score) {
                schema.eventStatus = "http://schema.org/EventCompleted";
                schema.result = {
                    "@type": "SportsEventStatus",
                    "name": item.score
                };
            } else if (item.status === 'live') {
                schema.eventStatus = "http://schema.org/EventLive";
            }


        } else if (type === 'news') {
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const itemUrl = `${window.location.origin}/?view=news&id=${item.id}&title=${itemSlug}`;
            const formattedDate = item.date ? new Date(item.date).toISOString() : new Date().toISOString();

            schema = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": item.title,
                "image": item.image || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png',
                "datePublished": formattedDate,
                "dateModified": formattedDate, // Can be modified date if available
                "author": {
                    "@type": "Person",
                    "name": item.author || "Shahid Kora"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "شاهد كورة",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png",
                        "width": 200, "height": 50
                    }
                },
                "description": item.summary || item.description
            };
        }

        schemaScriptElement.textContent = JSON.stringify(schema, null, 2);
        console.log('📄 [SEO] New JSON-LD schema added/updated.');
    }
    // END: Updated function for JSON-LD Schema

    function displaySuggestedMatches(currentMatchId) {
        if (!suggestedMatchGrid || !currentDetailedMatch) {
            console.error('❌ displaySuggestedMatches: suggestedMatchGrid or currentDetailedMatch is missing. Cannot display suggested matches.');
            return;
        }

        const currentMatchLeague = currentDetailedMatch.league;
        let suggested = [];

        if (currentMatchLeague) {
            // Find matches from the same league
            suggested = matchesData.filter(match =>
                match.id !== currentMatchId &&
                match.league && match.league.toLowerCase() === currentMatchLeague.toLowerCase()
            );
            suggested = suggested.sort(() => 0.5 - Math.random());
        }

        // If not enough suggestions from the same league, add random matches
        if (suggested.length < 12) { // Aim for 12 suggestions
            const otherMatches = matchesData.filter(match =>
                match.id !== currentMatchId && !suggested.includes(match)
            );
            const shuffledOthers = otherMatches.sort(() => 0.5 - Math.random());
            const needed = 12 - suggested.length;
            suggested = [...suggested, ...shuffledOthers.slice(0, needed)];
        }

        const finalSuggested = suggested.slice(0, 12);

        if (finalSuggested.length === 0) {
            suggestedMatchGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No suggested matches available currently.</p>';
            console.log('✨ [Suggestions] No suggested matches available after filtering.');
            return;
        }

        displayItems(finalSuggested, suggestedMatchGrid, 'match');
        console.log(`✨ [Suggestions] Displayed ${finalSuggested.length} suggested matches in ${suggestedMatchGrid.id}.`);
    }

    // --- 5. View Management and Routing ---

    function renderView(templateId) {
        const template = document.getElementById(templateId);
        if (!template) {
            console.error(`❌ View template with ID "${templateId}" not found.`);
            return;
        }
        
        // Remove all currently active view sections
        document.querySelectorAll('.view-section').forEach(section => section.remove());
        
        // Hide hero section by default unless the view is 'home'
        if (heroSection) heroSection.style.display = 'none';

        const clone = document.importNode(template.content, true);
        contentDisplay.appendChild(clone);
        console.log(`✅ [View] Template rendered: ${templateId}`);

        // --- Re-bind dynamic DOM elements after they are added to the page ---
        // This is crucial for the script to access the new elements.
        if (templateId === 'home-view-template') {
            mainMatchGrid = document.getElementById('main-match-grid');
            homeMatchesTitle = document.getElementById('home-matches-title');
            homePrevPageBtn = document.getElementById('home-prev-page-btn');
            homeNextPageBtn = document.getElementById('home-next-page-btn');
            if (heroSection) heroSection.style.display = 'flex'; // Show hero for home view
        } else if (templateId === 'live-matches-template') {
            liveMatchGrid = document.getElementById('live-match-grid');
            liveEmptyState = document.getElementById('live-empty-state');
            livePrevPageBtn = document.getElementById('live-prev-page-btn');
            liveNextPageBtn = document.getElementById('live-next-page-btn');
            liveMatchesTitle = document.getElementById('live-matches-title');
            liveFilterBtns = document.querySelectorAll('#live-matches-section .filter-btn');
        } else if (templateId === 'upcoming-matches-template') {
            upcomingMatchGrid = document.getElementById('upcoming-match-grid');
            upcomingEmptyState = document.getElementById('upcoming-empty-state');
            upcomingPrevPageBtn = document.getElementById('upcoming-prev-page-btn');
            upcomingNextPageBtn = document.getElementById('upcoming-next-page-btn');
            upcomingMatchesTitle = document.getElementById('upcoming-matches-title');
            upcomingFilterBtns = document.querySelectorAll('#upcoming-matches-section .filter-btn');
        } else if (templateId === 'highlights-template') {
            highlightsGrid = document.getElementById('highlights-grid');
            highlightsEmptyState = document.getElementById('highlights-empty-state');
            highlightsPrevPageBtn = document.getElementById('highlights-prev-page-btn');
            highlightsNextPageBtn = document.getElementById('highlights-next-page-btn');
            highlightsTitle = document.getElementById('highlights-title');
        } else if (templateId === 'news-template') {
            newsGrid = document.getElementById('news-grid');
            newsEmptyState = document.getElementById('news-empty-state');
            newsPrevPageBtn = document.getElementById('news-prev-page-btn');
            newsNextPageBtn = document.getElementById('news-next-page-btn');
            newsTitle = document.getElementById('news-title');
        }
        // Match details elements are rebound inside `showMatchDetails` as they are specific to that flow

        // Re-attach all dynamic event listeners for the new view
        attachDynamicEventListeners();
    }


    function showView(viewName, filter = null) {
        currentView = viewName;
        currentPage = 1; // Reset page when changing views
        currentDataForPagination = []; // Clear previous pagination data

        // Hide hero section unless the view is 'home'
        if (heroSection && viewName !== 'home') {
            heroSection.style.display = 'none';
        }

        // Clear iframe content and hide video overlay when navigating away from details page
        if (matchPlayerContainer) {
            matchPlayerContainer.innerHTML = '';
            console.log('[Video Player] match-player-container cleared on navigation.');
        }
        if (videoOverlay) {
            videoOverlay.style.pointerEvents = 'none';
            videoOverlay.classList.add('hidden');
        }
        if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
        
        currentDetailedMatch = null; // Clear detailed match data
        
        let newUrl = new URL(window.location.origin);

        // Update active navigation link
        navLinks.forEach(link => link.classList.remove('active'));
        const activeNavLink = document.querySelector(`.main-nav ul li a[data-target-view="${viewName}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        } else if (viewName === 'home' && homeNavLinkActual) {
            homeNavLinkActual.classList.add('active'); // Ensure home is active by default
        }


        switch (viewName) {
            case 'home':
                renderView('home-view-template');
                homeMatchesTitle.textContent = 'أبرز المباريات والجديد';
                currentDataForPagination = [...matchesData].sort(() => 0.5 - Math.random()); // Randomize matches for home
                paginateItems(currentDataForPagination, currentPage, mainMatchGrid, 'match');
                updatePaginationButtons(currentDataForPagination.length, currentPage, homePrevPageBtn, homeNextPageBtn);
                newUrl.searchParams.delete('view'); // Homepage does not need 'view' param
                updatePageMetadata(); // Default homepage metadata
                generateAndInjectSchema(); // Clear schema for homepage
                break;
            case 'live':
                renderView('live-matches-template');
                liveMatchesTitle.textContent = 'مباريات كرة القدم مباشرة الآن';
                const liveMatches = matchesData.filter(m => m.status === 'live');
                currentDataForPagination = liveMatches;
                paginateItems(currentDataForPagination, currentPage, liveMatchGrid, 'match');
                updatePaginationButtons(currentDataForPagination.length, currentPage, livePrevPageBtn, liveNextPageBtn);
                liveEmptyState.style.display = liveMatches.length === 0 ? 'block' : 'none';
                newUrl.searchParams.set('view', 'live');
                updatePageMetadata(null, 'live'); // General metadata for live view
                generateAndInjectSchema(); // No specific schema for a list view
                break;
            case 'upcoming':
                renderView('upcoming-matches-template');
                upcomingMatchesTitle.textContent = 'مواعيد مباريات كرة القدم القادمة';
                let upcomingMatches = matchesData.filter(m => m.status === 'upcoming');
                if (filter === 'today') {
                    const today = new Date().toISOString().slice(0, 10);
                    upcomingMatches = upcomingMatches.filter(m => m.date_time && m.date_time.startsWith(today));
                    upcomingMatchesTitle.textContent = 'مباريات اليوم';
                } else if (filter === 'tomorrow') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                    upcomingMatches = upcomingMatches.filter(m => m.date_time && m.date_time.startsWith(tomorrowStr));
                    upcomingMatchesTitle.textContent = 'مباريات الغد';
                }
                currentDataForPagination = upcomingMatches;
                paginateItems(currentDataForPagination, currentPage, upcomingMatchGrid, 'match');
                updatePaginationButtons(currentDataForPagination.length, currentPage, upcomingPrevPageBtn, upcomingNextPageBtn);
                upcomingEmptyState.style.display = upcomingMatches.length === 0 ? 'block' : 'none';
                newUrl.searchParams.set('view', 'upcoming');
                if (filter) newUrl.searchParams.set('filter', filter);
                updatePageMetadata(null, 'upcoming');
                generateAndInjectSchema();
                break;
            case 'highlights':
                renderView('highlights-template');
                highlightsTitle.textContent = 'أهداف وملخصات المباريات';
                const highlightsMatches = matchesData.filter(m => m.highlights_url);
                currentDataForPagination = highlightsMatches;
                paginateItems(currentDataForPagination, currentPage, highlightsGrid, 'match');
                updatePaginationButtons(currentDataForPagination.length, currentPage, highlightsPrevPageBtn, highlightsNextPageBtn);
                highlightsEmptyState.style.display = highlightsMatches.length === 0 ? 'block' : 'none';
                newUrl.searchParams.set('view', 'highlights');
                updatePageMetadata(null, 'highlights');
                generateAndInjectSchema();
                break;
            case 'news':
                renderView('news-template');
                newsTitle.textContent = 'آخر أخبار كرة القدم';
                currentDataForPagination = newsData;
                paginateItems(currentDataForPagination, currentPage, newsGrid, 'news');
                updatePaginationButtons(currentDataForPagination.length, currentPage, newsPrevPageBtn, newsNextPageBtn);
                newsEmptyState.style.display = newsData.length === 0 ? 'block' : 'none';
                newUrl.searchParams.set('view', 'news');
                updatePageMetadata(null, 'news');
                generateAndInjectSchema();
                break;
            // 'details' case is handled by showMatchDetails function
        }
        history.pushState({ view: viewName, filter: filter }, document.title, newUrl.toString());
        console.log(`🔗 [URL] URL updated to ${newUrl.toString()}`);
        console.log(`🔄 [View] Switched to view: ${viewName}`);

        // Close mobile navigation menu if open
        if (mainNav && mainNav.classList.contains('nav-open')) {
            mainNav.classList.remove('nav-open');
        }
    }

    // --- 6. Event Listeners (using Event Delegation where possible) ---

    function attachDynamicEventListeners() {
        // --- Static Listeners (attached once on DOMContentLoaded) ---
        // These are already set up at the start of DOMContentLoaded and don't need re-attaching
        // - menuToggle, homeLogoLink, watchNowBtn, searchButton, searchInput

        // --- Event Delegation for Dynamic Elements ---

        // 6.1. Navigation Links Delegation (for nav-link class)
        // Add a single listener to the parent `mainNav` and check the target
        mainNav.removeEventListener('click', handleNavLinkClickDelegated); // Prevent multiple attachments
        mainNav.addEventListener('click', handleNavLinkClickDelegated);

        // 6.2. Pagination Buttons Delegation (for .btn-page class)
        // Add a single listener to `contentDisplay` as pagination buttons are inside dynamic views
        contentDisplay.removeEventListener('click', handlePaginationClickDelegated);
        contentDisplay.addEventListener('click', handlePaginationClickDelegated);

        // 6.3. Filter Buttons Delegation (for .filter-btn class)
        contentDisplay.removeEventListener('click', handleFilterButtonClickDelegated);
        contentDisplay.addEventListener('click', handleFilterButtonClickDelegated);

        // 6.4. Match Card and Watch Button Delegation (for .match-card and .btn-watch)
        contentDisplay.removeEventListener('click', handleMatchCardClickDelegated);
        contentDisplay.addEventListener('click', handleMatchCardClickDelegated);

        // 6.5. News Card and Read More Button Delegation (for .news-card and .btn-read-more)
        contentDisplay.removeEventListener('click', handleNewsCardClickDelegated);
        contentDisplay.addEventListener('click', handleNewsCardClickDelegated);

        // 6.6. Match Details Page Specific Listeners (must exist in DOM when attached)
        if (currentView === 'details') {
            if (backToHomeBtn) {
                backToHomeBtn.onclick = () => { // Direct assignment is fine here as it's specific to this view
                    console.log('🔙 [Interaction] Back to matches button clicked.');
                    showView('home'); // Go back to home/main matches view
                };
            }
            if (videoOverlay) {
                videoOverlay.onclick = async (e) => {
                    console.log('⏯️ [Ad Click] Video overlay clicked. Attempting to open direct link.');
                    const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');

                    if (adOpened) {
                        videoOverlay.style.pointerEvents = 'none';
                        videoOverlay.classList.add('hidden');
                        if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                        console.log('[Video Player] Overlay hidden, allowing iframe interaction after ad.');
                    } else {
                        console.log('[Video Overlay] Ad not opened due to cooldown. Overlay remains active.');
                    }
                    e.stopPropagation(); // Prevent click from bubbling up
                };
            }
            if (matchDetailsPoster) {
                matchDetailsPoster.onclick = () => { // Direct assignment is fine here
                    console.log('🖼️ [Ad Click] Match details poster clicked. Attempting to open direct link.');
                    openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'detailsPoster');
                };
            }
        }
    }

    // --- Event Delegation Handlers ---

    function handleNavLinkClickDelegated(e) {
        const target = e.target.closest('.nav-link');
        if (!target || target.id === 'home-nav-link-actual') return; // Skip if no nav-link or it's the specific home link (handled separately below)

        e.preventDefault();
        const targetView = target.dataset.targetView;
        if (targetView) {
            console.log(`🏠 [Interaction] Navigation link clicked: ${targetView}`);
            showView(targetView);
        }
    }

    function handlePaginationClickDelegated(e) {
        const target = e.target.closest('.btn-page');
        if (!target || target.disabled) return; // Ignore if not a pagination button or if disabled

        let dataArray, targetGrid, prevBtn, nextBtn, typeOfItems;

        // Determine which set of data and which grid to paginate based on current view
        switch (currentView) {
            case 'home':
                dataArray = matchesData.sort(() => 0.5 - Math.random()); // For home, always re-randomize for consistent pagination logic
                targetGrid = mainMatchGrid;
                prevBtn = homePrevPageBtn;
                nextBtn = homeNextPageBtn;
                typeOfItems = 'match';
                break;
            case 'live':
                dataArray = matchesData.filter(m => m.status === 'live');
                targetGrid = liveMatchGrid;
                prevBtn = livePrevPageBtn;
                nextBtn = liveNextPageBtn;
                typeOfItems = 'match';
                break;
            case 'upcoming':
                let filteredUpcoming = matchesData.filter(m => m.status === 'upcoming');
                const currentUpcomingFilter = document.querySelector('#upcoming-matches-section .filter-btn.active')?.dataset.filterValue;
                if (currentUpcomingFilter === 'today') {
                    const today = new Date().toISOString().slice(0, 10);
                    filteredUpcoming = filteredUpcoming.filter(m => m.date_time && m.date_time.startsWith(today));
                } else if (currentUpcomingFilter === 'tomorrow') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                    filteredUpcoming = filteredUpcoming.filter(m => m.date_time && m.date_time.startsWith(tomorrowStr));
                }
                dataArray = filteredUpcoming;
                targetGrid = upcomingMatchGrid;
                prevBtn = upcomingPrevPageBtn;
                nextBtn = upcomingNextPageBtn;
                typeOfItems = 'match';
                break;
            case 'highlights':
                dataArray = matchesData.filter(m => m.highlights_url);
                targetGrid = highlightsGrid;
                prevBtn = highlightsPrevPageBtn;
                nextBtn = highlightsNextPageBtn;
                typeOfItems = 'match';
                break;
            case 'news':
                dataArray = newsData;
                targetGrid = newsGrid;
                prevBtn = newsPrevPageBtn;
                nextBtn = newsNextPageBtn;
                typeOfItems = 'news';
                break;
            default:
                return; // Not a paginated section
        }

        if (target.id.includes('next-page-btn')) {
            const totalPages = Math.ceil(dataArray.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
            }
        } else if (target.id.includes('prev-page-btn')) {
            if (currentPage > 1) {
                currentPage--;
            }
        }
        
        paginateItems(dataArray, currentPage, targetGrid, typeOfItems);
        updatePaginationButtons(dataArray.length, currentPage, prevBtn, nextBtn);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log(`➡️ [Pagination] Clicked ${target.id}. Current Page: ${currentPage}`);
    }

    function handleFilterButtonClickDelegated(e) {
        const target = e.target.closest('.filter-btn');
        if (!target) return;

        const filterType = target.dataset.filterType;
        const filterValue = target.dataset.filterValue;

        // Remove active class from all filter buttons in the current section
        document.querySelectorAll(`#${currentView}-matches-section .filter-btn`).forEach(btn => btn.classList.remove('active'));
        // Add active class to the clicked button
        target.classList.add('active');

        currentPage = 1; // Reset page on filter change
        let filteredMatches = [];
        let targetGrid, prevBtn, nextBtn, emptyStateElement;

        if (currentView === 'live') {
            filteredMatches = matchesData.filter(m => m.status === 'live');
            liveMatchesTitle.textContent = 'مباريات كرة القدم مباشرة الآن';
            targetGrid = liveMatchGrid;
            prevBtn = livePrevPageBtn;
            nextBtn = liveNextPageBtn;
            emptyStateElement = liveEmptyState;
        } else if (currentView === 'upcoming') {
            filteredMatches = matchesData.filter(m => m.status === 'upcoming');
            if (filterValue === 'today') {
                const today = new Date().toISOString().slice(0, 10);
                filteredMatches = filteredMatches.filter(m => m.date_time && m.date_time.startsWith(today));
                upcomingMatchesTitle.textContent = 'مباريات اليوم';
            } else if (filterValue === 'tomorrow') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                filteredMatches = filteredMatches.filter(m => m.date_time && m.date_time.startsWith(tomorrowStr));
                upcomingMatchesTitle.textContent = 'مباريات الغد';
            } else { // "All Upcoming"
                upcomingMatchesTitle.textContent = 'مواعيد مباريات كرة القدم القادمة';
            }
            targetGrid = upcomingMatchGrid;
            prevBtn = upcomingPrevPageBtn;
            nextBtn = upcomingUpcomingPageBtn; // Corrected: was upcomingNextPageBtn previously, but HTML uses upcoming-next-page-btn
            emptyStateElement = upcomingEmptyState;
        }
        currentDataForPagination = filteredMatches;
        paginateItems(currentDataForPagination, currentPage, targetGrid, 'match');
        updatePaginationButtons(currentDataForPagination.length, currentPage, prevBtn, nextBtn);
        if (emptyStateElement) {
            emptyStateElement.style.display = filteredMatches.length === 0 ? 'block' : 'none';
        }
        console.log(`⚡ [Filter] Applied filter: ${filterType}=${filterValue} on ${currentView} view.`);
    }

    function handleMatchCardClickDelegated(e) {
        const watchBtn = e.target.closest('.btn-watch');
        const matchCard = e.target.closest('.match-card');

        if (watchBtn && watchBtn.dataset.matchId) {
            e.stopPropagation(); // Prevent card click if button is clicked
            console.log(`⚡ [Interaction] "Watch Now" button clicked for ID: ${watchBtn.dataset.matchId}`);
            openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card');
            showMatchDetails(parseInt(watchBtn.dataset.matchId));
        } else if (matchCard && !e.target.closest('.btn-read-more')) { // Ensure not clicking news read more link
            // If the general card area is clicked, also trigger ad
            console.log(`⚡ [Interaction] Match card clicked for ID (if available): ${matchCard.querySelector('.btn-watch')?.dataset.matchId || 'N/A'}`);
            openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card');
        }
    }

    function handleNewsCardClickDelegated(e) {
        const readMoreLink = e.target.closest('.btn-read-more');
        const newsCard = e.target.closest('.news-card');

        if (readMoreLink) {
            // Let the default link behavior happen (open in new tab)
            openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card'); // Trigger ad for news link click
            console.log(`⚡ [Interaction] "Read More" button clicked for news item.`);
        } else if (newsCard) {
            // If the general card area is clicked, also trigger ad
            openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card');
            console.log(`⚡ [Interaction] News card clicked.`);
        }
    }

    // --- Lazy Load Initialization (same as before) ---
    function initializeLazyLoad() {
        if ('IntersectionObserver' in window) {
            let lazyLoadImages = document.querySelectorAll('.lazyload');
            let imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        let image = entry.target;
                        if (image.dataset.src) {
                            image.src = image.dataset.src;
                            const pictureParent = image.closest('picture');
                            if (pictureParent) {
                                const sourceElement = pictureParent.querySelector('source');
                                if (sourceElement) { // Ensure source element exists and update srcset
                                    const webpSrcset = image.dataset.src.replace(/\.(png|jpe?g)/i, '.webp');
                                    if (sourceElement.srcset !== webpSrcset) {
                                        sourceElement.srcset = webpSrcset;
                                    }
                                }
                            }
                        }
                        image.classList.remove('lazyload');
                        observer.unobserve(image);
                    }
                });
            }, {
                rootMargin: '0px 0px 100px 0px' // Load images when 100px from viewport
            });

            lazyLoadImages.forEach(function(image) {
                imageObserver.observe(image);
            });
        } else {
            // Fallback for browsers that do not support IntersectionObserver
            let lazyLoadImages = document.querySelectorAll('.lazyload');
            lazyLoadImages.forEach(function(image) {
                if (image.dataset.src) {
                    image.src = image.dataset.src;
                    const pictureParent = image.closest('picture');
                    if (pictureParent) {
                        const sourceElement = pictureParent.querySelector('source');
                        if (sourceElement) {
                            sourceElement.srcset = image.dataset.src.replace(/\.(png|jpe?g)/i, '.webp');
                        }
                    }
                }
            });
        }
        console.log('🖼️ [Lazy Load] IntersectionObserver initialized for images (or fallback applied).');
    }

    // --- 7. Security Measures (Same as before) ---
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        console.warn('🚫 [Security] Right-click disabled.');
    });

    document.addEventListener('keydown', e => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.metaKey && e.altKey && e.key === 'I') // Mac dev tools shortcut
        ) {
            e.preventDefault();
            console.warn(`🚫 [Security] Developer tools/source shortcut prevented: ${e.key}`);
        }
    });

    const devtoolsDetector = (() => {
        const threshold = 160; // Pixel threshold for window size change detection
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
        setInterval(checkDevTools, 1000); // Check every second
        checkDevTools(); // Initial check
    })();

    // --- 8. Initial Load and History Management ---

    // Initial setup for static event listeners
    if (menuToggle && mainNav) {
        menuToggle.onclick = () => {
            mainNav.classList.toggle('nav-open');
            console.log('☰ [Interaction] Menu toggled.');
        };
    }
    if (homeLogoLink) {
        homeLogoLink.onclick = (e) => {
            e.preventDefault();
            console.log('🏠 [Interaction] Home logo clicked.');
            showView('home');
        };
    }
    if (watchNowBtn) {
        watchNowBtn.onclick = (e) => {
            e.preventDefault();
            console.log('🎬 [Interaction] "Watch Now" button clicked.');
            // Scroll to the main match grid, or switch to home view if it's not visible
            if (mainMatchGrid) mainMatchGrid.scrollIntoView({ behavior: 'smooth' });
            else showView('home'); 
        };
    }
    if (searchButton) {
        searchButton.onclick = performSearch;
        console.log('🔍 [Event] Search button listener attached.');
    }
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                performSearch();
                searchInput.blur(); // Hide keyboard on mobile
            }
        };
        console.log('🔍 [Event] Search input keypress listener attached.');
    }
    // Specific listener for the "Home" navigation link (because its ID is home-nav-link-actual)
    if (homeNavLinkActual) {
        homeNavLinkActual.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🏠 [Interaction] Home navigation link clicked.');
            showView('home');
            if (mainNav && mainNav.classList.contains('nav-open')) {
                mainNav.classList.remove('nav-open');
            }
        });
    }

    function initialPageLoadLogic() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        const idParam = urlParams.get('id');
        const filterParam = urlParams.get('filter');

        if (viewParam === 'details' && idParam) {
            const matchId = parseInt(idParam);
            const match = matchesData.find(m => m.id === matchId);
            if (!isNaN(matchId) && match) {
                console.log(`🚀 [Initial Load] Attempting to load match details from URL: ID ${matchId}`);
                showMatchDetails(matchId);
            } else {
                console.warn('⚠️ [Initial Load] Invalid match ID in URL or match not found. Displaying homepage.');
                showView('home');
            }
        } else if (viewParam) {
            console.log(`🚀 [Initial Load] Attempting to load view from URL: ${viewParam}`);
            showView(viewParam, filterParam);
        } else {
            console.log('🚀 [Initial Load] No specific view in URL. Displaying homepage.');
            showView('home');
        }
    }

    // Handles browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] Browser history navigation detected.', event.state);
        // If data isn't loaded yet (e.g., direct deep link before data fetch completes)
        if (matchesData.length === 0 || newsData.length === 0) {
            console.warn('[Popstate] Match/News data not yet loaded. Attempting to fetch data and render page based on state.');
            loadAllData().then(() => { // Reload all data then try to render
                if (event.state && event.state.view) {
                    if (event.state.view === 'details' && event.state.id) {
                        showMatchDetails(event.state.id);
                    } else {
                        showView(event.state.view, event.state.filter);
                    }
                } else {
                    showView('home');
                }
            }).catch(err => {
                console.error('[Popstate] Failed to fetch data on popstate:', err);
                // Display user-friendly error message
                document.body.innerHTML = '<div style="text-align: center; margin-top: 100px; color: #f44336; font-size: 20px;">' +
                                            'Sorry, a technical error occurred while loading data. Please refresh the page.' +
                                            '<p style="font-size: 14px; color: #ccc;">(Error restoring page state)</p></div>';
            });
            return;
        }

        // If data is already loaded
        if (event.state && event.state.view) {
            if (event.state.view === 'details' && event.state.id) {
                showMatchDetails(event.state.id);
            } else {
                showView(event.state.view, event.state.filter);
            }
        } else {
            showView('home');
        }
    });

    // Start by loading all necessary data (matches and news)
    loadAllData();
});
