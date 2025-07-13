// script.js - كود محسن وواضح لموقع بث مباشر لمباريات كرة القدم 'شاهد كورة'
// تم التركيز على أفضل أداء ممكن من جانب العميل مع الحفاظ على الوظائف والإعلانات
// والتأكد من إزالة أي عناصر قد تؤثر سلباً على الفهم من قبل محركات البحث
// تم التعديل لاستخدام iframe لروابط البث المباشر والتكامل مع نظام القوالب
// **تم التكييف ليتوافق مع هيكل ملف JSON الجديد وإصلاح جميع أخطاء الطباعة**

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Shahid Kora script execution started.');

    // --- 1. DOM Element References (Initial Page Elements) ---
    const mainContentDisplay = document.getElementById('content-display');
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const homeNavLink = document.getElementById('home-nav-link-actual');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const heroSection = document.getElementById('hero-section');
    const watchNowBtn = document.getElementById('watch-now-btn');
    
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Reference to templates
    const homeViewTemplate = document.getElementById('home-view-template');
    const liveMatchesTemplate = document.getElementById('live-matches-template');
    const upcomingMatchesTemplate = document.getElementById('upcoming-matches-template');
    const highlightsTemplate = document.getElementById('highlights-template');
    const newsTemplate = document.getElementById('news-template');
    const matchDetailsTemplate = document.getElementById('match-details-view-template');

    // Constants
    const matchesPerPage = 20; 
    let currentActiveViewElement = null; // Holds the currently active view element (the cloned section)

    let matchesData = []; // All loaded match data
    let currentFilteredMatches = []; // Matches currently selected for display/pagination
    let currentPage = 1;
    let currentDetailedMatch = null; // The match currently displayed in details view

    // --- 1.1. Critical DOM Element Verification ---
    // This ensures all required static elements and template containers are present on page load.
    const requiredElements = {
        '#content-display': mainContentDisplay,
        '#home-logo-link': document.getElementById('home-logo-link'),
        '#menu-toggle': menuToggle,
        '#main-nav': mainNav,
        '#home-nav-link-actual': homeNavLink,
        '#hero-section': heroSection,
        '#watch-now-btn': watchNowBtn,
        '#search-input': searchInput,
        '#search-button': searchButton,
        '#json-ld-schema': document.getElementById('json-ld-schema'),
        // Dynamic SEO elements (they must exist as empty elements with these IDs in HTML)
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
        // Templates themselves should also exist
        '#home-view-template': homeViewTemplate,
        '#live-matches-template': liveMatchesTemplate,
        '#upcoming-matches-template': upcomingMatchesTemplate,
        '#highlights-template': highlightsTemplate,
        '#news-template': newsTemplate,
        '#match-details-view-template': matchDetailsTemplate
    };

    let criticalError = false;
    for (const [id, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`❌ Critical Error: Required DOM element with ID "${id}" not found. Please check your HTML file.`);
            criticalError = true;
        }
    }
    if (criticalError) {
        console.error('🛑 Script execution halted due to missing critical DOM elements. Please fix your HTML!');
        document.body.innerHTML = '<div style="text-align: center; margin-top: 100px; color: #f44336; font-size: 20px;">' +
                                    'عذرًا، حدث خطأ فني. يرجاء تحديث الصفحة أو المحاولة لاحقًا.' +
                                    '<p style="font-size: 14px; color: #ccc;">(عناصر الصفحة الرئيسية مفقودة)</p></div>';
        return; // Stop script execution
    } else {
        console.log('✅ All critical DOM elements found.');
    }

    // --- 2. Adsterra Configuration ---
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/s9pzkja6hn?key=0d9ae755a41e87391567e3eab37b7cec'; // DirectLink_1
    const DIRECT_LINK_COOLDOWN_MATCH_CARD = 3 * 60 * 1000; // 3 minutes cooldown for general clicks
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 10 * 1000; // 10 seconds cooldown for video player interactions

    let lastDirectLinkClickTimeMatchCard = 0;
    let lastDirectLinkClickTimeVideoInteraction = 0;
    let videoOverlayInterval = null; // To store the interval ID for the video overlay

    /**
     * Opens an Adsterra direct link if cooldown period has passed.
     * @param {number} cooldownDuration - The cooldown duration in milliseconds.
     * @param {string} type - The type of interaction ('matchCard', 'matchDetailsPoster', 'videoOverlay').
     * @returns {boolean} True if ad link was opened, false otherwise.
     */
    function openAdLink(cooldownDuration, type) {
        let lastClickTime;
        let setLastClickTime;

        // Determine which cooldown to use based on the interaction type
        if (type === 'matchCard' || type === 'matchDetailsPoster') {
            lastClickTime = lastDirectLinkClickTimeMatchCard;
            setLastClickTime = (time) => lastDirectLinkClickTimeMatchCard = time;
        } else if (type === 'videoOverlay') {
            lastClickTime = lastDirectLinkClickTimeVideoInteraction;
            setLastClickTime = (time) => lastDirectLinkClickTimeVideoInteraction = time;
        } else {
            console.error('Invalid ad type provided to openAdLink:', type);
            return false;
        }

        const currentTime = Date.now();
        if (currentTime - lastClickTime > cooldownDuration) {
            // Cooldown has passed, open the ad link
            // Using setTimeout with 0 delay to make window.open asynchronous, reducing potential main thread blocking
            setTimeout(() => {
                const newWindow = window.open(ADSTERRA_DIRECT_LINK_URL, '_blank');
                if (newWindow) {
                    newWindow.focus(); // Try to bring the new tab/window to front
                    setLastClickTime(currentTime); // Update last click time
                    console.log(`💰 [Ad Click - ${type}] Direct link opened successfully.`);
                } else {
                    // If newWindow is null, it means popup was blocked
                    console.warn(`⚠️ [Ad Click - ${type}] Popup blocked or failed to open direct link. Ensure popups are allowed.`);
                }
            }, 0);
            return true; // Indicate that an attempt to open was made
        } else {
            // Cooldown is still active
            const timeLeft = (cooldownDuration - (currentTime - lastClickTime)) / 1000;
            console.log(`⏳ [Ad Click - ${type}] Direct link cooldown active. No new tab will be opened. Time left: ${timeLeft.toFixed(1)} seconds.`);
            return false;
        }
    }

    // --- 3. View Management (using Templates) ---

    /**
     * Dynamically loads content into the main display area from a specified template.
     * @param {string} viewId - The ID of the template element (e.g., 'home', 'live', 'details').
     * @param {Function} [callback] - An optional callback function to execute after the view is loaded, receives the cloned section element as argument.
     */
    function showView(viewId, callback = () => {}) {
        // Hide hero section when switching to any view other than 'home'
        if (heroSection) {
            heroSection.style.display = (viewId === 'home') ? 'flex' : 'none';
        }
        
        // Remove 'active' class from all navigation links
        navLinks.forEach(link => link.classList.remove('active'));

        // Clear previous content from the main display area
        mainContentDisplay.innerHTML = '';
        currentActiveViewElement = null; // Reset the reference to the currently active view element

        let templateToLoad;
        let navLinkToActivate;

        // Map viewId to its corresponding template and navigation link
        switch (viewId) {
            case 'home':
                templateToLoad = homeViewTemplate;
                navLinkToActivate = document.querySelector('[data-target-view="home"]');
                break;
            case 'live':
                templateToLoad = liveMatchesTemplate;
                navLinkToActivate = document.querySelector('[data-target-view="live"]');
                break;
            case 'upcoming':
                templateToLoad = upcomingMatchesTemplate;
                navLinkToActivate = document.querySelector('[data-target-view="upcoming"]');
                break;
            case 'highlights':
                templateToLoad = highlightsTemplate;
                navLinkToActivate = document.querySelector('[data-target-view="highlights"]');
                break;
            case 'news':
                templateToLoad = newsTemplate;
                navLinkToActivate = document.querySelector('[data-target-view="news"]');
                break;
            case 'details': // Match details view is special, it doesn't activate a top nav link
                templateToLoad = matchDetailsTemplate;
                break;
            default:
                console.error(`Attempted to load unknown view with ID: "${viewId}". Falling back to home view.`);
                showView('home'); // Fallback to home view
                return;
        }

        // Check if the template exists and has content
        if (templateToLoad && templateToLoad.content) {
            const clonedContent = templateToLoad.content.cloneNode(true); // Clone the template content (deep copy)
            const sectionElement = clonedContent.firstElementChild; // Get the root <section> element from the cloned content

            if (sectionElement) {
                sectionElement.classList.add('active-view'); // Add class for CSS animations/visibility
                mainContentDisplay.appendChild(sectionElement); // Append the cloned section to the main display area
                currentActiveViewElement = sectionElement; // Store reference to the active view element

                // Activate the corresponding navigation link if found
                if (navLinkToActivate) {
                    navLinkToActivate.classList.add('active');
                }
                
                console.log(`✅ View "${viewId}" loaded successfully from template.`);
                callback(sectionElement); // Execute callback with the newly loaded section element
            } else {
                console.error(`Error: Template with ID "${viewId}" does not contain a valid root section element.`);
            }
        } else {
            console.error(`Error: Template with ID "${viewId}" not found or its content is empty.`);
        }
    }

    // --- 4. Match Data & iframe URL Handling ---

    /**
     * Fetches match data from 'matches.json'.
     * Handles errors during fetch or JSON parsing.
     * Sorts the data by status (live, upcoming, finished) and date.
     */
    async function fetchMatchesData() {
        try {
            console.log('📡 Fetching match data from matches.json...');
            const response = await fetch('matches.json');
            if (!response.ok) {
                // If response is not OK (e.g., 404, 500), throw an error
                throw new Error(`HTTP error! Status: ${response.status} - Could not load matches.json. Check file path and server configuration.`);
            }
            matchesData = await response.json(); // Parse JSON response

            if (!Array.isArray(matchesData)) {
                console.error('❌ Fetched data is not an array. Please check matches.json format. Expected an array of match objects.');
                matchesData = []; // Reset to empty array to prevent further errors
            } else if (matchesData.length === 0) {
                console.warn('⚠️ matches.json loaded, but it is empty.');
            }

            // Standardize status to lowercase and combine team/logo fields for easier processing
            matchesData = matchesData.map(match => ({
                ...match, // Copy all existing properties
                status: match.status ? match.status.toLowerCase() : 'unknown', // Ensure status is lowercase
                // Create a 'teams' array for easier filtering/display in card functions
                teams: [match.home_team, match.away_team].filter(Boolean),
                // Create a 'team_logos' array for easier filtering/display in card functions
                team_logos: [match.home_team_logo, match.away_team_logo].filter(Boolean)
            }));

            // Sort matches: live first, then upcoming by date (ascending), then finished by most recent date (descending)
            matchesData.sort((a, b) => {
                const statusOrder = { 'live': 1, 'upcoming': 2, 'finished': 3, 'news': 4, 'highlight': 5, 'unknown': 99 }; // Define a priority order for statuses
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff; // Sort by status first

                const dateA = new Date(a.date_time); // Use date_time from the new JSON structure
                const dateB = new Date(b.date_time); // Use date_time from the new JSON structure

                if (a.status === 'finished') {
                    return dateB.getTime() - dateA.getTime(); // For finished matches, most recent first (descending date)
                }
                return dateA.getTime() - dateB.getTime(); // For live/upcoming, chronological order (ascending date)
            });
            
            console.log('✅ Match data loaded successfully from matches.json', matchesData.length, 'matches found.');
            initialPageLoadLogic(); // Proceed with initial page load logic after data is ready
        } catch (error) {
            console.error('❌ Failed to load match data:', error.message);
            // Display a user-friendly error message on the main content area
            mainContentDisplay.innerHTML = '<section class="view-section active-view container">' +
                                            '<p style="text-align: center; color: var(--up-text-primary); margin-top: 50px;">عذرًا، لم نتمكن من تحميل بيانات المباريات. يرجى المحاولة مرة أخرى لاحقًا أو التحقق من ملف matches.json.</p>' +
                                            '</section>';
            // Attempt to update the section title if it exists on the initial page load
            const homeMatchesTitle = document.getElementById('home-matches-title');
            if (homeMatchesTitle) {
                homeMatchesTitle.textContent = 'خطأ في تحميل المباريات';
            }
        }
    }

    /**
     * Creates a match card DOM element for a given match object.
     * @param {object} match - The match data object.
     * @returns {HTMLElement} The created match card div element.
     */
    function createMatchCard(match) {
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card');
        
        // Prepare image sources for <picture> and lazy loading
        const thumbnailSrc = match.thumbnail; // Default thumbnail
        const webpSource = thumbnailSrc ? thumbnailSrc.replace(/\.(png|jpe?g)$/i, '.webp') : ''; // Generate .webp path
        
        // Format match date and time for display
        const matchDate = match.date_time ? new Date(match.date_time).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'غير متوفر';
        const matchTime = match.date_time ? new Date(match.date_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'غير متوفر';

        // Determine status class and text for styling
        const statusClass = match.status === 'live' ? 'live-status' : (match.status === 'finished' ? 'finished-status' : 'upcoming-status');
        const statusText = match.status === 'live' ? 'مباشر الآن' : (match.status === 'finished' ? 'انتهت' : 'قادمة');

        // Generate HTML for team logos and names, handling cases where data might be missing
        // Use match.home_team, match.away_team, match.home_team_logo, match.away_team_logo
        const teamsHtml = (match.home_team && match.away_team)
            ? `
                <div class="teams-logos">
                    <div>
                        <span>${match.home_team}</span>
                        <img data-src="${match.home_team_logo || 'images/team-logos/default.png'}" src="${match.home_team_logo || 'images/team-logos/default.png'}" alt="${match.home_team} logo" class="team-logo lazyload" width="50" height="50" loading="lazy">
                    </div>
                    <span class="vs-text">VS</span>
                    <div>
                        <img data-src="${match.away_team_logo || 'images/team-logos/default.png'}" src="${match.away_team_logo || 'images/team-logos/default.png'}" alt="${match.away_team} logo" class="team-logo lazyload" width="50" height="50" loading="lazy">
                        <span>${match.away_team}</span>
                    </div>
                </div>
            `
            : `<p class="match-teams">${match.title || 'الفرق غير متوفرة'}</p>`; // Fallback to title or generic text

        // Determine if the thumbnail is the LCP image. This is a heuristic.
        // For general match cards, the thumbnail is usually important, but not always the single LCP for the entire page.
        // We'll apply `fetchpriority="high"` only for the very first few images on the homepage.
        const isLCPCandidate = (matchCard.tabIndex === 0); // Placeholder: You'd need to determine this based on actual layout

        // Construct the inner HTML of the match card
        matchCard.innerHTML = `
            <picture>
                ${webpSource ? `<source srcset="${webpSource}" type="image/webp" onerror="this.remove()">` : ''}
                <img data-src="${thumbnailSrc || 'images/thumbnails/default.jpg'}" src="${thumbnailSrc || 'images/thumbnails/default.jpg'}" alt="${match.title}"
                    class="lazyload" width="350" height="200" ${isLCPCandidate ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'}>
            </picture>
            <div class="match-card-content">
                <h3>${match.title}</h3>
                ${teamsHtml}
                <p class="match-league">${match.league_name || 'غير محدد'}</p>
                <p class="match-date">${matchDate} - ${matchTime}</p>
                <span class="match-status ${statusClass}">${statusText}</span>
                ${match.status === 'finished' && match.score ? `<p class="match-score">${match.score}</p>` : ''}
            </div>
        `;
        
        // Add click event listener to the match card
        matchCard.addEventListener('click', () => {
            console.log(`⚡ [Interaction] Match card clicked for ID: ${match.id}.`);
            openAdLink(DIRECT_LINK_COOLDOWN_MATCH_CARD, 'matchCard'); // Trigger ad
            showMatchDetails(match.id); // Navigate to match details
        });
        return matchCard;
    }

    /**
     * Initializes lazy loading for images within a specified container.
     * Uses IntersectionObserver for modern browsers and falls back to direct loading.
     * @param {HTMLElement} [container=document] - The DOM element to observe for lazy load images. Defaults to the entire document.
     */
    function initializeLazyLoad(container = document) {
        if ('IntersectionObserver' in window) {
            let lazyLoadImages = container.querySelectorAll('img.lazyload, source.lazyload');
            let imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        let element = entry.target;
                        if (element.tagName === 'IMG') {
                            if (element.dataset.src && (!element.src || element.src !== element.dataset.src)) {
                                element.src = element.dataset.src;
                            }
                        } else if (element.tagName === 'SOURCE') {
                            if (element.dataset.srcset && (!element.srcset || element.srcset !== element.dataset.srcset)) {
                                element.srcset = element.dataset.srcset;
                            }
                        }
                        element.classList.remove('lazyload'); // Remove lazyload class once loaded
                        observer.unobserve(element); // Stop observing this image
                    }
                });
            }, {
                rootMargin: '0px 0px 100px 0px' // Load images when they are 100px from viewport
            });

            lazyLoadImages.forEach(function(element) {
                // Ensure data-src or data-srcset is set for lazyload
                if (element.dataset.src || element.dataset.srcset) {
                    imageObserver.observe(element); // Start observing each lazyload image
                }
            });
        } else {
            // Fallback for browsers that do not support IntersectionObserver (load all images immediately)
            let lazyLoadImages = container.querySelectorAll('img.lazyload, source.lazyload');
            lazyLoadImages.forEach(function(element) {
                if (element.tagName === 'IMG') {
                    if (element.dataset.src) {
                        element.src = element.dataset.src;
                    }
                } else if (element.tagName === 'SOURCE') {
                    if (element.dataset.srcset) {
                        element.srcset = element.dataset.srcset;
                    }
                }
                element.classList.remove('lazyload');
            });
        }
        console.log('🖼️ [Lazy Load] IntersectionObserver initialized for images (or fallback used).');
    }

    /**
     * Displays a given array of matches in a target grid element.
     * Manages empty state and hides pagination if no matches.
     * @param {Array<object>} matchesToDisplay - Array of match objects to render.
     * @param {HTMLElement} targetGridElement - The DOM element (grid) where match cards will be appended.
     * @param {HTMLElement} [emptyStateElement] - Optional. The element to show if no matches, hide otherwise.
     * @param {HTMLElement} [paginationControlsElement] - Optional. The element containing pagination buttons, shown if matches, hidden otherwise.
     */
    function displayMatches(matchesToDisplay, targetGridElement, emptyStateElement = null, paginationControlsElement = null) {
        if (!targetGridElement) {
            console.error('❌ displayMatches: Target grid element is null or undefined.');
            return;
        }

        targetGridElement.innerHTML = ''; // Clear any existing content in the grid
        if (emptyStateElement) emptyStateElement.style.display = 'none'; // Hide empty state message initially
        if (paginationControlsElement) paginationControlsElement.style.display = 'none'; // Hide pagination controls initially

        if (!matchesToDisplay || matchesToDisplay.length === 0) {
            if (emptyStateElement) emptyStateElement.style.display = 'block'; // Show empty state if no matches
            console.log(`⚽ [Display] No matches to display in ${targetGridElement.id}.`);
            return;
        }

        console.log(`⚽ [Display] Displaying ${matchesToDisplay.length} matches in ${targetGridElement.id}.`);
        matchesToDisplay.forEach(match => {
            targetGridElement.appendChild(createMatchCard(match)); // Append each match card to the grid
        });
        console.log(`⚽ [Display] Finished displaying ${matchesToDisplay.length} matches in ${targetGridElement.id}.`);
        initializeLazyLoad(targetGridElement); // Re-initialize lazy load for the newly added elements
    }

    /**
     * Handles pagination logic for a given array of matches.
     * Updates the displayed matches and the state of pagination buttons.
     * @param {Array<object>} matchesArray - The full array of matches to paginate.
     * @param {number} page - The current page number to display.
     * @param {string} targetGridId - The ID of the grid element for this pagination.
     * @param {string} prevBtnId - The ID of the previous page button.
     * @param {string} nextBtnId - The ID of the next page button.
     * @param {string} emptyStateId - The ID of the empty state element.
     */
    function paginateMatches(matchesArray, page, targetGridId, prevBtnId, nextBtnId, emptyStateId) {
        const targetGridElement = document.getElementById(targetGridId);
        const prevPageBtn = document.getElementById(prevBtnId);
        const nextPageBtn = document.getElementById(nextBtnId);
        const emptyStateElement = document.getElementById(emptyStateId);
        // Find the closest pagination controls container
        const paginationControlsElement = prevPageBtn ? prevPageBtn.closest('.pagination-controls') : null;

        if (!targetGridElement) {
            console.error(`Pagination failed: Target grid element "${targetGridId}" not found.`);
            return;
        }

        if (!Array.isArray(matchesArray) || matchesArray.length === 0) {
            displayMatches([], targetGridElement, emptyStateElement, paginationControlsElement);
            // Disable buttons if no matches
            if (prevPageBtn) prevPageBtn.disabled = true;
            if (nextPageBtn) nextPageBtn.disabled = true;
            return;
        }

        const startIndex = (page - 1) * matchesPerPage;
        const endIndex = startIndex + matchesPerPage;
        const paginatedMatches = matchesArray.slice(startIndex, endIndex);

        displayMatches(paginatedMatches, targetGridElement, emptyStateElement, paginationControlsElement);
        
        const totalPages = Math.ceil(matchesArray.length / matchesPerPage);
        if (paginationControlsElement) {
            paginationControlsElement.style.display = 'flex'; // Show pagination controls if there are matches
        }
        // Update button disabled states
        if (prevPageBtn) prevPageBtn.disabled = (page === 1);
        if (nextPageBtn) nextPageBtn.disabled = (page * matchesPerPage >= matchesArray.length);
        
        console.log(`➡️ [Pagination] Displaying page ${page} of ${totalPages}. Matches from index ${startIndex} to ${Math.min(endIndex, matchesArray.length)-1}.`);
    }

    // --- 5. View Specific Logic Functions ---

    /**
     * Handles the display and logic for the Home view.
     * Displays a mix of live, upcoming, and recent finished matches.
     */
    function handleHomeView() {
        showView('home', (section) => {
            // Get references to elements within the newly cloned 'home-view-template' section
            const matchGridElement = section.querySelector('#main-match-grid');
            const prevPageBtn = section.querySelector('#home-prev-page-btn');
            const nextPageBtn = section.querySelector('#home-next-page-btn');
            const sectionTitle = section.querySelector('#home-matches-title');
            const emptyStateElement = section.querySelector('#home-empty-state'); // Ensure this element exists in your template if you want an empty state here

            if (sectionTitle) sectionTitle.textContent = 'أبرز المباريات والجديد';

            // Filter for live, upcoming, and some recent finished matches for the homepage
            const homePageMatches = matchesData.filter(match => {
                const matchDate = new Date(match.date_time); // Use date_time
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Matches from last 7 days

                return match.status === 'live' || // Always show live matches
                       match.status === 'upcoming' || // Always show upcoming matches
                       (match.status === 'finished' && matchDate >= oneWeekAgo); // Show finished matches from last week
            });

            // Re-sort for home page: live first, then upcoming (chronological), then recent finished (descending date)
            currentFilteredMatches = [...homePageMatches].sort((a, b) => {
                const statusOrder = { 'live': 1, 'upcoming': 2, 'finished': 3 };
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff;

                const dateA = new Date(a.date_time); // Use date_time
                const dateB = new Date(b.date_time); // Use date_time

                if (a.status === 'finished') {
                    return dateB.getTime() - dateA.getTime(); 
                }
                return dateA.getTime() - dateB.getTime(); 
            });

            currentPage = 1;
            paginateMatches(currentFilteredMatches, currentPage, 'main-match-grid', 'home-prev-page-btn', 'home-next-page-btn', 'home-empty-state');
            
            // Re-attach event listeners for home pagination buttons (as they are newly cloned)
            if (prevPageBtn) {
                prevPageBtn.onclick = () => {
                    if (currentPage > 1) {
                        currentPage--;
                        paginateMatches(currentFilteredMatches, currentPage, 'main-match-grid', 'home-prev-page-btn', 'home-next-page-btn', 'home-empty-state');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
            if (nextPageBtn) {
                nextPageBtn.onclick = () => {
                    const totalPages = Math.ceil(currentFilteredMatches.length / matchesPerPage);
                    if (currentPage < totalPages) {
                        currentPage++;
                        paginateMatches(currentFilteredMatches, currentPage, 'main-match-grid', 'home-prev-page-btn', 'home-next-page-btn', 'home-empty-state');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
            console.log('🏠 [View] Home view initialized with latest matches.');
        });
        updatePageMetadata(); // Update SEO for home page
        generateAndInjectSchema(); // Generate general schema for home page
    }

    /**
     * Handles the display and logic for the Live Matches view.
     * Filters and displays only live matches.
     */
    function handleLiveMatchesView() {
        showView('live', (section) => {
            // Get references to elements within the newly cloned 'live-matches-template' section
            const matchGridElement = section.querySelector('#live-match-grid');
            const emptyStateElement = section.querySelector('#live-empty-state');
            const prevPageBtn = section.querySelector('#live-prev-page-btn');
            const nextPageBtn = section.querySelector('#live-next-page-btn');
            const filterButtons = section.querySelectorAll('.filter-btn');
            const dropdown = section.querySelector('.filter-dropdown');
            const sectionTitle = section.querySelector('#live-matches-title');

            if (sectionTitle) sectionTitle.textContent = 'مباريات كرة القدم مباشرة الآن';

            // Populate dropdown with unique leagues from ALL matches that have a 'live' status.
            // Using a Set to get unique league names, then filter out any empty/null values.
            const uniqueLeagues = [...new Set(matchesData.filter(m => m.status === 'live').map(m => m.league_name))].filter(Boolean); // Use league_name
            if (dropdown) { // Check if dropdown exists before populating
                dropdown.innerHTML = '<option value="all">كل البطولات</option>' + 
                                    uniqueLeagues.map(league => `<option value="${league}">${league}</option>`).join('');
            }

            /**
             * Applies filters (status, league) to the live matches.
             */
            const applyLiveFilters = () => {
                const activeFilterBtn = section.querySelector('.filter-btn.active');
                // The data-filter-type and data-filter-value attributes are already set in HTML for these buttons
                const filterType = activeFilterBtn ? activeFilterBtn.dataset.filterType : 'status'; 
                const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filterValue : 'live'; // Default to live status
                const selectedLeague = dropdown ? dropdown.value : 'all'; // Get selected league from dropdown

                currentFilteredMatches = matchesData.filter(match => {
                    let passesStatusFilter = false; // Assume false by default

                    // Filter by status (always 'live' for this view)
                    if (filterType === 'status' && match.status === 'live') {
                        passesStatusFilter = true;
                    } 
                    // Add specific 'top-leagues-live' logic if you have specific top leagues defined in your data
                    // For example:
                    // else if (filterType === 'top-leagues-live') {
                    //    const topLeagues = ['الدوري الإنجليزي الممتاز', 'الدوري الإسباني - الليجا', 'دوري أبطال أوروبا']; 
                    //    passesStatusFilter = match.status === 'live' && topLeagues.includes(match.league_name);
                    // }

                    // Filter by selected league from dropdown
                    let passesLeagueFilter = true;
                    if (selectedLeague !== 'all' && match.league_name !== selectedLeague) { // Use league_name
                        passesLeagueFilter = false;
                    }
                    
                    return passesStatusFilter && passesLeagueFilter;
                }).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()); // Sort live matches chronologically (Use date_time)

                currentPage = 1;
                paginateMatches(currentFilteredMatches, currentPage, 'live-match-grid', 'live-prev-page-btn', 'live-next-page-btn', 'live-empty-state');
            };

            // Attach event listeners to filter buttons
            filterButtons.forEach(btn => {
                btn.onclick = () => {
                    filterButtons.forEach(b => b.classList.remove('active')); // Deactivate all filter buttons
                    btn.classList.add('active'); // Activate the clicked button
                    applyLiveFilters(); // Re-apply filters
                };
            });
            // Attach event listener to the league dropdown
            if (dropdown) {
                dropdown.onchange = applyLiveFilters;
            }

            // Initial display of live matches when the view loads
            applyLiveFilters();

            // Re-attach event listeners for pagination buttons
            if (prevPageBtn) {
                prevPageBtn.onclick = () => {
                    if (currentPage > 1) {
                        currentPage--;
                        paginateMatches(currentFilteredMatches, currentPage, 'live-match-grid', 'live-prev-page-btn', 'live-next-page-btn', 'live-empty-state');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
            if (nextPageBtn) {
                nextPageBtn.onclick = () => {
                    const totalPages = Math.ceil(currentFilteredMatches.length / matchesPerPage);
                    if (currentPage < totalPages) {
                        currentPage++;
                        paginateMatches(currentFilteredMatches, currentPage, 'live-match-grid', 'live-prev-page-btn', 'live-next-page-btn', 'live-empty-state');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
            console.log('⚽ [View] Live matches view initialized.');
        });
        // Update SEO for Live Matches page
        updatePageMetadata({ title: 'المباريات المباشرة', description: 'شاهد بث مباشر لأهم مباريات كرة القدم الآن. لا تفوت أي لحظة من الإثارة!', keywords: 'مباريات مباشرة, بث مباشر, كورة لايف' });
        generateAndInjectSchema(); // No specific match, so general schema for the view
    }

    /**
     * Handles the display and logic for the Upcoming Matches view.
     * Filters and displays upcoming matches by date (today, tomorrow) or league.
     */
    function handleUpcomingMatchesView() {
        showView('upcoming', (section) => {
            // Get references to elements within the newly cloned 'upcoming-matches-template' section
            const matchGridElement = section.querySelector('#upcoming-match-grid');
            const emptyStateElement = section.querySelector('#upcoming-empty-state');
            const prevPageBtn = section.querySelector('#upcoming-prev-page-btn');
            const nextPageBtn = section.querySelector('#upcoming-next-page-btn');
            const filterButtons = section.querySelectorAll('.filter-btn');
            const dropdown = section.querySelector('.filter-dropdown');
            const sectionTitle = section.querySelector('#upcoming-matches-title');

            if (sectionTitle) sectionTitle.textContent = 'مواعيد مباريات كرة القدم القادمة';

            // Populate dropdown with unique leagues from ALL matches that have an 'upcoming' status.
            const uniqueLeagues = [...new Set(matchesData.filter(m => m.status === 'upcoming').map(m => m.league_name))].filter(Boolean); // Use league_name
            if (dropdown) { // Check if dropdown exists before populating
                dropdown.innerHTML = '<option value="all">كل البطولات</option>' + 
                                    uniqueLeagues.map(league => `<option value="${league}">${league}</option>`).join('');
            }

            /**
             * Applies filters (date, league) to the upcoming matches.
             */
            const applyUpcomingFilters = () => {
                const activeFilterBtn = section.querySelector('.filter-btn.active');
                const filterType = activeFilterBtn ? activeFilterBtn.dataset.filterType : 'status'; 
                const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filterValue : 'upcoming'; 
                const selectedLeague = dropdown ? dropdown.value : 'all';
                
                const now = new Date();
                // Normalize dates to the start of the day for accurate comparison
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

                currentFilteredMatches = matchesData.filter(match => {
                    let passesDateFilter = false; 
                    const matchDateObj = new Date(match.date_time); // Use date_time
                    const matchDay = new Date(matchDateObj.getFullYear(), matchDateObj.getMonth(), matchDateObj.getDate());

                    // First, ensure the match is actually upcoming
                    if (match.status !== 'upcoming') return false;

                    // Apply date-specific filters
                    if (filterType === 'status' && filterValue === 'upcoming') {
                        passesDateFilter = true; // All upcoming matches
                    } else if (filterType === 'date') {
                        if (filterValue === 'today') {
                            passesDateFilter = matchDay.getTime() === today.getTime();
                        } else if (filterValue === 'tomorrow') {
                            passesDateFilter = matchDay.getTime() === tomorrow.getTime(); 
                        }
                    }
                    
                    // Apply league filter
                    let passesLeagueFilter = true;
                    if (selectedLeague !== 'all' && match.league_name !== selectedLeague) { // Use league_name
                        passesLeagueFilter = false;
                    }

                    return passesDateFilter && passesLeagueFilter;
                }).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()); // Always sort upcoming matches chronologically (Use date_time)

                currentPage = 1;
                paginateMatches(currentFilteredMatches, currentPage, 'upcoming-match-grid', 'upcoming-prev-page-btn', 'upcoming-next-page-btn', 'upcoming-empty-state');
            };

            // Attach event listeners to filter buttons
            filterButtons.forEach(btn => {
                btn.onclick = () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    applyUpcomingFilters();
                };
            });
            // Attach event listener to the league dropdown
            if (dropdown) {
                dropdown.onchange = applyUpcomingFilters;
            }

            // Initial display of upcoming matches when the view loads
            applyUpcomingFilters();

            // Re-attach event listeners for pagination buttons
            if (prevPageBtn) {
                prevPageBtn.onclick = () => {
                    if (currentPage > 1) {
                        currentPage--;
                        paginateMatches(currentFilteredMatches, currentPage, 'upcoming-match-grid', 'upcoming-prev-page-btn', 'upcoming-next-page-btn', 'upcoming-empty-state');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
            if (nextPageBtn) {
                nextPageBtn.onclick = () => {
                    const totalPages = Math.ceil(currentFilteredMatches.length / matchesPerPage);
                    if (currentPage < totalPages) {
                        currentPage++;
                        paginateMatches(currentFilteredMatches, currentPage, 'upcoming-match-grid', 'upcoming-prev-page-btn', 'upcoming-next-page-btn', 'upcoming-empty-state');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
            console.log('📅 [View] Upcoming matches view initialized.');
        });
        // Update SEO for Upcoming Matches page
        updatePageMetadata({ title: 'مواعيد المباريات', description: 'اكتشف جدول مباريات كرة القدم القادمة والبطولات الكبرى.', keywords: 'مواعيد مباريات, جدول مباريات, مباريات اليوم, مباريات الغد' });
        generateAndInjectSchema();
    }

    /**
     * Handles the display and logic for the Highlights view.
     * Displays finished matches that have a highlight URL.
     */
    function handleHighlightsView() {
        showView('highlights', (section) => {
            // Get references to elements within the newly cloned 'highlights-template' section
            const matchGridElement = section.querySelector('#highlights-grid');
            const emptyStateElement = section.querySelector('#highlights-empty-state');
            const prevPageBtn = section.querySelector('#highlights-prev-page-btn');
            const nextPageBtn = section.querySelector('#highlights-next-page-btn');
            const sectionTitle = section.querySelector('#highlights-title');

            if (sectionTitle) sectionTitle.textContent = 'أهداف وملخصات المباريات';

            // Filter for matches that are of type 'highlight' and have an embed_url (for video)
            currentFilteredMatches = matchesData.filter(m => m.type === 'highlight' && m.embed_url)
                                             .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()); // Sort by newest first (Use date_time)

            currentPage = 1;
            paginateMatches(currentFilteredMatches, currentPage, 'highlights-grid', 'highlights-prev-page-btn', 'highlights-next-page-btn', 'highlights-empty-state');

            // Re-attach event listeners for pagination buttons
            if (prevPageBtn) {
                prevPageBtn.onclick = () => {
                    if (currentPage > 1) {
                        currentPage--;
                        paginateMatches(currentFilteredMatches, currentPage, 'highlights-grid', 'highlights-prev-page-btn', 'highlights-next-page-btn', 'highlights-empty-state');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
            if (nextPageBtn) {
                nextPageBtn.onclick = () => {
                    const totalPages = Math.ceil(currentFilteredMatches.length / matchesPerPage);
                    if (currentPage < totalPages) {
                        currentPage++;
                        paginateMatches(currentFilteredMatches, currentPage, 'highlights-grid', 'highlights-prev-page-btn', 'highlights-next-page-btn', 'highlights-empty-state');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
            console.log('🏆 [View] Highlights view initialized.');
        });
        // Update SEO for Highlights page
        updatePageMetadata({ title: 'أهداف وملخصات', description: 'شاهد أحدث أهداف وملخصات مباريات كرة القدم بجودة عالية. استمتع بأجمل اللقطات والأهداف الحاسمة.', keywords: 'أهداف, ملخصات, فيديو كرة قدم, أهداف اليوم, ملخصات المباريات, أجمل الأهداف' });
        generateAndInjectSchema();
    }

    /**
     * Handles the display and logic for the News view.
     * This is currently a placeholder as actual news data is not in `matches.json`.
     */
    function handleNewsView() {
        showView('news', (section) => {
            const newsGridElement = section.querySelector('#news-grid');
            const emptyStateElement = section.querySelector('#news-empty-state');
            const sectionTitle = section.querySelector('#news-title');

            if (sectionTitle) sectionTitle.textContent = 'آخر أخبار كرة القدم';

            // Filter for items with type 'news'
            currentFilteredMatches = matchesData.filter(m => m.type === 'news')
                                                .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()); // Newest news first (Use date_time)

            // For news, we might not always paginate, or use a simpler display logic
            displayMatches(currentFilteredMatches, newsGridElement, emptyStateElement, null); // Pass null for pagination controls
            
            console.log('📰 [View] News view initialized.');
        });
        // Update SEO for News page
        updatePageMetadata({ title: 'آخر أخبار كرة القدم', description: 'تابع أحدث أخبار كرة القدم المحلية والعالمية لحظة بلحظة. كل ما يخص الأندية واللاعبين والبطولات.', keywords: 'أخبار كرة قدم, آخر الأخبار, أخبار الرياضة, كرة القدم اليوم' });
        generateAndInjectSchema();
    }

    /**
     * Displays the detailed view of a specific match.
     * Injects match data and the iframe player.
     * @param {number} matchId - The ID of the match to display.
     */
    async function showMatchDetails(matchId) {
        console.log(`🔍 [Navigation] Attempting to display match details for ID: ${matchId}`);
        const match = matchesData.find(m => m.id === matchId); // Find the match object by ID

        if (match) {
            currentDetailedMatch = match; // Store the currently viewed detailed match

            // Load the match details view from its template
            showView('details', (sectionElement) => {
                // Get references to all relevant elements within the cloned details section
                const backToHomeBtn = sectionElement.querySelector('#back-to-home-btn');
                const matchDetailsTitleElement = sectionElement.querySelector('#match-details-title-element');
                const matchDetailsDescriptionElement = sectionElement.querySelector('#match-details-description');
                const matchDetailsDateTimeElement = sectionElement.querySelector('#match-details-date-time');
                const matchDetailsLeagueElement = sectionElement.querySelector('#match-details-league');
                const matchDetailsCommentatorsElement = sectionElement.querySelector('#match-details-commentators');
                const matchDetailsTeamsElement = sectionElement.querySelector('#match-details-teams');
                const matchDetailsStadiumElement = sectionElement.querySelector('#match-details-stadium');
                const matchDetailsStatusElement = sectionElement.querySelector('#match-details-status');
                const matchDetailsScoreContainer = sectionElement.querySelector('#match-details-score-container');
                const matchDetailsScoreElement = sectionElement.querySelector('#match-details-score');
                const matchDetailsHighlightsContainer = sectionElement.querySelector('#match-details-highlights-container');
                const matchDetailsHighlightsLink = sectionElement.querySelector('#match-details-highlights-link');
                const matchDetailsPoster = sectionElement.querySelector('#match-details-poster');
                const videoContainer = sectionElement.querySelector('#match-player-container');
                const videoLoadingSpinner = sectionElement.querySelector('#video-loading-spinner');
                const videoOverlay = sectionElement.querySelector('#video-overlay');
                const matchInfoBox = sectionElement.querySelector('.match-info-box'); // Reference to the info box to hide it

                // Populate text content for match details
                matchDetailsTitleElement.textContent = match.title || 'عنوان غير متوفر';
                matchDetailsDescriptionElement.textContent = match.short_description || 'لا يوجد وصف متاح لهذه المباراة.'; // Use short_description
                matchDetailsDateTimeElement.textContent = match.date_time ? new Date(match.date_time).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'غير متوفر'; // Use date_time
                matchDetailsLeagueElement.textContent = match.league_name || 'غير محدد'; // Use league_name
                matchDetailsCommentatorsElement.textContent = Array.isArray(match.commentators) ? match.commentators.join(', ') : match.commentators || 'غير متوفر';
                matchDetailsTeamsElement.textContent = `${match.home_team || 'فريق غير معروف'} vs ${match.away_team || 'فريق غير معروف'}`; // Combine home_team/away_team
                matchDetailsStadiumElement.textContent = match.stadium || 'غير متوفر';
                
                // Update status text and class for styling
                if (matchDetailsStatusElement) {
                    const statusText = match.status === 'live' ? 'مباشر الآن' : (match.status === 'finished' ? 'انتهت' : 'قادمة');
                    // Reset class and add appropriate one
                    matchDetailsStatusElement.className = ''; 
                    matchDetailsStatusElement.classList.add(match.status === 'live' ? 'live-status' : (match.status === 'finished' ? 'finished-status' : 'upcoming-status'));
                }

                // Show score and highlights sections only if data is available
                if (match.status === 'finished' && match.score) {
                    if (matchDetailsScoreContainer) matchDetailsScoreContainer.classList.remove('hidden');
                    if (matchDetailsScoreElement) matchDetailsScoreElement.textContent = match.score;
                } else {
                    if (matchDetailsScoreContainer) matchDetailsScoreContainer.classList.add('hidden');
                }

                if (match.highlight_url && match.type === 'highlight') { // Ensure type is 'highlight' for highlights
                    if (matchDetailsHighlightsContainer) matchDetailsHighlightsContainer.classList.remove('hidden');
                    if (matchDetailsHighlightsLink) matchDetailsHighlightsLink.href = match.highlight_url;
                } else {
                    if (matchDetailsHighlightsContainer) matchDetailsHighlightsContainer.classList.add('hidden');
                }

                // Set match poster (thumbnail)
                if (matchDetailsPoster) {
                    matchDetailsPoster.src = match.thumbnail || 'images/thumbnails/default.jpg';
                    matchDetailsPoster.alt = match.title;
                    matchDetailsPoster.setAttribute('width', '250');
                    matchDetailsPoster.setAttribute('height', '180');
                    // Add `fetchpriority="high"` to the poster image for LCP optimization on details page
                    matchDetailsPoster.setAttribute('fetchpriority', 'high');
                    matchDetailsPoster.setAttribute('loading', 'eager'); // Ensure it loads immediately
                    console.log(`[Details] Match poster set for ${match.title}`);
                }
                
                // Hide the match info box as per CSS rule
                if (matchInfoBox) {
                    matchInfoBox.style.display = 'none'; // This is defined in your CSS to hide it
                }

                // --- iframe Player Setup ---
                const iframeUrl = match.embed_url; // Use embed_url from the new JSON structure

                if (!iframeUrl) {
                    console.error(`❌ Failed to get stream URL for match ID: ${matchId}. Cannot initialize player. (embed_url is null/empty)`);
                    if (videoContainer) {
                        videoContainer.innerHTML = '<p style="text-align: center; color: var(--up-text-primary); margin-top: 20px;">عذرًا، لا يمكن تشغيل البث حاليًا (الرابط غير صالح أو غير متوفر).</p>';
                    }
                    // Ensure loading spinner and overlay are hidden if no stream
                    if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                    if (videoOverlay) {
                        videoOverlay.style.pointerEvents = 'none'; // Disable interaction
                        videoOverlay.classList.add('hidden'); // Hide overlay
                    }
                    return; // Stop here if no stream URL
                }

                if (videoContainer) {
                    videoContainer.innerHTML = ''; // Clear any previous video player content

                    const iframeElement = document.createElement('iframe');
                    iframeElement.id = 'match-iframe-player'; // Assign ID for CSS targeting
                    iframeElement.setAttribute('src', iframeUrl);
                    iframeElement.setAttribute('frameborder', '0');
                    iframeElement.setAttribute('allowfullscreen', 'true');
                    iframeElement.setAttribute('scrolling', 'no');
                    // Add sandbox attribute for enhanced security, restricting what the iframe can do
                    iframeElement.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
                    
                    // Apply inline styles for aspect ratio container to fill 100%
                    iframeElement.style.width = '100%';
                    iframeElement.style.height = '100%';
                    iframeElement.style.position = 'absolute';
                    iframeElement.style.top = '0';
                    iframeElement.style.left = '0';
                    
                    // Set a descriptive title for the iframe for accessibility
                    iframeElement.setAttribute('title', `مشغل بث مباشر لمباراة ${match.title}`);


                    // Show spinner while iframe loads (can be for a few seconds if content is heavy)
                    if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'block';
                    if (videoOverlay) {
                        videoOverlay.style.pointerEvents = 'auto'; // Enable interaction for initial ad click
                        videoOverlay.classList.remove('hidden'); // Ensure overlay is visible
                        videoOverlay.innerHTML = '<p>انقر هنا للتشغيل</p>'; // Ensure text is visible for user instruction
                    }

                    // Add load and error listeners for the iframe
                    iframeElement.onload = () => {
                        console.log(`[iframe] iframe loaded successfully from: ${iframeUrl}`);
                        if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none'; // Hide spinner once iframe content is loaded
                        // Keep overlay active; it will be hidden by user click event
                    };
                    iframeElement.onerror = () => {
                        console.error(`❌ [iframe] Failed to load iframe from: ${iframeUrl}. This might be due to security restrictions (X-Frame-Options) or an invalid URL.`);
                        if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                        // Display error message inside the container if iframe fails to load
                        if (videoContainer) {
                            videoContainer.innerHTML = '<p style="text-align: center; color: var(--up-text-primary); margin-top: 20px;">عذرًا، لا يمكن تشغيل البث حاليًا (قد يكون الرابط غير صالح أو محظور). يرجى المحاولة لاحقاً.</p>';
                        }
                        if (videoOverlay) { // Hide overlay if iframe loading fails completely
                            videoOverlay.style.pointerEvents = 'none';
                            videoOverlay.classList.add('hidden');
                        }
                    };
                    videoContainer.appendChild(iframeElement); // Append the iframe to the container
                    console.log('[Stream Player] iframe element created and appended.');
                } else {
                    console.error('❌ Critical error: "match-player-container" not found in details view. Cannot create stream player.');
                    return;
                }

                // Add event listener for the "Back to Home" button (inside details template)
                const backToHomeBtnInDetails = sectionElement.querySelector('#back-to-home-btn'); // Get local reference
                if (backToHomeBtnInDetails) {
                    backToHomeBtnInDetails.onclick = () => {
                        console.log('🔙 [Interaction] "Back to Matches" button clicked from details view.');
                        showHomePage(); // Navigate back to the home page
                    };
                }

                // Re-attach event listener for the video overlay (critical for ad interaction before playback)
                if (videoOverlay) {
                    videoOverlay.onclick = async (e) => {
                        console.log('⏯️ [Ad Interaction] Video overlay clicked. Attempting to open direct link.');
                        const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');

                        if (adOpened) {
                            // Give a short delay for the ad tab to open/load before hiding the overlay
                            await new Promise(resolve => setTimeout(resolve, 500)); 
                            if (videoOverlay) {
                                videoOverlay.style.pointerEvents = 'none'; // Disable further clicks on overlay
                                videoOverlay.classList.add('hidden'); // Hide the overlay
                            }
                            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none'; // Ensure spinner is hidden
                        } else {
                            console.log('[Video Overlay] Ad not opened due to cooldown. Overlay remains active.');
                        }
                        e.stopPropagation(); // Prevent the click event from bubbling up and potentially interacting with the iframe directly
                    };
                }
                
                // Add logic for video overlay re-appearance
                if (videoOverlay) {
                    // Clear any existing interval to prevent multiple intervals running
                    if (videoOverlayInterval) {
                        clearInterval(videoOverlayInterval);
                    }
                    // Set an interval to show the overlay every 10 seconds
                    videoOverlayInterval = setInterval(() => {
                        console.log('[Video Overlay] Showing overlay for ad interaction.');
                        videoOverlay.classList.remove('hidden'); // Show the overlay
                        videoOverlay.style.pointerEvents = 'auto'; // Enable clicks on the overlay
                    }, 10000); // 10 seconds
                }
            });
            
            // Update browser URL (for direct linking and refresh)
            const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-'); // Create a URL-friendly slug
            const newUrl = new URL(window.location.origin);
            newUrl.searchParams.set('view', 'details');
            newUrl.searchParams.set('id', match.id);
            newUrl.searchParams.set('title', matchSlug); // Add slug for better readability/SEO
            history.pushState({ view: 'details', id: match.id }, match.title, newUrl.toString()); // Update browser history without full page reload
            console.log(`🔗 [URL] Browser URL updated to ${newUrl.toString()}`);

            updatePageMetadata(match); // Update SEO meta tags for this specific match
            generateAndInjectSchema(match); // Generate JSON-LD schema for this specific match

            displaySuggestedMatches(matchId); // Display suggested matches for the current detailed match
            console.log(`✨ [Suggestions] displaySuggestedMatches called for ID: ${matchId}.`);

            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top of the page
        } else {
            console.error('❌ [Navigation] Match not found for the given ID:', matchId, '. Redirecting to home page.');
            showHomePage(); // If match ID is invalid, return to home page
        }
    }


    // --- 6. SEO Functions (Meta Tags & JSON-LD Schema) ---

    /**
     * Dynamically updates HTML meta tags and document title for SEO and social sharing.
     * Sets default values for the homepage or specific match details.
     * @param {object|null} match - The current match object if viewing details, or null for general views/homepage.
     */
    function updatePageMetadata(match = null) {
        // Get references to all dynamic meta tags and title elements
        const canonicalLink = document.getElementById('dynamic-canonical');
        const dynamicTitleElement = document.getElementById('dynamic-title'); // The <title> element has an ID now
        const dynamicDescription = document.getElementById('dynamic-description');
        const dynamicKeywords = document.getElementById('dynamic-keywords');
        const dynamicOgType = document.getElementById('dynamic-og-type');
        const dynamicOgUrl = document.getElementById('dynamic-og-url');
        const dynamicOgTitle = document.getElementById('dynamic-og-title');
        const dynamicOgDescription = document.getElementById('dynamic-og-description');
        const dynamicOgImage = document.getElementById('dynamic-og-image');
        const dynamicOgImageAlt = document.getElementById('dynamic-og-image-alt');
        const dynamicTwitterCard = document.getElementById('dynamic-twitter-card');
        const dynamicTwitterUrl = document.getElementById('dynamic-twitter-url');
        const dynamicTwitterTitle = document.getElementById('dynamic-twitter-title');
        const dynamicTwitterDescription = document.getElementById('dynamic-twitter-description');
        const dynamicTwitterImage = document.getElementById('dynamic-twitter-image');

        let pageTitle, pageDescription, pageKeywords, ogUrl, ogTitle, ogDescription, ogImage, ogType;
        let twitterTitle, twitterDescription, twitterImage, twitterCard;

        if (match) {
            // Case: Match Details Page
            const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const matchUrl = `${window.location.origin}/view/?details&id=${match.id}&title=${matchSlug}`;
            
            pageTitle = `${match.title} - بث مباشر أونلاين على شاهد كورة | Ultimate Pitch`;
            const shortDescriptionContent = (match.short_description || `شاهد بث مباشر لمباراة ${match.home_team || 'فريق'} ضد ${match.away_team || 'فريق'} في ${match.league_name || 'بطولة كرة القدم'} بجودة عالية على شاهد كورة. تابع جميع مباريات كرة القدم مباشرة.`).substring(0, 155);
            pageDescription = shortDescriptionContent + (match.short_description && match.short_description.length > 155 ? '...' : ''); // Use short_description
            
            // Combine home and away teams for keywords
            const matchTeams = `${match.home_team}, ${match.away_team}`.split(',').map(s => s.trim()).filter(Boolean).join(', '); 
            const matchLeague = String(match.league_name || '').trim(); // Use league_name
            const commentators = Array.isArray(match.commentators) ? match.commentators.join(', ') : String(match.commentators || '').trim();
            pageKeywords = [
                match.title, matchTeams, matchLeague, commentators, 'شاهد كورة', 'بث مباشر', 'مشاهدة أونلاين', 
                'مباريات اليوم', 'كرة القدم', 'جودة عالية', 'الدوري المصري', 'الدوري الإنجليزي', 
                'الدوري الإسباني', 'دوري أبطال أوروبا', 'بث مباشر مجاني', 'Ultimate Pitch'
            ].filter(Boolean).join(', '); // Filter out any empty strings

            ogUrl = matchUrl;
            ogTitle = `${match.title} - بث مباشر على شاهد كورة | Ultimate Pitch`;
            ogDescription = pageDescription;
            ogImage = match.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png'; // Fallback image
            ogType = "video.other"; // Best type for live sports streams according to Open Graph protocol

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image"; // Recommended for images

        } else {
            // Case: General View / Home Page
            const currentPath = window.location.pathname;
            // Determine default metadata based on the current logical view (e.g., /live-matches)
            if (currentPath.includes('/live-matches') || currentPath.includes('/live')) {
                pageTitle = 'شاهد كورة - المباريات المباشرة الآن | بث مباشر كرة القدم';
                pageDescription = 'شاهد بث مباشر لأهم مباريات كرة القدم الجارية حالياً بجودة عالية ومجاناً على شاهد كورة. لا تفوت أي هدف!';
                pageKeywords = 'مباريات مباشرة, بث مباشر, كورة لايف, شاهد الآن, مباريات جارية, الدوري الإنجليزي مباشر, الدوري الإسباني مباشر';
            } else if (currentPath.includes('/upcoming-matches') || currentPath.includes('/upcoming')) {
                pageTitle = 'شاهد كورة - مواعيد مباريات كرة القدم القادمة | جدول المباريات';
                pageDescription = 'اكتشف جدول مباريات كرة القدم القادمة، مواعيد البطولات الكبرى، ومواعيد مباريات اليوم والغد على شاهد كورة.';
                pageKeywords = 'مواعيد مباريات, جدول مباريات, مباريات اليوم, مباريات الغد, مباريات قادمة, شاهد كورة مواعيد';
            } else if (currentPath.includes('/highlights')) {
                pageTitle = 'شاهد كورة - أهداف وملخصات المباريات | فيديو كرة القدم';
                pageDescription = 'شاهد أحدث أهداف وملخصات مباريات كرة القدم بجودة عالية. استمتع بأجمل اللقطات والأهداف الحاسمة من الدوريات العالمية.';
                pageKeywords = 'أهداف, ملخصات, فيديو كرة قدم, أهداف اليوم, ملخصات المباريات, أجمل الأهداف';
            } else if (currentPath.includes('/news')) {
                pageTitle = 'شاهد كورة - آخر أخبار كرة القدم | عاجل وحصري';
                pageDescription = 'تابع آخر أخبار كرة القدم المحلية والعالمية لحظة بلحظة. كل ما يخص الأندية واللاعبين والبطولات الكبرى حصرياً على شاهد كورة.';
                pageKeywords = 'أخبار كرة قدم, آخر الأخبار, أخبار الرياضة, كرة القدم اليوم, انتقالات اللاعبين, عاجل كورة';
            } else { // Default for homepage
                pageTitle = 'شاهد كورة - Ultimate Pitch: بث مباشر لمباريات كرة القدم | مشاهدة مباريات اليوم بجودة عالية';
                pageDescription = 'شاهد كورة: ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.';
                pageKeywords = 'شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch';
            }

            ogUrl = window.location.origin; // Canonical URL for homepage
            ogTitle = pageTitle; // OG title matches page title for homepage
            ogDescription = pageDescription;
            ogImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png'; // Site's main OG image
            ogType = 'website'; // Standard type for a general website

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png'; // Site's main Twitter image
            twitterCard = "summary_large_image";
        }

        // Apply updates to the actual DOM elements
        if (dynamicTitleElement) dynamicTitleElement.textContent = pageTitle;
        document.title = pageTitle; // Also update the browser tab title
        if (dynamicDescription) dynamicDescription.setAttribute('content', pageDescription);
        if (dynamicKeywords) dynamicKeywords.setAttribute('content', pageKeywords);

        if (dynamicOgUrl) dynamicOgUrl.setAttribute('content', ogUrl);
        if (dynamicOgType) dynamicOgType.setAttribute('content', ogType);
        if (dynamicOgTitle) dynamicOgTitle.setAttribute('content', ogTitle);
        if (dynamicOgDescription) dynamicOgDescription.setAttribute('content', ogDescription);
        if (dynamicOgImage) dynamicOgImage.setAttribute('content', ogImage);
        if (dynamicOgImageAlt) dynamicOgImageAlt.setAttribute('content', ogTitle); 
        
        if (dynamicTwitterCard) dynamicTwitterCard.setAttribute('content', twitterCard);
        if (dynamicTwitterUrl) dynamicTwitterUrl.setAttribute('content', ogUrl); 
        if (dynamicTwitterTitle) dynamicTwitterTitle.setAttribute('content', twitterTitle);
        if (dynamicTwitterDescription) dynamicTwitterDescription.setAttribute('content', twitterDescription);
        if (dynamicTwitterImage) dynamicTwitterImage.setAttribute('content', twitterImage);

        if (canonicalLink) canonicalLink.setAttribute('href', ogUrl);

        console.log('📄 [SEO] Meta tags updated.');
    }
    
    /**
     * Generates and injects JSON-LD structured data (Schema.org markup) into the page's <head>.
     * Provides specific `SportsEvent` schema for match details or clears it for general views.
     * @param {object|null} match - The current match object if viewing details, or null for general views/homepage.
     */
    function generateAndInjectSchema(match = null) {
        const schemaScriptElement = document.getElementById('json-ld-schema');
        if (!schemaScriptElement) {
            console.error('❌ JSON-LD schema script element (ID: "json-ld-schema") not found in HTML. Cannot inject schema.');
            return;
        }

        if (!match) {
            // Clear schema for homepage or general views as it's not specific to one event
            schemaScriptElement.textContent = '';
            console.log('📄 [SEO] No specific JSON-LD schema for this general view (cleared).');
            return;
        }

        // Generate URL for the match details page
        const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
        const matchUrl = `${window.location.origin}/view/?details&id=${match.id}&title=${matchSlug}`;

        // Format date/time to ISOString for schema
        let formattedDate;
        if (match.date_time) { // Use date_time from the new JSON structure
            try {
                const date = new Date(match.date_time);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toISOString();
                } else {
                    formattedDate = new Date().toISOString(); // Fallback to current date if invalid
                }
            } catch (e) {
                formattedDate = new Date().toISOString(); // Fallback if date parsing fails
            }
        } else {
            formattedDate = new Date().toISOString(); // Fallback if no date provided
        }

        // Prepare arrays for teams and commentators, ensuring they are arrays of strings
        // Use home_team, away_team directly
        const teamsArray = [match.home_team, match.away_team].filter(Boolean); 
        const commentatorsArray = Array.isArray(match.commentators) ? match.commentators : (match.commentators ? String(match.commentators).split(',').map(s => s.trim()).filter(s => s !== '') : []);
        
        // The actual stream URL or the iframe embed URL
        const streamSourceUrl = match.embed_url; // Use embed_url from the new JSON structure

        // Define the Schema.org object for SportsEvent
        const schema = {
            "@context": "https://schema.org",
            "@type": "SportsEvent", 
            "name": match.title,
            "description": match.short_description || `مشاهدة بث مباشر لمباراة ${teamsArray.join(' و ')} في ${match.league_name || 'بطولة كرة القدم'} على شاهد كورة.`, // Use short_description and league_name
            "image": match.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png', // Fallback image
            "url": matchUrl,
            "startDate": formattedDate, 
            "location": {
                "@type": "Place",
                "name": match.stadium || "ملعب غير معروف"
                // Add more location details like addressLocality, addressCountry if available in your data
            },
            "performer": teamsArray.map(teamName => ({ "@type": "SportsTeam", "name": teamName })), 
            "sport": "Football", // Specific sport
            "eventStatus": `https://schema.org/EventStatusType/${ // Set event status based on match.status (ensure lowercase for comparison)
                match.status.toLowerCase() === 'live' ? 'EventScheduled' : // 'EventScheduled' implies it's happening or will happen
                (match.status.toLowerCase() === 'finished' ? 'EventCompleted' : 'EventScheduled') // Use EventCompleted for finished games
            }`, 
            
            // Add VideoObject to indicate the presence of a live stream or video content
            "video": {
                "@type": "VideoObject",
                "name": `بث مباشر لمباراة ${match.title}`,
                "description": `بث مباشر بجودة عالية لمباراة ${match.title} بين ${teamsArray.join(' و ')}.`,
                "thumbnailUrl": match.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png', // Video thumbnail
                "uploadDate": formattedDate, // Date when the stream starts (or match date)
                "contentUrl": streamSourceUrl, // The URL of the actual video/stream
                "embedUrl": streamSourceUrl, // The URL to embed the video/stream (same as contentUrl for iframes)
                "interactionCount": "100000", // Placeholder, ideally use actual view counts
                "liveBroadcast": { // Indicate if it's a live broadcast
                    "@type": "BroadcastEvent",
                    "isLiveBroadcast": match.status.toLowerCase() === 'live', // True if current status is 'live'
                    "startDate": formattedDate,
                    "endDate": new Date(new Date(match.date_time).getTime() + 105 * 60 * 1000).toISOString() // Assuming avg 105 mins for a match + extra time (Use date_time)
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "شاهد كورة - Ultimate Pitch",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://shahidkora.online/images/shahed-plus-logo.png", // Ensure this path is correct for your site's logo
                        "width": 200,
                        "height": 50
                    }
                }
            },
            
            // PotentialAction for "Watch" to guide search engines
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
                    "name": "مشاهدة البث المباشر",
                    "price": "0", // Assuming it's free
                    "priceCurrency": "USD",
                    "availability": "http://schema.org/InStock", // Available
                    "url": matchUrl
                }
            }
        };

        // Add commentator info if available
        if (commentatorsArray.length > 0) {
            schema.commentator = commentatorsArray.map(name => ({ "@type": "Person", "name": name }));
        }
        // Add aggregate rating if available from a rating system
        // if (match.rating && !isNaN(parseFloat(match.rating))) {
        //    schema.aggregateRating = {
        //        "@type": "AggregateRating",
        //        "ratingValue": parseFloat(match.rating).toFixed(1),
        //        "bestRating": "5", // Or 10, depending on your rating scale
        //        "ratingCount": "1000" // Example count
        //    };
        // }

        schemaScriptElement.textContent = JSON.stringify(schema, null, 2); // Pretty print JSON for readability
        console.log('📄 [SEO] New JSON-LD schema added/updated.');
    }

    /**
     * Displays a list of suggested matches related to the currently detailed match.
     * @param {number} currentMatchId - The ID of the match currently being viewed in detail.
     */
    function displaySuggestedMatches(currentMatchId) {
        // Get the suggested match grid element from the current active view (which should be the details view)
        const suggestedMatchGrid = currentActiveViewElement ? currentActiveViewElement.querySelector('#suggested-match-grid') : null;
        if (!suggestedMatchGrid || !currentDetailedMatch) {
            console.error('❌ displaySuggestedMatches: "suggestedMatchGrid" or "currentDetailedMatch" not found. Cannot display suggested matches.');
            return;
        }

        const currentMatchLeague = currentDetailedMatch.league_name; // Use league_name
        // Ensure teams are an array for consistent filtering
        const currentMatchTeams = [currentDetailedMatch.home_team, currentDetailedMatch.away_team].filter(Boolean); // Use home_team, away_team
        let suggested = []; // Array to hold suggested matches

        // 1. Prioritize matches from the same league, excluding the current match
        if (currentMatchLeague) {
            suggested = matchesData.filter(match =>
                match.id !== currentMatchId &&
                match.league_name === currentMatchLeague && // Use league_name
                match.status !== 'finished' // Prefer live or upcoming suggestions
            );
        }

        // 2. If not enough, add matches involving the same teams or other popular teams, if not already included
        if (suggested.length < 12) {
            const teamRelated = matchesData.filter(match =>
                match.id !== currentMatchId &&
                match.status !== 'finished' && // Prefer live or upcoming suggestions
                ([match.home_team, match.away_team].filter(Boolean).some(team => currentMatchTeams.includes(team))) && // Check if any team matches (Use home_team, away_team)
                !suggested.some(s => s.id === match.id) // Avoid adding duplicates
            );
            suggested = [...new Set([...suggested, ...teamRelated])]; // Use Set to ensure uniqueness
        }

        // 3. Fill up with other live/upcoming matches randomly if still not enough
        if (suggested.length < 12) {
            const otherRelevantMatches = matchesData.filter(match => 
                match.id !== currentMatchId && 
                match.status !== 'finished' && // Only live or upcoming matches
                !suggested.some(s => s.id === match.id) // Exclude already suggested
            ).sort(() => 0.5 - Math.random()); // Randomize selection for variety
            const needed = 12 - suggested.length;
            suggested = [...suggested, ...otherRelevantMatches.slice(0, needed)];
        }
        
        // 4. Finally, add some recent finished matches if still not enough (as a last resort)
        if (suggested.length < 12) {
            const finishedMatches = matchesData.filter(match => 
                match.id !== currentMatchId && 
                !suggested.some(s => s.id === match.id)
            ).sort((a,b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()); // Newest finished first (Use date_time)
            const needed = 12 - suggested.length;
            suggested = [...suggested, ...finishedMatches.slice(0, needed)];
        }

        const finalSuggested = suggested.slice(0, 12); // Limit to a maximum of 12 suggestions

        if (finalSuggested.length === 0) {
            suggestedMatchGrid.innerHTML = '<p style="text-align: center; color: var(--up-text-muted);">لا توجد مباريات مقترحة حالياً.</p>';
            console.log('✨ [Suggestions] No suggested matches available after filtering.');
            return;
        }

        // Display the final suggested matches (no empty state or pagination for this grid)
        displayMatches(finalSuggested, suggestedMatchGrid); 
        console.log(`✨ [Suggestions] Displayed ${finalSuggested.length} suggested matches in ${suggestedMatchGrid.id}.`);
    }

    /**
     * Resets the view to the Home page, clears search, and updates URL/SEO.
     */
    function showHomePage() {
        console.log('🏠 [Navigation] Displaying home page.');
        
        if (searchInput) searchInput.value = ''; // Clear search input text
        
        // Reset navigation active link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.targetView === 'home') {
                link.classList.add('active'); // Activate the home link
            }
        });

        handleHomeView(); // Call the specific handler for the home view to re-render its content
        
        // Ensure the video overlay and spinner are hidden when navigating away from a match detail page
        const videoOverlay = document.getElementById('video-overlay'); // Get from global scope as it might be detached
        const videoLoadingSpinner = document.getElementById('video-loading-spinner');
        if (videoOverlay) {
            videoOverlay.style.pointerEvents = 'none'; // Disable interactions
            videoOverlay.classList.add('hidden'); // Hide the overlay
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none'; // Hide spinner
        }
        // Clear the video overlay interval when leaving the details page
        if (videoOverlayInterval) {
            clearInterval(videoOverlayInterval);
            videoOverlayInterval = null;
            console.log('[Video Overlay] Interval cleared.');
        }

        currentDetailedMatch = null; // Clear the reference to any previously detailed match

        // Update browser URL to the root for the home page
        const newUrl = new URL(window.location.origin);
        history.pushState({ view: 'home' }, 'شاهد كورة - الصفحة الرئيسية', newUrl.toString());
        console.log(`🔗 [URL] Browser URL updated to ${newUrl.toString()}`);

        updatePageMetadata(); // Reset SEO meta tags to home page defaults
        generateAndInjectSchema(); // Clear any specific JSON-LD schema
    }


    // --- 7. Event Listeners ---

    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('nav-open');
            console.log('☰ [Interaction] Mobile menu toggled.');
        });
    }

    // Home logo link (always navigate to homepage)
    const homeLogoLink = document.getElementById('home-logo-link');
    if (homeLogoLink) {
        homeLogoLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            console.log('🏠 [Interaction] Home logo link clicked.');
            showHomePage();
            if (mainNav && mainNav.classList.contains('nav-open')) {
                mainNav.classList.remove('nav-open'); // Close mobile menu if open
            }
        });
    }

    // Main navigation links (delegated using data-target-view)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.dataset.targetView; // Get the view ID from data-target-view attribute
            
            // Call the appropriate handler function based on the targetView
            if (targetView === 'home') {
                showHomePage();
            } else if (targetView === 'live') {
                handleLiveMatchesView();
            } else if (targetView === 'upcoming') {
                handleUpcomingMatchesView();
            } else if (targetView === 'highlights') {
                handleHighlightsView();
            } else if (targetView === 'news') {
                handleNewsView();
            }
            console.log(`➡️ [Navigation] Navigation link clicked: "${targetView}".`);
            
            // Close mobile menu after navigation
            if (mainNav && mainNav.classList.contains('nav-open')) {
                mainNav.classList.remove('nav-open');
            }
        });
    });

    // "Watch Matches Now" button on hero section
    if (watchNowBtn) {
        watchNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🎬 [Interaction] "Watch Matches Now" button clicked.');
            // This button typically scrolls to the main match listing or directly shows live matches
            handleLiveMatchesView(); // Direct to live matches view
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top of the new view
        });
    }
    
    // Search functionality listeners
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.toLowerCase().trim();
            console.log(`🔍 [Search] Search button clicked. Query: "${query}".`);
            
            let searchResults = [];
            if (query) {
                // Filter matches based on title, league_name, home_team, or away_team
                searchResults = matchesData.filter(match =>
                    match.title.toLowerCase().includes(query) ||
                    (match.league_name && match.league_name.toLowerCase().includes(query)) || // Use league_name
                    (match.home_team && match.home_team.toLowerCase().includes(query)) || // Use home_team
                    (match.away_team && match.away_team.toLowerCase().includes(query)) // Use away_team
                );
            } else {
                searchResults = matchesData; // If search query is empty, show all matches
            }

            // Always display search results in the home view template, adjusting its title
            showView('home', (section) => {
                const matchGridElement = section.querySelector('#main-match-grid');
                const prevPageBtn = section.querySelector('#home-prev-page-btn');
                const nextPageBtn = section.querySelector('#home-next-page-btn');
                const sectionTitle = section.querySelector('#home-matches-title');

                if (sectionTitle) {
                    sectionTitle.textContent = query ? `نتائج البحث عن "${query}"` : 'أبرز المباريات والجديد';
                }

                currentFilteredMatches = searchResults; // Set the filtered results for pagination
                currentPage = 1; // Reset to first page
                paginateMatches(currentFilteredMatches, currentPage, 'main-match-grid', 'home-prev-page-btn', 'home-next-page-btn', 'home-empty-state');
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
            });
        });
        console.log('🔍 [Event] Search button listener attached.');
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchButton.click(); // Simulate a click on the search button when Enter is pressed
                searchInput.blur(); // Hide the keyboard on mobile devices
            }
        });
        console.log('🔍 [Event] Search input keypress listener attached.');
    }

    // General Security Measures (Right-click and DevTools blocking)
    document.addEventListener('contextmenu', e => {
        e.preventDefault(); // Prevent default right-click context menu
        console.warn('🚫 [Security] Right-click context menu disabled.');
    });

    document.addEventListener('keydown', e => {
        // Block common developer tool shortcuts
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || // Ctrl+Shift+I/J
            (e.ctrlKey && e.key === 'u') || // Ctrl+U for view source
            (e.metaKey && e.altKey && e.key === 'I') // Cmd+Option+I for Mac DevTools
        ) {
            e.preventDefault(); // Prevent default action for these key combinations
            console.warn(`🚫 [Security] Developer tools/source shortcut blocked: ${e.key}.`);
        }
    });

    // DevTools Detector (attempts to detect if developer tools are open)
    const devtoolsDetector = (() => {
        const threshold = 160; // A common heuristic for devtools panel width/height
        let isOpen = false; // Flag to track current state of devtools

        const checkDevTools = () => {
            // Check if inner window dimensions are significantly smaller than outer window dimensions
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

        window.addEventListener('resize', checkDevTools); // Check on window resize
        // Reduced frequency for performance impact
        setInterval(checkDevTools, 5000); // Periodically check every 5 seconds instead of 1 second
        checkDevTools(); // Initial check on load
    })();

    // --- 8. Initial Page Load and History Management ---

    /**
     * Determines which view to show on initial page load based on URL parameters.
     * If 'view' and 'id' parameters are present, attempts to load match details.
     * Otherwise, defaults to the home page.
     */
    function initialPageLoadLogic() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        const idParam = urlParams.get('id');

        if (viewParam === 'details' && idParam) {
            const matchId = parseInt(idParam);
            const match = matchesData.find(m => m.id === matchId); // Find the match in the loaded data

            if (!isNaN(matchId) && match) {
                console.log(`🚀 [Initial Load] Attempting to load match details from URL: ID ${matchId}.`);
                showMatchDetails(matchId); // Show match details if valid ID and match found
            } else {
                console.warn('⚠️ [Initial Load] Invalid match ID in URL or match not found in data. Displaying home page as fallback.');
                showHomePage(); // Fallback to home page if ID is invalid or match doesn't exist
            }
        } else {
            console.log('🚀 [Initial Load] No specific view parameters in URL. Displaying home page.');
            showHomePage(); // Default to showing the home page
        }
    }

    /**
     * Handles browser popstate event (back/forward button clicks).
     * Re-renders the appropriate view based on the history state.
     */
    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] Browser history navigation detected.', event.state);
        
        // If match data hasn't been loaded yet (e.g., initial load failed or very fast popstate),
        // try to fetch it first, then re-evaluate the state.
        if (matchesData.length === 0) {
            console.warn('[Popstate] Match data not loaded yet, attempting to fetch data and render view based on popstate event.');
            fetchMatchesData().then(() => {
                // After data is fetched, re-evaluate the state
                if (event.state && event.state.view === 'details' && event.state.id) {
                    const match = matchesData.find(m => m.id === event.state.id);
                    if (match) {
                        showMatchDetails(event.state.id);
                    } else {
                        console.warn('[Popstate] Match not found on popstate after data load. Displaying home page.');
                        showHomePage();
                    }
                } else {
                    showHomePage();
                }
            }).catch(err => {
                console.error('[Popstate] Failed to fetch match data on popstate during fallback:', err);
                showHomePage(); // Fallback to home page if data fetch still fails
            });
            return;
        }

        // If data is already loaded, proceed directly based on the state
        if (event.state && event.state.view === 'details' && event.state.id) {
            const match = matchesData.find(m => m.id === event.state.id);
            if (match) {
                showMatchDetails(event.state.id);
            } else {
                console.warn('[Popstate] Match not found for state ID. Displaying home page.');
                showHomePage();
            }
        } else {
            showHomePage();
        }
    });

    // --- Kick-off: Start fetching data when the DOM is fully loaded ---
    fetchMatchesData();
});
