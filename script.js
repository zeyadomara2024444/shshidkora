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

    // ======== DOM Elements Cache (Static references) ========
    const contentDisplay = document.getElementById('content-display');
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const menuToggle = document.getElementById('menu-toggle');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const homeLogoLink = document.getElementById('home-logo-link');
    const watchNowBtn = document.getElementById('watch-now-btn');
    const jsonLdSchema = document.getElementById('json-ld-schema');
    const heroSection = document.getElementById('hero-section');

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
             // For +02:00 in July 2025, it's typically CEST for Europe (UTC+2) or EEST for Egypt (UTC+3) if they're still on summertime.
             // Given the examples, the data uses +02:00 for European leagues.
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
        dynamicOgImage.setAttribute('content', image || "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png");
        dynamicOgImageAlt.setAttribute('content', imageAlt || title);
        dynamicOgType.setAttribute('content', 'website'); // Default, can be 'article', 'video.other'

        dynamicTwitterTitle.setAttribute('content', title);
        dynamicTwitterDescription.setAttribute('content', description);
        dynamicTwitterUrl.setAttribute('content', url);
        dynamicTwitterImage.setAttribute('content', image || "https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png");
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
        const schemas = []; // Array to hold multiple schemas

        if (viewName === 'match-details' && data && data.type === 'match') {
            const matchSchema = {
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
                "image": data.thumbnail, // Ensure this is a high-quality image (e.g., 1200px wide)
                "url": `${siteUrl}#match-${data.id}`
            };
            if (data.score) {
                matchSchema.result = data.score;
            }
            if (data.commentators && data.commentators.length > 0) {
                matchSchema.performer = data.commentators.map(c => ({
                    "@type": "Person",
                    "name": c
                }));
            }
            if (data.channel_info && data.channel_info.length > 0) {
                matchSchema.broadcastOfEvent = data.channel_info.map(channel => ({
                    "@type": "BroadcastService",
                    "name": channel.name,
                    "url": channel.link // Assuming link is a valid URL for the channel
                }));
            }
            schemas.push(matchSchema);

            // Add BreadcrumbList schema for match details
            schemas.push({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "الرئيسية",
                        "item": siteUrl + '#home'
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": data.status === 'Live' ? "المباريات المباشرة" : "مواعيد المباريات",
                        "item": siteUrl + (data.status === 'Live' ? '#live' : '#upcoming')
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": data.title,
                        "item": `${siteUrl}#match-${data.id}`
                    }
                ]
            });

        } else if (viewName === 'news-details' && data && data.type === 'news') { // Assuming a news details view might exist
            const newsArticleSchema = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": data.title,
                "image": [data.article_image], // Ensure this is a high-quality image
                "datePublished": data.date_time,
                "dateModified": data.date_time,
                "author": {
                    "@type": "Person",
                    "name": "فريق شاهد كورة"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "شاهد كورة - Ultimate Pitch",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png"
                    }
                },
                "description": data.short_description,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": data.article_url // Assuming news.article_url is the full canonical URL for the news
                }
            };
            schemas.push(newsArticleSchema);

            // Add BreadcrumbList schema for news details (if internal)
            schemas.push({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "الرئيسية",
                        "item": siteUrl + '#home'
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "آخر الأخبار",
                        "item": siteUrl + '#news'
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": data.title,
                        "item": data.article_url // Use the external URL if it leads out
                    }
                ]
            });

        } else if (viewName === 'home') {
            schemas.push({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "شاهد كورة - Ultimate Pitch",
                "url": siteUrl,
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${siteUrl}search?q={search_term_string}`,
                    "queryInput": "required name=search_term_string"
                }
            });
        } else if (['live', 'upcoming', 'highlights', 'news', 'search-results'].includes(viewName)) {
            // General CollectionPage for category views
            schemas.push({
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": dynamicTitle.textContent,
                "description": dynamicDescription.getAttribute('content'),
                "url": dynamicCanonical.getAttribute('href')
            });

            // Add BreadcrumbList for category pages
            let categoryName = '';
            let categoryUrlFragment = '';
            if (viewName === 'live') { categoryName = 'المباريات المباشرة'; categoryUrlFragment = '#live'; }
            else if (viewName === 'upcoming') { categoryName = 'مواعيد المباريات'; categoryUrlFragment = '#upcoming'; }
            else if (viewName === 'highlights') { categoryName = 'الأهداف والملخصات'; categoryUrlFragment = '#highlights'; }
            else if (viewName === 'news') { categoryName = 'آخر الأخبار'; categoryUrlFragment = '#news'; }
            else if (viewName === 'search-results') { categoryName = 'نتائج البحث'; categoryUrlFragment = `search?q=${encodeURIComponent(currentSearchQuery)}`; }

            schemas.push({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "الرئيسية",
                        "item": siteUrl + '#home'
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": categoryName,
                        "item": siteUrl + categoryUrlFragment
                    }
                ]
            });
        }

        // Set the content of the single JSON-LD script tag as an array of schemas
        jsonLdSchema.textContent = JSON.stringify(schemas, null, 2);
    };


    /**
     * Lazy loads images using Intersection Observer.
     * Applied to images with data-src and 'lazy' class.
     */
    const lazyLoadImages = () => {
        const lazyImages = document.querySelectorAll('img.lazy[data-src]');

        if ('IntersectionObserver' in window) {
            let lazyImageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const lazyImage = entry.target;
                        lazyImage.src = lazyImage.dataset.src;
                        lazyImage.removeAttribute('data-src'); // Remove data-src after loading
                        lazyImage.classList.remove('lazy');
                        lazyImage.onload = () => lazyImage.classList.add('loaded'); // Add 'loaded' class for fade-in effect (requires CSS transition)
                        lazyImage.onerror = () => { // Added onerror for lazy images
                            lazyImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 11l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E'; // Simple SVG placeholder
                            lazyImage.alt = 'صورة غير متوفرة';
                            lazyImage.classList.add('error'); // Add error class for specific styling
                        };
                        observer.unobserve(lazyImage); // Stop observing once loaded
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
                img.onload = () => img.classList.add('loaded');
                img.onerror = () => { // Fallback onerror
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 11l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E';
                    img.alt = 'صورة غير متوفرة';
                    img.classList.add('error');
                };
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
        let buttonHtml = '';
        let scoreOrVs = '<span>vs</span>';

        if (match.status === 'Live') {
            statusText = 'مباشر';
            statusClass = 'live-status';
            timeDisplay = 'الآن';
            buttonHtml = `<a href="#match-${match.id}" class="btn btn-primary" data-match-id="${match.id}" data-type="match">شاهد الآن <i class="fas fa-play-circle"></i></a>`;
        } else if (match.status === 'Finished') {
            statusText = 'انتهت';
            statusClass = 'finished-status';
            timeDisplay = formatDateTime(match.date_time);
            scoreOrVs = match.score ? `<span>${match.score}</span>` : '<span>-</span>';
            buttonHtml = `<a href="#match-${match.id}" class="btn btn-secondary" data-match-id="${match.id}" data-type="match">${match.highlights_url ? 'شاهد الملخص' : 'عرض التفاصيل'} <i class="fas ${match.highlights_url ? 'fa-video' : 'fa-info-circle'}"></i></a>`;
        } else if (match.status === 'Upcoming') {
            statusText = 'قريباً';
            statusClass = 'upcoming-status';
            timeDisplay = formatDateTime(match.date_time);
            buttonHtml = `<a href="#match-${match.id}" class="btn btn-secondary" data-match-id="${match.id}" data-type="match">عرض التفاصيل <i class="fas fa-info-circle"></i></a>`;
        }

        // Use data-src for lazy loading and add 'lazy' class
        card.innerHTML = `
            <div class="match-header">
                <span class="match-status ${statusClass}">${statusText}</span>
                <span class="match-time">${timeDisplay}</span>
            </div>
            <div class="match-teams">
                <div class="team home-team">
                    <img data-src="${match.home_team_logo}" alt="شعار ${match.home_team}" class="lazy" width="48" height="48">
                    <span>${match.home_team}</span>
                </div>
                <div class="vs">${scoreOrVs}</div>
                <div class="team away-team">
                    <img data-src="${match.away_team_logo}" alt="شعار ${match.away_team}" class="lazy" width="48" height="48">
                    <span>${match.away_team}</span>
                </div>
            </div>
            <div class="match-league">
                <img data-src="${match.league_logo}" alt="شعار ${match.league_name}" class="lazy" width="32" height="32">
                <span>${match.league_name}</span>
            </div>
            ${match.channel_info && match.channel_info.length > 0 && match.status !== 'Finished' ?
                `<div class="match-channels"><span>القنوات: ${match.channel_info.map(c => c.name).join(', ')}</span></div>` : ''}
            <div class="match-details-btn">
                ${buttonHtml}
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
        // Use data-src for lazy loading thumbnail
        card.innerHTML = `
            <img data-src="${news.thumbnail}" alt="صورة خبر ${news.title}" class="lazy" width="250" height="150">
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
     * Renders items into a specified grid container with pagination.
     * @param {Array<object>} items - Array of data items (matches or news).
     * @param {HTMLElement} container - The HTML container element to render into.
     * @param {Function} cardCreator - Function to create an individual card (createMatchCard or createNewsCard).
     * @param {number} page - Current page number for pagination.
     * @param {HTMLElement} [emptyStateElement=null] - Optional reference to the empty state div.
     * @param {HTMLElement} [paginationControlsElement=null] - Optional reference to the pagination controls div.
     */
    const renderGrid = (items, container, cardCreator, page, emptyStateElement = null, paginationControlsElement = null) => {
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

        paginatedItems.forEach(item => {
            // Ensure cardCreator returns an HTMLElement
            const cardElement = cardCreator(item);
            if (cardElement instanceof HTMLElement) {
                container.appendChild(cardElement);
            } else {
                console.warn('cardCreator did not return an HTMLElement for item:', item);
            }
        });

        // Update pagination button states
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

        // Always hide hero section unless it's the home view
        if (heroSection) { // Check if heroSection exists
            heroSection.style.display = (viewName === 'home') ? 'block' : 'none';
            if (viewName === 'home') {
                heroSection.classList.add('active-view'); // Add active class if it's the home view
            } else {
                heroSection.classList.remove('active-view');
            }
        } else {
            console.error("Hero section element (#hero-section) not found.");
        }


        // Deactivate all nav links and activate the current one
        navLinks.forEach(link => link.classList.remove('active'));
        const activeNavLink = document.querySelector(`.nav-link[data-target-view="${viewName}"]`);
        if (activeNavLink) activeNavLink.classList.add('active');
        // Close mobile menu if open
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');

        let pageTitle = "شاهد كورة: Ultimate Pitch - كل كرة القدم في مكان واحد";
        let pageDescription = "شاهد كورة - ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.";
        let pageKeywords = "شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch";
        let pageUrl = window.location.origin + '/';
        let ogImage = "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png";
        let ogImageAlt = "شاهد كورة | ملعبك النهائي لكرة القدم";
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

            // Clear previous content from contentDisplay (excluding heroSection)
            // Remove all children except heroSection
            Array.from(contentDisplay.children).forEach(child => {
                if (child.id !== 'hero-section') {
                    child.remove();
                }
            });
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
            }, currentPage.home, null, homePaginationControls);


            pageTitle = "شاهد كورة: Ultimate Pitch - كل كرة القدم في مكان واحد";
            pageDescription = "شاهد كورة - ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.";
            pageKeywords = "شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch, مباريات اليوم, بث مباشر الأهلي والزمالك, أخبار مبابي, ملخصات الدوري الإسباني";
            pageUrl = window.location.origin + '/';
            jsonLdData = { "@type": "WebSite", "name": "شاهد كورة - Ultimate Pitch", "url": pageUrl };


        } else if (viewName === 'live') {
            const template = document.getElementById('live-matches-template');
            if (!template) { console.error("ERROR: The 'live-matches-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب المباريات المباشرة غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'live-matches-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب المباريات المباشرة فارغ.</p>'; return; }

            // Clear all current children of contentDisplay except heroSection (if it exists)
            Array.from(contentDisplay.children).forEach(child => {
                if (child.id !== 'hero-section') {
                    child.remove();
                }
            });
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const liveGridContainer = targetSectionClone.querySelector('#live-match-grid');
            const liveEmptyState = targetSectionClone.querySelector('#live-empty-state');
            const livePaginationControls = targetSectionClone.querySelector('.pagination-controls');

            const itemsToRender = DATA.filter(item => item.type === 'match' && item.status === 'Live');
            renderGrid(itemsToRender, liveGridContainer, createMatchCard, currentPage.live, liveEmptyState, livePaginationControls);

            pageTitle = "شاهد كورة: مباريات كرة القدم مباشرة الآن | بث مباشر";
            pageDescription = "شاهد جميع مباريات كرة القدم التي تبث مباشرة الآن بجودة عالية. تابع ديربيات الكرة العالمية والمحلية لحظة بلحظة.";
            pageKeywords = "مباريات مباشرة، بث مباشر، شاهد الآن، كرة قدم لايف، مشاهدة مباريات، بث مجاني، الدوري المصري مباشر، الدوري السعودي مباشر";
            pageUrl = window.location.origin + '/live';


        } else if (viewName === 'upcoming') {
            const template = document.getElementById('upcoming-matches-template');
            if (!template) { console.error("ERROR: The 'upcoming-matches-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب المباريات القادمة غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'upcoming-matches-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب المباريات القادمة فارغ.</p>'; return; }

            Array.from(contentDisplay.children).forEach(child => {
                if (child.id !== 'hero-section') {
                    child.remove();
                }
            });
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

            renderGrid(filteredUpcoming, upcomingGridContainer, createMatchCard, currentPage.upcoming, upcomingEmptyState, upcomingPaginationControls);

            pageTitle = "شاهد كورة: مواعيد مباريات كرة القدم القادمة | جدول المباريات";
            pageDescription = "اكتشف مواعيد مباريات كرة القدم القادمة في جميع الدوريات والبطولات الكبرى. لا تفوت أي مباراة حاسمة!";
            pageKeywords = "مواعيد مباريات، مباريات اليوم، مباريات الغد، جدول المباريات، كرة قدم قادمة، دوري أبطال أوروبا، الدوري الإسباني، الدوري الإنجليزي";
            pageUrl = window.location.origin + '/upcoming';


        } else if (viewName === 'highlights') {
            const template = document.getElementById('highlights-template');
            if (!template) { console.error("ERROR: The 'highlights-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب الملخصات غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'highlights-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب الملخصات فارغ.</p>'; return; }

            Array.from(contentDisplay.children).forEach(child => {
                if (child.id !== 'hero-section') {
                    child.remove();
                }
            });
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const highlightsGridContainer = targetSectionClone.querySelector('#highlights-grid');
            const highlightsEmptyState = targetSectionClone.querySelector('#highlights-empty-state');
            const highlightsPaginationControls = targetSectionClone.querySelector('.pagination-controls');

            const itemsToRender = DATA.filter(item => item.type === 'match' && item.highlights_url);
            itemsToRender.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
            renderGrid(itemsToRender, highlightsGridContainer, createMatchCard, currentPage.highlights, highlightsEmptyState, highlightsPaginationControls);

            pageTitle = "شاهد كورة: أهداف وملخصات المباريات | أبرز اللقطات";
            pageDescription = "شاهد أهداف جميع المباريات وملخصات كاملة لأبرز اللقاءات في الدوريات والبطولات الكبرى. استمتع بأجمل اللحظات الكروية.";
            pageKeywords = "أهداف المباريات، ملخصات كرة القدم، أهداف اليوم، لقطات حاسمة، أفضل الأهداف، ملخصات الدوري الإسباني، ملخصات الدوري الإنجليزي";
            pageUrl = window.location.origin + '/highlights';


        } else if (viewName === 'news') {
            const template = document.getElementById('news-template');
            if (!template) { console.error("ERROR: The 'news-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب الأخبار غير موجود.</p>'; return; }
            targetSectionClone = document.importNode(template.content, true).firstElementChild;
            if (!targetSectionClone) { console.error("ERROR: Cloned content of 'news-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب الأخبار فارغ.</p>'; return; }

            Array.from(contentDisplay.children).forEach(child => {
                if (child.id !== 'hero-section') {
                    child.remove();
                }
            });
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const newsGridContainer = targetSectionClone.querySelector('#news-grid');
            const newsEmptyState = targetSectionClone.querySelector('#news-empty-state');
            const newsPaginationControls = targetSectionClone.querySelector('.pagination-controls');

            const itemsToRender = DATA.filter(item => item.type === 'news');
            itemsToRender.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
            renderGrid(itemsToRender, newsGridContainer, createNewsCard, currentPage.news, newsEmptyState, newsPaginationControls);

            pageTitle = "شاهد كورة: آخر أخبار كرة القدم | تحديثات حصرية";
            pageDescription = "تابع آخر أخبار كرة القدم العالمية والمحلية، انتقالات اللاعبين، تحديثات الأندية، وتحليلات حصرية لأبرز الأحداث الكروية.";
            pageKeywords = "أخبار كرة قدم، انتقالات اللاعبين، أخبار ريال مدريد، أخبار ليفربول، أخبار مبابي، تحديثات رياضية، أخبار الدوري الإنجليزي، أخبار الدوري الإسباني";
            pageUrl = window.location.origin + '/news';


        } else if (viewName === 'match-details' && dataId) {
            const match = DATA.find(item => item.type === 'match' && item.id === parseInt(dataId));
            if (match) {
                const template = document.getElementById('match-details-view-template');
                if (!template) { console.error("ERROR: The 'match-details-view-template' template was not found."); contentDisplay.innerHTML = '<p class="error-message">عذراً، قالب تفاصيل المباراة غير موجود.</p>'; return; }
                targetSectionClone = document.importNode(template.content, true).firstElementChild;
                if (!targetSectionClone) { console.error("ERROR: Cloned content of 'match-details-view-template' is empty."); contentDisplay.innerHTML = '<p class="error-message">عذراً، محتوى قالب تفاصيل المباراة فارغ.</p>'; return; }

                // Clear all current children of contentDisplay except heroSection (if it exists)
                Array.from(contentDisplay.children).forEach(child => {
                    if (child.id !== 'hero-section') {
                        child.remove();
                    }
                });
                contentDisplay.appendChild(targetSectionClone);
                targetSectionClone.style.display = 'block';
                targetSectionClone.classList.add('active-view');

                const matchDetailsTitleElement = targetSectionClone.querySelector('#match-details-title-element');
                const matchDetailsDescription = targetSectionClone.querySelector('#match-details-description');
                const matchDetailsDateTime = targetSectionClone.querySelector('#match-details-date-time');
                const matchDetailsLeague = targetSectionClone.querySelector('#match-details-league');
                const matchDetailsCommentators = targetSectionClone.querySelector('#match-details-commentators');
                const matchDetailsTeams = targetSectionClone.querySelector('#match-details-teams');
                const matchDetailsStadium = targetSectionClone.querySelector('#match-details-stadium');
                const matchDetailsStatus = targetSectionClone.querySelector('#match-details-status');
                const matchPlayerContainer = targetSectionClone.querySelector('#match-player-container');
                const videoOverlay = targetSectionClone.querySelector('#video-overlay');
                const overlayThumbnail = targetSectionClone.querySelector('#overlay-thumbnail');
                const loadingSpinner = targetSectionClone.querySelector('#video-loading-spinner');
                const matchDetailsScoreContainer = targetSectionClone.querySelector('#match-details-score-container');
                const matchDetailsScore = targetSectionClone.querySelector('#match-details-score');
                const matchDetailsHighlightsContainer = targetSectionClone.querySelector('#match-details-highlights-container');
                const matchDetailsHighlightsLink = targetSectionClone.querySelector('#match-details-highlights-link');
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
                matchDetailsDescription.textContent = match.short_description;
                matchDetailsDateTime.textContent = formatDateTime(match.date_time);
                matchDetailsLeague.textContent = match.league_name;
                matchDetailsCommentators.textContent = match.commentators.join(', ') || 'غير متاح';
                matchDetailsTeams.textContent = `${match.home_team} ضد ${match.away_team}`;
                matchDetailsStadium.textContent = match.stadium;
                matchDetailsStatus.textContent = match.status === 'Live' ? 'مباشرة' : match.status === 'Finished' ? 'انتهت' : 'قادمة';

                // Video Player & Overlay logic
                matchPlayerContainer.innerHTML = '';
                overlayThumbnail.src = match.thumbnail;
                videoOverlay.style.display = 'flex';
                loadingSpinner.style.display = 'none';

                videoOverlay.onclick = () => {
                    loadingSpinner.style.display = 'block';
                    videoOverlay.style.display = 'none';

                    const iframe = document.createElement('iframe');
                    iframe.src = match.embed_url;
                    // Add more robust allow attributes for mobile compatibility and features
                    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer;";
                    iframe.frameBorder = "0";
                    iframe.scrolling = "no";
                    iframe.setAttribute('referrerpolicy', 'origin');
                    
                    // Add a timeout for potential loading issues and better feedback
                    const loadingTimeout = setTimeout(() => {
                        if (loadingSpinner.style.display === 'block') { // Still spinning, assume issue
                            loadingSpinner.style.display = 'none';
                            matchPlayerContainer.innerHTML = '<p class="error-message">تعذر تحميل البث. قد يكون الرابط غير صالح أو توجد مشكلة في الشبكة. يرجى المحاولة لاحقاً.</p>';
                        }
                    }, 15000); // 15 seconds timeout

                    iframe.onload = () => {
                        loadingSpinner.style.display = 'none';
                        clearTimeout(loadingTimeout); // Clear timeout on successful load
                    };
                    iframe.onerror = () => {
                        loadingSpinner.style.display = 'none';
                        clearTimeout(loadingTimeout); // Clear timeout on error
                        matchPlayerContainer.innerHTML = '<p class="error-message">تعذر تحميل البث. يرجى المحاولة لاحقاً.</p>';
                    };
                    matchPlayerContainer.appendChild(iframe);

                    const adBannerContainer = targetSectionClone.querySelector('#ad-banner-iframe-sync');
                    if (adBannerContainer && !adBannerContainer.hasChildNodes()) {
                        window.atOptions = {
                            'key' : 'd0f597100460382f12621237f055f943',
                            'format' : 'iframe',
                            'height' : 50,
                            'width' : 320,
                            'params' : {}
                        };

                        const externalAdScript = document.createElement('script');
                        externalAdScript.type = 'text/javascript';
                        externalAdScript.src = '//www.highperformanceformat.com/d0f597100460382f12621237f055f943/invoke.js';
                        externalAdScript.async = true;

                        adBannerContainer.appendChild(externalAdScript);
                    }
                };

                if (match.status === 'Finished' && match.score) {
                    matchDetailsScoreContainer.classList.remove('hidden');
                    matchDetailsScore.textContent = match.score;
                } else {
                    matchDetailsScoreContainer.classList.add('hidden');
                }

                if (match.status === 'Finished' && match.highlights_url) {
                    matchDetailsHighlightsContainer.classList.remove('hidden');
                    matchDetailsHighlightsLink.href = match.highlights_url;
                } else {
                    matchDetailsHighlightsContainer.classList.add('hidden');
                }

                const suggestedMatches = DATA.filter(item =>
                    item.type === 'match' &&
                    item.id !== match.id &&
                    (item.league_id === match.league_id || item.category === match.category) &&
                    (item.status === 'Upcoming' || item.status === 'Live')
                ).slice(0, 4);

                renderGrid(suggestedMatches, suggestedMatchGrid, createMatchCard, 1);

                pageTitle = `${match.title} | شاهد كورة بث مباشر وتفاصيل المباراة`;
                pageDescription = match.short_description;
                pageKeywords = [...(match.tags || []), "مشاهدة مباراة", "بث مباشر", "ملخص المباراة", match.home_team, match.away_team, match.league_name].join(', ');
                pageUrl = `${window.location.origin}/#match-${match.id}`;
                ogImage = match.thumbnail;
                ogImageAlt = `ملصق مباراة ${match.title}`;
                jsonLdData = match; // This will be handled by generateJsonLdSchema
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

            // Clear all current children of contentDisplay except heroSection (if it exists)
            Array.from(contentDisplay.children).forEach(child => {
                if (child.id !== 'hero-section') {
                    child.remove();
                }
            });
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
            }, currentPage.search, null, homePaginationControls);

            pageTitle = `نتائج البحث عن "${currentSearchQuery}" | شاهد كورة`;
            pageDescription = `نتائج البحث عن "${currentSearchQuery}" في مباريات كرة القدم وآخر الأخبار على شاهد كورة.`;
            pageKeywords = `بحث كرة قدم، ${currentSearchQuery}, نتائج بحث، مباريات، أخبار`;
            pageUrl = `${window.location.origin}/search?q=${encodeURIComponent(currentSearchQuery)}`;
            jsonLdData = { "@type": "SearchResultsPage", "name": pageTitle, "url": pageUrl };
        }

        updateSEO(pageTitle, pageDescription, pageKeywords, pageUrl, ogImage, ogImageAlt);
        // Pass specific data to generateJsonLdSchema when applicable
        generateJsonLdSchema(dataId ? DATA.find(item => item.id === parseInt(dataId)) : null, viewName); 
    };


    // ======== Event Listeners ========

    // Delegated event listener for general clicks on the body
    document.body.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-link');
        const watchNow = e.target.closest('#watch-now-btn');
        const homeLogo = e.target.closest('#home-logo-link');

        if (navLink) {
            e.preventDefault();
            const targetView = navLink.dataset.targetView;
            switchView(targetView);
            // Update URL based on view for better direct linking/SEO
            window.history.pushState({ view: targetView }, '', `#${targetView}`);
        } else if (watchNow) {
            e.preventDefault();
            switchView('live');
            window.history.pushState({ view: 'live' }, '', '#live');
        } else if (homeLogo) {
            e.preventDefault();
            switchView('home');
            window.history.pushState({ view: 'home' }, '', '#home');
        }

        const itemCardBtn = e.target.closest('.match-details-btn .btn');
        if (itemCardBtn) {
            e.preventDefault();
            const itemId = itemCardBtn.dataset.matchId || itemCardBtn.dataset.newsId;
            const itemType = itemCardBtn.dataset.type;

            if (itemType === 'match' && itemId) {
                switchView('match-details', itemId);
                window.history.pushState({ view: 'match-details', id: itemId }, '', `#match-${itemId}`);
            }
        }

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
                switchView('home');
            }

        } catch (error) {
            console.error('Failed to load data:', error);
            contentDisplay.innerHTML = '<p class="error-message">عذراً، تعذر تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.</p>';
        }
    };

    fetchData();
});
