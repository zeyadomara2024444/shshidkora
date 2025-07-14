

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

    // --- 2. Adsterra Configuration & Ad Logic (UPDATED FOR SEPARATE COOLDOWNS AND POP-UNDER MECHANISM) ---

    // Adsterra JS Sync codes and Direct Link
    // IMPORTANT: JS Sync codes (like the first two) are designed to be injected into the current page's DOM,
    // and THEY THEMSELVES handle opening the pop-under tab.
    // Direct Links (like the third one) should be explicitly opened in a new tab.
    const adCodes = [
        "//pl27154379.profitableratecpm.com/a3/0f/2d/a30f2d8b70097467fa7c1b724f6ef1f2.js", // JS Sync Pop-under
        "//pl27154400.profitableratecpm.com/1c/2a/d6/1c2ad63f897e5c1d4c27840dc634efd4.js", // JS Sync Pop-under
        "https://www.profitableratecpm.com/s9pzkja6hn?key=0d9ae755a41e87391567e3eab37b7cec"  // Direct Link
    ];

    // --- Cooldown settings for Match Card Clicks (4 minutes) ---
    const MATCH_CARD_AD_COOLDOWN_TIME = 4 * 60 * 1000; // 4 minutes
    let lastMatchCardAdTime = 0;

    // --- Cooldown settings for Video Overlay Clicks (8 seconds) ---
    const VIDEO_OVERLAY_AD_COOLDOWN_TIME = 8 * 1000; // 8 seconds
    let lastVideoOverlayAdTime = 0;

    /**
     * Generic function to trigger an Adsterra ad (Pop-under via JS Sync or Direct Link).
     * @param {number} cooldownTime - The cooldown duration in milliseconds.
     * @param {number} currentLastInteractionTime - The current timestamp of the last ad interaction for this type.
     * @param {string} adTriggerContext - A string for logging context (e.g., "Match Card", "Video Overlay").
     * @returns {number} The updated lastInteractionTime (current timestamp if ad triggered, or previous if on cooldown).
     */
    function triggerAdsterraAd(cooldownTime, currentLastInteractionTime, adTriggerContext) {
        const currentTime = Date.now();
        if (currentTime - currentLastInteractionTime < cooldownTime) {
            console.log(`🚫 [Ad - ${adTriggerContext}] Cooldown active (${(cooldownTime / 1000)}s). Skipping ad.`);
            return currentLastInteractionTime; // Return unchanged time if on cooldown
        }

        const adTarget = adCodes[Math.floor(Math.random() * adCodes.length)]; // Select a random ad URL

        // Attempt to open in a new tab if it's a Direct Link.
        // If it's a JS Sync script, just append it; it will handle the pop-under itself.
        if (adTarget.includes('key=')) { // Heuristic for Adsterra Direct Link
            // For Direct Links, explicitly open in a new tab. Browsers might block if not directly user-initiated.
            window.open(adTarget, "_blank");
            console.log(`⚡ [Ad - ${adTriggerContext}] Adsterra Direct Link triggered (explicit new tab): ${adTarget}`);
        } else { // Assume it's a JS Sync pop-under script
            // For JS Sync scripts, inject them into the current document.
            // These scripts are designed to open pop-unders themselves (often immediately after injection).
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = (adTarget.startsWith('//') ? 'https:' : '') + adTarget; // Ensure absolute URL
            script.async = true; // Use async to not block rendering of the current page

            // Append the script to the body to trigger the ad
            document.body.appendChild(script);

            // Remove the script after a short delay to keep the DOM clean
            setTimeout(() => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            }, 500); // Remove after 0.5 seconds
            console.log(`⚡ [Ad - ${adTriggerContext}] Adsterra JS Sync triggered (injected into current page): ${adTarget}`);
        }
        
        return currentTime; // Update last interaction time for successful trigger
    }

    // Interval for the video overlay ad
    let videoOverlayInterval = null;
    let videoOverlayElement = null; // Reference to the overlay element

    /**
     * Manages the video overlay for ads.
     * This function is called when a match details page is loaded.
     * It ensures the overlay is completely transparent and positioned correctly.
     * @param {HTMLElement} overlayElement - The DOM element for the transparent overlay.
     * @param {HTMLElement} videoPlayerContainer - The container holding the video iframe. (Not directly used for positioning here, handled by CSS)
     */
    function setupVideoOverlayAd(overlayElement, videoPlayerContainer) { // videoPlayerContainer is not directly used for positioning here
        if (!overlayElement) { // Only check for overlayElement as positioning is CSS-based now
            console.error('❌ Cannot set up video overlay ad: Missing overlayElement.');
            return;
        }

        videoOverlayElement = overlayElement; // Store the reference
        videoOverlayElement.classList.remove('hidden'); // Ensure it's visible if hidden by default
        videoOverlayElement.style.pointerEvents = 'auto'; // Enable clicks
        // Make the overlay completely transparent and cover the video
        videoOverlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0)'; // Fully transparent
        videoOverlayElement.style.cursor = 'pointer'; // Show pointer to indicate clickable area
        videoOverlayElement.innerHTML = ''; // Clear any visible content to make it truly invisible (like the <p> tag in HTML)

        // Clear any existing interval to prevent multiple intervals running
        if (videoOverlayInterval) {
            clearInterval(videoOverlayInterval);
            console.log('[Video Overlay] Previous interval cleared.');
        }

        // Click handler for the overlay
        const handleOverlayClick = function() {
            lastVideoOverlayAdTime = triggerAdsterraAd(
                VIDEO_OVERLAY_AD_COOLDOWN_TIME,
                lastVideoOverlayAdTime,
                "Video Overlay"
            );
            
            // Hide the overlay immediately after click
            videoOverlayElement.classList.add('hidden');
            videoOverlayElement.style.pointerEvents = 'none'; // Disable clicks on the overlay temporarily

            // Set a timer to show the overlay again after VIDEO_OVERLAY_AD_COOLDOWN_TIME
            videoOverlayInterval = setTimeout(() => {
                if (videoOverlayElement) { // Check if element still exists before showing
                    videoOverlayElement.classList.remove('hidden');
                    videoOverlayElement.style.pointerEvents = 'auto'; // Re-enable clicks
                    console.log('[Video Overlay] Overlay re-appeared.');
                }
            }, VIDEO_OVERLAY_AD_COOLDOWN_TIME);
        };
        
        // Remove existing listener to prevent duplicates. Store the handler on the element.
        if (videoOverlayElement._adOverlayHandler) { // Check if a handler was previously stored
            videoOverlayElement.removeEventListener('click', videoOverlayElement._adOverlayHandler);
        }
        videoOverlayElement.addEventListener('click', handleOverlayClick);
        videoOverlayElement._adOverlayHandler = handleOverlayClick; // Store reference to the handler

        console.log('[Video Overlay] Video overlay ad setup complete.');
    }

    /**
     * Clears the video overlay ad interval and hides the overlay.
     */
    function clearVideoOverlayAd() {
        if (videoOverlayInterval) {
            clearInterval(videoOverlayInterval);
            videoOverlayInterval = null;
            console.log('[Video Overlay] Ad interval cleared.');
        }
        if (videoOverlayElement) {
            if (videoOverlayElement._adOverlayHandler) { // Remove the stored handler
                videoOverlayElement.removeEventListener('click', videoOverlayElement._adOverlayHandler);
                delete videoOverlayElement._adOverlayHandler; // Clean up the stored handler
            }
            videoOverlayElement.classList.add('hidden');
            videoOverlayElement.style.pointerEvents = 'none';
            videoOverlayElement = null; // Clear reference
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
        matchCard.dataset.matchId = match.id; // Store match ID for click handler
        
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

        const isLCPCandidate = (matchCard.tabIndex === 0);    

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
        
        // Add click event listener to the match card for navigation AND ad
        matchCard.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior, we handle navigation manually
            console.log(`⚡ [Interaction] Match card clicked for ID: ${match.id}.`);
            
            // Trigger the ad pop-under with 4-minute cooldown
            lastMatchCardAdTime = triggerAdsterraAd(
                MATCH_CARD_AD_COOLDOWN_TIME,
                lastMatchCardAdTime,
                "Match Card"
            );

            // Navigate to match details after a small delay to allow ad to load (optional, but good practice)
            setTimeout(() => {
                showMatchDetails(match.id);  
            }, 100); // Small delay
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
                if (element.dataset.src || element.dataset.srcset) {
                    imageObserver.observe(element);
                }
            });
        } else {
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
        const paginationControlsElement = prevPageBtn ? prevPageBtn.closest('.pagination-controls') : null;

        if (!targetGridElement) {
            console.error(`Pagination failed: Target grid element "${targetGridId}" not found.`);
            return;
        }

        if (!Array.isArray(matchesArray) || matchesArray.length === 0) {
            displayMatches([], targetGridElement, emptyStateElement, paginationControlsElement);
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
            paginationControlsElement.style.display = 'flex';
        }
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
            const matchGridElement = section.querySelector('#main-match-grid');
            const prevPageBtn = section.querySelector('#home-prev-page-btn');
            const nextPageBtn = section.querySelector('#home-next-page-btn');
            const sectionTitle = section.querySelector('#home-matches-title');
            const emptyStateElement = section.querySelector('#home-empty-state');

            if (sectionTitle) sectionTitle.textContent = 'أبرز المباريات والجديد';

            const homePageMatches = matchesData.filter(match => {
                const matchDate = new Date(match.date_time);
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

                return match.status === 'live' ||
                                       match.status === 'upcoming' ||
                                       (match.status === 'finished' && matchDate >= oneWeekAgo);
            });

            currentFilteredMatches = [...homePageMatches].sort((a, b) => {
                const statusOrder = { 'live': 1, 'upcoming': 2, 'finished': 3 };
                const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                if (statusDiff !== 0) return statusDiff;

                const dateA = new Date(a.date_time);
                const dateB = new Date(b.date_time);

                if (a.status === 'finished') {
                    return dateB.getTime() - dateA.getTime();    
                }
                return dateA.getTime() - dateB.getTime();    
            });

            currentPage = 1;
            paginateMatches(currentFilteredMatches, currentPage, 'main-match-grid', 'home-prev-page-btn', 'home-next-page-btn', 'home-empty-state');
            
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
        updatePageMetadata();
        generateAndInjectSchema();
    }

    /**
     * Handles the display and logic for the Live Matches view.
     * Filters and displays only live matches.
     */
    function handleLiveMatchesView() {
        showView('live', (section) => {
            const matchGridElement = section.querySelector('#live-match-grid');
            const emptyStateElement = section.querySelector('#live-empty-state');
            const prevPageBtn = section.querySelector('#live-prev-page-btn');
            const nextPageBtn = section.querySelector('#live-next-page-btn');
            const filterButtons = section.querySelectorAll('.filter-btn');
            const dropdown = section.querySelector('.filter-dropdown');
            const sectionTitle = section.querySelector('#live-matches-title');

            if (sectionTitle) sectionTitle.textContent = 'مباريات كرة القدم مباشرة الآن';

            const uniqueLeagues = [...new Set(matchesData.filter(m => m.status === 'live').map(m => m.league_name))].filter(Boolean);
            if (dropdown) {
                dropdown.innerHTML = '<option value="all">كل البطولات</option>' +    
                                             uniqueLeagues.map(league => `<option value="${league}">${league}</option>`).join('');
            }

            const applyLiveFilters = () => {
                const activeFilterBtn = section.querySelector('.filter-btn.active');
                const filterType = activeFilterBtn ? activeFilterBtn.dataset.filterType : 'status';    
                const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filterValue : 'live';
                const selectedLeague = dropdown ? dropdown.value : 'all';

                currentFilteredMatches = matchesData.filter(match => {
                    let passesStatusFilter = false;

                    if (filterType === 'status' && match.status === 'live') {
                        passesStatusFilter = true;
                    }
                    
                    let passesLeagueFilter = true;
                    if (selectedLeague !== 'all' && match.league_name !== selectedLeague) {
                        passesLeagueFilter = false;
                    }
                    
                    return passesStatusFilter && passesLeagueFilter;
                }).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

                currentPage = 1;
                paginateMatches(currentFilteredMatches, currentPage, 'live-match-grid', 'live-prev-page-btn', 'live-next-page-btn', 'live-empty-state');
            };

            filterButtons.forEach(btn => {
                btn.onclick = () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    applyLiveFilters();
                };
            });
            if (dropdown) {
                dropdown.onchange = applyLiveFilters;
            }

            applyLiveFilters();

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
        updatePageMetadata({ title: 'المباريات المباشرة', description: 'شاهد بث مباشر لأهم مباريات كرة القدم الآن. لا تفوت أي لحظة من الإثارة!', keywords: 'مباريات مباشرة, بث مباشر, كورة لايف' });
        generateAndInjectSchema();
    }

    /**
     * Handles the display and logic for the Upcoming Matches view.
     * Filters and displays upcoming matches by date (today, tomorrow) or league.
     */
    function handleUpcomingMatchesView() {
        showView('upcoming', (section) => {
            const matchGridElement = section.querySelector('#upcoming-match-grid');
            const emptyStateElement = section.querySelector('#upcoming-empty-state');
            const prevPageBtn = section.querySelector('#upcoming-prev-page-btn');
            const nextPageBtn = section.querySelector('#upcoming-next-page-btn');
            const filterButtons = section.querySelectorAll('.filter-btn');
            const dropdown = section.querySelector('.filter-dropdown');
            const sectionTitle = section.querySelector('#upcoming-matches-title');

            if (sectionTitle) sectionTitle.textContent = 'مواعيد مباريات كرة القدم القادمة';

            const uniqueLeagues = [...new Set(matchesData.filter(m => m.status === 'upcoming').map(m => m.league_name))].filter(Boolean);
            if (dropdown) {
                dropdown.innerHTML = '<option value="all">كل البطولات</option>' +    
                                             uniqueLeagues.map(league => `<option value="${league}">${league}</option>`).join('');
            }

            const applyUpcomingFilters = () => {
                const activeFilterBtn = section.querySelector('.filter-btn.active');
                const filterType = activeFilterBtn ? activeFilterBtn.dataset.filterType : 'status';    
                const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filterValue : 'upcoming';    
                const selectedLeague = dropdown ? dropdown.value : 'all';
                
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

                currentFilteredMatches = matchesData.filter(match => {
                    let passesDateFilter = false;    
                    const matchDateObj = new Date(match.date_time);
                    const matchDay = new Date(matchDateObj.getFullYear(), matchDateObj.getMonth(), matchDateObj.getDate());

                    if (match.status !== 'upcoming') return false;

                    if (filterType === 'status' && filterValue === 'upcoming') {
                        passesDateFilter = true;
                    } else if (filterType === 'date') {
                        if (filterValue === 'today') {
                            passesDateFilter = matchDay.getTime() === today.getTime();
                        } else if (filterValue === 'tomorrow') {
                            passesDateFilter = matchDay.getTime() === tomorrow.getTime();    
                        }
                    }
                    
                    let passesLeagueFilter = true;
                    if (selectedLeague !== 'all' && match.league_name !== selectedLeague) {
                        passesLeagueFilter = false;
                    }

                    return passesDateFilter && passesLeagueFilter;
                }).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

                currentPage = 1;
                paginateMatches(currentFilteredMatches, currentPage, 'upcoming-match-grid', 'upcoming-prev-page-btn', 'upcoming-next-page-btn', 'upcoming-empty-state');
            };

            filterButtons.forEach(btn => {
                btn.onclick = () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    applyUpcomingFilters();
                };
            });
            if (dropdown) {
                dropdown.onchange = applyUpcomingFilters;
            }

            applyUpcomingFilters();

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
        updatePageMetadata({ title: 'مواعيد المباريات', description: 'اكتشف جدول مباريات كرة القدم القادمة والبطولات الكبرى.', keywords: 'مواعيد مباريات, جدول مباريات, مباريات اليوم, مباريات الغد' });
        generateAndInjectSchema();
    }

    /**
     * Handles the display and logic for the Highlights view.
     * Displays finished matches that have a highlight URL.
     */
    function handleHighlightsView() {
        showView('highlights', (section) => {
            const matchGridElement = section.querySelector('#highlights-grid');
            const emptyStateElement = section.querySelector('#highlights-empty-state');
            const prevPageBtn = section.querySelector('#highlights-prev-page-btn');
            const nextPageBtn = section.querySelector('#highlights-next-page-btn');
            const sectionTitle = section.querySelector('#highlights-title');

            if (sectionTitle) sectionTitle.textContent = 'أهداف وملخصات المباريات';

            currentFilteredMatches = matchesData.filter(m => m.type === 'highlight' && m.embed_url)
                                                    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

            currentPage = 1;
            paginateMatches(currentFilteredMatches, currentPage, 'highlights-grid', 'highlights-prev-page-btn', 'highlights-next-page-btn', 'highlights-empty-state');

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

            currentFilteredMatches = matchesData.filter(m => m.type === 'news')
                                                        .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

            displayMatches(currentFilteredMatches, newsGridElement, emptyStateElement, null);
            
            console.log('📰 [View] News view initialized.');
        });
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
        const match = matchesData.find(m => m.id === matchId);

        if (match) {
            currentDetailedMatch = match;

            showView('details', (sectionElement) => {
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
                const videoContainer = sectionElement.querySelector('.video-player-container'); // Correctly targets the class now
                const videoLoadingSpinner = sectionElement.querySelector('#video-loading-spinner');
                const videoOverlay = sectionElement.querySelector('#video-overlay'); // Correctly targets the ID now

                // Populate text content for match details
                matchDetailsTitleElement.textContent = match.title || 'عنوان غير متوفر';
                matchDetailsDescriptionElement.textContent = match.short_description || 'لا يوجد وصف متاح لهذه المباراة.';
                matchDetailsDateTimeElement.textContent = match.date_time ? new Date(match.date_time).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'غير متوفر';
                matchDetailsLeagueElement.textContent = match.league_name || 'غير محدد';
                matchDetailsCommentatorsElement.textContent = Array.isArray(match.commentators) ? match.commentators.join(', ') : match.commentators || 'غير متوفر';
                matchDetailsTeamsElement.textContent = `${match.home_team || 'فريق غير معروف'} vs ${match.away_team || 'فريق غير معروف'}`;
                matchDetailsStadiumElement.textContent = match.stadium || 'غير متوفر';
                
                if (matchDetailsStatusElement) {
                    const statusText = match.status === 'live' ? 'مباشر الآن' : (match.status === 'finished' ? 'انتهت' : 'قادمة');
                    matchDetailsStatusElement.className = '';    
                    matchDetailsStatusElement.classList.add(match.status === 'live' ? 'live-status' : (match.status === 'finished' ? 'finished-status' : 'upcoming-status'));
                }

                if (match.status === 'finished' && match.score) {
                    if (matchDetailsScoreContainer) matchDetailsScoreContainer.classList.remove('hidden');
                    if (matchDetailsScoreElement) matchDetailsScoreElement.textContent = match.score;
                } else {
                    if (matchDetailsScoreContainer) matchDetailsScoreContainer.classList.add('hidden');
                }

                if (match.highlight_url && match.type === 'highlight') {
                    if (matchDetailsHighlightsContainer) matchDetailsHighlightsContainer.classList.remove('hidden');
                    if (matchDetailsHighlightsLink) matchDetailsHighlightsLink.href = match.highlight_url;
                } else {
                    if (matchDetailsHighlightsContainer) matchDetailsHighlightsContainer.classList.add('hidden');
                }

                if (matchDetailsPoster) {
                    matchDetailsPoster.src = match.thumbnail || 'images/thumbnails/default.jpg';
                    matchDetailsPoster.alt = match.title;
                    matchDetailsPoster.setAttribute('width', '250');
                    matchDetailsPoster.setAttribute('height', '180');
                    matchDetailsPoster.setAttribute('fetchpriority', 'high');
                    matchDetailsPoster.setAttribute('loading', 'eager');
                    console.log(`[Details] Match poster set for ${match.title}`);
                }
                
                // --- iframe Player Setup ---
                const iframeUrl = match.embed_url;

                if (!iframeUrl) {
                    console.error(`❌ Failed to get stream URL for match ID: ${matchId}. Cannot initialize player. (embed_url is null/empty)`);
                    if (videoContainer) {
                        videoContainer.innerHTML = '<p style="text-align: center; color: var(--up-text-primary); margin-top: 20px;">عذرًا، لا يمكن تشغيل البث حاليًا (الرابط غير صالح أو غير متوفر).</p>';
                    }
                    if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                    if (videoOverlay) {
                        videoOverlay.style.pointerEvents = 'none';
                        videoOverlay.classList.add('hidden');
                    }
                    return;
                }

                if (videoContainer) {
                    videoContainer.innerHTML = ''; // Clear any previous video player content

                    const iframeElement = document.createElement('iframe');
                    iframeElement.id = 'match-iframe-player';
                    iframeElement.setAttribute('src', iframeUrl);
                    iframeElement.setAttribute('frameborder', '0');
                    iframeElement.setAttribute('allowfullscreen', 'true');
                    iframeElement.setAttribute('scrolling', 'no');
                    iframeElement.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
                    
                    iframeElement.style.width = '100%';
                    iframeElement.style.height = '100%';
                    iframeElement.style.position = 'absolute';
                    iframeElement.style.top = '0';
                    iframeElement.style.left = '0';
                    
                    iframeElement.setAttribute('title', `مشغل بث مباشر لمباراة ${match.title}`);

                    if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'block';

                    iframeElement.onload = () => {
                        console.log(`[iframe] iframe loaded successfully from: ${iframeUrl}`);
                        if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                        // Setup the transparent video overlay ad *after* the iframe loads
                        if (videoOverlay) {
                            setupVideoOverlayAd(videoOverlay, videoContainer);
                        }
                    };
                    iframeElement.onerror = () => {
                        console.error(`❌ [iframe] Failed to load iframe from: ${iframeUrl}. This might be due to security restrictions (X-Frame-Options) or an invalid URL.`);
                        if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                        if (videoContainer) {
                            videoContainer.innerHTML = '<p style="text-align: center; color: var(--up-text-primary); margin-top: 20px;">عذرًا، لا يمكن تشغيل البث حاليًا (قد يكون الرابط غير صالح أو محظور). يرجى المحاولة لاحقاً.</p>';
                        }
                        clearVideoOverlayAd(); // Clear overlay ad if iframe fails
                    };
                    videoContainer.appendChild(iframeElement);
                    console.log('[Stream Player] iframe element created and appended.');
                } else {
                    console.error('❌ Critical error: ".video-player-container" not found in details view. Cannot create stream player.');
                    return;
                }

                const backToHomeBtnInDetails = sectionElement.querySelector('#back-to-home-btn');
                if (backToHomeBtnInDetails) {
                    backToHomeBtnInDetails.onclick = () => {
                        console.log('🔙 [Interaction] "Back to Matches" button clicked from details view.');
                        showHomePage();
                    };
                }
            });
            
            const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const newUrl = new URL(window.location.origin);
            newUrl.searchParams.set('view', 'details');
            newUrl.searchParams.set('id', match.id);
            newUrl.searchParams.set('title', matchSlug);
            history.pushState({ view: 'details', id: match.id }, match.title, newUrl.toString());
            console.log(`🔗 [URL] Browser URL updated to ${newUrl.toString()}`);

            updatePageMetadata(match);
            generateAndInjectSchema(match);

            displaySuggestedMatches(match.id); // Pass match.id, not currentDetailedMatch.id
            console.log(`✨ [Suggestions] displaySuggestedMatches called for ID: ${match.id}.`);

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.error('❌ [Navigation] Match not found for the given ID:', matchId, '. Redirecting to home page.');
            showHomePage();
        }
    }


    // --- 6. SEO Functions (Meta Tags & JSON-LD Schema) ---

    /**
     * Dynamically updates HTML meta tags and document title for SEO and social sharing.
     * Sets default values for the homepage or specific match details.
     * @param {object|null} match - The current match object if viewing details, or null for general views/homepage.
     */
    function updatePageMetadata(match = null) {
        const canonicalLink = document.getElementById('dynamic-canonical');
        const dynamicTitleElement = document.getElementById('dynamic-title');
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
            pageDescription = shortDescriptionContent + (match.short_description && match.short_description.length > 155 ? '...' : '');
            
            const matchTeams = `${match.home_team}, ${match.away_team}`.split(',').map(s => s.trim()).filter(Boolean).join(', ');    
            const matchLeague = String(match.league_name || '').trim();
            const commentators = Array.isArray(match.commentators) ? match.commentators.join(', ') : String(match.commentators || '').trim();
            pageKeywords = [
                match.title, matchTeams, matchLeague, commentators, 'شاهد كورة', 'بث مباشر', 'مشاهدة أونلاين',    
                'مباريات اليوم', 'كرة القدم', 'جودة عالية', 'الدوري المصري', 'الدوري الإنجليزي',    
                'الدوري الإسباني', 'دوري أبطال أوروبا', 'بث مباشر مجاني', 'Ultimate Pitch'
            ].filter(Boolean).join(', ');

            ogUrl = matchUrl;
            ogTitle = `${match.title} - بث مباشر على شاهد كورة | Ultimate Pitch`;
            ogDescription = pageDescription;
            ogImage = match.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png';
            ogType = "video.other";

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image";

        } else {
            const currentPath = window.location.pathname;
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

            ogUrl = window.location.origin;
            ogTitle = pageTitle;
            ogDescription = pageDescription;
            ogImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png';
            ogType = 'website';

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png';
            twitterCard = "summary_large_image";
        }

        if (dynamicTitleElement) dynamicTitleElement.textContent = pageTitle;
        document.title = pageTitle;
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
            schemaScriptElement.textContent = '';
            console.log('📄 [SEO] No specific JSON-LD schema for this general view (cleared).');
            return;
        }

        const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
        const matchUrl = `${window.location.origin}/view/?details&id=${match.id}&title=${matchSlug}`;

        let formattedDate;
        if (match.date_time) {
            try {
                const date = new Date(match.date_time);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toISOString();
                } else {
                    formattedDate = new Date().toISOString();
                }
            } catch (e) {
                formattedDate = new Date().toISOString();
            }
        } else {
            formattedDate = new Date().toISOString();
        }

        const teamsArray = [match.home_team, match.away_team].filter(Boolean);    
        const commentatorsArray = Array.isArray(match.commentators) ? match.commentators : (match.commentators ? String(match.commentators).split(',').map(s => s.trim()).filter(s => s !== '') : []);
        
        const streamSourceUrl = match.embed_url;

        const schema = {
            "@context": "https://schema.org",
            "@type": "SportsEvent",    
            "name": match.title,
            "description": match.short_description || `مشاهدة بث مباشر لمباراة ${teamsArray.join(' و ')} في ${match.league_name || 'بطولة كرة القدم'} على شاهد كورة.`,
            "image": match.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png',
            "url": matchUrl,
            "startDate": formattedDate,    
            "location": {
                "@type": "Place",
                "name": match.stadium || "ملعب غير معروف"
            },
            "performer": teamsArray.map(teamName => ({ "@type": "SportsTeam", "name": teamName })),    
            "sport": "Football",
            "eventStatus": `https://schema.org/EventStatusType/${
                match.status.toLowerCase() === 'live' ? 'EventScheduled' :
                (match.status.toLowerCase() === 'finished' ? 'EventCompleted' : 'EventScheduled')
            }`,    
            
            "video": {
                "@type": "VideoObject",
                "name": `بث مباشر لمباراة ${match.title}`,
                "description": `بث مباشر بجودة عالية لمباراة ${match.title} بين ${teamsArray.join(' و ')}.`,
                "thumbnailUrl": match.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png',
                "uploadDate": formattedDate,
                "contentUrl": streamSourceUrl,
                "embedUrl": streamSourceUrl,
                "interactionCount": "100000",
                "liveBroadcast": {
                    "@type": "BroadcastEvent",
                    "isLiveBroadcast": match.status.toLowerCase() === 'live',
                    "startDate": formattedDate,
                    "endDate": new Date(new Date(match.date_time).getTime() + 105 * 60 * 1000).toISOString()
                },
                "publisher": {
                    "@type": "Organization",
                    "@id": "https://shahidkora.online/#publisher", // Consistent ID for publisher
                    "name": "شاهد كورة - Ultimate Pitch",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://shahidkora.online/images/shahed-plus-logo.png",
                        "width": 200,
                        "height": 50
                    }
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
                    "name": "مشاهدة البث المباشر",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "http://schema.org/InStock",
                    "url": matchUrl
                }
            }
        };

        if (commentatorsArray.length > 0) {
            schema.commentator = commentatorsArray.map(name => ({ "@type": "Person", "name": name }));
        }

        schemaScriptElement.textContent = JSON.stringify(schema, null, 2);
        console.log('📄 [SEO] New JSON-LD schema added/updated.');
    }

    /**
     * Displays a list of suggested matches related to the currently detailed match.
     * @param {number} currentMatchId - The ID of the match currently being viewed in detail.
     */
    function displaySuggestedMatches(currentMatchId) {
        const suggestedMatchGrid = currentActiveViewElement ? currentActiveViewElement.querySelector('#suggested-match-grid') : null;
        if (!suggestedMatchGrid || !currentDetailedMatch) {
            console.error('❌ displaySuggestedMatches: "suggestedMatchGrid" or "currentDetailedMatch" not found. Cannot display suggested matches.');
            return;
        }

        const currentMatchLeague = currentDetailedMatch.league_name;
        const currentMatchTeams = [currentDetailedMatch.home_team, currentDetailedMatch.away_team].filter(Boolean);
        let suggested = [];

        if (currentMatchLeague) {
            suggested = matchesData.filter(match =>
                match.id !== currentMatchId &&
                match.league_name === currentMatchLeague &&
                match.status !== 'finished'
            );
        }

        if (suggested.length < 12) {
            const teamRelated = matchesData.filter(match =>
                match.id !== currentMatchId &&
                match.status !== 'finished' &&
                ([match.home_team, match.away_team].filter(Boolean).some(team => currentMatchTeams.includes(team))) &&
                !suggested.some(s => s.id === match.id)
            );
            suggested = [...new Set([...suggested, ...teamRelated])];
        }

        if (suggested.length < 12) {
            const otherRelevantMatches = matchesData.filter(match =>    
                match.id !== currentMatchId &&    
                match.status !== 'finished' &&
                !suggested.some(s => s.id === match.id)
            ).sort(() => 0.5 - Math.random());
            const needed = 12 - suggested.length;
            suggested = [...suggested, ...otherRelevantMatches.slice(0, needed)];
        }
        
        if (suggested.length < 12) {
            const finishedMatches = matchesData.filter(match =>    
                match.id !== currentMatchId &&    
                !suggested.some(s => s.id === match.id)
            ).sort((a,b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
            const needed = 12 - suggested.length;
            suggested = [...suggested, ...finishedMatches.slice(0, needed)];
        }

        const finalSuggested = suggested.slice(0, 12);

        if (finalSuggested.length === 0) {
            suggestedMatchGrid.innerHTML = '<p style="text-align: center; color: var(--up-text-muted);">لا توجد مباريات مقترحة حالياً.</p>';
            console.log('✨ [Suggestions] No suggested matches available after filtering.');
            return;
        }

        displayMatches(finalSuggested, suggestedMatchGrid);    
        console.log(`✨ [Suggestions] Displayed ${finalSuggested.length} suggested matches in ${suggestedMatchGrid.id}.`);
    }

    /**
     * Resets the view to the Home page, clears search, and updates URL/SEO.
     */
    function showHomePage() {
        console.log('🏠 [Navigation] Displaying home page.');
        
        if (searchInput) searchInput.value = '';
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.targetView === 'home') {
                link.classList.add('active');
            }
        });

        handleHomeView();
        
        // Ensure the video overlay and spinner are hidden when navigating away from a match detail page
        clearVideoOverlayAd(); // Call the specific clear function for ads

        currentDetailedMatch = null;

        const newUrl = new URL(window.location.origin);
        history.pushState({ view: 'home' }, 'شاهد كورة - الصفحة الرئيسية', newUrl.toString());
        console.log(`🔗 [URL] Browser URL updated to ${newUrl.toString()}`);

        updatePageMetadata();
        generateAndInjectSchema();
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
            e.preventDefault();
            console.log('🏠 [Interaction] Home logo link clicked.');
            showHomePage();
            if (mainNav && mainNav.classList.contains('nav-open')) {
                mainNav.classList.remove('nav-open');
            }
        });
    }

    // Main navigation links (delegated using data-target-view)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.dataset.targetView;
            
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
            handleLiveMatchesView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Search functionality listeners
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.toLowerCase().trim();
            console.log(`🔍 [Search] Search button clicked. Query: "${query}".`);
            
            let searchResults = [];
            if (query) {
                searchResults = matchesData.filter(match =>
                    match.title.toLowerCase().includes(query) ||
                    (match.league_name && match.league_name.toLowerCase().includes(query)) ||
                    (match.home_team && match.home_team.toLowerCase().includes(query)) ||
                    (match.away_team && match.away_team.toLowerCase().includes(query))
                );
            } else {
                searchResults = matchesData;
            }

            showView('home', (section) => {
                const matchGridElement = section.querySelector('#main-match-grid');
                const prevPageBtn = section.querySelector('#home-prev-page-btn');
                const nextPageBtn = section.querySelector('#home-next-page-btn');
                const sectionTitle = section.querySelector('#home-matches-title');

                if (sectionTitle) {
                    sectionTitle.textContent = query ? `نتائج البحث عن "${query}"` : 'أبرز المباريات والجديد';
                }

                currentFilteredMatches = searchResults;
                currentPage = 1;
                paginateMatches(currentFilteredMatches, currentPage, 'main-match-grid', 'home-prev-page-btn', 'home-next-page-btn', 'home-empty-state');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        console.log('🔍 [Event] Search button listener attached.');
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchButton.click();
                searchInput.blur();
            }
        });
        console.log('🔍 [Event] Search input keypress listener attached.');
    }

    // General Security Measures (Right-click and DevTools blocking)
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        console.warn('🚫 [Security] Right-click context menu disabled.');
    });

    document.addEventListener('keydown', e => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.metaKey && e.altKey && e.key === 'I')
        ) {
            e.preventDefault();
            console.warn(`🚫 [Security] Developer tools/source shortcut blocked: ${e.key}.`);
        }
    });

    // DevTools Detector (attempts to detect if developer tools are open)
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
        setInterval(checkDevTools, 5000);
        checkDevTools();
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
            const match = matchesData.find(m => m.id === matchId);

            if (!isNaN(matchId) && match) {
                console.log(`🚀 [Initial Load] Attempting to load match details from URL: ID ${matchId}.`);
                showMatchDetails(matchId);
            } else {
                console.warn('⚠️ [Initial Load] Invalid match ID in URL or match not found in data. Displaying home page as fallback.');
                showHomePage();
            }
        } else {
            console.log('🚀 [Initial Load] No specific view parameters in URL. Displaying home page.');
            showHomePage();
        }
    }

    /**
     * Handles browser popstate event (back/forward button clicks).
     * Re-renders the appropriate view based on the history state.
     */
    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] Browser history navigation detected.', event.state);
        
        if (matchesData.length === 0) {
            console.warn('[Popstate] Match data not loaded yet, attempting to fetch data and render view based on popstate event.');
            fetchMatchesData().then(() => {
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
                showHomePage();
            });
            return;
        }

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
