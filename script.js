document.addEventListener('DOMContentLoaded', () => {
    // ======== Configuration & Data Management ========
    const API_URL = './matches.json'; // Path to your JSON data file
    const ITEMS_PER_PAGE = 6;

    let DATA = []; // Will store fetched data
    let currentPage = {
        home: 1,
        live: 1,
        upcoming: 1,
        highlights: 1,
        news: 1,
        search: 1
    };
    let currentView = 'home';
    let currentFilter = {
        upcoming: 'upcoming' // Default filter for upcoming: 'upcoming' (all), 'today', 'tomorrow'
    };
    let currentSearchQuery = '';

    // Constants for date comparisons
    const NOW = new Date();
    const TODAY_START = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
    const TOMORROW_START = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1);
    const DAY_AFTER_TOMORROW_START = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 2);

    // Ad-related variables
    let adTriggers = {
        popunderOpened: false, // Tracks if popunder has been initiated once per session
        lastDirectLinkTime: 0 // Cooldown for the direct link (video overlay click)
    };
    const DIRECT_LINK_COOLDOWN_MS = 7000; // 7 seconds cooldown for direct link
    // URL for the pop-under ad (uncomment and use only if you have a *very specific*
    // and non-intrusive placement in mind, and the ad network allows it)
    const POPUNDER_AD_URL = 'https://www.profitableratecpm.com/s9pzkja6hn?key=0d9ae755a41e87391567e3eab37b7cec';


    // ======== DOM Elements Cache (Static references) ========
    const contentDisplay = document.getElementById('content-display');
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const menuToggle = document.getElementById('menu-toggle');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const homeLogoLink = document.getElementById('home-logo-link');

    // SEO Elements (Meta tags)
    const dynamicTitle = document.getElementById('dynamic-title');
    const dynamicDescription = document.getElementById('dynamic-description');
    const dynamicKeywords = document.getElementById('dynamic-keywords');
    const dynamicCanonical = document.getElementById('dynamic-canonical');
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

    const jsonLdSchema = document.getElementById('json-ld-schema');

    // ======== Utility Functions ========

    /**
     * Formats an ISO date string to a readable Arabic date and time with a relevant timezone abbreviation.
     * @param {string} isoString - The ISO date string.
     * @returns {string} Formatted date string.
     */
    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };

        const formattedDatePart = new Intl.DateTimeFormat('ar-EG', optionsDate).format(date);
        let formattedTimePart = new Intl.DateTimeFormat('ar-EG', optionsTime).format(date);

        formattedTimePart = formattedTimePart.replace('ص', 'ص').replace('م', 'م');

        let timezoneAbbreviation = '';
        const timezoneOffsetMatch = isoString.match(/([+-]\d{2}:\d{2})$/);
        const offsetString = timezoneOffsetMatch ? timezoneOffsetMatch[1] : null;

        if (offsetString === '+03:00') {
            timezoneAbbreviation = '(بتوقيت جدة)'; // SAST (Saudi Arabia Standard Time)
        } else if (offsetString === '+02:00') {
            if (isoString.includes("الدوري الإسباني") || isoString.includes("الدوري الألماني") || isoString.includes("الدوري الفرنسي") || isoString.includes("دوري أبطال أوروبا")) {
                timezoneAbbreviation = '(بتوقيت أوروبا/صيفي)'; // CEST for European leagues
            } else {
                timezoneAbbreviation = '(بتوقيت القاهرة)'; // If it's a non-DST Egyptian time or a generic +02
            }
        } else if (offsetString === '+01:00') {
            timezoneAbbreviation = '(بتوقيت لندن)'; // BST (British Summer Time)
        } else if (offsetString === '+00:00') {
            timezoneAbbreviation = '(بتوقيت جرينتش)'; // GMT/UTC
        } else {
            // Fallback for unhandled offsets or if offset is missing
            timezoneAbbreviation = '(توقيت محلي)'; // Or try to deduce from browser's locale if desired
        }

        return `${formattedDatePart}، ${formattedTimePart} ${timezoneAbbreviation}`;
    };

    /**
     * Attempts to open a URL in a new tab without hijacking the current one.
     * This is the most reliable way to handle ads that may try to open in the current tab.
     * @param {string} url - The URL to open.
     */
    const openInNewTab = (url) => {
        try {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.display = 'none'; // Hide the link from the user
            document.body.appendChild(link); // Must be in DOM to click
            link.click();
            link.remove();
        } catch (e) {
            console.error("Error opening ad in new tab:", e);
        }
    };


    /**
     * Updates the page's SEO meta tags dynamically.
     * @param {string} title - Page title.
     * @param {string} description - Meta description.
     * @param {string} keywords - Meta keywords.
     * @param {string} url - Canonical URL.
     * @param {string} [image=''] - Open Graph/Twitter image URL.
     * @param {string} [imageAlt=''] - Open Graph image alt text.
     */
    const updateSEO = (title, description, keywords, url, image = '', imageAlt = '') => {
        dynamicTitle.textContent = title;
        dynamicDescription.setAttribute('content', description);
        dynamicKeywords.setAttribute('content', keywords);
        dynamicCanonical.setAttribute('href', url);

        dynamicOgTitle.setAttribute('content', title);
        dynamicOgDescription.setAttribute('content', description);
        dynamicOgUrl.setAttribute('content', url);
        // Using a generic image path that does not contain 'ultimate-pitch'
        dynamicOgImage.setAttribute('content', image || "https://i.ibb.co/Lznx7Dcb/photo-6039465033634793751-y-1.jpg");
        dynamicOgImageAlt.setAttribute('content', imageAlt || title);
        dynamicOgType.setAttribute('content', 'website'); // Default, can be 'article', 'video.other'

        dynamicTwitterTitle.setAttribute('content', title);
        dynamicTwitterDescription.setAttribute('content', description);
        dynamicTwitterUrl.setAttribute('content', url);
        // Using a generic image path that does not contain 'ultimate-pitch'
        dynamicTwitterImage.setAttribute('content', image || "https://i.ibb.co/Lznx7Dcb/photo-6039465033634793751-y-1.jpg");
        dynamicTwitterCard.setAttribute('content', 'summary_large_image');
    };

    /**
     * Generates and updates JSON-LD structured data for SEO.
     * @param {object} data - The data object (match or news).
     * @param {string} viewName - The current view name.
     */
    const generateJsonLdSchema = (data, viewName) => {
        let schema = {};
        const siteUrl = window.location.origin + '/';

        if (viewName === 'match-details' && data && data.type === 'match') {
            schema = {
                "@context": "https://schema.org",
                "@type": "SportsEvent",
                "name": data.title,
                "description": data.short_description,
                "startDate": data.date_time,
                "location": {
                    "@type": "Place",
                    "name": data.stadium
                },
                "competitor": [
                    {
                        "@type": "SportsTeam",
                        "name": data.home_team,
                        "logo": data.home_team_logo
                    },
                    {
                        "@type": "SportsTeam",
                        "name": data.away_team,
                        "logo": data.away_team_logo
                    }
                ],
                "sport": "Football",
                "eventStatus": `https://schema.org/EventStatus/${data.status === 'Live' ? 'EventScheduled' : data.status === 'Finished' ? 'EventEnded' : 'EventScheduled'}`,
                "image": data.thumbnail,
                "url": `${siteUrl}#match-${data.id}`
            };
            if (data.score) {
                schema.result = data.score;
            }
            if (data.commentators && data.commentators.length > 0) {
                schema.performer = data.commentators.map(c => ({
                    "@type": "Person",
                    "name": c
                }));
            }
            if (data.channel_info && data.channel_info.length > 0) {
                schema.broadcastOfEvent = data.channel_info.map(channel => ({
                    "@type": "BroadcastService",
                    "name": channel.name,
                    "url": channel.link
                }));
            }
        } else if (viewName === 'news-details' && data && data.type === 'news') { // Assuming a news details view might exist
            schema = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": data.title,
                "image": [data.article_image],
                "datePublished": data.date_time,
                "dateModified": data.date_time,
                "author": {
                    "@type": "Person",
                    "name": "فريق كورة لايف" // Updated publisher author name
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "كورة لايف", // Removed "Ultimate Pitch"
                    "logo": {
                        "@type": "ImageObject",
                        // Updated logo URL to a generic one or removed specific mention
                        "url": "https://i.ibb.co/Lznx7Dcb/photo-6039465033634793751-y-1.jpg"
                    }
                },
                "description": data.short_description,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": data.article_url
                }
            };
        } else if (viewName === 'home') {
            schema = {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "كورة لايف", // Removed "Ultimate Pitch"
                "url": siteUrl,
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${siteUrl}?q={search_term_string}`,
                    "queryInput": "required name=search_term_string"
                }
            };
        } else if (['live', 'upcoming', 'highlights', 'search-results'].includes(viewName)) {
            schema = {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": dynamicTitle.textContent,
                "description": dynamicDescription.getAttribute('content'),
                "url": dynamicCanonical.getAttribute('href')
            };
        }

        jsonLdSchema.textContent = JSON.stringify(schema, null, 2);
    };

    /**
     * Lazy loads images using Intersection Observer or native loading.
     * Applied to images with data-src and 'lazy' class.
     * Added placeholder src for better UX during loading.
     */
    const lazyLoadImages = () => {
        const lazyImages = document.querySelectorAll('img.lazy[data-src]');

        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading supported
            lazyImages.forEach((img) => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
                img.onload = () => img.classList.add('loaded');
            });
        } else if ('IntersectionObserver' in window) {
            // Fallback to Intersection Observer
            let lazyImageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const lazyImage = entry.target;
                        lazyImage.src = lazyImage.dataset.src;
                        lazyImage.removeAttribute('data-src');
                        lazyImage.classList.remove('lazy');
                        lazyImage.onload = () => lazyImage.classList.add('loaded');
                        observer.unobserve(lazyImage);
                    }
                });
            }, {
                rootMargin: '0px 0px 200px 0px' // Load images when 200px from viewport
            });

            lazyImages.forEach((lazyImage) => {
                lazyImageObserver.observe(lazyImage);
            });
        } else {
            // Fallback for browsers that don't support Intersection Observer (load all immediately)
            lazyImages.forEach((img) => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
            });
        }
    };

    /**
     * Creates a match card HTML element.
     * @param {object} match - Match data object.
     * @returns {HTMLElement} The created match card element.
     */
    const createMatchCard = (match) => {
        const card = document.createElement('div');
        card.classList.add('match-card', match.status.toLowerCase());
        card.dataset.matchId = match.id;
        card.dataset.type = 'match';

        let statusText = '';
        let statusClass = '';
        let timeDisplay = '';
        let scoreOrVs = '<span>vs</span>';

        if (match.status === 'Live') {
            statusText = 'مباشر';
            statusClass = 'live-status';
            timeDisplay = 'الآن';
        } else if (match.status === 'Finished') {
            statusText = 'انتهت';
            statusClass = 'finished-status';
            timeDisplay = formatDateTime(match.date_time);
            scoreOrVs = match.score ? `<span>${match.score}</span>` : '<span>-</span>';
        } else if (match.status === 'Upcoming') {
            statusText = 'قريباً';
            statusClass = 'upcoming-status';
            timeDisplay = formatDateTime(match.date_time);
        }

        card.innerHTML = `
            <div class="match-header">
                <span class="match-status ${statusClass}">${statusText}</span>
                <span class="match-time">${timeDisplay}</span>
            </div>
            <div class="match-teams">
                <div class="team home-team">
                    <span>${match.home_team}</span>
                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="${match.home_team_logo}" alt="شعار ${match.home_team}" class="lazy" loading="lazy" width="48" height="48">
                </div>
                <div class="vs">${scoreOrVs}</div>
                <div class="team away-team">
                    <span>${match.away_team}</span>
                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="${match.away_team_logo}" alt="شعار ${match.away_team}" class="lazy" loading="lazy" width="48" height="48">
                </div>
            </div>
            <div class="match-league">
                <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="${match.league_logo}" alt="شعار ${match.league_name}" class="lazy" loading="lazy" width="32" height="32">
                <span>${match.league_name}</span>
            </div>
            ${match.channel_info && match.channel_info.length > 0 && match.status !== 'Finished' ?
                `<div class="match-channels"><span>القنوات: ${match.channel_info.map(c => c.name).join(', ')}</span></div>` : ''}
            <div class="match-details-btn">
                <a href="#match-${match.id}" class="btn btn-tertiary" data-match-id="${match.id}" data-type="match">عرض التفاصيل <i class="fas fa-info-circle"></i></a>
            </div>
        `;
        return card;
    };

    /**
     * Creates a news card HTML element.
     * @param {object} news - News data object.
     * @returns {HTMLElement} The created news card element.
     */
    const createNewsCard = (news) => {
        const card = document.createElement('div');
        card.classList.add('news-card');
        card.dataset.newsId = news.id;
        card.dataset.type = 'news';
        // Use data-src for lazy loading thumbnail, along with native loading="lazy"
        // IMPORTANT: Ensure news.article_url ALWAYS opens in a new tab to avoid self-redirection.
        // The rel="noopener noreferrer" is also crucial for security and performance.
        card.innerHTML = `
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="${news.thumbnail}" alt="صورة خبر ${news.title}" class="lazy" loading="lazy" width="250" height="150">
            <div class="news-card-content">
                <h3>${news.title}</h3>
                <p>${news.short_description}</p>
                <span class="news-date">${formatDateTime(news.date_time)}</span>
                <a href="${news.article_url}" target="_blank" rel="noopener noreferrer" class="btn btn-tertiary">اقرأ المزيد <i class="fas fa-arrow-left"></i></a>
            </div>
        `;
        return card;
    };

    /**
     * Dynamically injects a script tag into the head with given attributes.
     * @param {string} src The script URL.
     * @param {object} attributes Key-value pairs of attributes to set.
     */
    const injectScript = (src, attributes = {}) => {
        const script = document.createElement('script');
        script.src = src;
        for (const key in attributes) {
            script.setAttribute(key, attributes[key]);
        }
        document.head.appendChild(script);
    };

    /**
     * Renders items into a specified grid container with pagination.
     * @param {Array<object>} items - Array of data items (matches or news).
     * @param {HTMLElement} container - The HTML container element to render into.
     * @param {Function} cardCreator - Function to create an individual card (createMatchCard or createNewsCard).
     * @param {number} page - Current page number for pagination.
     * @param {HTMLElement} [emptyStateElement=null] - Optional reference to the empty state div.
     * @param {HTMLElement} [paginationControlsElement=null] - Optional reference to the pagination controls div.
     * @param {string} [viewNameForAd=''] - Current view name, used for ad placement logic
     */
    const renderGrid = (items, container, cardCreator, page, emptyStateElement = null, paginationControlsElement = null, viewNameForAd = '') => {
        if (!container) {
            console.error(`renderGrid: Target container is null or undefined. This indicates an issue with template cloning or element selection. Container expected: ${container?.id || 'N/A'}`);
            return;
        }
        container.innerHTML = ''; // Clear previous content

        if (items.length === 0) {
            if (emptyStateElement) emptyStateElement.style.display = 'block';
            if (paginationControlsElement) paginationControlsElement.style.display = 'none';
            return;
        } else {
            if (emptyStateElement) emptyStateElement.style.display = 'none';
            if (paginationControlsElement) paginationControlsElement.style.display = 'flex';
        }

        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedItems = items.slice(startIndex, endIndex);

        paginatedItems.forEach((item, index) => {
            const cardElement = cardCreator(item);
            if (cardElement instanceof HTMLElement) {
                container.appendChild(cardElement);

                // Insert Native Async ad strategically
                if (viewNameForAd && ['home', 'live', 'upcoming', 'highlights', 'search-results', 'news'].includes(viewNameForAd)) {
                    // Place Native Async ad after every 3rd card, but not on the last card to avoid awkward placement
                    // and only if it's not the last page with fewer than 3 items remaining
                    if ((index + 1) % 3 === 0 && (index + 1) < paginatedItems.length) {
                        const nativeAdWrapper = document.createElement('div');
                        nativeAdWrapper.className = 'native-ad-wrapper'; // A wrapper for styling and to contain the ad dynamically

                        // Create a unique ID for the ad container to ensure separate ad rendering
                        const dynamicAdContainerId = `container-b63334b55ca510415eee91e8173dc2d8-${viewNameForAd}-${page}-${index}`;
                        const adPlaceholderDiv = document.createElement('div');
                        adPlaceholderDiv.id = dynamicAdContainerId;
                        adPlaceholderDiv.className = 'native-ad-placeholder'; // Class for your CSS styling

                        nativeAdWrapper.appendChild(adPlaceholderDiv);
                        container.appendChild(nativeAdWrapper);

                        // No direct script injection here. The main ad script loaded once will populate these divs.
                    }
                }
            } else {
                console.warn('cardCreator did not return an HTMLElement for item:', item);
            }
        });

        // Update pagination button states (pagination controls are now display: none in CSS, so this won't be visible)
        if (paginationControlsElement) {
            const prevBtn = paginationControlsElement.querySelector('.btn-page.prev');
            const nextBtn = paginationControlsElement.querySelector('.btn-page.next');
            if (prevBtn) prevBtn.disabled = page === 1;
            if (nextBtn) nextBtn.disabled = endIndex >= items.length;
        }

        // Apply lazy loading to newly rendered images
        lazyLoadImages();
    };


    // ======== View Management & Content Rendering ========

    /**
     * Main function to switch between different sections (views) of the application.
     * @param {string} viewName - The name of the view to switch to (e.g., 'home', 'live', 'match-details').
     * @param {string|number} [dataId=null] - Optional ID for specific item details (e.g., match ID).
     */
    const switchView = (viewName, dataId = null) => {
        currentView = viewName;

        // Hide all main content sections initially
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active-view');
            section.style.display = 'none';
        });

        // Deactivate all nav links and activate the current one
        navLinks.forEach(link => link.classList.remove('active'));
        const activeNavLink = document.querySelector(`.nav-link[data-target-view="${viewName}"]`);
        if (activeNavLink) activeNavLink.classList.add('active');
        // Close mobile menu if open
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');

        // Initial SEO values, which will be updated below based on the view
        let pageTitle = "";
        let pageDescription = "";
        let pageKeywords = "";
        let pageUrl = window.location.origin + '/';
        let ogImage = "https://i.ibb.co/Lznx7Dcb/photo-6039465033634793751-y-1.jpg"; // Default image
        let ogImageAlt = "كورة لايف | بث مباشر لمباريات كرة القدم"; // Default image alt
        let jsonLdData = {}; // Data for schema markup

        let targetSectionClone; // Holds the cloned template content's root element

        // Render content based on the viewName
        if (viewName === 'home') {
            const template = document.getElementById('home-view-template');
            if (!template) {
                console.error("ERROR: The <template id='home-view-template'> element was not found in the DOM. Ensure it's in index.html.");
                contentDisplay.innerHTML = '<p class="error-message">عذراً، حدث خطأ في تحميل المحتوى الأساسي للموقع (قالب الصفحة الرئيسية غير موجود).</p>';
                return;
            }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;

            if (!targetSectionClone) {
                console.error("ERROR: The cloned content of 'home-view-template' is empty or does not have a first element child. Check the template structure in index.html.");
                contentDisplay.innerHTML = '<p class="error-message">عذراً، لم يتم العثور على القسم الرئيسي في القالب (قالب الصفحة الرئيسية فارغ).</p>';
                return;
            }

            // Clear previous content from contentDisplay
            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            // Get references to elements *inside the cloned section*
            const mainGridContainer = targetSectionClone.querySelector('#main-match-grid');
            const homePaginationControls = targetSectionClone.querySelector('.pagination-controls');
            const homeMatchesTitle = targetSectionClone.querySelector('#home-matches-title');

            // Filter for home: Live + Upcoming (Today/Tomorrow) + 2 latest finished + 2 latest news
            const liveMatches = DATA.filter(item => item.type === 'match' && item.status === 'Live');
            const upcomingMatchesTodayTomorrow = DATA.filter(item => {
                if (item.type !== 'match' || item.status !== 'Upcoming') return false;
                const matchDate = new Date(item.date_time);
                return (matchDate >= TODAY_START && matchDate < TOMORROW_START) ||
                               (matchDate >= TOMORROW_START && matchDate < DAY_AFTER_TOMORROW_START);
            }).sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

            const finishedMatches = DATA.filter(item => item.type === 'match' && item.status === 'Finished')
                                             .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))
                                             .slice(0, 2);

            const latestNews = DATA.filter(item => item.type === 'news')
                                             .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))
                                             .slice(0, 2);

            // Filter out any potential non-match/news items before passing to renderGrid
            const itemsToRender = [...liveMatches, ...upcomingMatchesTodayTomorrow, ...latestNews, ...finishedMatches].filter(item => item.type === 'match' || item.type === 'news');

            homeMatchesTitle.textContent = "أبرز المباريات والجديد";
            renderGrid(itemsToRender, mainGridContainer, (item) => {
                if (item.type === 'match') return createMatchCard(item);
                if (item.type === 'news') return createNewsCard(item);
                return null; // Ensure something is returned
            }, currentPage.home, null, homePaginationControls, 'home');

            // SEO values for Home page
            pageTitle = "كورة لايف - بث مباشر للمباريات، جداول، وأخبار كرة القدم حصريًا";
            pageDescription = "كورة لايف: بوابتك الأولى لمشاهدة جميع مباريات كرة القدم مباشرةً وبجودة عالية بدون تقطيع. تابع أحدث الأهداف، الملخصات، وآخر أخبار الدوريات العالمية حصريًا. عش الشغف الكروي معنا!";
            pageKeywords = "كورة لايف، بث مباشر، مباريات اليوم، مشاهدة مباريات، كورة القدم، لايف، اهداف، ملخصات، اخبار الكورة، جدول المباريات، دوريات عالمية، ماتشات مباشرة، Kora Live، بث حصري، بدون تقطيع، تحليل مباريات، نتائج المباريات";
            pageUrl = window.location.origin + '/';
            // jsonLdData is handled directly in generateJsonLdSchema for the 'home' view
            // No need to explicitly set ogImage and ogImageAlt here as they have default values in updateSEO
            // jsonLdData will be set via generateJsonLdSchema
            jsonLdData = { "@type": "WebSite", "name": "كورة لايف", "url": pageUrl };


        } else if (viewName === 'live') {
            const template = document.getElementById('live-matches-template');
            if (!template) { console.error("ERROR: The 'live-matches-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب المباريات المباشرة غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'live-matches-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب المباريات المباشرة فارغ.</p>'; return; }

            // Clear all current children of contentDisplay
            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const liveGridContainer = targetSectionClone.querySelector('#live-match-grid');
            const liveEmptyState = targetSectionClone.querySelector('#live-empty-state');
            const livePaginationControls = targetSectionClone.querySelector('.pagination-controls');

            const itemsToRender = DATA.filter(item => item.type === 'match' && item.status === 'Live');
            renderGrid(itemsToRender, liveGridContainer, createMatchCard, currentPage.live, liveEmptyState, livePaginationControls, 'live');

            // SEO values for Live Matches page
            pageTitle = "كورة لايف: مباريات كرة القدم مباشرة الآن | بث مباشر";
            pageDescription = "شاهد جميع مباريات كرة القدم التي تبث مباشرة الآن بجودة عالية. تابع ديربيات الكرة العالمية والمحلية لحظة بلحظة.";
            pageKeywords = "مباريات مباشرة، بث مباشر، كورة لايف، شاهد الآن، كرة قدم لايف، مشاهدة مباريات، بث مجاني، الدوري المصري مباشر، الدوري السعودي مباشر";
            pageUrl = window.location.origin + '/live';


        } else if (viewName === 'upcoming') {
            const template = document.getElementById('upcoming-matches-template');
            if (!template) { console.error("ERROR: The 'upcoming-matches-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب المباريات القادمة غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'upcoming-matches-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب المباريات القادمة فارغ.</p>'; return; }

            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const upcomingGridContainer = targetSectionClone.querySelector('#upcoming-match-grid');
            const upcomingEmptyState = targetSectionClone.querySelector('#upcoming-empty-state');
            const upcomingPaginationControls = targetSectionClone.querySelector('.pagination-controls');


            const filterBtns = targetSectionClone.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filterValue === currentFilter.upcoming) {
                    btn.classList.add('active');
                }
                btn.onclick = (e) => {
                    e.preventDefault();
                    filterBtns.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    currentFilter.upcoming = e.target.dataset.filterValue;
                    currentPage.upcoming = 1;
                    switchView('upcoming');
                };
            });

            let filteredUpcoming = DATA.filter(item => item.type === 'match' && item.status === 'Upcoming');

            if (currentFilter.upcoming === 'today') {
                filteredUpcoming = filteredUpcoming.filter(item => {
                    const matchDate = new Date(item.date_time);
                    return matchDate >= TODAY_START && matchDate < TOMORROW_START;
                });
            } else if (currentFilter.upcoming === 'tomorrow') {
                filteredUpcoming = filteredUpcoming.filter(item => {
                    const matchDate = new Date(item.date_time);
                    return matchDate >= TOMORROW_START && matchDate < DAY_AFTER_TOMORROW_START;
                });
            }
            filteredUpcoming.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

            renderGrid(filteredUpcoming, upcomingGridContainer, createMatchCard, currentPage.upcoming, upcomingEmptyState, upcomingPaginationControls, 'upcoming');

            // SEO values for Upcoming Matches page
            pageTitle = "كورة لايف: مواعيد مباريات كرة القدم القادمة | جدول المباريات";
            pageDescription = "اكتشف مواعيد مباريات كرة القدم القادمة في جميع الدوريات والبطولات الكبرى. لا تفوت أي مباراة حاسمة!";
            pageKeywords = "كورة لايف، مواعيد مباريات، مباريات اليوم، مباريات الغد، جدول المباريات، كرة قدم قادمة، دوري أبطال أوروبا، الدوري الإسباني، الدوري الإنجليزي";
            pageUrl = window.location.origin + '/upcoming';


        } else if (viewName === 'highlights') {
            const template = document.getElementById('highlights-template');
            if (!template) { console.error("ERROR: The 'highlights-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب الملخصات غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'highlights-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب الملخصات فارغ.</p>'; return; }

            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const highlightsGridContainer = targetSectionClone.querySelector('#highlights-grid');
            const highlightsEmptyState = targetSectionClone.querySelector('#highlights-empty-state');
            const highlightsPaginationControls = targetSectionClone.querySelector('.pagination-controls');

            const itemsToRender = DATA.filter(item => item.type === 'match' && item.highlights_url);
            itemsToRender.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
            renderGrid(itemsToRender, highlightsGridContainer, createMatchCard, currentPage.highlights, highlightsEmptyState, highlightsPaginationControls, 'highlights');

            // SEO values for Highlights page
            pageTitle = "كورة لايف: أهداف وملخصات المباريات | أبرز اللقطات";
            pageDescription = "شاهد أهداف جميع المباريات وملخصات كاملة لأبرز اللقاءات في الدوريات والبطولات الكبرى. استمتع بأجمل اللحظات الكروية.";
            pageKeywords = "كورة لايف، أهداف المباريات، ملخصات كرة القدم، أهداف اليوم، لقطات حاسمة، أفضل الأهداف، ملخصات الدوري الإسباني، ملخصات الدوري الإنجليزي";
            pageUrl = window.location.origin + '/highlights';


        } else if (viewName === 'news') {
            const template = document.getElementById('news-template');
            if (!template) { console.error("ERROR: The 'news-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب الأخبار غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'news-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب الأخبار فارغ.</p>'; return; }

            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const newsGridContainer = targetSectionClone.querySelector('#news-grid');
            const newsEmptyState = targetSectionClone.querySelector('#news-empty-state');
            const newsPaginationControls = targetSectionClone.querySelector('.pagination-controls');

            const itemsToRender = DATA.filter(item => item.type === 'news');
            itemsToRender.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
            renderGrid(itemsToRender, newsGridContainer, createNewsCard, currentPage.news, newsEmptyState, newsPaginationControls, 'news');

            // SEO values for News page
            pageTitle = "كورة لايف: آخر أخبار كرة القدم | تحديثات حصرية";
            pageDescription = "تابع آخر أخبار كرة القدم العالمية والمحلية، انتقالات اللاعبين، تحديثات الأندية، وتحليلات حصرية لأبرز الأحداث الكروية.";
            pageKeywords = "كورة لايف، أخبار كرة قدم، انتقالات اللاعبين، أخبار ريال مدريد، أخبار ليفربول، أخبار مبابي، تحديثات رياضية، أخبار الدوري الإنجليزي، أخبار الدوري الإسباني";
            pageUrl = window.location.origin + '/news';


        } else if (viewName === 'match-details' && dataId) {
            const match = DATA.find(item => item.type === 'match' && item.id === parseInt(dataId));
            if (match) {
                const template = document.getElementById('match-details-view-template');
                if (!template) { console.error("ERROR: The 'match-details-view-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب تفاصيل المباراة غير موجود.</p>'; return; }
                targetSectionClone = document.importNode(template.content, true).firstElementChild;
                if (!targetSectionClone) { console.error("ERROR: Cloned content of 'match-details-view-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب تفاصيل المباراة فارغ.</p>'; return; }

                contentDisplay.innerHTML = ''; // Clear all current children of contentDisplay
                contentDisplay.appendChild(targetSectionClone);
                targetSectionClone.style.display = 'block';
                targetSectionClone.classList.add('active-view');

                const matchDetailsTitleElement = targetSectionClone.querySelector('#match-details-title-element');

                const matchPlayerContainer = targetSectionClone.querySelector('#match-player-container');
                const videoOverlay = targetSectionClone.querySelector('#video-overlay');
                const overlayThumbnail = targetSectionClone.querySelector('#overlay-thumbnail');
                const loadingSpinner = targetSectionClone.querySelector('#video-loading-spinner');

                const suggestedMatchGrid = targetSectionClone.querySelector('#suggested-match-grid');
                const backToHomeBtn = targetSectionClone.querySelector('#back-to-home-btn'); // Get the back button within the cloned template

                // Add event listener for the back button, if it exists
                if (backToHomeBtn) {
                    backToHomeBtn.onclick = (e) => {
                        e.preventDefault();
                        switchView('home');
                        window.history.pushState({ view: 'home' }, '', '#home');
                    };
                }

                matchDetailsTitleElement.textContent = match.title;

                // Video Player & Overlay logic
                matchPlayerContainer.innerHTML = '';
                overlayThumbnail.src = match.thumbnail;
                videoOverlay.style.display = 'flex';
                loadingSpinner.style.display = 'none';

                let hlsInstance = null; // To keep track of the Hls instance

                // Function to initialize or re-initialize the HLS player
                const initializeHlsPlayer = (streamUrl) => {
                    // Destroy existing HLS instance if any
                    if (hlsInstance) {
                        hlsInstance.destroy();
                        hlsInstance = null;
                    }
                    matchPlayerContainer.innerHTML = ''; // Clear player container

                    const videoElement = document.createElement('video');
                    videoElement.controls = true;
                    videoElement.autoplay = true; // Auto-play after user interaction
                    videoElement.setAttribute('preload', 'auto');
                    videoElement.style.width = '100%';
                    videoElement.style.height = '100%';
                    videoElement.style.backgroundColor = 'black'; // Prevent flicker
                    videoElement.setAttribute('playsinline', ''); // Important for mobile browsers
                    matchPlayerContainer.appendChild(videoElement);

                    if (Hls.isSupported()) {
                        hlsInstance = new Hls({
                            autoStartLoad: true,       // تبدأ التحميل تلقائيا
                            startPosition: -1,         // تبدأ من أحدث جزء متاح
                            // ABR (Adaptive Bitrate) settings
                            capLevelToPlayerSize: true, // تكييف جودة البث لحجم المشغل
                            maxBufferLength: 30,       // أقصى طول للبفر بالثواني (يمنع التخزين المؤقت الزائد)
                            maxMaxBufferLength: 60,      // أقصى حد أقصى للبفر
                            minBufferLength: 5,        // الحد الأدنى للبفر قبل التشغيل
                            maxBufferHole: 0.5,        // أقصى فجوة مسموح بها في البفر
                            // Network / retry settings
                            liveSyncDurationCount: 3,  // عدد الشرائح لمزامنة البث المباشر
                            enableWorker: true,        // استخدم العاملين على الويب لتحسين الأداء
                            // Increased retry attempts and delays for robustness
                            fragLoadingMaxRetry: 10,   // زيادة عدد مرات إعادة محاولة تحميل الأجزاء
                            fragLoadingRetryDelay: 1000, // تأخير أطول بين المحاولات
                            fragLoadingMaxRetryTimeout: 30000, // وقت أطول لإعادة محاولات تحميل الأجزاء (30 ثانية)
                            manifestLoadingMaxRetry: 5,
                            manifestLoadingRetryDelay: 1000,
                            manifestLoadingMaxRetryTimeout: 15000,
                            levelLoadingMaxRetry: 5,
                            levelLoadingRetryDelay: 1000,
                            levelLoadingMaxRetryTimeout: 15000
                        });

                        hlsInstance.loadSource(streamUrl);
                        hlsInstance.attachMedia(videoElement);

                        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                            videoElement.play().catch(e => console.warn("Autoplay was prevented:", e));
                            loadingSpinner.style.display = 'none';
                            // Remove any temporary error messages
                            const existingTempMsg = matchPlayerContainer.querySelector('.temporary-error-message');
                            if (existingTempMsg) existingTempMsg.remove();
                        });

                        // --- Improved Error Handling for HLS.js ---
                        // Use a debounce for fatal error recovery to prevent rapid re-initialization
                        let hlsFatalErrorTimeout = null;
                        const REINITIALIZE_DELAY_MS = 3000; // 3 seconds before trying to re-initialize

                        const handleHlsError = (event, data) => {
                            console.error('HLS.js error:', data);
                            loadingSpinner.style.display = 'none';

                            // Remove any existing temporary error messages before adding a new one
                            const existingTempMsg = matchPlayerContainer.querySelector('.temporary-error-message');
                            if (existingTempMsg) existingTempMsg.remove();

                            let errorMsg = 'حدث خطأ غير معروف في البث. يرجى المحاولة لاحقاً.';

                            if (data.fatal) { // إذا كان الخطأ حرج (Fatal Error)
                                switch (data.type) {
                                    case Hls.ErrorTypes.NETWORK_ERROR:
                                        errorMsg = 'مشكلة في الاتصال بالبث (خطأ شبكة). جارى المحاولة...';
                                        console.warn('Fatal network error, attempting to recover HLS stream...');
                                        hlsInstance.startLoad(); // Try to resume loading
                                        break;
                                    case Hls.ErrorTypes.MEDIA_ERROR:
                                        errorMsg = 'مشكلة في تشغيل الفيديو (خطأ في الوسائط). جارى إعادة ضبط البث...';
                                        console.warn('Fatal media error, trying to recover HLS stream...');
                                        hlsInstance.recoverMediaError();
                                        break;
                                    default:
                                        errorMsg = 'خطأ حرج في البث. جارى إعادة تشغيل البث...';
                                        console.warn('Other fatal HLS error, attempting to recreate player...');
                                        // Clear any previous re-initialization timeout
                                        if (hlsFatalErrorTimeout) {
                                            clearTimeout(hlsFatalErrorTimeout);
                                        }
                                        hlsFatalErrorTimeout = setTimeout(() => {
                                            // Completely destroy and re-initialize the player
                                            initializeHlsPlayer(match.embed_url);
                                        }, REINITIALIZE_DELAY_MS);
                                        break;
                                }
                            } else {
                                // الأخطاء غير الحرجة (Non-fatal errors)
                                errorMsg = `مشكلة بسيطة في البث: ${data.details}.`;
                                console.warn('Non-fatal HLS.js error:', data);
                            }
                            // عرض رسالة الخطأ للمستخدم مؤقتًا
                            const tempErrorDiv = document.createElement('p');
                            tempErrorDiv.classList.add('temporary-error-message');
                            tempErrorDiv.textContent = errorMsg;
                            matchPlayerContainer.appendChild(tempErrorDiv);

                            setTimeout(() => {
                                if (tempErrorDiv && tempErrorDiv.parentNode) {
                                    tempErrorDiv.remove();
                                }
                            }, 5000); // Remove message after 5 seconds
                        };
                        hlsInstance.on(Hls.Events.ERROR, handleHlsError);
                        // --- End of Improved Error Handling ---

                    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                        // Native HLS support (Safari on iOS/macOS)
                        videoElement.src = streamUrl;
                        videoElement.play().catch(e => console.warn("Autoplay was prevented (native HLS):", e));
                        loadingSpinner.style.display = 'none';
                        // Remove any temporary error messages
                        const existingTempMsg = matchPlayerContainer.querySelector('.temporary-error-message');
                        if (existingTempMsg) existingTempMsg.remove();
                    } else {
                        // Browser does not support HLS at all
                        loadingSpinner.style.display = 'none';
                        matchPlayerContainer.innerHTML = '<p class="error-message">متصفحك لا يدعم تشغيل البث المباشر (HLS). يرجى استخدام متصفح أحدث يدعم HLS.</p>';
                    }
                };

                videoOverlay.onclick = () => {
                    loadingSpinner.style.display = 'block';
                    videoOverlay.style.display = 'none';

                    const currentTime = Date.now();
                    // استخدام openInNewTab لضمان فتح الإعلان في تبويبة جديدة
                    if (currentTime - adTriggers.lastDirectLinkTime > DIRECT_LINK_COOLDOWN_MS) {
                        openInNewTab(POPUNDER_AD_URL);
                        adTriggers.lastDirectLinkTime = currentTime;
                    }

                    // *** HLS.js Integration Start ***
                    // Check if the embed_url is an HLS (.m3u8) stream
                    if (match.embed_url && match.embed_url.endsWith('.m3u8')) {
                        initializeHlsPlayer(match.embed_url);
                    } else {
                        // If it's not an HLS stream (e.g., direct MP4 link or iframe)
                        const iframe = document.createElement('iframe');
                        iframe.src = match.embed_url;
                        iframe.allow = "autoplay; fullscreen; picture-in-picture";
                        iframe.frameBorder = "0";
                        iframe.scrolling = "no";
                        // Crucial for security and to prevent iframe content from navigating the parent
                        iframe.setAttribute('referrerpolicy', 'origin');
                        // No 'sandbox' attribute for iframes containing ads unless you specifically know it won't break them.
                        // iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation');
                        iframe.onload = () => {
                            loadingSpinner.style.display = 'none';
                        };
                        iframe.onerror = () => {
                            loadingSpinner.style.display = 'none';
                            matchPlayerContainer.innerHTML = '<p class="error-message">تعذر تحميل البث. يرجى المحاولة لاحقاً.</p>';
                        };
                        matchPlayerContainer.appendChild(iframe);
                    }
                    // *** HLS.js Integration End ***
                };

                const suggestedMatches = DATA.filter(item =>
                    item.type === 'match' &&
                    item.id !== match.id &&
                    (item.league_id === match.league_id || item.category === match.category) &&
                    (item.status === 'Upcoming' || item.status === 'Live')
                ).slice(0, 4);

                renderGrid(suggestedMatches, suggestedMatchGrid, createMatchCard, 1);

                // SEO values for Match Details page
                pageTitle = `${match.title} | كورة لايف بث مباشر وتفاصيل المباراة`;
                pageDescription = match.short_description;
                pageKeywords = [...(match.tags || []), "مشاهدة مباراة", "بث مباشر", "ملخص المباراة", match.home_team, match.away_team, match.league_name, "كورة لايف"].join(', ');
                pageUrl = `${window.location.origin}/#match-${match.id}`;
                ogImage = match.thumbnail;
                ogImageAlt = `ملصق مباراة ${match.title}`;
                jsonLdData = match;

            } else {
                console.warn(`Match with ID ${dataId} not found. Redirecting to home.`);
                switchView('home');
                window.history.pushState({ view: 'home' }, '', '#home');
                return;
            }
        } else if (viewName === 'search-results') {
            const template = document.getElementById('home-view-template'); // Re-using home template for search results
            if (!template) { console.error("ERROR: The 'home-view-template' template for search results was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب البحث غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'home-view-template' for search results is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب البحث فارغ.</p>'; return; }

            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const mainGridContainer = targetSectionClone.querySelector('#main-match-grid');
            const homePaginationControls = targetSectionClone.querySelector('.pagination-controls');
            const searchTitleElement = targetSectionClone.querySelector('#home-matches-title');

            searchTitleElement.textContent = `نتائج البحث عن: "${currentSearchQuery}"`;

            const query = currentSearchQuery.toLowerCase();
            const searchResults = DATA.filter(item => {
                const searchableText = `${item.title} ${item.short_description} ${item.league_name} ${item.home_team || ''} ${item.away_team || ''} ${item.commentators ? item.commentators.join(' ') : ''} ${item.tags ? item.tags.join(' ') : ''}`.toLowerCase();
                return searchableText.includes(query);
            });

            renderGrid(searchResults, mainGridContainer, (item) => {
                if (item.type === 'match') return createMatchCard(item);
                if (item.type === 'news') return createNewsCard(item);
                return null; // Ensure something is returned
            }, currentPage.search, null, homePaginationControls, 'search-results');

            // SEO values for Search Results page
            pageTitle = `نتائج البحث عن "${currentSearchQuery}" | كورة لايف`;
            pageDescription = `نتائج البحث عن "${currentSearchQuery}" في مباريات كرة القدم وآخر الأخبار على كورة لايف.`;
            pageKeywords = `بحث كرة قدم، ${currentSearchQuery}, نتائج بحث، مباريات، أخبار، كورة لايف`;
            pageUrl = `${window.location.origin}/search?q=${encodeURIComponent(currentSearchQuery)}`;
            jsonLdData = { "@type": "SearchResultsPage", "name": pageTitle, "url": pageUrl };
        }

        // Always call updateSEO and generateJsonLdSchema at the end of switchView
        updateSEO(pageTitle, pageDescription, pageKeywords, pageUrl, ogImage, ogImageAlt);
        generateJsonLdSchema(jsonLdData, viewName);
    };


    // ======== Event Listeners ========

    // Delegated event listener for general clicks on the body
    document.body.addEventListener('click', (e) => {
        // Pop-under ad block (on any click) is now commented out by default.
        // It caused issues with core functionality.
        /*
        const currentTime = Date.now();
        if (!adTriggers.popunderOpened || (currentTime - adTriggers.lastDirectLinkTime > DIRECT_LINK_COOLDOWN_MS)) {
            openInNewTab(POPUNDER_AD_URL);
            adTriggers.popunderOpened = true;
            adTriggers.lastDirectLinkTime = currentTime;
        }
        */

        const navLink = e.target.closest('.nav-link');
        const homeLogo = e.target.closest('#home-logo-link');

        if (navLink) {
            e.preventDefault();
            const targetView = navLink.dataset.targetView;
            switchView(targetView);
            window.history.pushState({ view: targetView }, '', `#${targetView}`);
        } else if (homeLogo) {
            e.preventDefault();
            switchView('home');
            window.history.pushState({ view: 'home' }, '', '#home');
        }

        // Click event for the entire match card (or its detail button within)
        const itemCard = e.target.closest('.match-card');
        if (itemCard && itemCard.dataset.type === 'match') { // Ensure it's a match card click
             e.preventDefault(); // Prevent default link behavior if any internal links are clicked
             const itemId = itemCard.dataset.matchId;
             if (itemId) {
                 switchView('match-details', itemId);
                 window.history.pushState({ view: 'match-details', id: itemId }, '', `#match-${itemId}`);
             }
        }
        // News cards link externally, so no special JS handler needed for them beyond their own <a> tag.


        // Toggle mobile menu
        if (e.target.closest('#menu-toggle')) {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        } else if (!mainNav.contains(e.target) && !menuToggle.contains(e.target) && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    // Delegated event listener for pagination buttons within contentDisplay
    contentDisplay.addEventListener('click', (e) => {
        const prevBtn = e.target.closest('.btn-page.prev');
        const nextBtn = e.target.closest('.btn-page.next');

        if (prevBtn || nextBtn) {
            e.preventDefault();
            const viewKey = currentView === 'search-results' ? 'search' : currentView;
            if (prevBtn) {
                currentPage[viewKey] = Math.max(1, currentPage[viewKey] - 1);
            } else if (nextBtn) {
                currentPage[viewKey]++;
            }
            switchView(currentView, null); // Re-render the current view with updated page
        }
    });


    searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            currentSearchQuery = query;
            currentPage.search = 1;
            switchView('search-results');
            // Update URL for search results
            window.history.pushState({ view: 'search-results', query: query }, '', `/search?q=${encodeURIComponent(query)}`);
        } else if (currentView === 'search-results') {
            // If search input is cleared and currently on search results, go to home
            switchView('home');
            window.history.pushState({ view: 'home' }, '', '/');
        }
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        const hash = window.location.hash.substring(1);
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');

        if (hash.startsWith('match-')) {
            const matchId = hash.split('-')[1];
            switchView('match-details', matchId);
        } else if (['home', 'live', 'upcoming', 'highlights', 'news'].includes(hash)) {
            switchView(hash);
        } else if (searchQuery) {
            searchInput.value = searchQuery; // Populate search input if returning to search results via history
            currentSearchQuery = searchQuery;
            switchView('search-results');
        } else {
            // Default to home if no specific hash or search query
            switchView('home');
        }
    });


    // ======== Initialization ========

    const fetchData = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            DATA = await response.json();
            console.log('Data loaded successfully:', DATA);

            // Initial view based on URL hash or search query
            const hash = window.location.hash.substring(1);
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('q');

            if (hash.startsWith('match-')) {
                const matchId = hash.split('-')[1];
                switchView('match-details', matchId);
            } else if (['live', 'upcoming', 'highlights', 'news'].includes(hash)) {
                switchView(hash);
            } else if (searchQuery) {
                searchInput.value = searchQuery;
                currentSearchQuery = searchQuery;
                switchView('search-results');
            } else {
                // Default to home if no specific hash or search query
                switchView('home');
            }

        } catch (error) {
            console.error('Failed to load data:', error);
            contentDisplay.innerHTML = '<p class="error-message">عذراً، تعذر تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.</p>';
        }
    };

    // Load HLS.js library dynamically
    const loadHlsJs = () => {
        return new Promise((resolve, reject) => {
            if (typeof Hls !== 'undefined') {
                resolve();
                return;
            }
            // استخدم hls.js (نسخة أخف) لتحسين الأداء على الأجهزة المختلفة
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.light.min.js';
            script.onload = () => resolve();
            script.onerror = () => {
                console.error("Failed to load hls.js. HLS playback may not work.");
                reject();
            };
            document.head.appendChild(script);
        });
    };

    // Obfuscated Ad Loading Logic for main ad script
    const initializeMainAdScript = () => {
        const adScriptUrlPart1 = "//pl27154385.profitableratecpm.";
        const adScriptUrlPart2 = "com/b63334b55ca510415eee91e8173dc2d8/invoke.js";
        const fullAdScriptUrl = adScriptUrlPart1 + adScriptUrlPart2;

        const existingScript = document.querySelector(`script[src*="${adScriptUrlPart1.substring(2)}"]`);
        if (existingScript) {
            console.log("Main ad script already loaded.");
            return;
        }

        injectScript(fullAdScriptUrl, {
            async: true,
            'data-cfasync': 'false'
        });
    };


    // Fetch data and then load HLS.js and initialize ads
    fetchData().then(() => {
        loadHlsJs();
        // Initialize the main ad script only once after data is loaded and views are ready
        initializeMainAdScript();
    });
});
