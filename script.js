// script.js - كود "شاهد كورة" الاحترافي الفائق لـ "Ultimate Pitch UI"
// مع تحسينات الأداء، SEO، وتجربة الموبايل
// **تمت إعادة إضافة ودعم صفحات تفاصيل المباريات (match-details).**
// **تم حل مشكلة فتح الإعلان بدلاً من المباراة عند النقر على البوستر الرئيسي.**

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Ultimate Pitch script execution started. (Match Details Pages Enabled).');

    // --- 1. DOM Element References & Critical Verification ---
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const homeLogoLink = document.getElementById('home-logo-link');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const contentDisplay = document.getElementById('content-display'); // The main dynamic content area
    const menuToggle = document.querySelector('.menu-toggle'); // Mobile menu toggle button

    // Templates for dynamic content loading (from HTML)
    const liveMatchesTemplate = document.getElementById('live-matches-template');
    const upcomingMatchesTemplate = document.getElementById('upcoming-matches-template');
    const highlightsTemplate = document.getElementById('highlights-template');
    const newsTemplate = document.getElementById('news-template');
    const matchDetailsTemplate = document.getElementById('match-details-template'); // Re-added
    const suggestedMatchesTemplate = document.getElementById('suggested-matches-template'); // Re-added

    const requiredElements = {
        '#main-nav': mainNav,
        '#content-display': contentDisplay,
        '#live-matches-template': liveMatchesTemplate,
        '#upcoming-matches-template': upcomingMatchesTemplate,
        '#highlights-template': highlightsTemplate,
        '#news-template': newsTemplate,
        '#match-details-template': matchDetailsTemplate, // Must be present in HTML
        '#suggested-matches-template': suggestedMatchesTemplate // Must be present in HTML
    };

    let criticalErrorDetected = false;
    for (const [id, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`❌ CRITICAL ERROR: Required DOM element or template "${id}" not found. Please check your HTML structure.`);
            criticalErrorDetected = true;
        }
    }

    if (criticalErrorDetected) {
        console.error('🛑 Script halted due to missing critical DOM elements. Please fix your HTML!');
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; margin-top: 100px; background-color: #2a0f0f; border-radius: 10px; border: 2px solid #ff4d4d; color: #ffcccc; font-family: sans-serif; font-size: 22px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);">
                عذرًا، حدث خطأ فني كارثي. يرجى تحديث الصفحة أو المحاولة لاحقًا.
                <p style="font-size: 16px; color: #f47b7b; margin-top: 15px;">(عناصر الواجهة الأساسية مفقودة أو تالفة في HTML)</p>
            </div>`;
        return; // Stop script execution
    } else {
        console.log('✅ All critical DOM elements and templates found. Proceeding with script execution.');
    }

    // --- 2. Adsterra Configuration ---
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/spqbhmyax?key=2469b039d4e7c471764bd04c57824cf2';
    const DIRECT_LINK_COOLDOWN_MATCH_CARD = 3 * 60 * 1000; // 3 minutes
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 15 * 1000; // 15 seconds

    let lastDirectLinkClickTimeMatchCard = 0;
    let lastDirectLinkClickTimeVideoInteraction = 0;

    function openAdLink(cooldownDuration, type) {
        let lastClickTime;
        let setLastClickTime;

        if (type === 'matchCard') { // General match card click (now leads to details page)
            lastClickTime = lastDirectLinkClickTimeMatchCard;
            setLastClickTime = (time) => lastDirectLinkClickTimeMatchCard = time;
        } else if (type === 'videoOverlay' || type === 'matchDetailsThumbnail') { // Specific ad triggers on details page
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
                console.warn(`⚠️ [Ad Click - ${type}] Pop-up blocked or direct link failed to open. Ensure pop-ups are allowed.`);
                return false;
            }
        } else {
            const timeLeft = (cooldownDuration - (currentTime - lastClickTime)) / 1000;
            console.log(`⏳ [Ad Click - ${type}] Direct link cooldown active. No new tab opened. Time left: ${timeLeft.toFixed(1)}s`);
            return false;
        }
    }

    // --- 3. Content Data & Dynamic Loading ---
    let allContentData = [];
    let currentDetailedItem = null; // Re-added

    async function fetchAllContentData() {
        try {
            console.log('📡 Fetching all content data from matches.json...');
            const response = await fetch('matches.json');
            
            if (!response.ok) {
                const errorText = await response.text(); 
                throw new Error(`HTTP error! Status: ${response.status}. Response: ${errorText.substring(0, 100)}...`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                console.error('❌ Fetched data is not an array. Please check matches.json format. Expected an array of objects.');
                allContentData = [];
                throw new Error('Invalid data format: matches.json is not an array.');
            } else {
                allContentData = data;
            }
            
            if (allContentData.length === 0) {
                console.warn('⚠️ matches.json loaded, but it is empty. No content will be displayed.');
            }
            console.log('✅ All content data loaded successfully from matches.json. Total items found:', allContentData.length);
            
            initialPageLoadLogic();
        } catch (error) {
            console.error('❌ Failed to load all content data:', error.message);
            contentDisplay.innerHTML = `
                <div class="empty-state" style="padding: 50px; background-color: var(--up-bg-medium); border: 2px solid var(--up-accent-red); border-radius: 10px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); margin-top: 50px; text-align: center;">
                    <p style="color: var(--up-text-primary); font-size: 1.2em;">عذرًا، لم نتمكن من الاتصال بمسار البيانات أو البيانات تالفة.</p>
                    <p style="font-size: 0.9em; color: #ccc;">الرجاء التأكد من ملف <code style="color:#FFF;">matches.json</code> و اتصالك بالشبكة. (خطأ: ${error.message})</p>
                    <button class="btn btn-secondary" onclick="window.location.reload()" style="margin-top: 20px;">إعادة تحميل الصفحة</button>
                </div>`;
            navLinks.forEach(link => link.style.pointerEvents = 'none');
            if (homeLogoLink) homeLogoLink.style.pointerEvents = 'none';
            searchButton.disabled = true;
        }
    }

    function createContentCard(item) {
        const card = document.createElement('div');
        card.classList.add('match-card');

        let innerContent = '';
        const webpSource = item.thumbnail ? item.thumbnail.replace(/\.(png|jpe?g)$/i, '.webp') : '/images/default-match-poster.webp';

        if (item.type === 'match' || item.type === 'highlight') {
            let statusText = '';
            let statusClass = '';
            let scoreDisplay = '';
            let actionText = '';

            const matchDateObj = new Date(item.date_time);
            const now = new Date();
            const matchEndTime = new Date(matchDateObj.getTime() + 105 * 60 * 1000);

            if (item.status === 'Live' && now >= matchDateObj && now < matchEndTime) {
                statusText = 'مباشر الآن';
                statusClass = 'live-status';
                actionText = 'انطلق للبث';
            } else if (item.status === 'Upcoming' && now < matchDateObj) {
                statusText = `تبدأ في: ${matchDateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
                statusClass = 'upcoming-status';
                actionText = 'عرض التفاصيل';
            } else if (item.status === 'Finished' || now >= matchEndTime) {
                statusText = 'اكتملت';
                statusClass = 'finished-status';
                scoreDisplay = `<span class="match-score">${item.score || 'N/A'}</span>`;
                actionText = item.highlights_url ? 'نبضات الملخص' : 'لا يوجد سجل';
            } else {
                statusText = 'غير متاح';
                statusClass = 'finished-status';
                actionText = 'عرض التفاصيل';
            }

            innerContent = `
                <picture>
                    <source srcset="${webpSource}" type="image/webp">
                    <img src="${item.thumbnail || '/images/default-match-poster.webp'}" alt="${item.title}" loading="lazy" width="300" height="400" onerror="this.src='/images/default-match-poster.webp';">
                </picture>
                <div class="match-card-content">
                    <div class="teams-logos">
                        <img src="${item.home_team_logo || '/images/default-team-logo.webp'}" alt="${item.home_team} logo" class="team-logo">
                        <span>${item.home_team || 'فريق'}</span>
                        <span class="vs-text">vs</span>
                        <span>${item.away_team || 'فريق'}</span>
                        <img src="${item.away_team_logo || '/images/default-team-logo.webp'}" alt="${item.away_team} logo" class="team-logo">
                    </div>
                    <h3>${item.title}</h3>
                    <p class="match-league">${item.league_name || 'غير محدد'}</p>
                    ${scoreDisplay}
                    <div class="match-status ${statusClass}">${statusText}</div>
                    <div class="card-actions">
                        <button class="card-action-btn btn-secondary" ${item.status === 'Finished' && !item.highlights_url ? 'disabled' : ''}>${actionText}</button>
                    </div>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('card-action-btn') && e.target.disabled) {
                    e.stopPropagation();
                    return;
                }
                console.log(`⚡ [Interaction] Match card clicked: ${item.id}`);
                openAdLink(DIRECT_LINK_COOLDOWN_MATCH_CARD, 'matchCard'); // Ad for general card click
                const itemSlug = createSlug(item.title);
                renderView('match-details', { id: item.id, type: item.type, slug: itemSlug }); // Navigate to details page
            });
        } else if (item.type === 'news') {
            card.classList.remove('match-card');
            card.classList.add('news-card');
            const newsThumbnail = item.thumbnail || '/images/default-news-thumbnail.webp';
            const webpNewsSource = newsThumbnail.replace(/\.(png|jpe?g)$/i, '.webp');

            innerContent = `
                <picture>
                    <source srcset="${webpNewsSource}" type="image/webp">
                    <img src="${newsThumbnail}" alt="${item.title}" loading="lazy" width="350" height="250" onerror="this.src='/images/default-news-thumbnail.webp';">
                </picture>
                <div class="news-card-content">
                    <h4>${item.title}</h4>
                    <p>${item.short_description || 'لا يوجد وصف متاح.'}</p>
                    <span class="news-date">${new Date(item.date_time).toLocaleDateString('ar-EG') || 'غير متوفر'}</span>
                    <div class="card-actions">
                        <a href="${item.article_url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">اقرأ المزيد</a>
                    </div>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return; // Don't trigger ad if clicking on the "Read More" link
                }
                console.log(`⚡ [Interaction] News card clicked (opening external link): ${item.id}`);
                window.open(item.article_url, '_blank');
            });
        }
        card.innerHTML = innerContent;
        return card;
    }

    function displayContent(contentArray, targetGridElement, emptyStateSelector = '.empty-state') {
        requestAnimationFrame(() => {
            targetGridElement.innerHTML = '';
            const parentSection = targetGridElement.closest('.view-section');
            const emptyStateElement = parentSection ? parentSection.querySelector(emptyStateSelector) : null;

            if (!contentArray || contentArray.length === 0) {
                if (emptyStateElement) {
                    emptyStateElement.style.display = 'block';
                }
                console.log(`🎬 [Display] No content to display in ${targetGridElement.id || targetGridElement.className}. Showing empty state.`);
                return;
            } else {
                if (emptyStateElement) {
                    emptyStateElement.style.display = 'none';
                }
            }

            console.log(`🎬 [Display] Displaying ${contentArray.length} items in ${targetGridElement.id || targetGridElement.className}.`);
            contentArray.forEach(item => {
                targetGridElement.appendChild(createContentCard(item));
            });
            console.log(`🎬 [Display] Finished displaying ${contentArray.length} items.`);
        });
    }

    function populateLeagueFilter(filterElement, contentType = 'match') {
        if (!filterElement) return;
        const leagues = new Set();
        allContentData.filter(item => item.type === contentType).forEach(item => {
            if (item.league_name) {
                leagues.add(item.league_name);
            }
        });

        filterElement.innerHTML = '<option value="all">كل البطولات</option>';
        Array.from(leagues).sort((a,b) => a.localeCompare(b, 'ar', { sensitivity: 'base' })).forEach(league => {
            const option = document.createElement('option');
            option.value = league;
            option.textContent = league;
            filterElement.appendChild(option);
        });
        console.log(`⚽ [Filters] League filter populated for ${filterElement.id}.`);
    }

    function createSlug(title) {
        if (!title) return '';
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    async function renderView(viewName, params = {}, pushState = true) {
        console.log(`🔄 [View Render] Attempting to render view: "${viewName}" with params:`, params);

        // Disposing of the iframe player instance before switching views if it exists
        const oldPlayer = contentDisplay.querySelector('.match-iframe-player');
        if (oldPlayer) {
            oldPlayer.remove();
            console.log('[IFRAME Player] Removed old iframe player from DOM.');
        }
        // Ensure video overlay is not stuck if leaving match details view
        const videoOverlayElement = document.querySelector('.video-overlay'); // Select dynamically as it's part of a template
        if (videoOverlayElement) {
            videoOverlayElement.style.pointerEvents = 'auto'; // Re-enable clicks
            videoOverlayElement.classList.remove('hidden'); // Show it again
            videoOverlayElement.style.cursor = 'pointer';    // Reset cursor
            videoOverlayElement.onclick = null; // Remove old onclick handler
            // Also remove the play icon if it was added
            const playIcon = videoOverlayElement.querySelector('.video-play-icon');
            if (playIcon) playIcon.remove();
            console.log('[Video Overlay] Resetting overlay state.');
        }


        const currentActiveView = contentDisplay.querySelector('.view-section.active-view');
        if (currentActiveView) {
            currentActiveView.classList.remove('active-view');
        }

        // Close mobile menu if open
        if (mainNav.classList.contains('active-mobile')) {
            mainNav.classList.remove('active-mobile');
            if (menuToggle) menuToggle.querySelector('i').className = 'fas fa-bars'; // Reset icon
        }

        let newViewElement = null;
        let targetGrid = null;
        let currentSectionData = [];
        let pageTitle = 'شاهد كورة - Ultimate Pitch: تجربة كرة القدم النهائية';
        const newUrl = new URL(window.location.origin);
        let historyState = { view: viewName, ...params };
        let urlPath = '/';

        // Update active navigation link
        navLinks.forEach(nav => nav.classList.remove('active'));
        const targetNavLink = document.querySelector(`.nav-link[data-target-view="${viewName}"]`);
        if (targetNavLink) targetNavLink.classList.add('active');

        switch (viewName) {
            case 'home':
            case 'live':
            case 'upcoming':
            case 'highlights':
            case 'news':
            case 'search':
                let templateToUse = liveMatchesTemplate;
                let sectionTitleText = 'أحدث المباريات';
                let showDateFilters = false;
                let showLeagueFilter = true;
                let gridClass = 'match-grid';
                let contentTypeFilter = 'match';

                if (viewName === 'home') {
                    currentSectionData = allContentData.filter(item => item.type === 'match' && (item.status === 'Live' || new Date(item.date_time) > new Date()))
                                                      .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
                    sectionTitleText = 'مباريات مباشرة وقادمة';
                    templateToUse = liveMatchesTemplate;
                    urlPath = '/';
                } else if (viewName === 'live') {
                    currentSectionData = allContentData.filter(m => m.type === 'match' && m.status === 'Live' && new Date(m.date_time) <= new Date() && new Date(new Date(m.date_time).getTime() + 105 * 60 * 1000) > new Date());
                    currentSectionData.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
                    sectionTitleText = 'المباريات المباشرة';
                    templateToUse = liveMatchesTemplate;
                    urlPath = '/live-matches';
                } else if (viewName === 'upcoming') {
                    currentSectionData = allContentData.filter(m => m.type === 'match' && m.status === 'Upcoming' && new Date(m.date_time) > new Date());
                    currentSectionData.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
                    sectionTitleText = 'مواعيد المباريات القادمة';
                    templateToUse = upcomingMatchesTemplate;
                    showDateFilters = true;
                    urlPath = '/upcoming-matches';
                } else if (viewName === 'highlights') {
                    currentSectionData = allContentData.filter(item => item.type === 'match' && (item.status === 'Finished' || new Date(item.date_time) < new Date()));
                    currentSectionData = currentSectionData.filter(m => m.highlights_url);
                    currentSectionData.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
                    sectionTitleText = 'أهداف وملخصات المباريات';
                    templateToUse = highlightsTemplate;
                    gridClass = 'news-grid'; 
                    showDateFilters = false;
                    showLeagueFilter = false;
                    urlPath = '/highlights';
                } else if (viewName === 'news') {
                    currentSectionData = allContentData.filter(item => item.type === 'news').sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
                    sectionTitleText = 'آخر الأخبار الرياضية';
                    templateToUse = newsTemplate;
                    gridClass = 'news-grid';
                    showDateFilters = false;
                    showLeagueFilter = false;
                    contentTypeFilter = 'news';
                    urlPath = '/news';
                } else if (viewName === 'search') {
                    const query = params.query ? params.query.toLowerCase().trim() : '';
                    if (!query) { renderView('home', {}, true); return; }

                    currentSectionData = allContentData.filter(item => {
                        const titleMatch = item.title.toLowerCase().includes(query);
                        const descMatch = item.short_description ? item.short_description.toLowerCase().includes(query) : false;
                        if (item.type === 'match') {
                            const leagueMatch = item.league_name ? item.league_name.toLowerCase().includes(query) : false;
                            const homeTeamMatch = item.home_team ? item.home_team.toLowerCase().includes(query) : false;
                            const awayTeamMatch = item.away_team ? item.away_team.toLowerCase().includes(query) : false;
                            const commentatorMatch = Array.isArray(item.commentators) ? item.commentators.some(c => c.toLowerCase().includes(query)) : false;
                            return titleMatch || descMatch || leagueMatch || homeTeamMatch || awayTeamMatch || commentatorMatch;
                        } else if (item.type === 'news') {
                            return titleMatch || descMatch;
                        }
                        return false;
                    });
                    sectionTitleText = `نتائج البحث عن "${params.query}" (${currentSectionData.length})`;
                    templateToUse = liveMatchesTemplate; 
                    showDateFilters = false;
                    showLeagueFilter = false;
                    urlPath = '/search';
                    newUrl.searchParams.set('q', query);
                }

                newViewElement = templateToUse.content.cloneNode(true);
                newViewElement.querySelector('.section-title').textContent = sectionTitleText;

                targetGrid = newViewElement.querySelector('.match-grid') || newViewElement.querySelector('.news-grid');
                if (!targetGrid) {
                    targetGrid = document.createElement('div');
                    targetGrid.className = gridClass;
                    newViewElement.querySelector('.container').appendChild(targetGrid);
                } else {
                    targetGrid.className = gridClass;
                }

                if (showDateFilters && params.category && params.category !== 'all') {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

                    currentSectionData = currentSectionData.filter(m => {
                        const matchDate = new Date(m.date_time); matchDate.setHours(0, 0, 0, 0);
                        if (params.category === 'today') return matchDate.getTime() === today.getTime();
                        if (params.category === 'tomorrow') return matchDate.getTime() === tomorrow.getTime();
                        return true;
                    });
                    if (viewName === 'upcoming') newUrl.searchParams.set('category', params.category);
                }

                if (showLeagueFilter && params.league && params.league !== 'all') {
                    currentSectionData = currentSectionData.filter(m => m.league_name === params.league);
                    if (viewName !== 'home') newUrl.searchParams.set('league', params.league);
                }

                contentDisplay.innerHTML = '';
                contentDisplay.appendChild(newViewElement);
                contentDisplay.querySelector('.view-section').classList.add('active-view');

                const filterControls = contentDisplay.querySelector('.filter-controls');
                if (filterControls) {
                    if (!showDateFilters && !showLeagueFilter && viewName !== 'search') {
                        filterControls.style.display = 'none';
                    } else {
                        filterControls.style.display = 'flex';
                        const buttons = filterControls.querySelectorAll('.filter-btn');
                        if (showDateFilters) {
                            buttons.forEach(btn => {
                                btn.style.display = ''; // Show
                                btn.classList.remove('active');
                                if (btn.dataset.filter === (params.category || 'all')) btn.classList.add('active');
                            });
                        } else {
                            buttons.forEach(btn => btn.style.display = 'none'); // Hide
                        }

                        const leagueSelect = filterControls.querySelector('.filter-dropdown');
                        if (leagueSelect && showLeagueFilter) {
                            leagueSelect.style.display = ''; // Show
                            populateLeagueFilter(leagueSelect, contentTypeFilter);
                            leagueSelect.value = params.league || 'all';
                        } else if (leagueSelect) {
                            leagueSelect.style.display = 'none'; // Hide
                        }
                    }
                }

                displayContent(currentSectionData, targetGrid);

                const paginationControls = contentDisplay.querySelector('.pagination-controls');
                if (paginationControls) paginationControls.style.display = 'none';

                pageTitle = sectionTitleText + ' - شاهد كورة';
                newUrl.pathname = urlPath;
                break;

            case 'match-details': // Re-added this case
                const itemId = parseInt(params.id);
                const itemType = params.type;
                const item = allContentData.find(i => i.id === itemId && i.type === itemType);

                if (!item || item.type !== 'match') {
                    console.error('❌ [View Render] Match details: Item not found or not a match type for ID:', itemId);
                    renderView('home', {}, true);
                    return;
                }
                currentDetailedItem = item;

                newViewElement = matchDetailsTemplate.content.cloneNode(true);
                const detailsContainer = newViewElement;

                const videoPlayerContainer = detailsContainer.querySelector('.video-player-container');
                const videoOverlayElement = detailsContainer.querySelector('.video-overlay');


                if (videoPlayerContainer) {
                    videoPlayerContainer.innerHTML = ''; 
                }
                
                if (videoOverlayElement) {
                    videoOverlayElement.style.pointerEvents = 'auto'; 
                    videoOverlayElement.classList.remove('hidden');
                    videoOverlayElement.style.cursor = 'pointer';
                    
                    const existingPlayIcon = videoOverlayElement.querySelector('.video-play-icon');
                    if (existingPlayIcon) existingPlayIcon.remove();

                    const playIcon = document.createElement('i');
                    playIcon.classList.add('fas', 'fa-play-circle', 'video-play-icon');
                    videoOverlayElement.appendChild(playIcon);

                    videoOverlayElement.onclick = async (e) => {
                        console.log('⏯️ [Ad Click] Video overlay clicked. Attempting to open direct link.');
                        const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');

                        if (adOpened) {
                            requestAnimationFrame(() => {
                                videoOverlayElement.style.pointerEvents = 'none';
                                videoOverlayElement.classList.add('hidden');
                                videoOverlayElement.style.cursor = 'default';
                                console.log('[IFRAME Player] Overlay hidden after ad interaction.');
                            });
                        } else {
                            console.log('[IFRAME Overlay] Ad did not open due to cooldown. Overlay remains active and clickable.');
                        }
                        e.stopPropagation();
                    };
                }

                const videoUrl = item.embed_url;
                if (!videoUrl) {
                    console.error(`❌ Failed to get video URL for match ID: ${itemId}. Cannot embed iframe.`);
                    if (videoPlayerContainer) {
                        videoPlayerContainer.innerHTML = '<p style="text-align: center; color: var(--up-text-primary); margin-top: 20px;">عذرًا، لا يمكن تشغيل الفيديو حاليًا (الرابط غير صالح).</p>';
                    }
                } else {
                    const iframeElement = document.createElement('iframe');
                    iframeElement.src = videoUrl;
                    iframeElement.setAttribute('frameborder', '0');
                    iframeElement.setAttribute('allowfullscreen', '');
                    iframeElement.setAttribute('scrolling', 'no');
                    iframeElement.setAttribute('rel', 'noopener noreferrer');
                    iframeElement.setAttribute('loading', 'lazy'); 
                    iframeElement.sandbox = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-top-navigation-by-user-activation';
                    iframeElement.classList.add('match-iframe-player');

                    if (videoPlayerContainer) { 
                        videoPlayerContainer.appendChild(iframeElement);
                        console.log('[IFRAME Player] New iframe element created with src:', videoUrl);
                    }
                }

                detailsContainer.querySelector('.match-details-title').textContent = item.title || 'غير متوفر';
                detailsContainer.querySelector('#match-details-description-js').textContent = item.short_description || 'لا يوجد وصف متاح.';
                const matchDateTime = item.date_time ? new Date(item.date_time) : null;
                detailsContainer.querySelector('#match-details-date-time-js').textContent = matchDateTime ?
                    matchDateTime.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) + ' - ' +
                    matchDateTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'غير متوفر';
                detailsContainer.querySelector('#match-details-league-js').textContent = item.league_name || 'غير محدد';
                detailsContainer.querySelector('#match-details-commentators-js').textContent = Array.isArray(item.commentators) ? item.commentators.join(', ') : item.commentators || 'غير متوفر';
                detailsContainer.querySelector('#match-details-teams-js').innerHTML = `${item.home_team || 'فريق'} <span class="vs-text">vs</span> ${item.away_team || 'فريق'}` || 'غير متوفر';
                detailsContainer.querySelector('#match-details-stadium-js').textContent = item.stadium || 'غير متوفر';
                detailsContainer.querySelector('#match-details-status-js').textContent = item.status || 'N/A';


                if (item.status === 'Finished') {
                    detailsContainer.querySelector('.match-details-score-container').classList.remove('hidden');
                    detailsContainer.querySelector('#match-details-score-js').textContent = item.score || 'N/A';
                    if (item.highlights_url) {
                        detailsContainer.querySelector('.match-details-highlights-container').classList.remove('hidden');
                        detailsContainer.querySelector('.match-details-highlights-link').href = item.highlights_url;
                    } else {
                        detailsContainer.querySelector('.match-details-highlights-container').classList.add('hidden');
                    }
                } else {
                    detailsContainer.querySelector('.match-details-score-container').classList.add('hidden');
                    detailsContainer.querySelector('.match-details-highlights-container').classList.add('hidden');
                }

                const detailsThumbnail = detailsContainer.querySelector('.match-details-thumbnail');
                if (detailsThumbnail) {
                    detailsThumbnail.src = item.thumbnail || '/images/default-match-poster.webp';
                    detailsThumbnail.alt = item.title;
                    detailsThumbnail.onerror = function() { this.src = '/images/default-match-poster.webp'; };
                    console.log(`[Details] Thumbnail set for ${item.title}`);

                    detailsThumbnail.addEventListener('click', () => {
                        console.log('🖼️ [Ad Click] Match details thumbnail clicked. Attempting to open direct link.');
                        openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'matchDetailsThumbnail');
                    });
                }
                
                contentDisplay.innerHTML = '';
                contentDisplay.appendChild(newViewElement);
                contentDisplay.querySelector('.view-section').classList.add('active-view');

                const backBtn = contentDisplay.querySelector('.back-btn');
                if (backBtn) {
                    backBtn.onclick = () => window.history.back();
                }

                pageTitle = `${item.title} - بث مباشر | شاهد كورة`;
                urlPath = `/match/${params.slug || createSlug(item.title)}`;
                newUrl.pathname = urlPath;
                newUrl.searchParams.set('id', item.id);
                newUrl.searchParams.set('type', item.type);

                displaySuggestedMatches(item.id);

                break;

            default:
                console.warn(`⚠️ [View Render] Unknown view "${viewName}". Falling back to home.`);
                renderView('home', {}, true);
                return;
        }

        if (pushState) {
            history.pushState(historyState, pageTitle, newUrl.toString());
            console.log(`🔗 [URL] URL updated to ${newUrl.toString()}`);
        } else {
            history.replaceState(historyState, pageTitle, newUrl.toString());
            console.log(`🔗 [URL] URL replaced with ${newUrl.toString()}`);
        }

        updateMetaTags(currentDetailedItem, viewName, params);
        addJsonLdSchema(currentDetailedItem, viewName, params);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Re-added displaySuggestedMatches function
    function displaySuggestedMatches(currentMatchId) {
        if (!suggestedMatchesTemplate) {
            console.error('❌ Suggested matches template not found.');
            return;
        }

        const existingSuggestedSection = contentDisplay.querySelector('.suggested-matches-section');
        if (existingSuggestedSection) {
            existingSuggestedSection.remove();
        }

        const suggestedSection = suggestedMatchesTemplate.content.cloneNode(true);
        const suggestedMatchGrid = suggestedSection.querySelector('.match-grid');
        const currentMatchDetailsSection = contentDisplay.querySelector('.match-details-section');

        if (!currentMatchDetailsSection || !suggestedMatchGrid || !currentDetailedItem || currentDetailedItem.type !== 'match') {
            console.error('❌ displaySuggestedMatches: Current match details section or grid not found/not a match. Cannot display suggestions.');
            return;
        }

        currentMatchDetailsSection.insertAdjacentElement('afterend', suggestedSection.children[0]);
        const activeSuggestedSection = contentDisplay.querySelector('.suggested-matches-section');
        if (activeSuggestedSection) activeSuggestedSection.classList.add('active-view');

        const currentMatchLeague = currentDetailedItem.league_name;
        let suggested = [];
        const maxSuggestions = 12;

        if (currentMatchLeague) {
            suggested = allContentData.filter(item =>
                item.type === 'match' &&
                item.id !== currentMatchId &&
                item.league_name === currentMatchLeague &&
                (item.status === 'Live' || new Date(item.date_time) > new Date() || (item.status === 'Finished' && item.highlights_url))
            );
            suggested.sort((a, b) => {
                const statusOrder = { 'Live': 1, 'Upcoming': 2, 'Finished': 3 };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                return new Date(a.date_time) - new Date(b.date_time);
            });
            suggested = suggested.slice(0, maxSuggestions);
        }

        if (suggested.length < maxSuggestions) {
            const otherMatches = allContentData.filter(item =>
                item.type === 'match' &&
                item.id !== currentMatchId &&
                !suggested.some(s => s.id === item.id) &&
                (item.status === 'Live' || new Date(item.date_time) > new Date() || (item.status === 'Finished' && item.highlights_url))
            ).sort(() => 0.5 - Math.random());

            const needed = maxSuggestions - suggested.length;
            suggested = [...suggested, ...otherMatches.slice(0, needed)];
        }

        if (suggested.length === 0) {
            if (activeSuggestedSection) {
                activeSuggestedSection.innerHTML = `
                    <div class="container">
                        <h2 class="section-title">مباريات قد تهمك</h2>
                        <p style="text-align: center; color: var(--up-text-secondary); padding: 20px;">لا توجد مباريات مقترحة حالياً.</p>
                    </div>`;
            }
            console.log('✨ [Suggestions] No suggested matches available.');
            return;
        }

        displayContent(suggested, suggestedMatchGrid);
        console.log(`✨ [Suggestions] Displayed ${suggested.length} suggested matches.`);
    }

    // --- 4. SEO & Schema.org Management ---
    function updateMetaTags(item = null, viewName = 'home', params = {}) {
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }

        let pageTitle, pageDescription, pageKeywords, ogUrl, ogTitle, ogDescription, ogImage, ogType;
        let twitterTitle, twitterDescription, twitterImage, twitterCreatorHandle;

        const defaultOgImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png';
        const defaultTwitterImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png';
        const baseUrl = 'https://shahidkora.online/';

        pageTitle = 'شاهد كورة - Ultimate Pitch: كل كرة القدم في مكان واحد';
        pageDescription = 'شاهد كورة: ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.';
        pageKeywords = 'شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch';
        ogUrl = baseUrl;
        ogTitle = pageTitle;
        ogDescription = pageDescription;
        ogImage = defaultOgImage;
        ogType = 'website';
        twitterTitle = ogTitle;
        twitterDescription = ogDescription;
        twitterImage = defaultTwitterImage;
        twitterCreatorHandle = '@ShahidKoraUP';

        if (item && item.type === 'match' && viewName === 'match-details') {
            const itemSlug = createSlug(item.title);
            const itemUrl = `${baseUrl}match/${itemSlug}`;
            canonicalLink.setAttribute('href', itemUrl);

            pageTitle = `${item.title} - بث مباشر | شاهد كورة`;
            const shortDesc = (item.short_description || `شاهد مباراة ${item.home_team} ضد ${item.away_team} بث مباشر بجودة عالية على شاهد كورة.`).substring(0, 155);
            pageDescription = shortDesc + (item.short_description && item.short_description.length > 155 ? '...' : '');

            const matchCommentators = Array.isArray(item.commentators) && item.commentators.length > 0 ? item.commentators.join(', ') : 'غير متوفر';
            const matchTeams = `${item.home_team}, ${item.away_team}`;
            const matchLeague = item.league_name;
            pageKeywords = [
                item.title, item.home_team, item.away_team, matchLeague, matchCommentators,
                'شاهد كورة', 'بث مباشر', 'مباريات كرة قدم', 'كورة لايف', 'بث حي', 'ملخصات أهداف'
            ].filter(Boolean).join(', ');

            ogUrl = itemUrl;
            ogTitle = `${item.title} - بث مباشر على شاهد كورة`;
            ogDescription = pageDescription;
            ogImage = item.thumbnail;
            ogType = "video.other";

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;

        } else if (item && item.type === 'news' && viewName === 'news') {
            const itemSlug = createSlug(item.title);
            const itemUrl = item.article_url || `${baseUrl}news/${itemSlug}`;
            canonicalLink.setAttribute('href', itemUrl);

            pageTitle = `${item.title} - آخر الأخبار | شاهد كورة`;
            const shortDesc = (item.short_description || `اقرأ أحدث الأخبار الرياضية عن ${item.title} على شاهد كورة.`).substring(0, 155);
            pageDescription = shortDesc + (item.short_description && item.short_description.length > 155 ? '...' : '');
            pageKeywords = [item.title, 'أخبار كورة', 'شاهد كورة', 'أخبار رياضية', 'تحليلات كروية', 'انتقالات اللاعبين'].filter(Boolean).join(', ');

            ogUrl = itemUrl;
            ogTitle = `${item.title} - أخبار شاهد كورة`;
            ogDescription = pageDescription;
            ogImage = item.thumbnail;
            ogType = "article";

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
        } else {
            const currentURL = new URL(window.location.href);
            let canonicalPath = currentURL.pathname;
            if (viewName === 'search' && params.query) {
                canonicalPath = `/search?q=${encodeURIComponent(params.query)}`;
            }
            canonicalLink.setAttribute('href', currentURL.origin + canonicalPath);

            if (viewName === 'live') {
                pageTitle = 'مباريات كرة القدم بث مباشر - شاهد كورة';
                pageDescription = 'شاهد جميع مباريات كرة القدم الجارية الآن بجودة عالية وبدون تقطيع على شاهد كورة. لا تفوت أي لحظة من الإثارة!';
                pageKeywords = 'مباريات مباشر، بث مباشر، مشاهدة مباشرة، كورة لايف، مباريات اليوم، شاهد كورة مباشر';
                ogUrl = `${baseUrl}live-matches`;
            } else if (viewName === 'upcoming') {
                pageTitle = 'مواعيد مباريات كرة القدم القادمة - شاهد كورة';
                pageDescription = 'اكتشف جدول مواعيد مباريات كرة القدم القادمة في جميع الدوريات والبطولات. كن على استعداد للمواجهات المنتظرة على شاهد كورة.';
                pageKeywords = 'مواعيد مباريات، جدول مباريات، مباريات الغد، مباريات اليوم، كورة قادمة، شاهد كورة';
                ogUrl = `${baseUrl}upcoming-matches`;
            } else if (viewName === 'highlights') {
                pageTitle = 'أهداف وملخصات مباريات كرة القدم - شاهد كورة';
                pageDescription = 'شاهد أفضل الأهداف وملخصات المباريات فور انتهائها. استمتع بجميع اللحظات الحاسمة والجنونية من عالم كرة القدم على شاهد كورة.';
                pageKeywords = 'أهداف، ملخصات، ملخص مباراة، أهداف اليوم، كورة أهداف، شاهد كورة ملخصات';
                ogUrl = `${baseUrl}highlights`;
            } else if (viewName === 'news') {
                pageTitle = 'آخر أخبار كرة القدم - شاهد كورة';
                pageDescription = 'ابق على اطلاع بآخر أخبار كرة القدم، التحليلات العميقة، والانتقالات الحصرية من كبرى الدوريات العالمية على شاهد كورة.';
                pageKeywords = 'أخبار كرة قدم، أخبار رياضية، تحليلات كروية، انتقالات اللاعبين، كورة أخبار، شاهد كورة';
                ogUrl = `${baseUrl}news`;
            } else if (viewName === 'search' && params.query) {
                pageTitle = `نتائج البحث عن "${params.query}" - شاهد كورة`;
                pageDescription = `استكشف نتائج البحث عن ${params.query} من المباريات والأخبار والملخصات على شاهد كورة.`;
                pageKeywords = `بحث ${params.query}, نتائج البحث كورة, شاهد كورة بحث`;
                ogUrl = `${baseUrl}search?q=${encodeURIComponent(params.query)}`;
            }
        }

        document.querySelector('title').textContent = pageTitle;
        document.querySelector('meta[name="description"]')?.setAttribute('content', pageDescription);
        document.querySelector('meta[name="keywords"]')?.setAttribute('content', pageKeywords);

        document.querySelector('meta[property="og:title"]')?.setAttribute('content', ogTitle);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', ogDescription);
        document.querySelector('meta[property="og:image"]')?.setAttribute('content', ogImage);
        document.querySelector('meta[property="og:url"]')?.setAttribute('content', ogUrl);
        document.querySelector('meta[property="og:type"]')?.setAttribute('content', ogType);
        document.querySelector('meta[property="og:locale"]')?.setAttribute('content', 'ar_AR');
        document.querySelector('meta[property="og:site_name"]')?.setAttribute('content', 'شاهد كورة');
        document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content', ogTitle);

        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', twitterTitle);
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', twitterDescription);
        document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', twitterImage);
        document.querySelector('meta[name="twitter:card"]')?.setAttribute('content', 'summary_large_image');

        let twitterCreator = document.querySelector('meta[name="twitter:creator"]');
        if (!twitterCreator) {
            twitterCreator = document.createElement('meta');
            twitterCreator.name = 'twitter:creator';
            document.head.appendChild(twitterCreator);
        }
        twitterCreator.setAttribute('content', twitterCreatorHandle);

        console.log('📄 [SEO] Meta tags updated.');
    }

    function addJsonLdSchema(item = null, viewName = 'home', params = {}) {
        document.querySelectorAll('script[type="application/ld+json"]').forEach(script => script.remove());
        console.log('📄 [SEO] All old JSON-LD schema scripts removed.');

        const baseUrl = 'https://shahidkora.online/';
        const currentUrl = window.location.href;
        let schemaAdded = false;

        const breadcrumbListSchema = {
            "@context": "http://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "الرئيسية",
                    "item": baseUrl
                }
            ]
        };

        if (item && item.type === 'match' && viewName === 'match-details') {
            let formattedStartDate;
            try {
                const date = new Date(item.date_time);
                formattedStartDate = !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
            } catch (e) { formattedStartDate = new Date().toISOString(); }

            const commentatorsArray = Array.isArray(item.commentators) && item.commentators.length > 0 ? item.commentators : String(item.commentators || '').split(',').map(s => s.trim()).filter(s => s !== '');

            const matchSchema = {
                "@context": "http://schema.org",
                "@type": "SportsEvent",
                "name": item.title,
                "description": item.short_description || `شاهد مباراة ${item.title} بث مباشر بجودة عالية على شاهد كورة.`,
                "url": currentUrl,
                "startDate": formattedStartDate,
                "location": {
                    "@type": "Place",
                    "name": item.stadium || "غير محدد"
                },
                "homeTeam": {
                    "@type": "SportsTeam",
                    "name": item.home_team,
                    "logo": item.home_team_logo || `${baseUrl}images/default-team-logo.webp`
                },
                "awayTeam": {
                    "@type": "SportsTeam",
                    "name": item.away_team,
                    "logo": item.away_team_logo || `${baseUrl}images/default-team-logo.webp`
                },
                "sport": "http://schema.org/Soccer",
                "eventStatus": `http://schema.org/Event${item.status === 'Live' ? 'Scheduled' : (item.status === 'Upcoming' ? 'Scheduled' : 'Completed')}`,
                "image": item.thumbnail || `${baseUrl}images/default-match-poster.webp`,
                "potentialAction": {
                    "@type": "WatchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": currentUrl,
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
                        "url": currentUrl
                    }
                },
                "organizer": {
                    "@type": "Organization",
                    "name": "شاهد كورة"
                }
            };

            if (commentatorsArray.length > 0) {
                matchSchema.performer = commentatorsArray.map(commentator => ({ "@type": "Person", "name": commentator }));
            }
            if (item.league_name) {
                matchSchema.superEvent = { "@type": "SportsEvent", "name": item.league_name };
            }
            if (item.status === 'Finished' && item.score) {
                matchSchema.result = { "@type": "SportsEvent", "name": item.score };
            }

            addSchemaToHead(matchSchema);
            schemaAdded = true;

            breadcrumbListSchema.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": item.title,
                "item": currentUrl
            });

        } else if (viewName === 'news' && item && item.type === 'news') {
            const newsSchema = {
                "@context": "http://schema.org",
                "@type": "NewsArticle",
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": item.article_url || currentUrl
                },
                "headline": item.title,
                "image": {
                    "@type": "ImageObject",
                    "url": item.thumbnail || `${baseUrl}images/default-news-thumbnail.webp`
                },
                "datePublished": item.date_time ? new Date(item.date_time).toISOString() : new Date().toISOString(),
                "dateModified": item.date_time ? new Date(item.date_time).toISOString() : new Date().toISOString(),
                "author": {
                    "@type": "Organization",
                    "name": "شاهد كورة"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "شاهد كورة",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png"
                    }
                },
                "description": item.short_description || item.title,
                "url": item.article_url || currentUrl
            };
            addSchemaToHead(newsSchema);
            schemaAdded = true;

            breadcrumbListSchema.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": "آخر الأخبار",
                "item": `${baseUrl}news`
            }, {
                "@type": "ListItem",
                "position": 3,
                "name": item.title,
                "item": item.article_url || currentUrl
            });

        } else {
            let webSiteSchema = {
                "@context": "http://schema.org",
                "@type": "WebSite",
                "name": "شاهد كورة - Ultimate Pitch",
                "url": baseUrl,
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${baseUrl}search?q={search_term_string}`,
                    "query-input": "required name=search_term_string"
                }
            };
            addSchemaToHead(webSiteSchema);
            schemaAdded = true;

            let viewNameArabic = '';
            let viewPath = '';
            switch(viewName) {
                case 'live': viewNameArabic = 'المباريات المباشرة'; viewPath = 'live-matches'; break;
                case 'upcoming': viewNameArabic = 'مواعيد المباريات'; viewPath = 'upcoming-matches'; break;
                case 'highlights': viewNameArabic = 'الأهداف والملخصات'; viewPath = 'highlights'; break;
                case 'news': viewNameArabic = 'آخر الأخبار'; viewPath = 'news'; break;
                case 'search': viewNameArabic = 'نتائج البحث'; viewPath = 'search'; break;
            }

            if (viewNameArabic) {
                breadcrumbListSchema.itemListElement.push({
                    "@type": "ListItem",
                    "position": 2,
                    "name": viewNameArabic,
                    "item": `${baseUrl}${viewPath}`
                });
                if (viewName === 'search' && params.query) {
                    breadcrumbListSchema.itemListElement.push({
                        "@type": "ListItem",
                        "position": 3,
                        "name": `نتائج البحث عن "${params.query}"`,
                        "item": `${baseUrl}${viewPath}?q=${encodeURIComponent(params.query)}`
                    });
                }
            }
        }

        if (breadcrumbListSchema.itemListElement.length > 1) {
            addSchemaToHead(breadcrumbListSchema);
        }

        if (schemaAdded) {
            console.log('📄 [SEO] New JSON-LD schema added/updated.');
        } else {
            console.log('📄 [SEO] No specific JSON-LD schema added for this view, only default WebSite and Breadcrumb.');
        }
    }

    function addSchemaToHead(schemaObject) {
        let script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schemaObject);
        document.head.appendChild(script);
    }

    // --- 5. Event Listeners ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = e.target.dataset.targetView;
            console.log(`📱 [Interaction] Nav link clicked: ${e.target.textContent.trim()}, Target View: ${targetView}`);
            renderView(targetView, {}, true);
        });
    });

    if (homeLogoLink) {
        homeLogoLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🏠 [Interaction] Home logo clicked.');
            renderView('home', {}, true);
        });
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active-mobile');
            const icon = menuToggle.querySelector('i');
            if (mainNav.classList.contains('active-mobile')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
            console.log(`☰ [Mobile Menu] Toggled to ${mainNav.classList.contains('active-mobile') ? 'open' : 'closed'}`);
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn') && e.target.dataset.targetView) {
            e.preventDefault();
            console.log(`🚀 [Interaction] General button with data-target-view clicked: ${e.target.dataset.targetView}`);
            renderView(e.target.dataset.targetView, {}, true);
        }
    });

    // Re-added specific 'back-btn' listener as match-details page is back.
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('back-btn')) {
            e.preventDefault();
            console.log('🔙 [Interaction] Back button clicked (delegated).');
            window.history.back();
        }
    });

    if (searchInput && searchButton) {
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                console.log(`🔍 [Search] Search initiated with query: "${query}".`);
                renderView('search', { query: query }, true);
            } else {
                console.log('🔍 [Search] Empty search query. Showing default home view.');
                renderView('home', {}, true);
            }
            searchInput.blur();
        };
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('filter-btn')) {
            const currentFilterBtn = e.target;
            const filterControls = currentFilterBtn.closest('.filter-controls');
            if (!filterControls) return;

            let viewName = 'home';
            if (window.location.pathname === '/live-matches') viewName = 'live';
            else if (window.location.pathname === '/upcoming-matches') viewName = 'upcoming';
            else if (window.location.pathname === '/highlights') viewName = 'highlights';
            else if (window.location.pathname === '/news') viewName = 'news';
            else if (window.location.pathname === '/search') viewName = 'search';

            filterControls.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            currentFilterBtn.classList.add('active');

            const category = currentFilterBtn.dataset.filter;
            const leagueSelect = filterControls.querySelector('.filter-dropdown');
            const league = leagueSelect ? leagueSelect.value : 'all';

            const currentParams = viewName === 'search' ? { query: searchInput.value.trim() || '' } : {};

            console.log(`✨ [Filter Click] Category: ${category}, League: ${league}`);
            renderView(viewName, { ...currentParams, category: category, league: league }, true);
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('filter-dropdown')) {
            const currentSelect = e.target;
            const filterControls = currentSelect.closest('.filter-controls');
            if (!filterControls) return;

            let viewName = 'home';
            if (window.location.pathname === '/live-matches') viewName = 'live';
            else if (window.location.pathname === '/upcoming-matches') viewName = 'upcoming';
            else if (window.location.pathname === '/highlights') viewName = 'highlights';
            else if (window.location.pathname === '/news') viewName = 'news';
            else if (window.location.pathname === '/search') viewName = 'search';

            const categoryBtn = filterControls.querySelector('.filter-btn.active');
            const category = categoryBtn ? categoryBtn.dataset.filter : 'all';
            const league = currentSelect.value;

            const currentParams = viewName === 'search' ? { query: searchInput.value.trim() || '' } : {};

            console.log(`✨ [Filter Change] Category: ${category}, League: ${league}`);
            renderView(viewName, { ...currentParams, category: category, league: league }, true);
        }
    }, { passive: true });

    // --- Global Security Measures (Still Recommended to REMOVE) ---
    // These are commented out by default for better user experience.
    document.addEventListener('contextmenu', e => {
        // e.preventDefault(); 
        // console.warn('🚫 [Security] Right-click disabled.');
    }, { passive: false });

    document.addEventListener('keydown', e => {
        if (
            // e.key === 'F12' ||
            // (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            // (e.ctrlKey && e.key === 'u') ||
            // (e.altKey && e.metaKey && e.key === 'I')
        ) {
            // e.preventDefault(); 
            // console.warn(`🚫 [Security] Developer tools/source hotkey prevented: ${e.key}`);
        }
    }, { passive: false });

    const devtoolsDetector = (() => {
        const threshold = 160;
        let isOpen = false;
        const checkDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            if (widthThreshold || heightThreshold) {
                if (!isOpen) {
                    isOpen = true;
                    // console.warn('🚨 [Security] Developer tools detected! This action is discouraged.'); 
                }
            } else {
                if (isOpen) {
                    isOpen = false;
                    // console.log('✅ [Security] Developer tools closed.');
                }
            }
        };
        // animateDevToolsCheck(); 
    })();
    // --- End Security Measures ---


    /**
     * @description Determines the initial view to render based on the current URL.
     * This function is now called AFTER allContentData has been loaded to ensure data availability.
     */
    function initialPageLoadLogic() {
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);

        let viewName = 'home';
        let params = {};

        if (currentPath.startsWith('/match/')) {
            viewName = 'match-details';
            params.id = parseInt(urlParams.get('id'));
            params.type = urlParams.get('type');
            params.slug = currentPath.substring(currentPath.lastIndexOf('/') + 1);
            if (isNaN(params.id) || !params.type) {
                console.warn('⚠️ [Initial Load] Missing or invalid ID/type for match details in URL. Falling back to home.');
                renderView('home', {}, false); 
                return;
            }
        } else if (currentPath === '/live-matches') {
            viewName = 'live';
        } else if (currentPath === '/upcoming-matches') {
            viewName = 'upcoming';
            params.category = urlParams.get('category') || 'all';
            params.league = urlParams.get('league') || 'all';
        } else if (currentPath === '/highlights') {
            viewName = 'highlights';
        } else if (currentPath === '/news') {
            viewName = 'news';
        } else if (currentPath === '/search') {
            viewName = 'search';
            params.query = urlParams.get('q') || '';
            if (!params.query) {
                console.warn('⚠️ [Initial Load] Empty search query in URL. Falling back to home.');
                renderView('home', {}, false); 
                return;
            }
        } else if (currentPath === '/') {
            viewName = 'home';
        } else {
            console.warn(`⚠️ [Initial Load] Unknown URL path: ${currentPath}. Falling back to home.`);
            renderView('home', {}, false); 
            return;
        }

        renderView(viewName, params, false);
    }

    /**
     * @description Handles browser history navigation (back/forward buttons).
     * Ensures data is loaded before rendering the historical state.
     */
    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] Browser history navigation detected.', event.state);

        if (allContentData.length === 0) {
            console.warn('[Popstate] Data not loaded, attempting to fetch data and render page based on history state.');
            fetchAllContentData().then(() => {
                if (event.state && event.state.view) {
                    const params = {};
                    if (event.state.view === 'match-details') {
                        params.id = event.state.id;
                        params.type = event.state.type;
                        params.slug = event.state.slug;
                    } else if (event.state.view === 'upcoming') {
                        params.category = event.state.category || 'all';
                        params.league = event.state.league || 'all';
                    } else if (event.state.view === 'search') {
                        params.query = event.state.query || '';
                    }
                    renderView(event.state.view, params, false);
                } else {
                    renderView('home', {}, false);
                }
            }).catch(err => {
                console.error('[Popstate] Failed to fetch data for history state after popstate:', err);
                contentDisplay.innerHTML = `
                    <div class="empty-state" style="padding: 50px; background-color: var(--up-bg-medium); border: 2px solid var(--up-accent-red); border-radius: 10px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); color: #ffcccc; font-family: sans-serif; font-size: 22px; margin-top: 50px; text-align: center;">
                        <p style="font-size: 16px; color: #f47b7b; margin-top: 15px;">عذراً، حدث خطأ أثناء تحميل البيانات من السجل. يرجى تحديث الصفحة.</p>
                        <button class="btn btn-secondary" onclick="window.location.reload()" style="margin-top: 20px;">إعادة تحميل الصفحة</button>
                    </div>`;
            });
            return;
        }

        if (event.state && event.state.view) {
            const params = {};
            if (event.state.view === 'match-details') {
                params.id = event.state.id;
                params.type = event.state.type;
                params.slug = event.state.slug;
            } else if (event.state.view === 'upcoming') {
                params.category = event.state.category || 'all';
                params.league = event.state.league || 'all';
            } else if (event.state.view === 'search') {
                params.query = event.state.query || '';
            }
            renderView(event.state.view, params, false);
        } else {
            renderView('home', {}, false);
        }
    });

    // Font loading optimization (using Font Face Observer)
    async function loadFonts() {
        if (typeof FontFaceObserver !== 'undefined') {
            const oswald = new FontFaceObserver('Oswald');
            const roboto = new FontFaceObserver('Roboto');

            try {
                await Promise.all([
                    oswald.load(null, 5000),
                    roboto.load(null, 5000)
                ]);
                document.documentElement.classList.add('fonts-loaded');
                console.log('✅ Fonts loaded successfully.');
            } catch (e) {
                console.error('❌ Font loading failed:', e);
                document.documentElement.classList.add('fonts-load-failed');
            }
        } else {
            console.warn('⚠️ FontFaceObserver not available. Fonts may load without FOUT optimization.');
            document.documentElement.classList.add('fonts-loaded');
        }
    }

    // Fetch data and then execute initial load logic
    fetchAllContentData();
    loadFonts();
});
