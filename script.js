document.addEventListener('DOMContentLoaded', () => {
    // ======== Configuration & Data Management ========
    const API_URL = './matches.json'; // المسار لملف بيانات JSON الخاص بك
    const ITEMS_PER_PAGE = 6;

    let DATA = []; // سيخزن البيانات المجلوبة
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
        upcoming: 'upcoming' // الفلتر الافتراضي للمباريات القادمة: 'upcoming' (الكل), 'today', 'tomorrow'
    };
    let currentSearchQuery = '';

    // ثوابت مقارنة التاريخ
    const NOW = new Date();
    const TODAY_START = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
    const TOMORROW_START = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1);
    const DAY_AFTER_TOMORROW_START = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 2);

    // متغيرات الإعلانات
    // **ملاحظة هامة:** adTriggers.popunderOpened لم يعد يُستخدم لفتح نوافذ تلقائية.
    let adTriggers = {
        popunderOpened: false, // لم يعد يُستخدم لفتح تلقائي
        lastDirectLinkTime: 0 // فترة تهدئة لرابط الإعلان المباشر (عند النقر على الفيديو)
    };
    const DIRECT_LINK_COOLDOWN_MS = 7000; // 7 ثوانٍ فترة تهدئة لرابط الإعلان المباشر
    // **هذا هو رابط الإعلان المباشر الوحيد الذي سيفتحه الكود الخاص بك في تبويب جديد.**
    const AD_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/s9pzkja6hn?key=0d9ae755a41e87391567e3eab37b7cec';


    // ======== DOM Elements Cache (Static references) ========
    const contentDisplay = document.getElementById('content-display');
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const menuToggle = document.getElementById('menu-toggle');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const homeLogoLink = document.getElementById('home-logo-link');

    // عناصر الـ SEO (Meta tags)
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
     * تنسيق سلسلة تاريخ ISO إلى تاريخ ووقت عربي مقروء مع اختصار المنطقة الزمنية ذات الصلة.
     * @param {string} isoString - سلسلة تاريخ ISO.
     * @returns {string} سلسلة التاريخ المنسقة.
     */
    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };

        const formattedDatePart = new Intl.DateTimeFormat('ar-EG', optionsDate).format(date);
        let formattedTimePart = new Intl.DateTimeFormat('ar-EG', optionsTime).format(date);

        // استبدال رموز الصباح/المساء للغة العربية
        formattedTimePart = formattedTimePart.replace('ص', 'ص').replace('م', 'م');

        let timezoneAbbreviation = '';
        const timezoneOffsetMatch = isoString.match(/([+-]\d{2}:\d{2})$/);
        const offsetString = timezoneOffsetMatch ? timezoneOffsetMatch[1] : null;

        if (offsetString === '+03:00') {
            timezoneAbbreviation = '(بتوقيت جدة)'; // SAST (Saudi Arabia Standard Time)
        } else if (offsetString === '+02:00') {
            // التحقق من الدوريات الأوروبية الشائعة خلال التوقيت الصيفي لاسم منطقة زمنية أكثر دقة
            if (isoString.includes("الدوري الإسباني") || isoString.includes("الدوري الألماني") || isoString.includes("الدوري الفرنسي") || isoString.includes("دوري أبطال أوروبا")) {
                timezoneAbbreviation = '(بتوقيت أوروبا/صيفي)'; // CEST for European leagues, or just CET
            } else {
                timezoneAbbreviation = '(بتوقيت القاهرة)'; // إذا كان توقيت مصري غير صيفي أو +02 عام
            }
        } else if (offsetString === '+01:00') {
            timezoneAbbreviation = '(بتوقيت لندن)'; // BST (British Summer Time)
        } else if (offsetString === '+00:00') {
            timezoneAbbreviation = '(بتوقيت جرينتش)'; // GMT/UTC
        } else {
            // حل بديل للأوفستات غير المعالجة أو في حالة عدم وجود الأوفست
            timezoneAbbreviation = '(توقيت محلي)'; // أو محاولة الاستنتاج من إعدادات المتصفح المحلية إذا رغبت
        }

        return `${formattedDatePart}، ${formattedTimePart} ${timezoneAbbreviation}`;
    };

    /**
     * **النسخة المحدثة من دالة فتح الرابط في تبويب جديد.**
     * **مهم جدًا:** لكي يعمل هذا بكفاءة ويتجنب مانعات النوافذ المنبثقة، يجب استدعاء هذه الدالة **مباشرةً** داخل معالج حدث نقرة المستخدم.
     * @param {string} url - الرابط لفتحه.
     */
    const openInNewTab = (url) => {
        try {
            // "_blank" يطلب فتح في تبويب جديد.
            // "noopener" و "noreferrer" مهمان للأمان والأداء.
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            if (newWindow) {
                // إذا تم فتح النافذة بنجاح (ولم يتم حظرها)، فلا داعي لمحاولة blur() أو focus()
                // لأن هدفنا هو فتح تبويب جديد، سواء كان في المقدمة أو الخلفية.
                // المتصفح هو من يقرر ذلك بناءً على إعداداته وسلوك المستخدم.
            } else {
                // حل بديل في حال قام مانع النوافذ المنبثقة بحظر window.open.
                // هذا الحل أقل موثوقية في فرض فتح تبويب جديد وقد يفتح في نفس التبويب.
                console.warn('window.open was blocked or failed, trying fallback with anchor tag.');
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link); // يجب إلحاق الرابط بـ body
                link.click();
                link.remove(); // تنظيف العنصر المؤقت
            }
        } catch (e) {
            console.error("Error opening URL in new tab:", e);
        }
    };


    /**
     * تحديث علامات Meta لـ SEO للصفحة ديناميكيًا.
     * @param {string} title - عنوان الصفحة.
     * @param {string} description - وصف Meta.
     * @param {string} keywords - كلمات مفتاحية Meta.
     * @param {string} url - الرابط الأساسي.
     * @param {string} [image=''] - رابط صورة Open Graph/Twitter.
     * @param {string} [imageAlt=''] - نص بديل لصورة Open Graph.
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
        dynamicOgType.setAttribute('content', 'website'); // افتراضي، يمكن أن يكون 'article', 'video.other'

        dynamicTwitterTitle.setAttribute('content', title);
        dynamicTwitterDescription.setAttribute('content', description);
        dynamicTwitterUrl.setAttribute('content', url);
        dynamicTwitterImage.setAttribute('content', image || "https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png");
        dynamicTwitterCard.setAttribute('content', 'summary_large_image');
    };

    /**
     * إنشاء وتحديث بيانات JSON-LD المهيكلة لـ SEO.
     * @param {object} data - كائن البيانات (مباراة أو خبر).
     * @param {string} viewName - اسم العرض الحالي.
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
        } else if (viewName === 'news-details' && data && data.type === 'news') { // افتراض وجود عرض تفاصيل الأخبار
            schema = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": data.title,
                "image": [data.article_image],
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
                    "@id": data.article_url
                }
            };
        } else if (viewName === 'home') {
            schema = {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "شاهد كورة - Ultimate Pitch",
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
     * تحميل الصور بشكل كسول باستخدام Intersection Observer أو التحميل الأصلي.
     * يُطبق على الصور ذات سمة data-src و class 'lazy'.
     */
    const lazyLoadImages = () => {
        const lazyImages = document.querySelectorAll('img.lazy[data-src]');

        if ('loading' in HTMLImageElement.prototype) {
            // التحميل الكسول الأصلي مدعوم
            lazyImages.forEach((img) => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
                img.onload = () => img.classList.add('loaded');
            });
        } else if ('IntersectionObserver' in window) {
            // حل بديل لـ Intersection Observer
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
                rootMargin: '0px 0px 200px 0px' // تحميل الصور عندما تكون على بعد 200 بكسل من منفذ العرض
            });

            lazyImages.forEach((lazyImage) => {
                lazyImageObserver.observe(lazyImage);
            });
        } else {
            // حل بديل للمتصفحات التي لا تدعم Intersection Observer (تحميل الكل فورًا)
            lazyImages.forEach((img) => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
            });
        }
    };

    /**
     * إنشاء عنصر HTML لبطاقة مباراة.
     * @param {object} match - كائن بيانات المباراة.
     * @returns {HTMLElement} عنصر بطاقة المباراة الذي تم إنشاؤه.
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
     * إنشاء عنصر HTML لبطاقة خبر.
     * @param {object} news - كائن بيانات الخبر.
     * @returns {HTMLElement} عنصر بطاقة الخبر الذي تم إنشاؤه.
     */
    const createNewsCard = (news) => {
        const card = document.createElement('div');
        card.classList.add('news-card');
        card.dataset.newsId = news.id;
        card.dataset.type = 'news';
        // استخدام data-src للتحميل الكسول للصورة المصغرة، بالإضافة إلى loading="lazy" الأصلي
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
     * عرض العناصر في حاوية شبكة محددة مع تقسيم الصفحات.
     * @param {Array<object>} items - مصفوفة من عناصر البيانات (مباريات أو أخبار).
     * @param {HTMLElement} container - عنصر HTML الحاوية للعرض.
     * @param {Function} cardCreator - دالة لإنشاء بطاقة فردية (createMatchCard أو createNewsCard).
     * @param {number} page - رقم الصفحة الحالي لتقسيم الصفحات.
     * @param {HTMLElement} [emptyStateElement=null] - مرجع اختياري لعنصر الحالة الفارغة.
     * @param {HTMLElement} [paginationControlsElement=null] - مرجع اختياري لعنصر التحكم في تقسيم الصفحات.
     * @param {string} [viewNameForAd=''] - اسم العرض الحالي، يُستخدم لمنطق وضع الإعلانات.
     */
    const renderGrid = (items, container, cardCreator, page, emptyStateElement = null, paginationControlsElement = null, viewNameForAd = '') => {
        if (!container) {
            console.error(`renderGrid: Target container is null or undefined. This indicates an issue with template cloning or element selection. Container expected: ${container?.id || 'N/A'}`);
            return;
        }
        container.innerHTML = ''; // مسح المحتوى السابق

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

                // **إدراج إعلانات Native Async:**
                // **ملاحظة هامة جداً:** هذا الجزء من الكود يقوم فقط بإضافة حاوية HTML (div) وسكريبت الإعلان
                // من profitableratecpm.com.
                // **السلوك الفعلي لفتح الإعلان (هل يفتح تبويب جديد، أو يحل محل الموقع، أو غير ذلك)
                // يتم التحكم فيه بالكامل بواسطة السكريبت الذي يتم تحميله من profitableratecpm.com.**
                // **لا يمكنك التحكم في هذا السلوك من كودك هذا.**
                if (viewNameForAd && ['home', 'live', 'upcoming', 'highlights', 'search-results', 'news'].includes(viewNameForAd)) {
                    // ضع إعلان Native Async بعد كل 3 بطاقات، ولكن ليس في البطاقة الأخيرة لتجنب الوضع الغريب
                    // وفقط إذا لم تكن الصفحة الأخيرة بأقل من 3 عناصر متبقية
                    if ((index + 1) % 3 === 0 && (index + 1) < paginatedItems.length) {
                        const nativeAdDiv = document.createElement('div');
                        nativeAdDiv.className = 'native-ad-placeholder'; // إضافة فئة للتنسيق
                        // استخدام ID فريد لكل حاوية إعلان لضمان العرض الصحيح إذا كان هناك العديد في الصفحة
                        const uniqueAdContainerId = `container-b63334b55ca510415eee91e8173dc2d8-${viewNameForAd}-${page}-${index}`;
                        nativeAdDiv.innerHTML = `
                            <script async="async" data-cfasync="false" src="//pl27154385.profitableratecpm.com/b63334b55ca510415eee91e8173dc2d8/invoke.js"></script>
                            <div id="${uniqueAdContainerId}"></div>
                        `;
                        container.appendChild(nativeAdDiv);
                    }
                }
            } else {
                console.warn('cardCreator did not return an HTMLElement for item:', item);
            }
        });

        // تحديث حالة أزرار تقسيم الصفحات
        if (paginationControlsElement) {
            const prevBtn = paginationControlsElement.querySelector('.btn-page.prev');
            const nextBtn = paginationControlsElement.querySelector('.btn-page.next');
            if (prevBtn) prevBtn.disabled = page === 1;
            if (nextBtn) nextBtn.disabled = endIndex >= items.length;
        }

        // تطبيق التحميل الكسول على الصور التي تم عرضها حديثًا
        lazyLoadImages();
    };


    // ======== View Management & Content Rendering ========

    /**
     * الوظيفة الرئيسية للتبديل بين أقسام (شاشات) التطبيق المختلفة.
     * @param {string} viewName - اسم العرض للتبديل إليه (مثال: 'home', 'live', 'match-details').
     * @param {string|number} [dataId=null] - ID اختياري لتفاصيل عنصر محدد (مثال: ID المباراة).
     */
    const switchView = (viewName, dataId = null) => {
        currentView = viewName;

        // إخفاء جميع أقسام المحتوى الرئيسية في البداية
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active-view');
            section.style.display = 'none';
        });

        // إلغاء تفعيل جميع روابط التنقل وتفعيل الرابط الحالي
        navLinks.forEach(link => link.classList.remove('active'));
        const activeNavLink = document.querySelector(`.nav-link[data-target-view="${viewName}"]`);
        if (activeNavLink) activeNavLink.classList.add('active');
        // إغلاق قائمة الجوال إذا كانت مفتوحة
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');

        let pageTitle = "شاهد كورة: Ultimate Pitch - كل كرة القدم في مكان واحد";
        let pageDescription = "شاهد كورة - ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.";
        let pageKeywords = "شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch";
        let pageUrl = window.location.origin + '/';
        let ogImage = "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png";
        let ogImageAlt = "شاهد كورة | ملعبك النهائي لكرة القدم";
        let jsonLdData = {}; // بيانات لترميز Schema

        let targetSectionClone; // سيحتوي على العنصر الجذر للمحتوى المستنسخ من القالب

        // عرض المحتوى بناءً على اسم العرض
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

            // مسح المحتوى السابق من contentDisplay
            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            // الحصول على مراجع للعناصر *داخل القسم المستنسخ*
            const mainGridContainer = targetSectionClone.querySelector('#main-match-grid');
            const homePaginationControls = targetSectionClone.querySelector('.pagination-controls');
            const homeMatchesTitle = targetSectionClone.querySelector('#home-matches-title');

            // تصفية الصفحة الرئيسية: مباريات مباشرة + قادمة (اليوم/الغد) + أحدث مباراتين منتهيتين + أحدث خبرين
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

            // تصفية أي عناصر غير مباريات/أخبار محتملة قبل تمريرها إلى renderGrid
            const itemsToRender = [...liveMatches, ...upcomingMatchesTodayTomorrow, ...latestNews, ...finishedMatches].filter(item => item.type === 'match' || item.type === 'news');

            homeMatchesTitle.textContent = "أبرز المباريات والجديد";
            renderGrid(itemsToRender, mainGridContainer, (item) => {
                if (item.type === 'match') return createMatchCard(item);
                if (item.type === 'news') return createNewsCard(item);
                return null; // التأكد من إرجاع شيء
            }, currentPage.home, null, homePaginationControls, 'home');


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

            // مسح جميع العناصر الحالية من contentDisplay
            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(targetSectionClone);
            targetSectionClone.style.display = 'block';
            targetSectionClone.classList.add('active-view');

            const liveGridContainer = targetSectionClone.querySelector('#live-match-grid');
            const liveEmptyState = targetSectionClone.querySelector('#live-empty-state');
            const livePaginationControls = targetSectionClone.querySelector('.pagination-controls');

            const itemsToRender = DATA.filter(item => item.type === 'match' && item.status === 'Live');
            renderGrid(itemsToRender, liveGridContainer, createMatchCard, currentPage.live, liveEmptyState, livePaginationControls, 'live');

            pageTitle = "شاهد كورة: مباريات كرة القدم مباشرة الآن | بث مباشر";
            pageDescription = "شاهد جميع مباريات كرة القدم التي تبث مباشرة الآن بجودة عالية. تابع ديربيات الكرة العالمية والمحلية لحظة بلحظة.";
            pageKeywords = "مباريات مباشرة، بث مباشر، شاهد الآن، كرة قدم لايف، مشاهدة مباريات، بث مجاني، الدوري المصري مباشر، الدوري السعودي مباشر";
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

            pageTitle = "شاهد كورة: مواعيد مباريات كرة القدم القادمة | جدول المباريات";
            pageDescription = "اكتشف مواعيد مباريات كرة القدم القادمة في جميع الدوريات والبطولات الكبرى. لا تفوت أي مباراة حاسمة!";
            pageKeywords = "مواعيد مباريات، مباريات اليوم، مباريات الغد، جدول المباريات، كرة قدم قادمة، دوري أبطال أوروبا، الدوري الإسباني، الدوري الإنجليزي";
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

            pageTitle = "شاهد كورة: أهداف وملخصات المباريات | أبرز اللقطات";
            pageDescription = "شاهد أهداف جميع المباريات وملخصات كاملة لأبرز اللقاءات في الدوريات والبطولات الكبرى. استمتع بأجمل اللحظات الكروية.";
            pageKeywords = "أهداف المباريات، ملخصات كرة القدم، أهداف اليوم، لقطات حاسمة، أفضل الأهداف، ملخصات الدوري الإسباني، ملخصات الدوري الإنجليزي";
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

                contentDisplay.innerHTML = ''; // مسح جميع العناصر الحالية من contentDisplay
                contentDisplay.appendChild(targetSectionClone);
                targetSectionClone.style.display = 'block';
                targetSectionClone.classList.add('active-view');

                const matchDetailsTitleElement = targetSectionClone.querySelector('#match-details-title-element');

                const matchPlayerContainer = targetSectionClone.querySelector('#match-player-container');
                const videoOverlay = targetSectionClone.querySelector('#video-overlay');
                const overlayThumbnail = targetSectionClone.querySelector('#overlay-thumbnail');
                const loadingSpinner = targetSectionClone.querySelector('#video-loading-spinner');

                const suggestedMatchGrid = targetSectionClone.querySelector('#suggested-match-grid');
                const backToHomeBtn = targetSectionClone.querySelector('#back-to-home-btn'); // الحصول على زر الرجوع ضمن القالب المستنسخ

                // إضافة مستمع حدث لزر الرجوع، إذا كان موجودًا
                if (backToHomeBtn) {
                    backToHomeBtn.onclick = (e) => {
                        e.preventDefault();
                        switchView('home');
                        window.history.pushState({ view: 'home' }, '', '#home');
                    };
                }

                matchDetailsTitleElement.textContent = match.title;

                // منطق مشغل الفيديو والـ Overlay
                matchPlayerContainer.innerHTML = '';
                overlayThumbnail.src = match.thumbnail;
                videoOverlay.style.display = 'flex';
                loadingSpinner.style.display = 'none';

                videoOverlay.onclick = () => {
                    loadingSpinner.style.display = 'block';
                    videoOverlay.style.display = 'none';

                    // **الإعلان الوحيد الذي نتحكم فيه بفتحه في تبويب جديد:**
                    // يتم تشغيله هنا لأنها نقرة مباشرة من المستخدم على Overlay الفيديو،
                    // مما يزيد من فرصة عدم حظر المتصفح للإعلان كـ Pop-up.
                    const currentTime = Date.now();
                    if (currentTime - adTriggers.lastDirectLinkTime > DIRECT_LINK_COOLDOWN_MS) {
                        openInNewTab(AD_DIRECT_LINK_URL); // استخدم openInNewTab لضمان الفتح في تبويب جديد
                        adTriggers.lastDirectLinkTime = currentTime;
                    }

                    const iframe = document.createElement('iframe');
                    iframe.src = match.embed_url;
                    iframe.allow = "autoplay; fullscreen; picture-in-picture";
                    iframe.frameBorder = "0";
                    iframe.scrolling = "no";
                    iframe.setAttribute('referrerpolicy', 'origin');
                    iframe.onload = () => {
                        loadingSpinner.style.display = 'none';
                    };
                    iframe.onerror = () => {
                        loadingSpinner.style.display = 'none';
                        matchPlayerContainer.innerHTML = '<p class="error-message">تعذر تحميل البث. يرجى المحاولة لاحقاً.</p>';
                    };
                    matchPlayerContainer.appendChild(iframe);
                };

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
                jsonLdData = match;

            } else {
                console.warn(`Match with ID ${dataId} not found. Redirecting to home.`);
                switchView('home');
                window.history.pushState({ view: 'home' }, '', '#home');
                return;
            }
        } else if (viewName === 'search-results') {
            const template = document.getElementById('home-view-template'); // إعادة استخدام قالب الصفحة الرئيسية لنتائج البحث
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
                return null; // التأكد من إرجاع شيء
            }, currentPage.search, null, homePaginationControls, 'search-results');

            pageTitle = `نتائج البحث عن "${currentSearchQuery}" | شاهد كورة`;
            pageDescription = `نتائج البحث عن "${currentSearchQuery}" في مباريات كرة القدم وآخر الأخبار على شاهد كورة.`;
            pageKeywords = `بحث كرة قدم، ${currentSearchQuery}, نتائج بحث، مباريات، أخبار`;
            pageUrl = `${window.location.origin}/search?q=${encodeURIComponent(currentSearchQuery)}`;
            jsonLdData = { "@type": "SearchResultsPage", "name": pageTitle, "url": pageUrl };
        }

        updateSEO(pageTitle, pageDescription, pageKeywords, pageUrl, ogImage, ogImageAlt);
        generateJsonLdSchema(jsonLdData, viewName);
    };


    // ======== Event Listeners ========

    // مستمع حدث مفوض للنقرات العامة على الجسم
    document.body.addEventListener('click', (e) => {
        // **تم التأكد من إزالة أي كود هنا كان يحاول فتح إعلانات تلقائيًا أو كـ "pop-under".**
        // هذا يعني أن الكود الخاص بك لا يقوم بفتح إعلانات غير مرغوبة.
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

        // حدث النقر لبطاقة المباراة بالكامل (أو زر التفاصيل بداخلها)
        const itemCard = e.target.closest('.match-card');
        if (itemCard && itemCard.dataset.type === 'match') { // التأكد من أنها نقرة على بطاقة مباراة
             e.preventDefault(); // منع سلوك الرابط الافتراضي لأي روابط داخلية
             const itemId = itemCard.dataset.matchId;
             if (itemId) {
                 switchView('match-details', itemId);
                 window.history.pushState({ view: 'match-details', id: itemId }, '', `#match-${itemId}`);
             }
        }
        // روابط بطاقات الأخبار تفتح خارجيًا، لذلك لا تحتاج إلى معالج JavaScript خاص بها بخلاف وسم <a> الخاص بها.


        // تبديل قائمة الجوال
        if (e.target.closest('#menu-toggle')) {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        } else if (!mainNav.contains(e.target) && !menuToggle.contains(e.target) && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    // مستمع حدث مفوض لأزرار تقسيم الصفحات داخل contentDisplay
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
            switchView(currentView, null); // إعادة عرض العرض الحالي بالصفحة المحدثة
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
            // تحديث رابط URL لنتائج البحث
            window.history.pushState({ view: 'search-results', query: query }, '', `/search?q=${encodeURIComponent(query)}`);
        } else if (currentView === 'search-results') {
            // إذا تم مسح حقل البحث وأنت حاليًا في نتائج البحث، انتقل إلى الصفحة الرئيسية
            switchView('home');
            window.history.pushState({ view: 'home' }, '', '/');
        }
    }

    // التعامل مع أزرار الرجوع/الأمام في المتصفح
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
            searchInput.value = searchQuery; // تعبئة حقل البحث إذا عُدت إلى نتائج البحث عبر السجل
            currentSearchQuery = searchQuery;
            switchView('search-results');
        } else {
            // افتراضيًا، انتقل إلى الصفحة الرئيسية إذا لم يكن هناك هاش أو استعلام بحث محدد
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

            // تحديد العرض الأولي بناءً على هاش URL أو استعلام البحث
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
                // افتراضيًا، انتقل إلى الصفحة الرئيسية إذا لم يكن هناك هاش أو استعلام بحث محدد
                switchView('home');
            }

        } catch (error) {
            console.error('Failed to load data:', error);
            contentDisplay.innerHTML = '<p class="error-message">عذراً، تعذر تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.</p>';
        }
    };

    fetchData();
});
