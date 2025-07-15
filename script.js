// script.js - كود "شاهد كورة" - Ultimate Pitch UI - محسن وواضح لمحركات البحث والمطورين
// تم التركيز على أفضل أداء ممكن من جانب العميل مع الحفاظ على الوظائف والإعلانات
// والتأكد من إزالة أي عناصر قد تؤثر سلباً على الفهم من قبل محركات البحث

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Script execution started for Shahid Kora.');

    // --- 1. DOM Element References & Critical Verification ---
    const mainHeader = document.querySelector('.main-header');
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const contentDisplay = document.getElementById('content-display');
    const heroSection = document.getElementById('hero-section');
    const watchNowBtn = document.getElementById('watch-now-btn');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const homeLogoLink = document.getElementById('home-logo-link');

    // Templates (cloned into contentDisplay)
    const homeViewTemplate = document.getElementById('home-view-template');
    const liveMatchesTemplate = document.getElementById('live-matches-template');
    const upcomingMatchesTemplate = document.getElementById('upcoming-matches-template');
    const highlightsTemplate = document.getElementById('highlights-template');
    const newsTemplate = document.getElementById('news-template');
    const matchDetailsViewTemplate = document.getElementById('match-details-view-template');

    // Global state
    let itemsData = []; // Combined array of matches and news
    let currentViewItems = []; // Items for the currently displayed view (e.g., live matches, search results)
    let currentPage = 1;
    const itemsPerPage = 20; // Number of items per page for grids
    let currentActiveView = 'home';
    let currentDetailedMatch = null;

    // --- 1.1. Critical DOM Element Verification ---
    const requiredElements = {
        '#main-header': mainHeader,
        '#main-nav': mainNav,
        '#content-display': contentDisplay,
        '#hero-section': heroSection,
        '#home-view-template': homeViewTemplate,
        '#live-matches-template': liveMatchesTemplate,
        '#upcoming-matches-template': upcomingMatchesTemplate,
        '#highlights-template': highlightsTemplate,
        '#news-template': newsTemplate,
        '#match-details-view-template': matchDetailsViewTemplate
    };

    let criticalError = false;
    for (const [id, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`❌ Critical Error: DOM element with ID "${id}" is missing. Please check your HTML file.`);
            criticalError = true;
        }
    }
    if (criticalError) {
        console.error('🛑 Script will not execute fully due to missing essential DOM elements. Fix your HTML!');
        document.body.innerHTML = '<div style="text-align: center; margin-top: 100px; color: #f44336; font-size: 20px;">' +
            'Sorry, a technical error occurred. Please refresh the page or try again later.' +
            '<p style="font-size: 14px; color: #ccc;">(Essential page elements are missing)</p></div>';
        return;
    } else {
        console.log('✅ All essential DOM elements found.');
    }

    // --- 2. Adsterra Configuration ---
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/spqbhmyax?key=2469b039d4e7c471764bd04c57824cf2';
    const DIRECT_LINK_COOLDOWN_CARD_CLICK = 3 * 60 * 1000; // 3 minutes
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 10 * 1000; // 10 seconds

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
            console.error('Invalid ad link type for openAdLink:', type);
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
                console.warn(`⚠️ [Ad Click - ${type}] Pop-up blocked or failed to open direct link. Please allow pop-ups.`);
                return false;
            }
        } else {
            const timeLeft = (cooldownDuration - (currentTime - lastClickTime)) / 1000;
            console.log(`⏳ [Ad Click - ${type}] Cooldown active. No new tab will open. Time left: ${timeLeft.toFixed(1)}s`);
            return false;
        }
    }

    // --- 3. Data Fetching & Card Creation ---
    async function fetchItemsData() {
        try {
            console.log('📡 Fetching items data from matches.json...');
            const response = await fetch('matches.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - Could not load matches.json. Check file path and server config.`);
            }
            itemsData = await response.json();
            if (!Array.isArray(itemsData)) {
                console.error('❌ Fetched data is not an array. Please check matches.json format. Expected array of objects.');
                itemsData = [];
            } else if (itemsData.length === 0) {
                console.warn('⚠️ matches.json loaded, but it is empty.');
            }
            console.log('✅ Items data loaded successfully from matches.json.', itemsData.length, 'items found.');
            initialPageLoadLogic(); // Proceed with initial page load
        } catch (error) {
            console.error('❌ Failed to load items data:', error.message);
            contentDisplay.innerHTML = '<section class="view-section active-view container">' +
                '<p style="text-align: center; color: var(--up-text-primary); margin-top: 50px;">عذراً، لم نتمكن من تحميل بيانات المباريات والأخبار. يرجى المحاولة مرة أخرى لاحقاً أو التحقق من ملف matches.json.</p>' +
                '</section>';
        }
    }

    function createMatchCard(match) {
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card');
        matchCard.setAttribute('data-id', match.id);

        const homeLogo = match.home_team_logo || '/images/teams/default.png';
        const awayLogo = match.away_team_logo || '/images/teams/default.png';
        const thumbnail = match.thumbnail || '/images/thumbnails/default-match.jpg';

        const statusClass = match.status === 'Live' ? 'live-status' :
                            match.status === 'Upcoming' ? 'upcoming-status' :
                            'finished-status';
        const scoreDisplay = match.status === 'Finished' && match.score ? `<div class="match-score">${match.score}</div>` : '';
        const dateTime = match.date_time ? new Date(match.date_time).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'غير محدد';
        const highlightsButton = match.highlights_url ? `<button class="btn btn-secondary btn-highlights" data-highlights-url="${match.highlights_url}" aria-label="شاهد الملخص"><i class="fas fa-play-circle"></i> ملخص</button>` : '';

        matchCard.innerHTML = `
            <img src="${thumbnail}" alt="${match.title}" loading="lazy" width="350" height="200">
            <div class="match-card-content">
                <div class="teams-logos">
                    <div>
                        <img src="${homeLogo}" alt="${match.home_team} logo" class="team-logo" width="50" height="50" loading="lazy">
                        <span>${match.home_team}</span>
                    </div>
                    <span class="vs-text">VS</span>
                    <div>
                        <span>${match.away_team}</span>
                        <img src="${awayLogo}" alt="${match.away_team} logo" class="team-logo" width="50" height="50" loading="lazy">
                    </div>
                </div>
                <h3>${match.title}</h3>
                <p class="match-league">${match.league_name}</p>
                ${scoreDisplay}
                <span class="match-status ${statusClass}">${match.status === 'Live' ? 'مباشر الآن' : match.status === 'Upcoming' ? 'قريباً' : 'انتهت'}</span>
                <p class="match-time">${dateTime}</p>
                ${highlightsButton}
            </div>
        `;
        matchCard.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-highlights')) {
                console.log(`⚡ [Interaction] Match card clicked for ID: ${match.id}`);
                openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card');
                showMatchDetails(match.id);
            }
        });

        // Add event listener for highlights button if it exists
        const highlightsBtn = matchCard.querySelector('.btn-highlights');
        if (highlightsBtn) {
            highlightsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event from firing
                openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card'); // Ad for highlights click
                window.open(highlightsBtn.dataset.highlightsUrl, '_blank');
                console.log(`▶️ [Interaction] Highlights button clicked for ID: ${match.id}`);
            });
        }

        return matchCard;
    }

    function createNewsCard(newsItem) {
        const newsCard = document.createElement('div');
        newsCard.classList.add('news-card');
        newsCard.setAttribute('data-id', newsItem.id);

        const thumbnail = newsItem.article_image || newsItem.thumbnail || '/images/news/default-news.jpg';
        const date = newsItem.date_time ? new Date(newsItem.date_time).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير محدد';

        newsCard.innerHTML = `
            <img src="${thumbnail}" alt="${newsItem.title}" loading="lazy" width="250" height="150">
            <div class="news-card-content">
                <h4>${newsItem.title}</h4>
                <p>${newsItem.short_description}</p>
                <span class="news-date">${date}</span>
            </div>
        `;
        newsCard.addEventListener('click', () => {
            console.log(`⚡ [Interaction] News card clicked for ID: ${newsItem.id}`);
            openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card');
            if (newsItem.article_url) {
                window.open(newsItem.article_url, '_blank');
            } else {
                console.warn(`⚠️ News item ${newsItem.id} has no article_url.`);
            }
        });
        return newsCard;
    }

    function displayItems(itemsToDisplay, targetGridElement, typeFilter = null) {
        if (!targetGridElement) {
            console.error('❌ displayItems: Target grid element is null or undefined.');
            return;
        }
        targetGridElement.innerHTML = ''; // Clear old content

        if (!itemsToDisplay || itemsToDisplay.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.classList.add('empty-state');
            emptyState.style.display = 'block'; // Make sure it's visible
            emptyState.innerHTML = '<p>لا توجد عناصر لعرضها حالياً.</p>';
            if (currentActiveView === 'live') {
                emptyState.innerHTML = '<p>لا توجد مباريات مباشرة حالياً. استعد للإثارة القادمة!</p><button class="btn btn-secondary" data-target-view="upcoming">اكتشف المباريات القادمة</button>';
            } else if (currentActiveView === 'upcoming') {
                emptyState.innerHTML = '<p>لا توجد مباريات مجدولة حالياً. ترقبوا التحديثات!</p>';
            } else if (currentActiveView === 'highlights') {
                emptyState.innerHTML = '<p>لا توجد أهداف أو ملخصات متاحة حالياً.</p>';
            } else if (currentActiveView === 'news') {
                emptyState.innerHTML = '<p>الأخبار قيد التحديث. تابعونا لكل جديد في عالم كرة القدم!</p>';
            }

            targetGridElement.appendChild(emptyState);
            console.log(`🎬 [Display] No items to display in ${targetGridElement.id} for type: ${typeFilter || 'All'}.`);
            return;
        }

        console.log(`🎬 [Display] Displaying ${itemsToDisplay.length} items in ${targetGridElement.id}.`);
        itemsToDisplay.forEach(item => {
            if (item.type === 'match') {
                targetGridElement.appendChild(createMatchCard(item));
            } else if (item.type === 'news') {
                targetGridElement.appendChild(createNewsCard(item));
            }
        });
        console.log(`🎬 [Display] Successfully displayed ${itemsToDisplay.length} items in ${targetGridElement.id}.`);
    }

    function paginateItems(itemsArray, page, targetGridElement, paginationControlsElement) {
        if (!targetGridElement || !paginationControlsElement) {
            console.error('❌ paginateItems: Missing targetGridElement or paginationControlsElement.');
            return;
        }

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = itemsArray.slice(startIndex, endIndex);

        displayItems(paginatedItems, targetGridElement);
        updatePaginationButtons(itemsArray.length, page, paginationControlsElement);
        console.log(`➡️ [Pagination] Displaying page ${page}. Items from index ${startIndex} to ${Math.min(endIndex, itemsArray.length) - 1}.`);

        // Show/hide pagination controls
        if (itemsArray.length > itemsPerPage) {
            paginationControlsElement.style.display = 'flex';
        } else {
            paginationControlsElement.style.display = 'none';
        }
    }

    function updatePaginationButtons(totalItems, currentPageNum, paginationControlsElement) {
        const prevBtn = paginationControlsElement.querySelector('.btn-page.prev');
        const nextBtn = paginationControlsElement.querySelector('.btn-page.next');

        if (prevBtn) prevBtn.disabled = currentPageNum === 1;
        if (nextBtn) nextBtn.disabled = currentPageNum * itemsPerPage >= totalItems;
        console.log(`🔄 [Pagination] Buttons updated. Current page: ${currentPageNum}, Total items: ${totalItems}`);
    }

    function performSearch() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filteredItems = [];
        const currentSectionTitle = contentDisplay.querySelector('.view-section.active-view .section-title');
        const currentGrid = contentDisplay.querySelector('.view-section.active-view .match-grid, .view-section.active-view .news-grid');
        const currentPagination = contentDisplay.querySelector('.view-section.active-view .pagination-controls');

        if (!currentGrid || !currentPagination) {
            console.warn('Search attempted on a view without a grid or pagination controls.');
            return;
        }

        if (query) {
            filteredItems = itemsData.filter(item =>
                item.title.toLowerCase().includes(query) ||
                (item.short_description && item.short_description.toLowerCase().includes(query)) ||
                (item.league_name && item.league_name.toLowerCase().includes(query)) ||
                (item.home_team && item.home_team.toLowerCase().includes(query)) ||
                (item.away_team && item.away_team.toLowerCase().includes(query)) ||
                (item.commentators && item.commentators.some(c => c.toLowerCase().includes(query))) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(query)))
            );
            if (currentSectionTitle) {
                currentSectionTitle.textContent = `نتائج البحث عن "${query}"`;
            }
            console.log(`🔍 [Search] Search performed for "${query}". Found ${filteredItems.length} results.`);
        } else {
            // If query is empty, show default content for the current view
            renderView(currentActiveView); // Re-render the current view to reset filters/search
            return;
        }

        currentPage = 1;
        currentViewItems = filteredItems;
        paginateItems(currentViewItems, currentPage, currentGrid, currentPagination);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- 4. View Rendering and Navigation ---
    function renderView(viewName, filterValue = null) {
        console.log(`🔄 [View Render] Attempting to render view: ${viewName}`);
        currentActiveView = viewName;

        // Hide all active view sections first
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active-view');
            section.style.display = 'none';
        });
        heroSection.style.display = 'none'; // Ensure hero is hidden unless it's the specific home setup

        // Deactivate all nav links
        navLinks.forEach(link => link.classList.remove('active'));

        // Clear content display area before cloning new template
        contentDisplay.innerHTML = '';

        let targetTemplate;
        let gridElementId;
        let titleElementId;
        let emptyStateElementId;
        let paginationControlsId;
        let itemsToRender = [];

        // Select the correct template and filter data
        switch (viewName) {
            case 'home':
                targetTemplate = homeViewTemplate;
                gridElementId = 'main-match-grid';
                titleElementId = 'home-matches-title';
                paginationControlsId = 'home-pagination-controls'; // Not present in HTML, need to add if pagination is wanted for home
                itemsToRender = [...itemsData].sort(() => 0.5 - Math.random()).filter(item => item.type === 'match'); // Show random matches on home
                heroSection.style.display = 'block'; // Show hero section on home
                document.getElementById('home-nav-link-actual').classList.add('active');
                break;
            case 'live':
                targetTemplate = liveMatchesTemplate;
                gridElementId = 'live-match-grid';
                titleElementId = 'live-matches-title';
                emptyStateElementId = 'live-empty-state';
                paginationControlsId = 'live-pagination-controls'; // Need to append this to the template for the pagination buttons to exist
                itemsToRender = itemsData.filter(item => item.type === 'match' && item.status === 'Live');
                break;
            case 'upcoming':
                targetTemplate = upcomingMatchesTemplate;
                gridElementId = 'upcoming-match-grid';
                titleElementId = 'upcoming-matches-title';
                emptyStateElementId = 'upcoming-empty-state';
                paginationControlsId = 'upcoming-pagination-controls'; // Need to append this
                itemsToRender = itemsData.filter(item => item.type === 'match' && item.status === 'Upcoming');
                if (filterValue === 'today') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    itemsToRender = itemsToRender.filter(item => {
                        const matchDate = new Date(item.date_time);
                        matchDate.setHours(0, 0, 0, 0);
                        return matchDate.getTime() === today.getTime();
                    });
                } else if (filterValue === 'tomorrow') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    itemsToRender = itemsToRender.filter(item => {
                        const matchDate = new Date(item.date_time);
                        matchDate.setHours(0, 0, 0, 0);
                        return matchDate.getTime() === tomorrow.getTime();
                    });
                }
                break;
            case 'highlights':
                targetTemplate = highlightsTemplate;
                gridElementId = 'highlights-grid';
                titleElementId = 'highlights-title';
                emptyStateElementId = 'highlights-empty-state';
                paginationControlsId = 'highlights-pagination-controls'; // Need to append this
                itemsToRender = itemsData.filter(item => item.type === 'match' && item.highlights_url);
                break;
            case 'news':
                targetTemplate = newsTemplate;
                gridElementId = 'news-grid';
                titleElementId = 'news-title';
                emptyStateElementId = 'news-empty-state';
                paginationControlsId = 'news-pagination-controls'; // Need to append this
                itemsToRender = itemsData.filter(item => item.type === 'news').sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
                break;
            default:
                console.warn(`⚠️ Unknown view requested: ${viewName}. Defaulting to home.`);
                renderView('home');
                return;
        }

        // Clone content from template
        const clonedContent = targetTemplate.content.cloneNode(true);
        contentDisplay.appendChild(clonedContent);

        // Get live references to elements within the newly cloned content
        const currentViewSection = contentDisplay.querySelector('.view-section');
        const currentGridElement = currentViewSection.querySelector(`#${gridElementId}`);
        const currentPaginationControls = currentViewSection.querySelector('.pagination-controls'); // Already in template with correct IDs

        // Activate the current view section
        if (currentViewSection) {
            currentViewSection.style.display = 'block';
            setTimeout(() => { // Add active class after a short delay for animation
                currentViewSection.classList.add('active-view');
            }, 50);
        }

        // Activate the corresponding nav link
        const activeNavLink = document.querySelector(`.main-nav ul li a[data-target-view="${viewName}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }

        // Set current items for pagination and display
        currentViewItems = itemsToRender;
        currentPage = 1; // Reset page to 1 for new view

        // Handle filter buttons for upcoming matches
        if (viewName === 'upcoming') {
            currentViewSection.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filterValue === filterValue || (filterValue === null && btn.dataset.filterValue === 'upcoming')) {
                    btn.classList.add('active');
                }
                btn.onclick = () => {
                    renderView('upcoming', btn.dataset.filterValue);
                };
            });
        }


        // Display items and set up pagination
        if (currentGridElement) {
            paginateItems(currentViewItems, currentPage, currentGridElement, currentPaginationControls);
        } else {
            console.error(`❌ Grid element #${gridElementId} not found in cloned template for view ${viewName}.`);
        }

        // Attach pagination event listeners
        const prevPageBtn = currentPaginationControls ? currentPaginationControls.querySelector('.btn-page.prev') : null;
        const nextPageBtn = currentPaginationControls ? currentPaginationControls.querySelector('.btn-page.next') : null;

        if (prevPageBtn) {
            prevPageBtn.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    paginateItems(currentViewItems, currentPage, currentGridElement, currentPaginationControls);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
        }
        if (nextPageBtn) {
            nextPageBtn.onclick = () => {
                const totalPages = Math.ceil(currentViewItems.length / itemsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    paginateItems(currentViewItems, currentPage, currentGridElement, currentPaginationControls);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
        }

        // Update URL and SEO for the new view (home view handles itself)
        if (viewName !== 'home') {
            const newUrl = new URL(window.location.origin);
            newUrl.searchParams.set('view', viewName);
            history.pushState({ view: viewName }, document.title, newUrl.toString());
            updatePageMetadata(); // Use default metadata for views
            generateAndInjectSchema(); // Clear schema for general views
        }

        // Special handling for empty states to ensure correct visibility
        const emptyStateElement = currentViewSection.querySelector(`#${emptyStateElementId}`);
        if (emptyStateElement) {
            if (itemsToRender.length === 0) {
                emptyStateElement.style.display = 'block';
                if (currentGridElement) currentGridElement.innerHTML = ''; // Ensure grid is empty
            } else {
                emptyStateElement.style.display = 'none';
            }
        }
        console.log(`✅ View "${viewName}" rendered successfully.`);
    }


    function showMatchDetails(matchId) {
        console.log(`🔍 [Navigation] Displaying match details for ID: ${matchId}`);
        const match = itemsData.find(item => item.id === matchId && item.type === 'match');

        if (match) {
            currentDetailedMatch = match;

            // Hide all general view sections
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.remove('active-view');
                section.style.display = 'none';
            });
            heroSection.style.display = 'none';

            // Clone match details template
            contentDisplay.innerHTML = ''; // Clear main content area
            const clonedDetailsContent = matchDetailsViewTemplate.content.cloneNode(true);
            contentDisplay.appendChild(clonedDetailsContent);

            const matchDetailsSection = contentDisplay.querySelector('.match-details-section');
            const videoContainer = matchDetailsSection.querySelector('#match-player-container');
            const videoOverlay = matchDetailsSection.querySelector('#video-overlay');
            const videoLoadingSpinner = matchDetailsSection.querySelector('#video-loading-spinner');

            // Show match details section
            if (matchDetailsSection) {
                matchDetailsSection.style.display = 'block';
                setTimeout(() => {
                    matchDetailsSection.classList.add('active-view');
                }, 50);
            }

            // Populate video player iframe
            if (videoContainer) {
                videoContainer.innerHTML = '';
                const iframeElement = document.createElement('iframe');
                iframeElement.id = 'match-player-iframe';
                iframeElement.src = match.embed_url;
                iframeElement.setAttribute('frameborder', '0');
                iframeElement.setAttribute('allowfullscreen', 'true');
                iframeElement.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
                iframeElement.style.width = '100%';
                iframeElement.style.height = '100%';
                iframeElement.style.minHeight = '300px';
                iframeElement.loading = 'lazy';
                videoContainer.appendChild(iframeElement);
                console.log('[Video Player] Iframe created for match player.');

                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';

                if (videoOverlay) {
                    videoOverlay.style.pointerEvents = 'auto'; // Enable click for ad
                    videoOverlay.classList.remove('hidden');
                    // Add click listener for the overlay
                    videoOverlay.onclick = async (e) => {
                        console.log('⏯️ [Ad Click] Video overlay clicked. Attempting to open direct link.');
                        const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');
                        if (adOpened) {
                            await new Promise(resolve => setTimeout(resolve, 300));
                            if (videoOverlay) {
                                videoOverlay.style.pointerEvents = 'none';
                                videoOverlay.classList.add('hidden');
                            }
                        } else {
                            console.log('[Video Overlay] Ad not opened due to cooldown. Overlay remains active.');
                        }
                        e.stopPropagation();
                    };
                }
            } else {
                console.error('❌ Critical Error: #match-player-container not found. Cannot create video player.');
                return;
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Populate match details info box
            const matchDetailsTitleElement = matchDetailsSection.querySelector('#match-details-title-element');
            const matchDetailsDescription = matchDetailsSection.querySelector('#match-details-description');
            const matchDetailsDateTime = matchDetailsSection.querySelector('#match-details-date-time');
            const matchDetailsLeague = matchDetailsSection.querySelector('#match-details-league');
            const matchDetailsCommentators = matchDetailsSection.querySelector('#match-details-commentators');
            const matchDetailsTeams = matchDetailsSection.querySelector('#match-details-teams');
            const matchDetailsStadium = matchDetailsSection.querySelector('#match-details-stadium');
            const matchDetailsStatus = matchDetailsSection.querySelector('#match-details-status');
            const matchDetailsScoreContainer = matchDetailsSection.querySelector('#match-details-score-container');
            const matchDetailsScore = matchDetailsSection.querySelector('#match-details-score');
            const matchDetailsHighlightsContainer = matchDetailsSection.querySelector('#match-details-highlights-container');
            const matchDetailsHighlightsLink = matchDetailsSection.querySelector('#match-details-highlights-link');
            const matchDetailsPoster = matchDetailsSection.querySelector('#match-details-poster');

            if (matchDetailsTitleElement) matchDetailsTitleElement.textContent = match.title || 'عنوان المباراة غير متوفر';
            if (matchDetailsDescription) matchDetailsDescription.textContent = match.short_description || 'لا يوجد وصف متاح لهذه المباراة.';
            if (matchDetailsDateTime) matchDetailsDateTime.textContent = match.date_time ? new Date(match.date_time).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' }) : 'غير متوفر';
            if (matchDetailsLeague) matchDetailsLeague.textContent = match.league_name || 'غير محدد';
            if (matchDetailsCommentators) matchDetailsCommentators.textContent = Array.isArray(match.commentators) ? match.commentators.join(', ') : match.commentators || 'غير متوفر';
            if (matchDetailsTeams) matchDetailsTeams.textContent = `${match.home_team} ضد ${match.away_team}` || 'الفرق غير متوفرة';
            if (matchDetailsStadium) matchDetailsStadium.textContent = match.stadium || 'غير متوفر';
            if (matchDetailsStatus) matchDetailsStatus.textContent = match.status === 'Live' ? 'مباشرة الآن' : match.status === 'Upcoming' ? 'قريباً' : 'انتهت';

            if (match.status === 'Finished' && match.score) {
                if (matchDetailsScoreContainer) matchDetailsScoreContainer.classList.remove('hidden');
                if (matchDetailsScore) matchDetailsScore.textContent = match.score;
            } else {
                if (matchDetailsScoreContainer) matchDetailsScoreContainer.classList.add('hidden');
            }

            if (match.highlights_url) {
                if (matchDetailsHighlightsContainer) matchDetailsHighlightsContainer.classList.remove('hidden');
                if (matchDetailsHighlightsLink) {
                    matchDetailsHighlightsLink.href = match.highlights_url;
                    matchDetailsHighlightsLink.onclick = (e) => {
                        e.preventDefault();
                        openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card'); // Ad for highlights click
                        window.open(match.highlights_url, '_blank');
                    };
                }
            } else {
                if (matchDetailsHighlightsContainer) matchDetailsHighlightsContainer.classList.add('hidden');
            }

            if (matchDetailsPoster) {
                matchDetailsPoster.src = match.thumbnail || '/images/thumbnails/default-match.jpg';
                matchDetailsPoster.alt = match.title;
                matchDetailsPoster.onclick = () => {
                    openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'detailsPoster');
                };
            }

            // Back to home button listener
            const backToHomeBtn = matchDetailsSection.querySelector('#back-to-home-btn');
            if (backToHomeBtn) {
                backToHomeBtn.onclick = () => {
                    console.log('🔙 [Interaction] Back to matches button clicked.');
                    renderView('home'); // Go back to home view
                };
            }

            // Suggested Matches Section
            displaySuggestedMatches(match.id, matchDetailsSection.querySelector('#suggested-match-grid'));

            // Update URL and SEO
            const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const newUrl = new URL(window.location.origin);
            newUrl.pathname = '/match'; // Cleaner URL structure
            newUrl.searchParams.set('id', match.id);
            newUrl.searchParams.set('title', matchSlug);

            history.pushState({ view: 'details', id: match.id }, match.title, newUrl.toString());
            console.log(`🔗 [URL] URL updated to ${newUrl.toString()}`);

            updatePageMetadata(match);
            generateAndInjectSchema(match);

        } else {
            console.error('❌ [Navigation] Match not found for ID:', matchId, '. Redirecting to home page.');
            renderView('home');
        }
    }


    function updatePageMetadata(item = null) {
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }

        let pageTitle, pageDescription, pageKeywords, ogUrl, ogTitle, ogDescription, ogImage, ogType;
        let twitterTitle, twitterDescription, twitterImage, twitterCard;

        if (item && item.type === 'match') {
            const matchSlug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const matchUrl = `${window.location.origin}/match?id=${item.id}&title=${matchSlug}`;
            canonicalLink.setAttribute('href', matchUrl);

            pageTitle = `${item.title} - مشاهدة بث مباشر وملخصات على شاهد كورة`;
            const shortDescription = (item.short_description || `شاهد بث مباشر لمباراة ${item.home_team} ضد ${item.away_team} بجودة عالية. ${item.league_name}.`).substring(0, 155);
            pageDescription = shortDescription + (item.short_description && item.short_description.length > 155 ? '...' : '');

            const matchTags = Array.isArray(item.tags) ? item.tags.join(', ') : String(item.tags || '').trim();
            const commentators = Array.isArray(item.commentators) ? item.commentators.join(', ') : String(item.commentators || '').trim();
            pageKeywords = [
                item.title, item.home_team, item.away_team, item.league_name, item.stadium,
                'شاهد كورة', 'بث مباشر', 'مباريات اليوم', 'أهداف', 'ملخصات', 'أخبار كرة قدم',
                'دوري', 'كورة', 'مشاهدة مجانية', 'تحليل كروي', commentators, matchTags
            ].filter(Boolean).join(', ');

            ogUrl = matchUrl;
            ogTitle = `${item.title} - بث مباشر وملخصات | شاهد كورة`;
            ogDescription = pageDescription;
            ogImage = item.thumbnail || item.home_team_logo || item.away_team_logo;
            ogType = "video.other"; // Or article if it's primarily text content about the match

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image";

        } else if (item && item.type === 'news') {
            // For news items, since they might open external links, direct SEO is less critical for *this* page
            // but we can set it up if the internal news view is implemented.
            // For now, if news has a dedicated view, this would be updated.
            // Assuming news items link externally, this part might not be used for detail view.
            const newsSlug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const newsUrl = item.article_url || `${window.location.origin}/news?id=${item.id}&title=${newsSlug}`; // Fallback if no external URL
            canonicalLink.setAttribute('href', newsUrl);

            pageTitle = `${item.title} - آخر الأخبار الكروية على شاهد كورة`;
            pageDescription = (item.short_description || `آخر الأخبار الرياضية: ${item.title}`).substring(0, 155);
            const newsTags = Array.isArray(item.tags) ? item.tags.join(', ') : String(item.tags || '').trim();
            pageKeywords = [
                item.title, 'أخبار كرة قدم', 'شاهد كورة', 'أخبار عاجلة', 'تحليلات رياضية', newsTags
            ].filter(Boolean).join(', ');

            ogUrl = newsUrl;
            ogTitle = `${item.title} | شاهد كورة - أخبار`;
            ogDescription = pageDescription;
            ogImage = item.article_image || item.thumbnail || 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png';
            ogType = 'article';

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image";

        } else {
            // Default Home Page metadata
            pageTitle = 'شاهد كورة - Ultimate Pitch: تجربة كرة القدم النهائية | بث مباشر وأخبار';
            pageDescription = 'شاهد كورة - ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.';
            pageKeywords = 'شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch';

            ogUrl = window.location.origin;
            canonicalLink.setAttribute('href', ogUrl + '/');
            ogTitle = 'شاهد كورة - Ultimate Pitch: كل كرة القدم في مكان واحد';
            ogDescription = pageDescription;
            ogImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png';
            ogType = 'website';

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png';
            twitterCard = "summary_large_image";
        }

        document.title = pageTitle;
        document.getElementById('dynamic-title').setAttribute('content', pageTitle); // Update the meta tag for dynamic title
        document.getElementById('dynamic-description').setAttribute('content', pageDescription);
        document.querySelector('meta[name="keywords"]').setAttribute('content', pageKeywords);

        document.getElementById('dynamic-og-title').setAttribute('content', ogTitle);
        document.getElementById('dynamic-og-description').setAttribute('content', ogDescription);
        document.getElementById('dynamic-og-image').setAttribute('content', ogImage);
        document.getElementById('dynamic-og-image-alt').setAttribute('content', ogTitle);
        document.getElementById('dynamic-og-url').setAttribute('content', ogUrl);
        document.getElementById('dynamic-og-type').setAttribute('content', ogType);

        document.getElementById('dynamic-twitter-title').setAttribute('content', twitterTitle);
        document.getElementById('dynamic-twitter-description').setAttribute('content', twitterDescription);
        document.getElementById('dynamic-twitter-image').setAttribute('content', twitterImage);
        document.getElementById('dynamic-twitter-card').setAttribute('content', twitterCard);

        document.getElementById('dynamic-canonical').setAttribute('href', canonicalLink.getAttribute('href'));

        console.log('📄 [SEO] Meta tags updated.');
    }

    function generateAndInjectSchema(item = null) {
        let schemaScriptElement = document.getElementById('json-ld-schema');
        if (!schemaScriptElement) {
            schemaScriptElement = document.createElement('script');
            schemaScriptElement.type = 'application/ld+json';
            schemaScriptElement.id = 'json-ld-schema';
            document.head.appendChild(schemaScriptElement);
        }

        if (!item) {
            // For general pages, or when no specific item is viewed, clear schema
            schemaScriptElement.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "شاهد كورة - Ultimate Pitch",
                "url": "https://shahidkora.online/",
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://shahidkora.online/?s={search_term_string}",
                    "query-input": "required name=search_term_string"
                }
            }, null, 2);
            console.log('📄 [SEO] Default WebSite JSON-LD schema injected/updated.');
            return;
        }

        let schema;
        if (item.type === 'match') {
            const matchSlug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const matchUrl = `${window.location.origin}/match?id=${item.id}&title=${matchSlug}`;
            const formattedDate = item.date_time ? new Date(item.date_time).toISOString() : new Date().toISOString();

            schema = {
                "@context": "https://schema.org",
                "@type": "SportsEvent",
                "name": item.title,
                "description": item.short_description || `مشاهدة بث مباشر وملخصات مباراة ${item.home_team} ضد ${item.away_team} في ${item.league_name} على شاهد كورة.`,
                "startDate": formattedDate,
                "location": {
                    "@type": "Place",
                    "name": item.stadium || "غير متوفر"
                },
                "competitor": [
                    { "@type": "SportsTeam", "name": item.home_team, "image": item.home_team_logo || "" },
                    { "@type": "SportsTeam", "name": item.away_team, "image": item.away_team_logo || "" }
                ],
                "sport": "Football",
                "eventStatus": item.status === 'Live' ? "http://schema.org/EventScheduled" : // Consider EventScheduled or EventInProgress
                                item.status === 'Upcoming' ? "http://schema.org/EventScheduled" :
                                "http://schema.org/EventCompleted",
                "url": matchUrl,
                "image": item.thumbnail || item.home_team_logo || "",
                "offers": {
                    "@type": "Offer",
                    "url": matchUrl,
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "http://schema.org/InStock"
                },
                "performer": item.commentators && item.commentators.length > 0 ? item.commentators.map(c => ({ "@type": "Person", "name": c })) : undefined,
                "superEvent": {
                    "@type": "SportsEvent",
                    "name": item.league_name,
                    "url": `${window.location.origin}/league?id=${item.league_id}&name=${encodeURIComponent(item.league_name.replace(/\s+/g, '-'))}` // Example league URL
                }
            };
            if (item.score && item.status === 'Finished') {
                schema.result = item.score; // Add result if available
            }
            if (item.embed_url) {
                 schema.video = {
                    "@type": "VideoObject",
                    "name": `${item.home_team} vs ${item.away_team} - ${item.title}`,
                    "description": item.short_description || `بث مباشر لمباراة ${item.home_team} ضد ${item.away_team}.`,
                    "thumbnailUrl": item.thumbnail || item.home_team_logo || "",
                    "uploadDate": formattedDate,
                    "embedUrl": item.embed_url,
                    "contentUrl": item.embed_url,
                    "interactionCount": "100000" // Placeholder
                 };
            }
        } else if (item.type === 'news') {
            const newsUrl = item.article_url || `${window.location.origin}/news?id=${item.id}&title=${encodeURIComponent(item.title.replace(/\s+/g, '-'))}`;
            const formattedDate = item.date_time ? new Date(item.date_time).toISOString() : new Date().toISOString();
            schema = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": newsUrl
                },
                "headline": item.title,
                "image": {
                    "@type": "ImageObject",
                    "url": item.article_image || item.thumbnail || "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png",
                    "width": 1200, // Placeholder
                    "height": 675  // Placeholder
                },
                "datePublished": formattedDate,
                "dateModified": formattedDate, // Assuming same for simplicity, or add a 'last_modified' field
                "author": {
                    "@type": "Organization", // Or Person if an author name is available
                    "name": "شاهد كورة"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "شاهد كورة",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://shahidkora.online/favicon-ultimate-pitch.ico", // Or larger logo
                        "width": 60,
                        "height": 60
                    }
                },
                "description": item.short_description
            };
        }

        if (schema) {
            schemaScriptElement.textContent = JSON.stringify(schema, null, 2);
            console.log('📄 [SEO] JSON-LD schema injected/updated.');
        } else {
            console.log('📄 [SEO] No specific JSON-LD schema generated for this item type.');
        }
    }


    function displaySuggestedMatches(currentMatchId, targetGridElement) {
        if (!targetGridElement || !currentDetailedMatch) {
            console.error('❌ displaySuggestedMatches: targetGridElement or currentDetailedMatch is missing.');
            return;
        }

        const currentMatchLeague = currentDetailedMatch.league_name;
        let suggested = [];

        // Try to suggest matches from the same league first
        if (currentMatchLeague) {
            suggested = itemsData.filter(item =>
                item.type === 'match' &&
                item.id !== currentMatchId &&
                item.league_name === currentMatchLeague &&
                item.status !== 'Finished' // Prefer live/upcoming for suggestions
            ).sort(() => 0.5 - Math.random()); // Shuffle
        }

        // If not enough, fill with other live/upcoming matches
        if (suggested.length < 8) { // Aim for around 8 suggestions
            const otherMatches = itemsData.filter(item =>
                item.type === 'match' &&
                item.id !== currentMatchId &&
                item.status !== 'Finished' &&
                !suggested.includes(item)
            ).sort(() => 0.5 - Math.random());
            const needed = 8 - suggested.length;
            suggested = [...suggested, ...otherMatches.slice(0, needed)];
        }

        // If still not enough (e.g., no live/upcoming), fill with finished matches
        if (suggested.length < 8) {
             const finishedMatches = itemsData.filter(item =>
                item.type === 'match' &&
                item.id !== currentMatchId &&
                !suggested.includes(item)
            ).sort(() => 0.5 - Math.random());
            const needed = 8 - suggested.length;
            suggested = [...suggested, ...finishedMatches.slice(0, needed)];
        }


        const finalSuggested = suggested.slice(0, 8); // Display maximum 8 suggested matches

        if (finalSuggested.length === 0) {
            targetGridElement.innerHTML = '<p style="text-align: center; color: var(--up-text-muted);">لا توجد مباريات مقترحة حالياً.</p>';
            console.log('✨ [Suggestions] No suggested matches available after filtering.');
            return;
        }

        // Temporarily change grid columns for suggested section to show 2 per row on mobile
        // This is handled in CSS media queries for .suggested-matches-section .match-grid
        displayItems(finalSuggested, targetGridElement);
        console.log(`✨ [Suggestions] Displayed ${finalSuggested.length} suggested matches in ${targetGridElement.id}.`);
    }


    // --- 5. Event Listeners ---
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('nav-open');
            console.log('☰ [Interaction] Menu toggled.');
        });
    }

    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.dataset.targetView;
            if (targetView) {
                console.log(`🏠 [Interaction] Nav link clicked: ${targetView}`);
                renderView(targetView);
                // Close mobile menu if open
                if (mainNav && mainNav.classList.contains('nav-open')) {
                    mainNav.classList.remove('nav-open');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for new view
            }
        });
    });

    if (homeLogoLink) {
        homeLogoLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🏠 [Interaction] Home logo clicked.');
            renderView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (watchNowBtn) {
        watchNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🎬 [Interaction] "Watch Now" button clicked.');
            renderView('live'); // Go to live matches section
            window.scrollTo({ top: 0, behavior: 'smooth' });
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


    // --- 6. Browser History & Initial Load ---
    function initialPageLoadLogic() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        const idParam = urlParams.get('id');

        if (viewParam === 'details' && idParam) {
            const matchId = parseInt(idParam);
            const match = itemsData.find(item => item.id === matchId && item.type === 'match');

            if (!isNaN(matchId) && match) {
                console.log(`🚀 [Initial Load] Attempting to load match details from URL: ID ${matchId}`);
                showMatchDetails(matchId);
            } else {
                console.warn('⚠️ [Initial Load] Invalid match ID in URL or match not found. Displaying home page.');
                renderView('home');
            }
        } else {
            console.log('🚀 [Initial Load] No specific view in URL. Displaying home page.');
            renderView('home'); // Default to home view
        }
    }

    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] Browser history navigation detected.', event.state);
        // If itemsData isn't loaded yet, fetch it and then re-evaluate the state
        if (itemsData.length === 0) {
            console.warn('[Popstate] Item data not loaded, attempting to fetch and render based on state.');
            fetchItemsData().then(() => {
                handlePopstateEvent(event);
            }).catch(err => {
                console.error('[Popstate] Failed to fetch items data on popstate:', err);
                renderView('home'); // Fallback to home if fetch fails
            });
        } else {
            handlePopstateEvent(event);
        }
    });

    function handlePopstateEvent(event) {
        if (event.state && event.state.view === 'details' && event.state.id) {
            const match = itemsData.find(item => item.id === event.state.id && item.type === 'match');
            if (match) {
                showMatchDetails(event.state.id);
            } else {
                console.warn('[Popstate] Match not found on popstate. Displaying home page.');
                renderView('home');
            }
        } else if (event.state && event.state.view) {
            renderView(event.state.view);
        } else {
            renderView('home'); // Default to home if state is empty or invalid
        }
    }

    // --- 7. Security Features ---
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
            console.warn(`🚫 [Security] Developer tools/source shortcut blocked: ${e.key}`);
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


    // Initial data fetch and page load
    fetchItemsData();
});
