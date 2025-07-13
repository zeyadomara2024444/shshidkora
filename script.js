// script.js - كود "شاهد كورة" الاحترافي الفائق لـ "Ultimate Pitch UI"
// مع تحسينات الأداء، SEO، وتجربة الموبايل (محدث لتقليل التقطيع والأرشفة) - إصلاح جذري لعدم عرض الكروت

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Ultimate Pitch script execution started.');

    // --- 1. DOM Element References & Critical Verification ---
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const homeLogoLink = document.getElementById('home-logo-link');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const contentDisplay = document.getElementById('content-display'); // The main dynamic content area
    const menuToggle = document.querySelector('.menu-toggle'); // Mobile menu toggle button

    // Templates for dynamic content loading (from HTML)
    // 💡 هام جداً: تأكد أن هذه الـ IDs تتطابق تماماً مع ما هو موجود في ملف HTML الخاص بك <template id="...">
    const liveMatchesTemplate = document.getElementById('live-matches-template');
    const upcomingMatchesTemplate = document.getElementById('upcoming-matches-template');
    const highlightsTemplate = document.getElementById('highlights-template');
    const newsTemplate = document.getElementById('news-template');
    const matchDetailsTemplate = document.getElementById('match-details-template');
    const suggestedMatchesTemplate = document.getElementById('suggested-matches-template');

    const requiredElements = {
        '#main-nav': mainNav,
        '#content-display': contentDisplay,
        '#live-matches-template': liveMatchesTemplate,
        '#upcoming-matches-template': upcomingMatchesTemplate,
        '#highlights-template': highlightsTemplate,
        '#news-template': newsTemplate,
        '#match-details-template': matchDetailsTemplate,
        '#suggested-matches-template': suggestedMatchesTemplate
    };

    let criticalErrorDetected = false;
    for (const [id, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`❌ CRITICAL ERROR: Required DOM element or template "${id}" not found. Please check your HTML structure. The element with ID: ${id} is missing.`);
            criticalErrorDetected = true;
        }
    }

    if (criticalErrorDetected) {
        console.error('🛑 Script halted due to missing critical DOM elements. Please fix your HTML!');
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; margin-top: 100px; background-color: #2a0f0f; border-radius: 10px; border: 2px solid #ff4d4d; color: #ffcccc; font-family: sans-serif; font-size: 22px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);">
                عذرًا، حدث خطأ فني كارثي. يرجى تحديث الصفحة أو المحاولة لاحقًا.
                <p style="font-size: 16px; color: #f47b7b; margin-top: 15px;">(عناصر الواجهة الأساسية مفقودة أو تالفة في HTML. راجع الـ console للمزيد من التفاصيل.)</p>
            </div>`;
        return; // Stop script execution
    } else {
        console.log('✅ All critical DOM elements and templates found. Proceeding with script execution.');
    }

    // --- 2. Adsterra Configuration (NO CHANGES HERE AS PER REQUEST) ---
    // (لم يتم المساس بأي كود خاص بالإعلانات)
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/spqbhmyax?key=2469b039d4e7c471764bd04c57824cf2';
    const DIRECT_LINK_COOLDOWN_MATCH_CARD = 3 * 60 * 1000; // 3 minutes
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 15 * 1000; // 15 seconds

    let lastDirectLinkClickTimeMatchCard = 0;
    let lastDirectLinkClickTimeVideoInteraction = 0;

    function openAdLink(cooldownDuration, type) {
        let lastClickTime;
        let setLastClickTime;

        if (type === 'matchCard' || type === 'matchDetailsThumbnail') {
            lastClickTime = lastDirectLinkClickTimeMatchCard;
            setLastClickTime = (time) => lastDirectLinkClickTimeMatchCard = time;
        } else if (type.startsWith('video')) {
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
    let currentDetailedItem = null; // Stores the currently viewed detailed item

    async function fetchAllContentData() {
        try {
            console.log('📡 Fetching all content data from matches.json...');
            const response = await fetch('matches.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - Could not load matches.json. Check file path and server configuration.`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error('❌ Fetched data is not an array. Please check matches.json format. Expected an array of objects.');
                allContentData = []; // Ensure it's an empty array if invalid format
            } else {
                allContentData = data;
                console.log('JSON Data Structure Sample (first item):', allContentData.length > 0 ? allContentData[0] : 'No items');
            }
            if (allContentData.length === 0) {
                console.warn('⚠️ matches.json loaded, but it is empty. No content will be displayed.');
            }
            console.log('✅ All content data loaded successfully from matches.json. Total items found:', allContentData.length);
            
            // ⭐ تم الإصلاح: استدعاء initialPageLoadLogic فقط بعد التأكد من تحميل البيانات بالكامل
            initialPageLoadLogic(); 
        } catch (error) {
            console.error('❌ Failed to load all content data:', error.message);
            contentDisplay.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 50px; background-color: var(--up-bg-medium); border: 2px solid var(--up-accent-red); border-radius: var(--border-radius-card); box-shadow: var(--up-shadow-strong); margin-top: 50px;">
                    <p style="color: var(--up-text-primary);">عذرًا، لم نتمكن من الاتصال بمسار البيانات أو قراءتها. يرجى التحقق من اتصالك بالشبكة و<a href="/" style="color: var(--up-accent-blue); text-decoration: underline;">تحديث الصفحة</a>.</p>
                    <p style="color: var(--up-text-secondary); font-size: 0.9em;">(خطأ: ${error.message}. تأكد من وجود ملف matches.json وتنسيقه الصحيح.)</p>
                </div>`;
        }
    }

    // Helper to get image sources for responsive images
    function getImageSources(basePath) {
        if (!basePath) return {};
        const cleanPath = basePath.split('?')[0].split('#')[0];
        const extMatch = cleanPath.match(/\.(png|jpe?g|gif|webp)$/i);
        const ext = extMatch ? extMatch[1] : '';
        const name = cleanPath.substring(0, cleanPath.lastIndexOf('.'));
        return {
            webp: name + '.webp',
            mediumWebp: name + '_medium.webp',
            largeWebp: name + '_large.webp',
            original: basePath
        };
    }

    function createContentCard(item) {
        const card = document.createElement('div');
        card.classList.add(item.type === 'news' ? 'news-card' : 'match-card');

        let innerContent = '';
        const defaultPoster = '/images/default-match-poster.webp';
        const defaultTeamLogo = '/images/default-team-logo.webp';
        const defaultNewsThumbnail = '/images/default-news-thumbnail.webp';

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

            const cardThumbnail = item.thumbnail || defaultPoster;
            const imgSources = getImageSources(cardThumbnail);

            innerContent = `
                <picture>
                    <source srcset="${imgSources.webp}" type="image/webp">
                    <img src="${imgSources.original}" alt="${item.title}" loading="lazy" width="300" height="200"
                            onerror="this.onerror=null;this.src='${defaultPoster}';"
                            srcset="${imgSources.webp ? imgSources.webp + ' 300w,' : ''} ${imgSources.mediumWebp ? imgSources.mediumWebp + ' 600w,' : ''} ${imgSources.largeWebp ? imgSources.largeWebp + ' 900w,' : ''} ${imgSources.original || defaultPoster} 300w"
                            sizes="(max-width: 600px) 300px, (max-width: 900px) 600px, 900px">
                </picture>
                <div class="match-card-content">
                    <div class="teams-logos">
                        <img src="${item.home_team_logo || defaultTeamLogo}" alt="${item.home_team} logo" class="team-logo" onerror="this.onerror=null;this.src='${defaultTeamLogo}';">
                        <span>${item.home_team}</span>
                        <span class="vs-text">vs</span>
                        <span>${item.away_team}</span>
                        <img src="${item.away_team_logo || defaultTeamLogo}" alt="${item.away_team} logo" class="team-logo" onerror="this.onerror=null;this.src='${defaultTeamLogo}';">
                    </div>
                    <h3>${item.title}</h3>
                    <p class="match-league">${item.league_name}</p>
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
                // لا يوجد تغيير هنا: كود الإعلانات
                openAdLink(DIRECT_LINK_COOLDOWN_MATCH_CARD, 'matchCard');
                const itemSlug = createSlug(item.title);
                renderView('match-details', { id: item.id, type: item.type, slug: itemSlug });
            });
        } else if (item.type === 'news') {
            const newsThumbnail = item.thumbnail || defaultNewsThumbnail;
            const newsImgSources = getImageSources(newsThumbnail);

            innerContent = `
                <picture>
                    <source srcset="${newsImgSources.webp}" type="image/webp">
                    <img src="${newsImgSources.original}" alt="${item.title}" loading="lazy" width="350" height="250"
                            onerror="this.onerror=null;this.src='${defaultNewsThumbnail}';"
                            srcset="${newsImgSources.webp ? newsImgSources.webp + ' 350w,' : ''} ${newsImgSources.mediumWebp ? newsImgSources.mediumWebp + ' 700w,' : ''} ${newsImgSources.original || defaultNewsThumbnail} 350w"
                            sizes="(max-width: 768px) 350px, 700px">
                </picture>
                <div class="news-card-content">
                    <h4>${item.title}</h4>
                    <p>${item.short_description}</p>
                    <span class="news-date">${new Date(item.date_time).toLocaleDateString('ar-EG')}</span>
                    <div class="card-actions">
                        <a href="${item.article_url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">اقرأ المزيد</a>
                    </div>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }
                console.log(`⚡ [Interaction] News card clicked (opening external link): ${item.id}`);
                window.open(item.article_url, '_blank');
            });
        } else {
            console.warn(`⚠️ [createContentCard] Unknown item type encountered: ${item.type}`, item);
            return null; // Return null for unknown types
        }
        card.innerHTML = innerContent;
        return card;
    }

    function displayContent(contentArray, targetGridElement, emptyStateSelector = '.empty-state') {
        if (!targetGridElement) {
            console.error('❌ displayContent: targetGridElement is null or undefined. Cannot display content.');
            return;
        }

        requestAnimationFrame(() => {
            targetGridElement.innerHTML = '';
            const parentViewSection = targetGridElement.closest('.view-section');
            const emptyStateElement = parentViewSection ? parentViewSection.querySelector(emptyStateSelector) : null;

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
            const fragment = document.createDocumentFragment();
            contentArray.forEach(item => {
                const card = createContentCard(item);
                if (card) { // Only append if card was successfully created
                    fragment.appendChild(card);
                }
            });
            targetGridElement.appendChild(fragment);
            console.log(`🎬 [Display] Finished displaying ${contentArray.length} items.`);
        });
    }

    function populateLeagueFilter(filterElement, contentType = 'match') {
        if (!filterElement) {
            console.warn(`⚠️ populateLeagueFilter: Filter element not found for content type "${contentType}".`);
            return;
        }
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

        // Cleanup old event listeners for dynamic elements that might be removed
        const oldVideoOverlay = contentDisplay.querySelector('.video-overlay');
        if (oldVideoOverlay) {
            oldVideoOverlay.onclick = null;
            console.log('[Cleanup] Removed old video overlay click handler.');
        }

        // Remove active class from previous view section
        const currentActiveView = contentDisplay.querySelector('.view-section.active-view');
        if (currentActiveView) {
            currentActiveView.classList.remove('active-view');
            // More aggressive cleanup: detach iframes to stop any background video playback
            currentActiveView.querySelectorAll('iframe').forEach(iframe => {
                iframe.src = 'about:blank'; // Stop video
                iframe.remove();
            });
            console.log('[Cleanup] Detached iframes from old view.');
        }

        // Close mobile menu if open
        if (menuToggle && mainNav.classList.contains('active-mobile')) {
            mainNav.classList.remove('active-mobile');
            menuToggle.querySelector('i').className = 'fas fa-bars';
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

        try {
            switch (viewName) {
                case 'home':
                case 'live':
                case 'upcoming':
                case 'highlights':
                case 'news':
                case 'search':
                    let templateToUse;
                    let sectionTitleText;
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
                        currentSectionData = allContentData.filter(m => {
                            const matchDate = new Date(m.date_time);
                            const now = new Date();
                            const matchEndTime = new Date(matchDate.getTime() + 105 * 60 * 1000);
                            return m.type === 'match' && m.status === 'Live' && now >= matchDate && now < matchEndTime;
                        });
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
                        currentSectionData = allContentData.filter(item => item.type === 'match' && (item.status === 'Finished' || new Date(item.date_time) < new Date()) && item.highlights_url)
                                                           .sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
                        sectionTitleText = 'أهداف وملخصات المباريات';
                        templateToUse = highlightsTemplate;
                        gridClass = 'news-grid'; // Use news-grid for better layout of highlight videos
                        showDateFilters = false;
                        showLeagueFilter = true;
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
                        if (!query) {
                            renderView('home', {}, true);
                            console.warn('⚠️ [View Render] Search query empty, redirecting to home.');
                            return;
                        }

                        currentSectionData = allContentData.filter(item => {
                            const searchFields = [item.title, item.short_description, item.league_name, item.home_team, item.away_team, (Array.isArray(item.commentators) ? item.commentators.join(' ') : item.commentators)];
                            return searchFields.some(field => field && String(field).toLowerCase().includes(query));
                        });
                        currentSectionData.sort((a, b) => {
                            const aTitleMatch = a.title?.toLowerCase().includes(query);
                            const bTitleMatch = b.title?.toLowerCase().includes(query);
                            if (aTitleMatch && !bTitleMatch) return -1;
                            if (!aTitleMatch && bTitleMatch) return 1;
                            return new Date(b.date_time) - new Date(a.date_time);
                        });

                        sectionTitleText = `نتائج البحث عن "${params.query}" (${currentSectionData.length})`;
                        templateToUse = liveMatchesTemplate; // Generic template for search results
                        showDateFilters = false;
                        showLeagueFilter = true;
                        urlPath = '/search';
                        newUrl.searchParams.set('q', query);
                    }

                    if (!templateToUse) {
                        console.error(`❌ Template not defined for view: ${viewName}. This is a critical error.`);
                        // عرض رسالة خطأ واضحة للمستخدم
                        contentDisplay.innerHTML = `
                            <div class="empty-state error-message" style="text-align: center; padding: 50px; background-color: #2a0f0f; border: 2px solid #ff4d4d; border-radius: 10px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); margin-top: 50px;">
                                <p style="color: #ffcccc; font-size: 1.2em;">عذرًا، لا يمكن عرض هذا القسم حاليًا بسبب مشكلة داخلية.</p>
                                <p style="font-size: 0.9em; color: #f47b7b;">(السبب: قالب العرض مفقود. يرجى إبلاغ الدعم الفني.)</p>
                            </div>`;
                        return; // Stop rendering
                    }
                    
                    newViewElement = templateToUse.content.cloneNode(true);
                    console.log(`✅ Cloned template for view "${viewName}". newViewElement type:`, newViewElement.nodeType, newViewElement.nodeName);
                    
                    const containerInTemplate = newViewElement.querySelector('.container');
                    const sectionTitleEl = newViewElement.querySelector('.section-title');
                    if (sectionTitleEl) sectionTitleEl.textContent = sectionTitleText;
                    else console.warn(`⚠️ Section title element not found in template for view: ${viewName}`);

                    targetGrid = newViewElement.querySelector('.match-grid') || newViewElement.querySelector('.news-grid');
                    if (!targetGrid) {
                        console.warn(`⚠️ Target grid element (.match-grid or .news-grid) not found directly in template for view: ${viewName}. Attempting to create and append.`);
                        targetGrid = document.createElement('div');
                        targetGrid.className = gridClass;
                        if (containerInTemplate) {
                            containerInTemplate.appendChild(targetGrid);
                            console.log('✅ Created and appended new grid to .container within template.');
                        } else {
                            newViewElement.appendChild(targetGrid);
                            console.warn('⚠️ No .container found in template, appended new grid directly to DocumentFragment. Verify HTML structure.');
                        }
                    } else {
                        targetGrid.className = gridClass;
                        console.log(`✅ Found existing grid element with class: ${targetGrid.className} in template.`);
                    }

                    const filterControls = newViewElement.querySelector('.filter-controls');
                    if (filterControls) {
                        filterControls.style.display = (showDateFilters || showLeagueFilter || viewName === 'search') ? 'flex' : 'none';

                        const buttons = filterControls.querySelectorAll('.filter-btn');
                        buttons.forEach(btn => btn.style.display = showDateFilters ? '' : 'none');
                        if (showDateFilters) {
                            buttons.forEach(btn => {
                                btn.classList.remove('active');
                                if (btn.dataset.filter === (params.category || 'all')) btn.classList.add('active');
                            });
                        }

                        const leagueSelect = filterControls.querySelector('.filter-dropdown');
                        if (leagueSelect) {
                            leagueSelect.style.display = showLeagueFilter ? '' : 'none';
                            if (showLeagueFilter) {
                                populateLeagueFilter(leagueSelect, contentTypeFilter);
                                leagueSelect.value = params.league || 'all';
                            }
                        }
                    } else {
                        console.log('ℹ️ Filter controls not found in the current template.');
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
                    const actualViewSection = contentDisplay.querySelector('.view-section');
                    if (actualViewSection) {
                        actualViewSection.classList.add('active-view');
                        console.log(`✅ Applied 'active-view' to:`, actualViewSection);
                    } else {
                        console.error('❌ Could not find .view-section after appending newViewElement.');
                    }

                    displayContent(currentSectionData, targetGrid);

                    const paginationControls = contentDisplay.querySelector('.pagination-controls');
                    if (paginationControls) paginationControls.style.display = 'none';

                    pageTitle = sectionTitleText + ' - شاهد كورة';
                    newUrl.pathname = urlPath;
                    break;

                case 'match-details':
                    // تأكد من أن البيانات كلها موجودة قبل المتابعة
                    if (!allContentData || allContentData.length === 0) {
                        console.error('❌ [View Render] Cannot render match details: allContentData is empty or not loaded.');
                        contentDisplay.innerHTML = `
                            <div class="empty-state error-message" style="text-align: center; padding: 50px; background-color: #2a0f0f; border: 2px solid #ff4d4d; border-radius: 10px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); margin-top: 50px;">
                                <p style="color: #ffcccc; font-size: 1.2em;">عذرًا، لا يمكن تحميل تفاصيل المباراة حاليًا.</p>
                                <p style="font-size: 0.9em; color: #f47b7b;">(يرجى التحقق من اتصالك بالإنترنت وتحديث الصفحة.)</p>
                            </div>`;
                        return;
                    }

                    const itemId = parseInt(params.id);
                    const itemType = params.type;
                    const item = allContentData.find(i => i.id === itemId && i.type === itemType);

                    if (!item || item.type !== 'match') {
                        console.error('❌ [View Render] Match details: Item not found or not a match type for ID:', itemId, params);
                        // عرض رسالة خطأ واضحة للمستخدم
                        contentDisplay.innerHTML = `
                            <div class="empty-state error-message" style="text-align: center; padding: 50px; background-color: #2a0f0f; border: 2px solid #ff4d4d; border-radius: 10px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); margin-top: 50px;">
                                <p style="color: #ffcccc; font-size: 1.2em;">عذرًا، لم يتم العثور على تفاصيل هذه المباراة.</p>
                                <p style="font-size: 0.9em; color: #f47b7b;">(قد تكون غير موجودة أو تم نقلها. يرجى <a href="/" style="color: var(--up-accent-blue); text-decoration: underline;">العودة للصفحة الرئيسية</a>.)</p>
                            </div>`;
                        return; // Stop rendering
                    }
                    currentDetailedItem = item;

                    newViewElement = matchDetailsTemplate.content.cloneNode(true);
                    const detailsContainer = newViewElement.querySelector('.match-details-section');

                    if (!detailsContainer) {
                        console.error('❌ Match details container (.match-details-section) not found in template. Cannot render details.');
                        // عرض رسالة خطأ واضحة للمستخدم
                        contentDisplay.innerHTML = `
                            <div class="empty-state error-message" style="text-align: center; padding: 50px; background-color: #2a0f0f; border: 2px solid #ff4d4d; border-radius: 10px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); margin-top: 50px;">
                                <p style="color: #ffcccc; font-size: 1.2em;">عذرًا، حدث خطأ في تحميل تخطيط الصفحة.</p>
                                <p style="font-size: 0.9em; color: #f47b7b;">(يرجى محاولة تحديث الصفحة أو الاتصال بالدعم الفني.)</p>
                            </div>`;
                        return; // Stop rendering
                    }

                    // تحديث محتوى تفاصيل المباراة
                    detailsContainer.querySelector('.match-details-title').textContent = item.title || 'غير متوفر';
                    detailsContainer.querySelector('.match-details-description').textContent = item.short_description || 'لا يوجد وصف متاح.';

                    const matchDateTime = item.date_time ? new Date(item.date_time) : null;
                    const formattedDateTime = matchDateTime ?
                        matchDateTime.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) + ' - ' +
                        matchDateTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'غير متوفر';
                    detailsContainer.querySelector('.match-details-date-time').textContent = formattedDateTime;

                    detailsContainer.querySelector('.match-details-league').textContent = item.league_name || 'غير محدد';
                    detailsContainer.querySelector('.match-details-commentators').textContent = Array.isArray(item.commentators) ? item.commentators.join(', ') : item.commentators || 'غير متوفر';
                    detailsContainer.querySelector('.match-details-teams').innerHTML = `${item.home_team} <span class="vs-text">vs</span> ${item.away_team}` || 'غير متوفر';
                    detailsContainer.querySelector('.match-details-stadium').textContent = item.stadium || 'غير متوفر';
                    detailsContainer.querySelector('.match-details-status').textContent = item.status || 'N/A';

                    if (item.status === 'Finished') {
                        detailsContainer.querySelector('.match-details-score-container')?.classList.remove('hidden');
                        detailsContainer.querySelector('.match-details-score').textContent = item.score || 'N/A';
                        if (item.highlights_url) {
                            detailsContainer.querySelector('.match-details-highlights-container')?.classList.remove('hidden');
                            detailsContainer.querySelector('.match-details-highlights-link').href = item.highlights_url;
                        } else {
                            detailsContainer.querySelector('.match-details-highlights-container')?.classList.add('hidden');
                        }
                    } else {
                        detailsContainer.querySelector('.match-details-score-container')?.classList.add('hidden');
                        detailsContainer.querySelector('.match-details-highlights-container')?.classList.add('hidden');
                    }

                    const detailsThumbnail = detailsContainer.querySelector('.match-details-thumbnail');
                    if (detailsThumbnail) {
                        const thumbSources = getImageSources(item.thumbnail);
                        const pictureElement = detailsThumbnail.closest('picture');
                        // نضمن أننا نحدث عنصر الصورة الصحيح
                        const imgElementToUpdate = pictureElement ? pictureElement.querySelector('img') : detailsThumbnail;

                        if (imgElementToUpdate) {
                            imgElementToUpdate.src = thumbSources.original || '/images/default-match-poster.webp';
                            imgElementToUpdate.alt = item.title;
                            imgElementToUpdate.onerror = function() { this.src = '/images/default-match-poster.webp'; };

                            if (pictureElement) {
                                // إعادة تعيين Source elements داخل Picture للحفاظ على الصورة المتجاوبة
                                pictureElement.innerHTML = `
                                    <source srcset="${thumbSources.webp}" type="image/webp">
                                    <img src="${thumbSources.original}" alt="${item.title}" loading="lazy" width="600" height="400"
                                            onerror="this.onerror=null;this.src='/images/default-match-poster.webp';"
                                            srcset="${thumbSources.webp ? thumbSources.webp + ' 600w,' : ''} ${thumbSources.mediumWebp ? thumbSources.mediumWebp + ' 900w,' : ''} ${thumbSources.largeWebp ? thumbSources.largeWebp + ' 1200w,' : ''} ${thumbSources.original || '/images/default-match-poster.webp'} 600w"
                                            sizes="(max-width: 768px) 100vw, 600px">
                                `;
                                const reSelectedImg = pictureElement.querySelector('img');
                                if (reSelectedImg) {
                                    reSelectedImg.addEventListener('click', () => {
                                        console.log('🖼️ [Ad Click] Match details thumbnail clicked. Attempting to open direct link.');
                                        // لا يوجد تغيير هنا: كود الإعلانات
                                        openAdLink(DIRECT_LINK_COOLDOWN_MATCH_CARD, 'matchDetailsThumbnail');
                                    });
                                }
                            } else {
                                imgElementToUpdate.addEventListener('click', () => {
                                    console.log('🖼️ [Ad Click] Match details thumbnail clicked. Attempting to open direct link.');
                                    // لا يوجد تغيير هنا: كود الإعلانات
                                    openAdLink(DIRECT_LINK_COOLDOWN_MATCH_CARD, 'matchDetailsThumbnail');
                                });
                            }
                        }
                        console.log(`[Details] Thumbnail set for ${item.title}`);
                    }


                    const videoContainer = detailsContainer.querySelector('.video-player-container');
                    const videoOverlay = detailsContainer.querySelector('.video-overlay');

                    if (videoContainer) videoContainer.innerHTML = '';

                    const videoUrl = item.embed_url;
                    if (!videoUrl) {
                        console.error(`❌ Failed to get video URL for match ID: ${itemId}. Cannot embed iframe.`);
                        if (videoContainer) { // Ensure container exists before updating its content
                           videoContainer.innerHTML = '<p style="text-align: center; color: var(--up-text-primary); margin-top: 20px;">عذرًا، لا يمكن تشغيل الفيديو حاليًا (الرابط غير صالح).</p>';
                        }
                    } else {
                        const iframeElement = document.createElement('iframe');
                        iframeElement.src = videoUrl;
                        iframeElement.setAttribute('frameborder', '0');
                        iframeElement.setAttribute('allowfullscreen', '');
                        iframeElement.setAttribute('scrolling', 'no');
                        iframeElement.setAttribute('rel', 'noopener noreferrer');
                        iframeElement.setAttribute('loading', 'lazy');
                        // تقييد Sandbox لزيادة الأمان ومنع محتوى الطرف الثالث من التسبب في مشاكل
                        iframeElement.sandbox = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock allow-top-navigation-by-user-activation';
                        iframeElement.classList.add('match-iframe-player');

                        if (videoContainer) { // Ensure container exists before appending
                            videoContainer.appendChild(iframeElement);
                            console.log('[IFRAME Player] New iframe element created with src:', videoUrl);
                        } else {
                            console.error('❌ Video container not found when trying to append iframe.');
                        }

                        if (videoOverlay) {
                            videoOverlay.style.pointerEvents = 'auto';
                            videoOverlay.classList.remove('hidden');
                            // يجب إضافة زر التشغيل إن لم يكن موجوداً
                            let playButton = videoOverlay.querySelector('.video-play-btn');
                            if (!playButton) {
                                playButton = document.createElement('button');
                                playButton.classList.add('video-play-btn');
                                playButton.innerHTML = '<i class="fas fa-play"></i>'; // تأكد أن لديك FontAwesome
                                videoOverlay.appendChild(playButton);
                            }

                            const videoOverlayClickHandler = async (e) => {
                                console.log('⏯️ [Ad Click] Video overlay clicked. Attempting to open direct link.');
                                // لا يوجد تغيير هنا: كود الإعلانات
                                const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');

                                if (adOpened) {
                                    videoOverlay.style.pointerEvents = 'none';
                                    videoOverlay.classList.add('hidden');
                                    console.log('[IFRAME Player] Overlay hidden after ad interaction.');
                                } else {
                                    console.log('[IFRAME Overlay] Ad did not open due to cooldown. Overlay remains active and clickable.');
                                }
                                e.stopPropagation();
                            };
                            videoOverlay.onclick = videoOverlayClickHandler;
                        }
                    }

                    contentDisplay.innerHTML = '';
                    contentDisplay.appendChild(newViewElement);
                    const actualMatchDetailsSection = contentDisplay.querySelector('.match-details-section');
                    if(actualMatchDetailsSection){
                        actualMatchDetailsSection.classList.add('active-view');
                    } else {
                        console.error("❌ Could not find .match-details-section after appending new view.");
                    }

                    const backBtn = detailsContainer.querySelector('.back-btn');
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
        } catch (error) {
            console.error(`🛑 ERROR during renderView for "${viewName}":`, error);
            contentDisplay.innerHTML = `
                <div class="empty-state error-message" style="text-align: center; padding: 50px; background-color: var(--up-bg-medium); border: 2px solid var(--up-accent-red); border-radius: 10px; box-shadow: var(--up-shadow-strong); margin-top: 50px;">
                    <p style="color: var(--up-text-primary);">عذرًا، حدث خطأ أثناء تحميل المحتوى. يرجى <a href="/" style="color: var(--up-accent-blue); text-decoration: underline;">الضغط هنا لتحديث الصفحة</a>.</p>
                    <p style="font-size: 0.9em; color: var(--up-text-secondary);">تفاصيل الخطأ: ${error.message}. (تحقق من الـ console لأخطاء JavaScript)</p>
                </div>`;
            return;
        }


        if (pushState) {
            history.pushState(historyState, pageTitle, newUrl.toString());
            console.log(`🔗 [URL] URL updated to ${newUrl.toString()}`);
        } else {
            history.replaceState(historyState, pageTitle, newUrl.toString());
            console.log(`🔗 [URL] URL replaced with ${newUrl.toString()}`);
        }

        // Delay meta tag and schema updates slightly to ensure DOM is fully ready
        setTimeout(() => {
            updateMetaTags(currentDetailedItem, viewName, params);
            addJsonLdSchema(currentDetailedItem, viewName, params);
        }, 50); // Small delay, adjust if needed

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function displaySuggestedMatches(currentMatchId) {
        if (!suggestedMatchesTemplate) {
            console.error('❌ Suggested matches template not found.');
            return;
        }

        const existingSuggestedSection = contentDisplay.querySelector('.suggested-matches-section');
        if (existingSuggestedSection) {
            existingSuggestedSection.remove();
        }

        const suggestedSectionClone = suggestedMatchesTemplate.content.cloneNode(true);
        const suggestedMatchGrid = suggestedSectionClone.querySelector('.match-grid');
        const currentMatchDetailsSection = contentDisplay.querySelector('.match-details-section');

        if (!currentMatchDetailsSection || !suggestedMatchGrid || !currentDetailedItem || currentDetailedItem.type !== 'match') {
            console.error('❌ displaySuggestedMatches: Current match details section, suggested grid, or current detailed item not found/not a match. Cannot display suggestions.');
            return;
        }

        currentMatchDetailsSection.insertAdjacentElement('afterend', suggestedSectionClone.children[0]);
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
                const titleElement = activeSuggestedSection.querySelector('.section-title');
                activeSuggestedSection.innerHTML = `
                    <div class="container">
                        ${titleElement ? `<h2 class="section-title">${titleElement.textContent}</h2>` : '<h2 class="section-title">مباريات قد تهمك</h2>'}
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
            const itemUrl = `${baseUrl}match/${itemSlug}?id=${item.id}&type=${item.type}`;
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
            ogImage = item.thumbnail || defaultOgImage;
            ogType = "video.other";

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;

        } else if (item && item.type === 'news' && viewName === 'news') {
            const itemSlug = createSlug(item.title);
            const itemUrl = item.article_url || `${baseUrl}news/${itemSlug}?id=${item.id}&type=${item.type}`;
            canonicalLink.setAttribute('href', itemUrl);

            pageTitle = `${item.title} - آخر الأخبار | شاهد كورة`;
            const shortDesc = (item.short_description || `اقرأ أحدث الأخبار الرياضية عن ${item.title} على شاهد كورة.`).substring(0, 155);
            pageDescription = shortDesc + (item.short_description && item.short_description.length > 155 ? '...' : '');
            pageKeywords = [item.title, 'أخبار كورة', 'شاهد كورة', 'أخبار رياضية', 'تحليلات كروية', 'انتقالات اللاعبين'].filter(Boolean).join(', ');

            ogUrl = itemUrl;
            ogTitle = `${item.title} - أخبار شاهد كورة`;
            ogDescription = pageDescription;
            ogImage = item.thumbnail || defaultOgImage;
            ogType = "article";

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
        } else {
            const currentURL = new URL(window.location.href);
            let canonicalPath = currentURL.pathname;
            if (viewName === 'search' && params.query) {
                canonicalPath = `/search?q=${encodeURIComponent(params.query)}`;
            } else if (viewName === 'home') {
                 canonicalPath = '/';
            } else if (viewName === 'live') {
                 canonicalPath = '/live-matches';
            } else if (viewName === 'upcoming') {
                 canonicalPath = '/upcoming-matches';
            } else if (viewName === 'highlights') {
                 canonicalPath = '/highlights';
            } else if (viewName === 'news') {
                 canonicalPath = '/news';
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

        document.title = pageTitle;
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
    // Combined and delegated event listeners for robustness
    document.body.addEventListener('click', (e) => {
        // Navigation Links
        const navLinkTarget = e.target.closest('.nav-link');
        if (navLinkTarget) {
            e.preventDefault();
            const targetView = navLinkTarget.dataset.targetView;
            console.log(`📱 [Interaction] Nav link clicked: ${navLinkTarget.textContent.trim()}, Target View: ${targetView}`);
            renderView(targetView, {}, true);
            return;
        }

        // Home Logo Link
        const homeLogoClickTarget = e.target.closest('#home-logo-link');
        if (homeLogoLink && homeLogoClickTarget) { // Ensure homeLogoLink is not null
            e.preventDefault();
            console.log('🏠 [Interaction] Home logo clicked.');
            renderView('home', {}, true);
            return;
        }

        // Mobile Menu Toggle
        const menuToggleClickTarget = e.target.closest('.menu-toggle');
        if (menuToggle && menuToggleClickTarget) { // Ensure menuToggle is not null
            mainNav.classList.toggle('active-mobile');
            const icon = menuToggle.querySelector('i');
            if (icon) { // Check if icon exists
                icon.className = mainNav.classList.contains('active-mobile') ? 'fas fa-times' : 'fas fa-bars';
            }
            console.log(`☰ [Mobile Menu] Toggled to ${mainNav.classList.contains('active-mobile') ? 'open' : 'closed'}`);
            return;
        }

        // General button with data-target-view
        if (e.target.classList.contains('btn') && e.target.dataset.targetView) {
            e.preventDefault();
            console.log(`🚀 [Interaction] General button with data-target-view clicked: ${e.target.dataset.targetView}`);
            renderView(e.target.dataset.targetView, {}, true);
            return;
        }

        // Back button
        if (e.target.classList.contains('back-btn')) {
            e.preventDefault();
            console.log('🔙 [Interaction] Back button clicked (delegated).');
            window.history.back();
            return;
        }

        // Filter Buttons
        if (e.target.classList.contains('filter-btn')) {
            const currentFilterBtn = e.target;
            const filterControls = currentFilterBtn.closest('.filter-controls');
            if (!filterControls) {
                console.warn('⚠️ Filter button clicked but no parent .filter-controls found.');
                return;
            }

            let viewName = 'home';
            const path = window.location.pathname;
            if (path.includes('/live-matches')) viewName = 'live';
            else if (path.includes('/upcoming-matches')) viewName = 'upcoming';
            else if (path.includes('/highlights')) viewName = 'highlights';
            else if (path.includes('/news')) viewName = 'news';
            else if (path.includes('/search')) viewName = 'search';


            filterControls.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            currentFilterBtn.classList.add('active');

            const category = currentFilterBtn.dataset.filter;
            const leagueSelect = filterControls.querySelector('.filter-dropdown');
            const league = leagueSelect ? leagueSelect.value : 'all';

            console.log(`✨ [Filter Click] Category: ${category}, League: ${league}`);
            renderView(viewName, { category: category, league: league }, true);
            return;
        }
    });

    // Search input and button event listeners (not delegated as they are specific inputs)
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
    } else {
        console.warn('⚠️ Search input or search button not found.');
    }

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('filter-dropdown')) {
            const currentSelect = e.target;
            const filterControls = currentSelect.closest('.filter-controls');
            if (!filterControls) {
                console.warn('⚠️ Filter dropdown changed but no parent .filter-controls found.');
                return;
            }

            let viewName = 'home';
            const path = window.location.pathname;
            if (path.includes('/live-matches')) viewName = 'live';
            else if (path.includes('/upcoming-matches')) viewName = 'upcoming';
            else if (path.includes('/highlights')) viewName = 'highlights';
            else if (path.includes('/news')) viewName = 'news';
            else if (path.includes('/search')) viewName = 'search';


            const categoryBtn = filterControls.querySelector('.filter-btn.active');
            const category = categoryBtn ? categoryBtn.dataset.filter : 'all';
            const league = currentSelect.value;

            console.log(`✨ [Filter Change] Category: ${category}, League: ${league}`);
            renderView(viewName, { category: category, league: league }, true);
        }
    }, { passive: true });

    // Global Security Measures (NO CHANGES HERE - Keep existing if intended)
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        console.warn('🚫 [Security] Right-click disabled.');
    }, { passive: false });

    document.addEventListener('keydown', e => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.altKey && e.metaKey && e.key === 'I')
        ) {
            e.preventDefault();
            console.warn(`🚫 [Security] Developer tools/source hotkey prevented: ${e.key}`);
        }
    }, { passive: false });

    const devtoolsDetector = (() => {
        const threshold = 160;
        let isOpen = false;
        const checkDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            const isChromeDevToolsOpen = window.devtools && window.devtools.isOpen;
            const isConsoleOpen = /./.test(console.log) ? (console.table && console.table.constructor.toString().indexOf('native code') === -1) : false;

            if (widthThreshold || heightThreshold || isChromeDevToolsOpen || isConsoleOpen) {
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
        let intervalId;
        const startCheck = () => {
             if (!intervalId) {
                 intervalId = setInterval(() => requestAnimationFrame(checkDevTools), 1000);
             }
        };
        const stopCheck = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        setTimeout(startCheck, 3000);
        window.addEventListener('resize', () => requestAnimationFrame(checkDevTools));
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopCheck();
            } else {
                startCheck();
            }
        });

    })();

    function initialPageLoadLogic() {
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);

        let viewName = 'home';
        let params = {};

        const matchPathMatch = currentPath.match(/^\/match\/([a-zA-Z0-9-]+)$/);
        if (matchPathMatch) {
            viewName = 'match-details';
            params.slug = matchPathMatch[1];
            params.id = parseInt(urlParams.get('id'));
            params.type = urlParams.get('type');
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

        // ⭐ تم الإصلاح: إذا كانت البيانات غير محملة بعد عند استدعاء هذه الدالة لأول مرة (أي عند تحديث الصفحة أو الدخول المباشر)،
        // فسيتم معالجة هذا داخل renderView إذا كانت allContentData فارغة.
        renderView(viewName, params, false);
    }

    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] Browser history navigation detected.', event.state);
        if (event.state) {
            renderView(event.state.view, event.state, false);
        } else {
            // هذا السيناريو قد يحدث إذا لم يكن هناك state محفوظة (مثل بعد تحديث الصفحة بالكامل)
            // في هذه الحالة، نعيد تشغيل منطق تحميل الصفحة الأولية.
            initialPageLoadLogic(); 
        }
    });

    async function loadFonts() {
        if (typeof FontFaceObserver !== 'undefined') {
            const oswald = new FontFaceObserver('Oswald');
            const roboto = new FontFaceObserver('Roboto');

            try {
                await Promise.allSettled([
                    oswald.load(null, 5000),
                    roboto.load(null, 5000)
                ]);
                document.documentElement.classList.add('fonts-loaded');
                console.log('✅ Fonts loading process completed.');
            } catch (e) {
                console.error('❌ Font loading failed:', e);
                document.documentElement.classList.add('fonts-load-failed');
            }
        } else {
            console.warn('⚠️ FontFaceObserver not available. Fonts may load without FOUT optimization.');
            document.documentElement.classList.add('fonts-loaded');
        }
    }

    // ⭐ تم الإصلاح: تم إزالة استدعاء initialPageLoadLogic() من هنا.
    // الآن يتم استدعاؤه داخل fetchAllContentData() بعد التأكد من تحميل البيانات.
    fetchAllContentData();
    loadFonts();
});
