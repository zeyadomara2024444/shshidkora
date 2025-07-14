// script.js - كود JavaScript محسن وواضح لمحركات البحث والمطورين لموقع "شاهد كورة"
// تم التركيز على أفضل أداء ممكن من جانب العميل مع الحفاظ على الوظائف والإعلانات
// والتأكد من إزالة أي عناصر قد تؤثر سلباً على الفهم من قبل محركات البحث
// تم تحديث هذا الإصدار لاستخدام iframe لمشغل الفيديو وتكييفه لمحتوى كرة القدم

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Shahid Kora script execution started.');

    // --- 1. DOM Element References ---
    // العناصر العامة للصفحة
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const homeLogoLink = document.getElementById('home-logo-link');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const contentDisplay = document.getElementById('content-display'); // الحاوية الرئيسية لعرض المحتوى

    // العناصر الخاصة بـ Hero Section (الصفحة الرئيسية)
    const heroSection = document.getElementById('hero-section');
    const watchNowBtn = document.getElementById('watch-now-btn');

    // عناصر قالب "Home View"
    let mainMatchGrid, homeMatchesTitle, homePrevPageBtn, homeNextPageBtn;

    // عناصر قالب "Live Matches"
    let liveMatchGrid, liveEmptyState, livePrevPageBtn, liveNextPageBtn, liveMatchesTitle;
    let liveFilterBtns;

    // عناصر قالب "Upcoming Matches"
    let upcomingMatchGrid, upcomingEmptyState, upcomingPrevPageBtn, upcomingNextPageBtn, upcomingMatchesTitle;
    let upcomingFilterBtns;

    // عناصر قالب "Highlights"
    let highlightsGrid, highlightsEmptyState, highlightsPrevPageBtn, highlightsNextPageBtn, highlightsTitle;

    // عناصر قالب "News"
    let newsGrid, newsEmptyState, newsPrevPageBtn, newsNextPageBtn, newsTitle;

    // عناصر قالب "Match Details"
    let matchDetailsSection;
    let backToHomeBtn, matchDetailsTitleElement, matchPlayerContainer, videoOverlay, videoLoadingSpinner;
    let matchDetailsPoster, matchDetailsDescription, matchDetailsDateTime, matchDetailsLeague, matchDetailsCommentators, matchDetailsTeams, matchDetailsStadium, matchDetailsStatus, matchDetailsScoreContainer, matchDetailsScore, matchDetailsHighlightsContainer, matchDetailsHighlightsLink;
    let suggestedMatchGrid;

    // ****** تحسين الأداء على الموبايل: عدد المباريات/الأخبار المعروضة لكل صفحة ******
    const itemsPerPage = 20; // القيمة الموصى بها لأداء أفضل

    let currentView = 'home'; // لتعقب العرض الحالي (home, live, details, etc.)
    let currentDataForPagination = []; // البيانات الحالية للترقيم
    let currentPage = 1;
    let matchesData = []; // بيانات المباريات والأهداف
    let newsData = []; // بيانات الأخبار
    let currentDetailedMatch = null; // المباراة المفصلة المعروضة حالياً

    // --- 1.1. Critical DOM Element Verification (أثناء تحميل القوالب) ---
    // هذه العناصر سيتم التحقق منها بعد إضافة القالب المناسب
    const checkDynamicElements = () => {
        const requiredDynamicElements = {};
        if (currentView === 'home') {
            requiredDynamicElements['#main-match-grid'] = mainMatchGrid;
            requiredDynamicElements['#home-matches-title'] = homeMatchesTitle;
            requiredDynamicElements['#home-prev-page-btn'] = homePrevPageBtn;
            requiredDynamicElements['#home-next-page-btn'] = homeNextPageBtn;
        } else if (currentView === 'live') {
            requiredDynamicElements['#live-match-grid'] = liveMatchGrid;
            requiredDynamicElements['#live-matches-title'] = liveMatchesTitle;
            requiredDynamicElements['#live-empty-state'] = liveEmptyState;
            requiredDynamicElements['#live-prev-page-btn'] = livePrevPageBtn;
            requiredDynamicElements['#live-next-page-btn'] = liveNextPageBtn;
            requiredDynamicElements['.filter-btn'] = document.querySelector('#live-matches-section .filter-btn');
        } else if (currentView === 'upcoming') {
            requiredDynamicElements['#upcoming-match-grid'] = upcomingMatchGrid;
            requiredDynamicElements['#upcoming-matches-title'] = upcomingMatchesTitle;
            requiredDynamicElements['#upcoming-empty-state'] = upcomingEmptyState;
            requiredDynamicElements['#upcoming-prev-page-btn'] = upcomingPrevPageBtn;
            requiredDynamicElements['#upcoming-next-page-btn'] = upcomingNextPageBtn;
            requiredDynamicElements['.filter-btn'] = document.querySelector('#upcoming-matches-section .filter-btn');
        } else if (currentView === 'highlights') {
            requiredDynamicElements['#highlights-grid'] = highlightsGrid;
            requiredDynamicElements['#highlights-title'] = highlightsTitle;
            requiredDynamicElements['#highlights-empty-state'] = highlightsEmptyState;
            requiredDynamicElements['#highlights-prev-page-btn'] = highlightsPrevPageBtn;
            requiredDynamicElements['#highlights-next-page-btn'] = highlightsNextPageBtn;
        } else if (currentView === 'news') {
            requiredDynamicElements['#news-grid'] = newsGrid;
            requiredDynamicElements['#news-title'] = newsTitle;
            requiredDynamicElements['#news-empty-state'] = newsEmptyState;
            requiredDynamicElements['#news-prev-page-btn'] = newsPrevPageBtn;
            requiredDynamicElements['#news-next-page-btn'] = newsNextPageBtn;
        } else if (currentView === 'details') {
            requiredDynamicElements['#match-details-title-element'] = matchDetailsTitleElement;
            requiredDynamicElements['#match-player-container'] = matchPlayerContainer;
            requiredDynamicElements['#video-overlay'] = videoOverlay;
            requiredDynamicElements['#video-loading-spinner'] = videoLoadingSpinner;
            requiredDynamicElements['#match-details-poster'] = matchDetailsPoster;
            requiredDynamicElements['#match-details-description'] = matchDetailsDescription;
            requiredDynamicElements['#match-details-date-time'] = matchDetailsDateTime;
            requiredDynamicElements['#match-details-league'] = matchDetailsLeague;
            requiredDynamicElements['#match-details-commentators'] = matchDetailsCommentators;
            requiredDynamicElements['#match-details-teams'] = matchDetailsTeams;
            requiredDynamicElements['#match-details-stadium'] = matchDetailsStadium;
            requiredDynamicElements['#match-details-status'] = matchDetailsStatus;
            requiredDynamicElements['#suggested-match-grid'] = suggestedMatchGrid;
        }

        let criticalError = false;
        for (const [id, element] of Object.entries(requiredDynamicElements)) {
            if (!element) {
                console.error(`❌ خطأ فادح: العنصر بالمعرّف "${id}" غير موجود في العرض الحالي. يرجى التحقق من ملف HTML الخاص بك وقوالب الـ template.`);
                criticalError = true;
            }
        }
        if (criticalError) {
            console.error('🛑 لن يتم تنفيذ السكريبت بالكامل بسبب عناصر DOM الأساسية المفقودة في العرض الديناميكي. قم بإصلاح HTML الخاص بك!');
            // يمكن عرض رسالة خطأ للمستخدم هنا إذا أردت
            return false;
        }
        return true;
    };


    // --- 2. Adsterra Configuration ---
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/spqbhmyax?key=2469b039d4e7c471764bd04c57824cf2'; // تأكد من تحديث هذا الرابط
    const DIRECT_LINK_COOLDOWN_CARD_CLICK = 3 * 60 * 1000; // 3 دقائق
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 10 * 1000; // 10 ثواني

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
            console.error('نوع إعلان غير صالح لـ openAdLink:', type);
            return false;
        }

        const currentTime = Date.now();
        if (currentTime - lastClickTime > cooldownDuration) {
            const newWindow = window.open(ADSTERRA_DIRECT_LINK_URL, '_blank');
            if (newWindow) {
                newWindow.focus();
                setLastClickTime(currentTime);
                console.log(`💰 [نقر إعلان - ${type}] تم فتح الرابط المباشر بنجاح.`);
                return true;
            } else {
                console.warn(`⚠️ [نقر إعلان - ${type}] تم حظر النافذة المنبثقة أو فشل فتح الرابط المباشر. تأكد من السماح بالنوافذ المنبثقة.`);
                return false;
            }
        } else {
            const timeLeft = (cooldownDuration - (currentTime - lastClickTime)) / 1000;
            console.log(`⏳ [نقر إعلان - ${type}] التهدئة للرابط المباشر نشطة. لن يتم فتح علامة تبويب جديدة. الوقت المتبقي: ${timeLeft.toFixed(1)}ثانية`);
            return false;
        }
    }

    // --- 3. Data Fetching and Management ---

    async function fetchData(url) {
        try {
            console.log(`📡 جلب البيانات من ${url}...`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`خطأ HTTP! الحالة: ${response.status} - تعذر تحميل ${url}.`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error(`❌ البيانات التي تم جلبها من ${url} ليست مصفوفة. المتوقع مصفوفة من الكائنات.`);
                return [];
            }
            console.log(`✅ تم تحميل البيانات بنجاح من ${url}: ${data.length} عنصر.`);
            return data;
        } catch (error) {
            console.error(`❌ فشل تحميل البيانات من ${url}:`, error.message);
            return [];
        }
    }

    async function loadAllData() {
        matchesData = await fetchData('matches.json'); // اسم ملف جديد لبيانات المباريات
        newsData = await fetchData('news.json');     // اسم ملف جديد لبيانات الأخبار
        initialPageLoadLogic(); // بعد تحميل كل البيانات، ابدأ منطق تحميل الصفحة الأولية
    }

    // --- 4. Content Creation & Display Functions ---

    function createMatchCard(match) {
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card');
        const webpSource = match.thumbnail.replace(/\.(png|jpe?g)/i, '.webp');
        const team1Logo = match.team1_logo ? `<img src="${match.team1_logo}" alt="${match.team1} Logo" class="team-logo" width="40" height="40" loading="lazy">` : '';
        const team2Logo = match.team2_logo ? `<img src="${match.team2_logo}" alt="${match.team2} Logo" class="team-logo" width="40" height="40" loading="lazy">` : '';
        
        let scoreDisplay = '';
        if (match.status === 'finished' && match.score) {
            scoreDisplay = `<span class="match-score">${match.score}</span>`;
        } else if (match.status === 'live') {
            scoreDisplay = `<span class="live-indicator">مباشر <i class="fas fa-circle"></i></span>`;
        }

        const matchTitle = match.title || `${match.team1 || 'الفريق 1'} vs ${match.team2 || 'الفريق 2'}`;

        matchCard.innerHTML = `
            <picture>
                <source srcset="${webpSource}" type="image/webp" onerror="this.remove()">
                <img data-src="${match.thumbnail}" src="${match.thumbnail}" alt="${matchTitle}" class="lazyload" width="300" height="180" loading="lazy">
            </picture>
            <div class="match-card-content">
                <h3 class="match-card-title">${matchTitle}</h3>
                <p class="match-card-league">${match.league || 'بطولة غير معروفة'}</p>
                <p class="match-card-teams">
                    ${team1Logo} ${match.team1 || 'غير معروف'} ${scoreDisplay} ${match.team2 || 'غير معروف'} ${team2Logo}
                </p>
                <p class="match-card-time">${match.date_time ? new Date(match.date_time).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'وقت غير متوفر'}</p>
                <button class="btn btn-primary btn-watch" data-match-id="${match.id}">شاهد الآن</button>
            </div>
        `;
        matchCard.querySelector('.btn-watch').addEventListener('click', (e) => {
            e.stopPropagation(); // منع النقر على البطاقة بالكامل
            console.log(`⚡ [تفاعل] تم النقر على زر "شاهد الآن" للمعّرف: ${match.id}`);
            openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card');
            showMatchDetails(match.id, 'match');
        });

        // Event listener for the entire card (optional, for another ad trigger)
        matchCard.addEventListener('click', () => {
            console.log(`⚡ [تفاعل] تم النقر على بطاقة المباراة للمعّرف: ${match.id}`);
            openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card'); // قد يفتح إعلان هنا أيضًا
        });

        return matchCard;
    }

    function createNewsCard(newsItem) {
        const newsCard = document.createElement('div');
        newsCard.classList.add('news-card');
        const webpSource = newsItem.image.replace(/\.(png|jpe?g)/i, '.webp');
        newsCard.innerHTML = `
            <picture>
                <source srcset="${webpSource}" type="image/webp" onerror="this.remove()">
                <img data-src="${newsItem.image}" src="${newsItem.image}" alt="${newsItem.title}" class="lazyload" width="300" height="200" loading="lazy">
            </picture>
            <div class="news-card-content">
                <h3 class="news-card-title">${newsItem.title}</h3>
                <p class="news-card-date">${newsItem.date ? new Date(newsItem.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'تاريخ غير متوفر'}</p>
                <p class="news-card-summary">${newsItem.summary || newsItem.description.substring(0, 100) + '...'}</p>
                <a href="${newsItem.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-read-more">اقرأ المزيد <i class="fas fa-external-link-alt"></i></a>
            </div>
        `;
        newsCard.addEventListener('click', () => {
             openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'card'); // إعلان عند النقر على بطاقة الخبر
        });
        return newsCard;
    }

    function displayItems(itemsToDisplay, targetGridElement, type = 'match') {
        if (!targetGridElement) {
            console.error(`❌ displayItems: العنصر المستهدف للشبكة ${targetGridElement} فارغ أو غير معرّف.`);
            return;
        }
        targetGridElement.innerHTML = ''; // مسح المحتوى القديم

        if (!itemsToDisplay || itemsToDisplay.length === 0) {
            // يتم التعامل مع empty-state في الوظيفة التي تستدعي هذه الدالة
            // لا تضع رسالة هنا لتجنب التكرار
            console.log(`🎬 [عرض] لا توجد عناصر للعرض في ${targetGridElement.id}.`);
            return;
        }

        console.log(`🎬 [عرض] جاري عرض ${itemsToDisplay.length} عنصر في ${targetGridElement.id}.`);
        itemsToDisplay.forEach(item => {
            if (type === 'match') {
                targetGridElement.appendChild(createMatchCard(item));
            } else if (type === 'news') {
                targetGridElement.appendChild(createNewsCard(item));
            }
        });
        console.log(`🎬 [عرض] تم عرض ${itemsToDisplay.length} عنصر في ${targetGridElement.id}.`);
        initializeLazyLoad(); // إعادة تهيئة التحميل الكسول للعناصر الجديدة
    }

    function paginateItems(itemsArray, page, targetGridElement, type) {
        if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
            displayItems([], targetGridElement, type);
            // يتم التعامل مع أزرار الترقيم و empty-state خارج هذه الدالة
            return;
        }

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = itemsArray.slice(startIndex, endIndex);

        displayItems(paginatedItems, targetGridElement, type);
        console.log(`➡️ [ترقيم الصفحات] يتم عرض الصفحة ${page}. العناصر من الفهرس ${startIndex} إلى ${Math.min(endIndex, itemsArray.length) - 1}.`);
    }

    function updatePaginationButtons(totalItems, currentPage, prevBtn, nextBtn) {
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage * itemsPerPage >= totalItems;
        console.log(`🔄 [ترقيم الصفحات] تم تحديث الأزرار. الصفحة الحالية: ${currentPage}, إجمالي العناصر: ${totalItems}`);
    }

    function performSearch() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filteredItems = [];
        let sectionTitle = '';
        let targetGrid, prevBtn, nextBtn;

        if (currentView === 'news') {
            filteredItems = newsData.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.summary.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            );
            sectionTitle = query ? `نتائج البحث عن "${query}" في الأخبار` : 'آخر أخبار كرة القدم';
            targetGrid = newsGrid;
            prevBtn = newsPrevPageBtn;
            nextBtn = newsNextPageBtn;
        } else { // Search across matches (home, live, upcoming, highlights)
            const allMatches = matchesData; // يمكن دمجها إذا كان البحث يشمل كل أنواع المباريات
            filteredItems = allMatches.filter(match =>
                match.title.toLowerCase().includes(query) ||
                match.team1.toLowerCase().includes(query) ||
                match.team2.toLowerCase().includes(query) ||
                (match.league && match.league.toLowerCase().includes(query)) ||
                (match.commentators && match.commentators.toLowerCase().includes(query)) ||
                (match.stadium && match.stadium.toLowerCase().includes(query))
            );
            sectionTitle = query ? `نتائج البحث عن "${query}" في المباريات` : 'أبرز المباريات والجديد';
            targetGrid = mainMatchGrid; // افتراضياً يعرض النتائج في الشبكة الرئيسية للصفحة الرئيسية
            prevBtn = homePrevPageBtn;
            nextBtn = homeNextPageBtn;
        }

        if (currentView !== 'news' && !query) {
            // إذا كان لا يوجد استعلام بحث في عرض المباريات، اعرض مباريات عشوائية (كما كان الحال في الصفحة الرئيسية)
            filteredItems = [...matchesData].sort(() => 0.5 - Math.random());
        }


        if (sectionTitle) {
            if (currentView === 'home' && homeMatchesTitle) homeMatchesTitle.textContent = sectionTitle;
            if (currentView === 'live' && liveMatchesTitle) liveMatchesTitle.textContent = sectionTitle;
            if (currentView === 'upcoming' && upcomingMatchesTitle) upcomingMatchesTitle.textContent = sectionTitle;
            if (currentView === 'highlights' && highlightsTitle) highlightsTitle.textContent = sectionTitle;
            if (currentView === 'news' && newsTitle) newsTitle.textContent = sectionTitle;
        }
        
        currentPage = 1;
        currentDataForPagination = filteredItems;
        paginateItems(currentDataForPagination, currentPage, targetGrid, currentView === 'news' ? 'news' : 'match');
        updatePaginationButtons(currentDataForPagination.length, currentPage, prevBtn, nextBtn);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log(`🔍 [بحث] تم إجراء بحث عن "${query}". تم العثور على ${filteredItems.length} نتيجة في ${currentView} view.`);
    }


    function showMatchDetails(matchId) {
        console.log(`🔍 [توجيه] عرض تفاصيل المباراة للمعّرف: ${matchId}`);
        const match = matchesData.find(m => m.id === matchId);

        if (!match) {
            console.error('❌ [توجيه] المباراة غير موجودة للمعّرف:', matchId, 'يتم إعادة التوجيه إلى الصفحة الرئيسية.');
            showView('home');
            return;
        }

        currentDetailedMatch = match;
        currentView = 'details';
        renderView('match-details-view-template'); // عرض قالب التفاصيل

        // ربط عناصر DOM بعد أن تم إضافتها للصفحة
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

        // التحقق من أن جميع العناصر المطلوبة موجودة
        if (!checkDynamicElements()) return;

        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('[توجيه] تم التمرير للأعلى.');

        matchDetailsTitleElement.textContent = match.title || `${match.team1} vs ${match.team2}` || 'تفاصيل المباراة';
        matchDetailsDescription.textContent = match.description || 'لا يوجد وصف متاح لهذه المباراة.';
        matchDetailsDateTime.textContent = match.date_time ? new Date(match.date_time).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'غير متوفر';
        matchDetailsLeague.textContent = match.league || 'غير متوفر';
        matchDetailsCommentators.textContent = match.commentators || 'غير متوفر';
        matchDetailsTeams.textContent = `${match.team1 || 'الفريق الأول'} vs ${match.team2 || 'الفريق الثاني'}`;
        matchDetailsStadium.textContent = match.stadium || 'غير متوفر';
        matchDetailsStatus.textContent = match.status || 'غير متوفر';

        // عرض النتيجة أو إخفائها بناءً على حالة المباراة
        if (match.status === 'finished' && match.score) {
            matchDetailsScoreContainer.classList.remove('hidden');
            matchDetailsScore.textContent = match.score;
        } else {
            matchDetailsScoreContainer.classList.add('hidden');
        }

        // عرض رابط الملخص أو إخفائه
        if (match.highlights_url) {
            matchDetailsHighlightsContainer.classList.remove('hidden');
            matchDetailsHighlightsLink.href = match.highlights_url;
        } else {
            matchDetailsHighlightsContainer.classList.add('hidden');
        }

        if (matchDetailsPoster) {
            matchDetailsPoster.src = match.thumbnail;
            matchDetailsPoster.alt = match.title;
            matchDetailsPoster.setAttribute('width', '250');
            matchDetailsPoster.setAttribute('height', '180');
            console.log(`[تفاصيل] تم تعيين الصورة المصغرة لـ ${match.title}`);
            matchDetailsPoster.addEventListener('click', () => {
                openAdLink(DIRECT_LINK_COOLDOWN_CARD_CLICK, 'detailsPoster');
            });
        }

        // إنشاء iframe لمشغل الفيديو
        if (matchPlayerContainer) {
            matchPlayerContainer.innerHTML = '';
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
            console.log('[مشغل الفيديو] تم إنشاء iframe جديد للمشغل.');
        }

        // إظهار الغطاء الأولي إذا كان موجودًا
        if (videoOverlay) {
            videoOverlay.style.pointerEvents = 'auto'; // لتمكين النقر على الإعلان
            videoOverlay.classList.remove('hidden');
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'block';
        }
        setTimeout(() => {
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
        }, 2000); // إخفاء spinner بعد ثانيتين، هذا تقديري

        const matchSlug = (match.title || `${match.team1}-vs-${match.team2}`).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
        const newUrl = new URL(window.location.origin);
        newUrl.searchParams.set('view', 'details');
        newUrl.searchParams.set('id', match.id);
        newUrl.searchParams.set('title', matchSlug);

        history.pushState({ view: 'details', id: match.id }, match.title, newUrl.toString());
        console.log(`🔗 [URL] تم تحديث URL إلى ${newUrl.toString()}`);

        updatePageMetadata(match);
        generateAndInjectSchema(match);
        displaySuggestedMatches(match.id);
    }

    // START: Updated function for Meta Tags
    function updatePageMetadata(item = null, type = 'match') { // type يمكن أن يكون 'match' أو 'news' أو null للصفحة الرئيسية
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
            ogImage = item.thumbnail;
            ogType = "video.other"; // يمكن أن يكون video.episode أو video.movie إذا كان مناسباً، لكن other أكثر عمومية للرياضة
            
            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image";

        } else if (item && type === 'news') {
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const itemUrl = `${window.location.origin}/?view=news&id=${item.id}&title=${itemSlug}`; // يمكن تخصيص رابط الأخبار
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
            ogImage = item.image;
            ogType = "article";
            
            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image";

        } else {
            // بيانات الصفحة الرئيسية الافتراضية
            pageTitle = 'شاهد كورة - Ultimate Pitch: تجربة كرة القدم النهائية | بث مباشر وأهداف';
            pageDescription = 'شاهد كورة - ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.';
            pageKeywords = 'شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch';

            ogUrl = window.location.origin + '/';
            canonicalLink.setAttribute('href', ogUrl);
            ogTitle = 'شاهد كورة - Ultimate Pitch: كل كرة القدم في مكان واحد';
            ogDescription = pageDescription;
            ogImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png'; // استبدل برابط شعار موقعك
            ogType = 'website';

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png'; // استبدل برابط شعار موقعك
            twitterCard = "summary_large_image";
        }

        // تحديث جميع الـ meta tags باستخدام الـ IDs
        document.title = pageTitle;
        document.getElementById('dynamic-title').textContent = pageTitle;
        document.getElementById('dynamic-description').setAttribute('content', pageDescription);
        // استخدم querySelector لـ keywords لأنه لا يوجد ID مباشر له في HTML
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (keywordsMeta) keywordsMeta.setAttribute('content', pageKeywords);

        document.getElementById('dynamic-og-title').setAttribute('content', ogTitle);
        document.getElementById('dynamic-og-description').setAttribute('content', ogDescription);
        document.getElementById('dynamic-og-image').setAttribute('content', ogImage);
        document.getElementById('dynamic-og-image-alt').setAttribute('content', ogTitle);
        document.getElementById('dynamic-og-url').setAttribute('content', ogUrl);
        // استخدم querySelector لـ og:type لأنه لا يوجد ID مباشر له في HTML
        const ogTypeMeta = document.querySelector('meta[property="og:type"]');
        if (ogTypeMeta) ogTypeMeta.setAttribute('content', ogType);

        document.getElementById('dynamic-twitter-title').setAttribute('content', twitterTitle);
        document.getElementById('dynamic-twitter-description').setAttribute('content', twitterDescription);
        document.getElementById('dynamic-twitter-image').setAttribute('content', twitterImage);
        // استخدم querySelector لـ twitter:card لأنه لا يوجد ID مباشر له في HTML
        const twitterCardMeta = document.querySelector('meta[property="twitter:card"]');
        if (twitterCardMeta) twitterCardMeta.setAttribute('content', twitterCard);

        document.getElementById('dynamic-canonical').setAttribute('href', canonicalLink.getAttribute('href'));

        console.log('📄 [SEO] تم تحديث الميتا تاجز.');
    }
    // END: Updated function for Meta Tags

    // START: Updated function for JSON-LD Schema
    function generateAndInjectSchema(item = null, type = 'match') { // type يمكن أن يكون 'match' أو 'news' أو null للصفحة الرئيسية
        let schemaScriptElement = document.getElementById('json-ld-schema');
        if (!schemaScriptElement) {
            schemaScriptElement = document.createElement('script');
            schemaScriptElement.type = 'application/ld+json';
            schemaScriptElement.id = 'json-ld-schema';
            document.head.appendChild(schemaScriptElement);
        }

        if (!item) {
            schemaScriptElement.textContent = ''; // مسح أي schema إذا لم يكن هناك عنصر محدد (لصفحة الرئيسية)
            console.log('📄 [SEO] لا يوجد مخطط JSON-LD للصفحة الرئيسية.');
            return;
        }

        let schema = {};

        if (type === 'match') {
            const itemSlug = (item.title || `${item.team1}-vs-${item.team2}`).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const itemUrl = `${window.location.origin}/?view=details&id=${item.id}&title=${itemSlug}`;
            const formattedDate = item.date_time ? new Date(item.date_time).toISOString() : new Date().toISOString();

            schema = {
                "@context": "https://schema.org",
                "@type": "SportsEvent", // نوع مناسب للمباريات
                "name": item.title || `${item.team1} vs ${item.team2}`,
                "description": item.description || `شاهد بث مباشر وملخصات مباراة ${item.title || `${item.team1} ضد ${item.team2}`} على شاهد كورة.`,
                "startDate": formattedDate,
                "location": {
                    "@type": "Place",
                    "name": item.stadium || "ملعب غير معروف"
                },
                "competitor": [
                    { "@type": "SportsTeam", "name": item.team1 },
                    { "@type": "SportsTeam", "name": item.team2 }
                ],
                "eventStatus": "http://schema.org/EventScheduled", // يمكن تحديثها لـ EventLive أو EventCompleted
                "url": itemUrl,
                "image": item.thumbnail,
                "organizer": {
                    "@type": "Organization",
                    "name": "شاهد كورة",
                    "url": "https://shahidkora.online"
                },
                "video": { // إضافة VideoObject كخاصية للحدث الرياضي
                    "@type": "VideoObject",
                    "name": item.title || `${item.team1} vs ${item.team2} - بث مباشر`,
                    "description": item.description || `فيديو بث مباشر لـ ${item.title || `${item.team1} ضد ${item.team2}`}.`,
                    "thumbnailUrl": item.thumbnail,
                    "uploadDate": formattedDate,
                    "contentUrl": item.embed_url, // رابط الفيديو الفعلي
                    "embedUrl": item.embed_url,   // نفس الرابط الذي يتم تضمينه
                    "publisher": {
                        "@type": "Organization",
                        "name": "شاهد كورة",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png", // شعار موقعك
                            "width": 200, "height": 50
                        }
                    }
                }
            };

            // إضافة النتيجة إذا كانت المباراة منتهية
            if (item.status === 'finished' && item.score) {
                schema.eventStatus = "http://schema.org/EventCompleted";
                schema.result = {
                    "@type": "SportsEventStatus",
                    "name": item.score // يمكن تحسينه ليكون أكثر تفصيلاً مثل "score"
                };
            }

        } else if (type === 'news') {
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const itemUrl = `${window.location.origin}/?view=news&id=${item.id}&title=${itemSlug}`; // يمكن تخصيص رابط الأخبار
            const formattedDate = item.date ? new Date(item.date).toISOString() : new Date().toISOString();

            schema = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": item.title,
                "image": item.image,
                "datePublished": formattedDate,
                "dateModified": formattedDate, // يمكن أن يكون تاريخ التعديل إن وجد
                "author": {
                    "@type": "Person",
                    "name": item.author || "شاهد كورة"
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
        console.log('📄 [SEO] تم إضافة/تحديث مخطط JSON-LD الجديد.');
    }
    // END: Updated function for JSON-LD Schema

    function displaySuggestedMatches(currentMatchId) {
        if (!suggestedMatchGrid || !currentDetailedMatch) {
            console.error('❌ displaySuggestedMatches: suggestedMatchGrid أو currentDetailedMatch غير موجودين. لا يمكن عرض المباريات المقترحة.');
            return;
        }

        const currentMatchLeague = currentDetailedMatch.league;
        let suggested = [];

        if (currentMatchLeague) {
            // البحث عن مباريات من نفس الدوري
            suggested = matchesData.filter(match =>
                match.id !== currentMatchId &&
                match.league && match.league.toLowerCase() === currentMatchLeague.toLowerCase()
            );
            suggested = suggested.sort(() => 0.5 - Math.random());
        }

        // إذا لم يكن هناك ما يكفي من الاقتراحات من نفس الدوري، أضف مباريات عشوائية
        if (suggested.length < 12) { // عرض 12 اقتراح
            const otherMatches = matchesData.filter(match =>
                match.id !== currentMatchId && !suggested.includes(match)
            );
            const shuffledOthers = otherMatches.sort(() => 0.5 - Math.random());
            const needed = 12 - suggested.length;
            suggested = [...suggested, ...shuffledOthers.slice(0, needed)];
        }

        const finalSuggested = suggested.slice(0, 12);

        if (finalSuggested.length === 0) {
            suggestedMatchGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">لا توجد مباريات مقترحة حالياً.</p>';
            console.log('✨ [اقتراحات] لا توجد مباريات مقترحة متاحة بعد التصفية.');
            return;
        }

        displayItems(finalSuggested, suggestedMatchGrid, 'match');
        console.log(`✨ [اقتراحات] تم عرض ${finalSuggested.length} مباراة مقترحة في ${suggestedMatchGrid.id}.`);
    }

    // --- 5. View Management and Routing ---

    function renderView(templateId) {
        const template = document.getElementById(templateId);
        if (!template) {
            console.error(`❌ قالب العرض بالمعرّف "${templateId}" غير موجود.`);
            return;
        }
        // إزالة جميع العروض النشطة حالياً
        document.querySelectorAll('.view-section').forEach(section => section.remove());
        
        // إزالة hero-section أيضاً عند الانتقال لعرض آخر غير الرئيسية
        if (heroSection) heroSection.style.display = 'none';

        const clone = document.importNode(template.content, true);
        contentDisplay.appendChild(clone);
        console.log(`✅ [عرض] تم عرض القالب: ${templateId}`);

        // ربط العناصر بعد إضافة القالب للدوم
        if (templateId === 'home-view-template') {
            mainMatchGrid = document.getElementById('main-match-grid');
            homeMatchesTitle = document.getElementById('home-matches-title');
            homePrevPageBtn = document.getElementById('home-prev-page-btn');
            homeNextPageBtn = document.getElementById('home-next-page-btn');
            if (heroSection) heroSection.style.display = 'flex'; // إظهار hero في الرئيسية
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
        // Match details elements are linked in showMatchDetails as they are part of a specific flow

        // إعادة ربط مستمعي الأحداث للعناصر الديناميكية
        attachDynamicEventListeners();
    }


    function showView(viewName, filter = null) {
        currentView = viewName;
        currentPage = 1; // إعادة تعيين الصفحة عند تغيير العرض
        currentDataForPagination = []; // مسح بيانات الترقيم السابقة

        // إخفاء الـ hero section بشكل افتراضي ما لم يكن العرض هو 'home'
        if (heroSection) {
            heroSection.style.display = 'none';
        }

        // مسح محتوى iframe عند الانتقال من صفحة التفاصيل
        if (matchPlayerContainer) {
            matchPlayerContainer.innerHTML = '';
            console.log('[مشغل الفيديو] تم مسح match-player-container عند الانتقال.');
        }
        if (videoOverlay) {
            videoOverlay.style.pointerEvents = 'none';
            videoOverlay.classList.add('hidden');
        }
        if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
        
        currentDetailedMatch = null; // مسح المباراة المفصلة

        let newUrl = new URL(window.location.origin);

        switch (viewName) {
            case 'home':
                renderView('home-view-template');
                homeMatchesTitle.textContent = 'أبرز المباريات والجديد';
                currentDataForPagination = [...matchesData].sort(() => 0.5 - Math.random());
                paginateItems(currentDataForPagination, currentPage, mainMatchGrid, 'match');
                updatePaginationButtons(currentDataForPagination.length, currentPage, homePrevPageBtn, homeNextPageBtn);
                newUrl.searchParams.delete('view'); // للرئيسية لا نحتاج view
                updatePageMetadata(); // بيانات الرئيسية
                generateAndInjectSchema();
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
                updatePageMetadata(null, 'live'); // يمكن تمرير null أو بيانات عامة لـ live view
                generateAndInjectSchema(); // لا يوجد schema محدد لقائمة كاملة
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
                currentDataForPagination = newsData; // بيانات الأخبار
                paginateItems(currentDataForPagination, currentPage, newsGrid, 'news');
                updatePaginationButtons(currentDataForPagination.length, currentPage, newsPrevPageBtn, newsNextPageBtn);
                newsEmptyState.style.display = newsData.length === 0 ? 'block' : 'none';
                newUrl.searchParams.set('view', 'news');
                updatePageMetadata(null, 'news');
                generateAndInjectSchema();
                break;
            // 'details' case handled by showMatchDetails function
        }
        history.pushState({ view: viewName, filter: filter }, document.title, newUrl.toString());
        console.log(`🔗 [URL] تم تحديث URL إلى ${newUrl.toString()}`);
        console.log(`🔄 [عرض] تم التبديل إلى عرض: ${viewName}`);

        // إغلاق قائمة التنقل على الموبايل
        if (mainNav && mainNav.classList.contains('nav-open')) {
            mainNav.classList.remove('nav-open');
        }
    }

    // --- 6. Event Listeners ---

    function attachDynamicEventListeners() {
        // إزالة المستمعين القدامى لتجنب التكرار (خاصة للأزرار التي تتغير مع القوالب)
        // هذا الجزء يصبح معقداً بعض الشيء مع المستمعين الديناميكيين.
        // طريقة أفضل هي استخدام Event Delegation حيثما أمكن.
        // للأزرار الفردية مثل "العودة للصفحة الرئيسية"، يمكننا إزالتها وإعادة إضافتها.

        // Global listeners (attached once on DOMContentLoaded)
        if (menuToggle && mainNav) {
            menuToggle.onclick = () => {
                mainNav.classList.toggle('nav-open');
                console.log('☰ [تفاعل] تم تبديل القائمة.');
            };
        }

        if (homeLogoLink) {
            homeLogoLink.onclick = (e) => {
                e.preventDefault();
                console.log('🏠 [تفاعل] تم النقر على شعار الصفحة الرئيسية.');
                showView('home');
            };
        }

        if (watchNowBtn) {
            watchNowBtn.onclick = (e) => {
                e.preventDefault();
                console.log('🎬 [تفاعل] تم النقر على زر "شاهد الآن".');
                if (mainMatchGrid) mainMatchGrid.scrollIntoView({ behavior: 'smooth' });
                else showView('home'); // في حال لم يكن الـ grid مرئياً
            };
        }

        if (searchButton) {
            searchButton.onclick = performSearch;
        }
        if (searchInput) {
            searchInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                    searchInput.blur();
                }
            };
        }

        // Navigation links (using event delegation for simplicity or re-attaching)
        navLinks.forEach(link => {
            // إزالة المستمعين السابقين لتجنب التكرار
            link.removeEventListener('click', handleNavLinkClick);
            link.addEventListener('click', handleNavLinkClick);
        });

        // Event delegation for pagination buttons
        // يمكننا استخدام مستمع واحد للحاويات التي تحتوي على الأزرار
        contentDisplay.removeEventListener('click', handlePaginationClick);
        contentDisplay.addEventListener('click', handlePaginationClick);

        // Event delegation for filter buttons
        contentDisplay.removeEventListener('click', handleFilterButtonClick);
        contentDisplay.addEventListener('click', handleFilterButtonClick);

        // Specific listeners for 'details' view, attached only when that view is rendered
        if (currentView === 'details') {
            if (backToHomeBtn) {
                backToHomeBtn.onclick = () => {
                    console.log('🔙 [تفاعل] تم النقر على زر العودة للمباريات.');
                    showView('home'); // العودة للرئيسية أو آخر صفحة مباريات
                };
            }
            if (videoOverlay) {
                videoOverlay.onclick = async (e) => {
                    console.log('⏯️ [نقر إعلان] تم النقر على غطاء الفيديو. محاولة فتح الرابط المباشر.');
                    const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');

                    if (adOpened) {
                        videoOverlay.style.pointerEvents = 'none';
                        videoOverlay.classList.add('hidden');
                        if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                        console.log('[مشغل الفيديو] تم إخفاء الغطاء والسماح بالتعامل مع iframe بعد فتح الإعلان.');
                    } else {
                        console.log('[غطاء الفيديو] الإعلان لم يفتح بسبب التهدئة. سيظل الغطاء نشطًا.');
                    }
                    e.stopPropagation();
                };
            }
        }
    }

    function handleNavLinkClick(e) {
        e.preventDefault();
        const targetView = e.target.dataset.targetView;
        if (targetView) {
            console.log(`🏠 [تفاعل] تم النقر على رابط التنقل: ${targetView}`);
            showView(targetView);
            navLinks.forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');
        }
    }

    function handlePaginationClick(e) {
        const target = e.target.closest('.btn-page');
        if (!target) return;

        let dataArray, targetGrid, prevBtn, nextBtn;
        let currentSectionPage = currentPage; // Assume current section page is global currentPage for now

        if (currentView === 'home' && mainMatchGrid) {
            dataArray = matchesData; // Home view displays random matches
            targetGrid = mainMatchGrid;
            prevBtn = homePrevPageBtn;
            nextBtn = homeNextPageBtn;
        } else if (currentView === 'live' && liveMatchGrid) {
            dataArray = matchesData.filter(m => m.status === 'live');
            targetGrid = liveMatchGrid;
            prevBtn = livePrevPageBtn;
            nextBtn = liveNextPageBtn;
        } else if (currentView === 'upcoming' && upcomingMatchGrid) {
            const currentFilter = document.querySelector('#upcoming-matches-section .filter-btn.active')?.dataset.filterValue;
            dataArray = matchesData.filter(m => m.status === 'upcoming');
            if (currentFilter === 'today') {
                const today = new Date().toISOString().slice(0, 10);
                dataArray = dataArray.filter(m => m.date_time && m.date_time.startsWith(today));
            } else if (currentFilter === 'tomorrow') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                dataArray = dataArray.filter(m => m.date_time && m.date_time.startsWith(tomorrowStr));
            }
            targetGrid = upcomingMatchGrid;
            prevBtn = upcomingPrevPageBtn;
            nextBtn = upcomingNextPageBtn;
        } else if (currentView === 'highlights' && highlightsGrid) {
            dataArray = matchesData.filter(m => m.highlights_url);
            targetGrid = highlightsGrid;
            prevBtn = highlightsPrevPageBtn;
            nextBtn = highlightsNextPageBtn;
        } else if (currentView === 'news' && newsGrid) {
            dataArray = newsData;
            targetGrid = newsGrid;
            prevBtn = newsPrevPageBtn;
            nextBtn = newsNextPageBtn;
        } else {
            return; // Not a paginated section
        }

        if (target.id.includes('next-page-btn')) {
            const totalPages = Math.ceil(dataArray.length / itemsPerPage);
            if (currentSectionPage < totalPages) {
                currentPage++;
            }
        } else if (target.id.includes('prev-page-btn')) {
            if (currentSectionPage > 1) {
                currentPage--;
            }
        }
        
        paginateItems(dataArray, currentPage, targetGrid, currentView === 'news' ? 'news' : 'match');
        updatePaginationButtons(dataArray.length, currentPage, prevBtn, nextBtn);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleFilterButtonClick(e) {
        const target = e.target.closest('.filter-btn');
        if (!target) return;

        const filterType = target.dataset.filterType;
        const filterValue = target.dataset.filterValue;

        document.querySelectorAll(`#${currentView}-matches-section .filter-btn`).forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        if (currentView === 'live') {
            // Live matches typically only have one filter option "All Live"
            const liveMatches = matchesData.filter(m => m.status === 'live');
            currentPage = 1;
            currentDataForPagination = liveMatches;
            paginateItems(currentDataForPagination, currentPage, liveMatchGrid, 'match');
            updatePaginationButtons(currentDataForPagination.length, currentPage, livePrevPageBtn, liveNextPageBtn);
            liveEmptyState.style.display = liveMatches.length === 0 ? 'block' : 'none';
        } else if (currentView === 'upcoming') {
            let upcomingMatches = matchesData.filter(m => m.status === 'upcoming');
            if (filterValue === 'today') {
                const today = new Date().toISOString().slice(0, 10);
                upcomingMatches = upcomingMatches.filter(m => m.date_time && m.date_time.startsWith(today));
                upcomingMatchesTitle.textContent = 'مباريات اليوم';
            } else if (filterValue === 'tomorrow') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().slice(0, 10);
                upcomingMatches = upcomingMatches.filter(m => m.date_time && m.date_time.startsWith(tomorrowStr));
                upcomingMatchesTitle.textContent = 'مباريات الغد';
            } else { // "All Upcoming"
                upcomingMatchesTitle.textContent = 'مواعيد مباريات كرة القدم القادمة';
            }
            currentPage = 1;
            currentDataForPagination = upcomingMatches;
            paginateItems(currentDataForPagination, currentPage, upcomingMatchGrid, 'match');
            updatePaginationButtons(currentDataForPagination.length, currentPage, upcomingPrevPageBtn, upcomingNextPageBtn);
            upcomingEmptyState.style.display = upcomingMatches.length === 0 ? 'block' : 'none';
        }
        console.log(`⚡ [تصفية] تم تطبيق التصفية: ${filterType}=${filterValue} على عرض ${currentView}.`);
    }


    // Lazy Load Initialization (same as before)
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
                                if (sourceElement && sourceElement.srcset !== image.dataset.src.replace(/\.(png|jpe?g)/i, '.webp')) { // Ensure webp srcset is set
                                    sourceElement.srcset = image.dataset.src.replace(/\.(png|jpe?g)/i, '.webp');
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
        console.log('🖼️ [تحميل كسول] تم تهيئة IntersectionObserver للصور (أو العودة للخيار البديل).');
    }

    // --- 7. Security Measures (Same as before) ---
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        console.warn('🚫 [أمان] تم تعطيل النقر بالزر الأيمن.');
    });

    document.addEventListener('keydown', e => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.metaKey && e.altKey && e.key === 'I')
        ) {
            e.preventDefault();
            console.warn(`🚫 [أمان] تم منع اختصار لوحة المفاتيح لأدوات المطور/المصدر: ${e.key}`);
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
                    console.warn('🚨 [أمان] تم اكتشاف أدوات المطور! هذا الإجراء غير مشجع.');
                }
            } else {
                if (isOpen) {
                    isOpen = false;
                    console.log('✅ [أمان] تم إغلاق أدوات المطور.');
                }
            }
        };
        window.addEventListener('resize', checkDevTools);
        setInterval(checkDevTools, 1000);
        checkDevTools();
    })();

    // --- 8. Initial Load and History Management ---

    function initialPageLoadLogic() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        const idParam = urlParams.get('id');
        const filterParam = urlParams.get('filter');

        // Global check for static elements
        const requiredStaticElements = {
            '#menu-toggle': menuToggle,
            '#main-nav': mainNav,
            '#home-logo-link': homeLogoLink,
            '#search-input': searchInput,
            '#search-button': searchButton,
            '#content-display': contentDisplay,
            '#hero-section': heroSection,
            '#watch-now-btn': watchNowBtn,
            '#home-nav-link-actual': document.getElementById('home-nav-link-actual') // هذا لا يتغير
        };

        let criticalStaticError = false;
        for (const [id, element] of Object.entries(requiredStaticElements)) {
            if (!element) {
                console.error(`❌ خطأ فادح: العنصر الثابت بالمعرّف "${id}" غير موجود. يرجى التحقق من ملف HTML الخاص بك.`);
                criticalStaticError = true;
            }
        }
        if (criticalStaticError) {
            console.error('🛑 لن يتم تنفيذ السكريبت بالكامل بسبب عناصر DOM الثابتة الأساسية المفقودة. قم بإصلاح HTML الخاص بك!');
            document.body.innerHTML = '<div style="text-align: center; margin-top: 100px; color: #f44336; font-size: 20px;">' +
                                        'عذرًا، حدث خطأ فني. يرجى تحديث الصفحة أو المحاولة لاحقًا.' +
                                        '<p style="font-size: 14px; color: #ccc;">(عناصر الصفحة الرئيسية مفقودة)</p></div>';
            return;
        } else {
            console.log('✅ تم العثور على جميع عناصر DOM الثابتة الأساسية.');
        }

        if (viewParam === 'details' && idParam) {
            const matchId = parseInt(idParam);
            const match = matchesData.find(m => m.id === matchId);
            if (!isNaN(matchId) && match) {
                console.log(`🚀 [تحميل أولي] محاولة تحميل تفاصيل المباراة من URL: المعّرف ${matchId}`);
                showMatchDetails(matchId);
            } else {
                console.warn('⚠️ [تحميل أولي] معّرف المباراة غير صالح في URL أو المباراة غير موجودة. يتم عرض الصفحة الرئيسية.');
                showView('home');
            }
        } else if (viewParam) {
            console.log(`🚀 [تحميل أولي] محاولة تحميل العرض من URL: ${viewParam}`);
            showView(viewParam, filterParam);
            // تفعيل رابط التنقل المقابل
            const activeNavLink = document.querySelector(`.main-nav ul li a[data-target-view="${viewParam}"]`);
            if (activeNavLink) {
                navLinks.forEach(link => link.classList.remove('active'));
                activeNavLink.classList.add('active');
            }
        } else {
            console.log('🚀 [تحميل أولي] لا يوجد عرض محدد في URL. يتم عرض الصفحة الرئيسية.');
            showView('home');
        }
        attachDynamicEventListeners(); // إرفاق المستمعين بعد تهيئة العرض الأولي
    }

    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] تم اكتشاف تصفح سجل المتصفح.', event.state);
        if (matchesData.length === 0 || newsData.length === 0) {
            console.warn('[Popstate] لم يتم تحميل بيانات المباريات/الأخبار بعد، محاولة جلب البيانات وعرض الصفحة بناءً على الحالة.');
            loadAllData().then(() => { // إعادة تحميل كل البيانات ثم محاولة العرض
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
                console.error('[Popstate] فشل جلب البيانات عند popstate:', err);
                // عرض رسالة خطأ للمستخدم
                document.body.innerHTML = '<div style="text-align: center; margin-top: 100px; color: #f44336; font-size: 20px;">' +
                                            'عذرًا، حدث خطأ فني أثناء تحميل البيانات. يرجى تحديث الصفحة.' +
                                            '<p style="font-size: 14px; color: #ccc;">(خطأ في استعادة حالة الصفحة)</p></div>';
            });
            return;
        }

        // إذا كانت البيانات موجودة بالفعل
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

    // ابدأ بتحميل كل البيانات
    loadAllData();
});
