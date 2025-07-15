// script.js - هذا الكود محسن وواضح لمحركات البحث والمطورين
// تم التركيز على أفضل أداء ممكن من جانب العميل مع الحفاظ على الوظائف والإعلانات
// والتأكد من إزالة أي عناصر قد تؤثر سلباً على الفهم من قبل محركات البحث

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Script execution started.');

    // --- 1. DOM Element References ---
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const homeNavLink = document.getElementById('home-nav-link-actual');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const heroSection = document.getElementById('hero-section');
    const watchNowBtn = document.getElementById('watch-now-btn');
    // Note: movieGridSection is from the previous context, assuming it's equivalent to match-grid-section for general listing
    const movieGridSection = document.getElementById('match-grid-section'); 
    const movieDetailsSection = document.querySelector('.match-details-section'); // Adjusted selector to class for template
    const movieGrid = document.getElementById('main-match-grid'); // Adjusted ID for main grid
    const suggestedMovieGrid = document.getElementById('suggested-match-grid'); // Adjusted ID for suggested grid
    const suggestedMoviesSection = document.querySelector('.suggested-matches-section'); // Adjusted selector to class for template
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const videoContainer = document.getElementById('match-player-container'); // Adjusted ID for video container
    const videoOverlay = document.getElementById('video-overlay');
    const homeLogoLink = document.getElementById('home-logo-link');
    const videoLoadingSpinner = document.getElementById('video-loading-spinner');
    const movieDetailsPoster = document.getElementById('match-details-poster'); // Adjusted ID for details poster
    
    // Pagination buttons - assuming these are for the main home page grid
    const prevPageBtn = document.getElementById('home-prev-page-btn');
    const nextPageBtn = document.getElementById('home-next-page-btn');
    
    // ****** تحسين الأداء على الموبايل: عدد الأفلام المعروضة لكل صفحة ******
    // إذا كنت قد غيرت هذا الرقم إلى 76، فهذا هو السبب الرئيسي في تدهور الأداء.
    // القيمة 30 هي نقطة بداية جيدة. لزيادة الأداء على الموبايل، يمكنك تقليلها إلى 20 أو 24.
    const matchesPerPage = 30; // القيمة الموصى بها لأداء أفضل على الموبايل

    let currentPage = 1;
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const sectionTitleElement = movieGridSection ? movieGridSection.querySelector('h2') : null;

    // --- 1.1. Critical DOM Element Verification ---
    const requiredElements = {
        '#main-match-grid': movieGrid,
        '#match-grid-section': movieGridSection,
        '.match-details-section': movieDetailsSection,
        '#hero-section': heroSection,
        '#match-player-container': videoContainer,
        '#video-overlay': videoOverlay,
        '#suggested-match-grid': suggestedMovieGrid,
        '.suggested-matches-section': suggestedMoviesSection,
        '#video-loading-spinner': videoLoadingSpinner,
        '#match-details-title-element': document.getElementById('match-details-title-element'), // Adjusted ID
        '#match-details-description': document.getElementById('match-details-description'),
        '#match-details-date-time': document.getElementById('match-details-date-time'),
        '#match-details-league': document.getElementById('match-details-league'),
        '#match-details-commentators': document.getElementById('match-details-commentators'),
        '#match-details-teams': document.getElementById('match-details-teams'),
        '#match-details-stadium': document.getElementById('match-details-stadium'),
        '#match-details-status': document.getElementById('match-details-status'),
        '#match-details-score-container': document.getElementById('match-details-score-container'),
        '#match-details-score': document.getElementById('match-details-score'),
        '#match-details-highlights-container': document.getElementById('match-details-highlights-container'),
        '#match-details-highlights-link': document.getElementById('match-details-highlights-link'),
        '#home-nav-link-actual': homeNavLink
    };

    let criticalError = false;
    for (const [id, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`❌ خطأ فادح: العنصر بالمعرّف/المحدد "${id}" غير موجود. يرجى التحقق من ملف HTML الخاص بك.`);
            criticalError = true;
        }
    }
    if (criticalError) {
        console.error('🛑 لن يتم تنفيذ السكريبت بالكامل بسبب عناصر DOM الأساسية المفقودة. قم بإصلاح HTML الخاص بك!');
        document.body.innerHTML = '<div style="text-align: center; margin-top: 100px; color: #f44336; font-size: 20px;">' +
                                    'عذرًا، حدث خطأ فني. يرجى تحديث الصفحة أو المحاولة لاحقًا.' +
                                    '<p style="font-size: 14px; color: #ccc;">(عناصر الصفحة الرئيسية مفقودة)</p></div>';
        return;
    } else {
        console.log('✅ تم العثور على جميع عناصر DOM الأساسية.');
    }

    // --- 2. Adsterra Configuration (لم يتم لمسها) ---
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/spqbhmyax?key=2469b039d4e7c471764bd04c57824cf2';
    const DIRECT_LINK_COOLDOWN_MOVIE_CARD = 3 * 60 * 1000; // 3 minutes
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 10 * 1000; // 10 seconds

    let lastDirectLinkClickTimeMovieCard = 0;
    let lastDirectLinkClickTimeVideoInteraction = 0;

    function openAdLink(cooldownDuration, type) {
        let lastClickTime;
        let setLastClickTime;

        if (type === 'movieCard' || type === 'movieDetailsPoster') {
            lastClickTime = lastDirectLinkClickTimeMovieCard;
            setLastClickTime = (time) => lastDirectLinkClickTimeMovieCard = time;
        } else if (type === 'videoOverlay' || type === 'videoSeek' || type === 'videoPause' || type === 'videoEndedRestart') {
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

    // --- 3. Match Data & Video URL Handling ---
    let matchesData = []; // Renamed from moviesData to matchesData for clarity
    let matchesDataForPagination = []; // Renamed for clarity
    let currentDetailedMatch = null; // Renamed from currentDetailedMovie

    async function fetchMatchesData() { // Renamed from fetchMoviesData
        try {
            console.log('📡 جلب بيانات المباريات من matches.json...');
            const response = await fetch('matches.json'); // Changed to matches.json
            if (!response.ok) {
                throw new Error(`خطأ HTTP! الحالة: ${response.status} - تعذر تحميل matches.json. تحقق من مسار الملف وتكوين الخادم.`);
            }
            matchesData = await response.json(); // Renamed
            if (!Array.isArray(matchesData)) {
                console.error('❌ البيانات التي تم جلبها ليست مصفوفة. يرجى التحقق من تنسيق matches.json. المتوقع مصفوفة من كائنات المباريات.');
                matchesData = [];
            } else if (matchesData.length === 0) {
                console.warn('⚠️ تم تحميل matches.json، ولكنه فارغ.');
            }
            console.log('✅ تم تحميل بيانات المباريات بنجاح من matches.json', matchesData.length, 'مباراة تم العثور عليهم.');
            initialPageLoadLogic();
        } catch (error) {
            console.error('❌ فشل تحميل بيانات المباريات:', error.message);
            if (movieGrid) { // Using movieGrid as the general home grid
                movieGrid.innerHTML = '<p style="text-align: center; color: var(--text-color); margin-top: 50px;">عذرًا، لم نتمكن من تحميل بيانات المباريات. يرجى المحاولة مرة أخرى لاحقًا أو التحقق من ملف matches.json.</p>';
            }
            if (sectionTitleElement) {
                sectionTitleElement.textContent = 'خطأ في تحميل المباريات';
            }
        }
    }

    function createMatchCard(match) { // Renamed from createMovieCard
        const matchCard = document.createElement('div');
        matchCard.classList.add('match-card'); // Changed class to match-card
        const webpSource = match.thumbnail.replace(/\.(png|jpe?g)/i, '.webp'); // Changed from poster to thumbnail
        matchCard.innerHTML = `
            <picture>
                <source srcset="${webpSource}" type="image/webp" onerror="this.remove()">
                <img data-src="${match.thumbnail}" src="${match.thumbnail}" alt="${match.title}" class="lazyload" width="300" height="180" loading="lazy">
            </picture>
            <h3>${match.title}</h3>
            <p>${match.league}</p>
            <p>${match.date} - ${match.time}</p>
        `;
        matchCard.addEventListener('click', () => {
            console.log(`⚡ [تفاعل] تم النقر على بطاقة المباراة للمعّرف: ${match.id}`);
            openAdLink(DIRECT_LINK_COOLDOWN_MOVIE_CARD, 'movieCard'); // Reusing movieCard type for ad cooldown
            showMatchDetails(match.id); // Renamed from showMovieDetails
        });
        return matchCard;
    }

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
                                if (sourceElement && sourceElement.dataset.srcset) {
                                    sourceElement.srcset = sourceElement.dataset.srcset;
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
                        if (sourceElement && sourceElement.dataset.srcset) {
                            sourceElement.srcset = sourceElement.dataset.srcset;
                        }
                    }
                }
            });
        }
        console.log('🖼️ [تحميل كسول] تم تهيئة IntersectionObserver للصور (أو العودة للخيار البديل).');
    }

    function displayMatches(matchesToDisplay, targetGridElement) { // Renamed from displayMovies
        if (!targetGridElement) {
            console.error('❌ displayMatches: العنصر المستهدف للشبكة فارغ أو غير معرّف.');
            return;
        }
        targetGridElement.innerHTML = ''; // مسح المحتوى القديم

        if (!matchesToDisplay || matchesToDisplay.length === 0) {
            targetGridElement.innerHTML = '<p style="text-align: center; color: var(--text-muted);">لا توجد مباريات مطابقة للبحث أو مقترحة.</p>';
            console.log(`⚽ [عرض] لا توجد مباريات للعرض في ${targetGridElement.id}.`);
            return;
        }

        console.log(`⚽ [عرض] جاري عرض ${matchesToDisplay.length} مباراة في ${targetGridElement.id}.`);
        matchesToDisplay.forEach(match => {
            targetGridElement.appendChild(createMatchCard(match));
        });
        console.log(`⚽ [عرض] تم عرض ${matchesToDisplay.length} مباراة في ${targetGridElement.id}.`);
        initializeLazyLoad(); // إعادة تهيئة التحميل الكسول للعناصر الجديدة
    }

    function paginateMatches(matchesArray, page) { // Renamed from paginateMovies
        if (!Array.isArray(matchesArray) || matchesArray.length === 0) {
            displayMatches([], movieGrid);
            updatePaginationButtons(0);
            return;
        }

        const startIndex = (page - 1) * matchesPerPage;
        const endIndex = startIndex + matchesPerPage;
        const paginatedMatches = matchesArray.slice(startIndex, endIndex);

        displayMatches(paginatedMatches, movieGrid);
        updatePaginationButtons(matchesArray.length);
        console.log(`➡️ [ترقيم الصفحات] يتم عرض الصفحة ${page}. المباريات من الفهرس ${startIndex} إلى ${Math.min(endIndex, matchesArray.length)-1}.`);
    }

    function updatePaginationButtons(totalMatches) { // Renamed from updatePaginationButtons (but still for home page)
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage * matchesPerPage >= totalMatches;
        console.log(`🔄 [ترقيم الصفحات] تم تحديث الأزرار. الصفحة الحالية: ${currentPage}, إجمالي المباريات: ${totalMatches}`);
    }

    function performSearch() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filteredMatches = []; // Renamed
        if (query) {
            filteredMatches = matchesData.filter(match => // Renamed
                match.title.toLowerCase().includes(query) ||
                (match.league && match.league.toLowerCase().includes(query)) ||
                (match.team1 && match.team1.toLowerCase().includes(query)) ||
                (match.team2 && match.team2.toLowerCase().includes(query)) ||
                (match.commentators && String(match.commentators).toLowerCase().includes(query))
            );
            if (sectionTitleElement) {
                sectionTitleElement.textContent = `نتائج البحث عن "${query}"`;
            }
            console.log(`🔍 [بحث] تم إجراء بحث عن "${query}". تم العثور على ${filteredMatches.length} نتيجة.`);
        } else {
            filteredMatches = [...matchesData].sort(() => 0.5 - Math.random()); // Renamed
            if (sectionTitleElement) {
                sectionTitleElement.textContent = 'أبرز المباريات والجديد'; // Adjusted title
            }
            console.log('🔍 [بحث] استعلام البحث فارغ، يتم عرض جميع المباريات (عشوائياً).');
        }
        currentPage = 1;
        matchesDataForPagination = filteredMatches; // Renamed
        paginateMatches(matchesDataForPagination, currentPage); // Renamed
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function showMatchDetails(matchId) { // Renamed from showMovieDetails
        console.log(`🔍 [توجيه] عرض تفاصيل المباراة للمعّرف: ${matchId}`);
        const match = matchesData.find(m => m.id === matchId); // Renamed

        if (match) {
            currentDetailedMatch = match; // Renamed

            if (heroSection) heroSection.style.display = 'none';
            if (movieGridSection) movieGridSection.style.display = 'none';
            // Also hide other main sections if they are not part of the details view
            document.querySelectorAll('.view-section').forEach(section => {
                if (section.id !== movieDetailsSection.id) { // Keep movieDetailsSection visible
                    section.style.display = 'none';
                }
            });


            // Clear previous video player content
            if (videoContainer) {
                videoContainer.innerHTML = ''; 
                // Create an iframe element instead of a video element
                const newIframeElement = document.createElement('iframe');
                newIframeElement.id = 'match-player-iframe'; // New ID for the iframe
                newIframeElement.classList.add('video-player-iframe'); // Add a class for styling
                newIframeElement.setAttribute('src', match.embed_url); // Directly use embed_url for iframe
                newIframeElement.setAttribute('frameborder', '0');
                newIframeElement.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture'); // Crucial for mobile and fullscreen
                newIframeElement.setAttribute('allowfullscreen', ''); // For older browsers
                newIframeElement.setAttribute('width', '100%'); // Ensure responsiveness, can be set via CSS
                newIframeElement.setAttribute('height', '100%'); // Ensure responsiveness, can be set via CSS
                newIframeElement.setAttribute('referrerpolicy', 'origin'); // Recommended for embeds
                videoContainer.appendChild(newIframeElement);
                console.log('[مشغل الفيديو] تم إنشاء عنصر iframe لمشغل الفيديو.');
            } else {
                console.error('❌ خطأ فادح: match-player-container غير موجود. لا يمكن إنشاء مشغل الفيديو.');
                return;
            }

            // Show the match details section and suggested matches
            if (movieDetailsSection) movieDetailsSection.style.display = 'block';
            if (suggestedMoviesSection) suggestedMoviesSection.style.display = 'block';

            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.log('[توجيه] تم التمرير للأعلى.');

            // Populate match details
            document.getElementById('match-details-title-element').textContent = match.title || 'غير متوفر';
            document.getElementById('match-details-description').textContent = match.description || 'لا يوجد وصف متاح.';
            document.getElementById('match-details-date-time').textContent = `${match.date || 'غير متوفر'} - ${match.time || 'غير متوفر'}`;
            document.getElementById('match-details-league').textContent = match.league || 'غير متوفر';
            document.getElementById('match-details-commentators').textContent = Array.isArray(match.commentators) ? match.commentators.join(', ') : match.commentators || 'غير متوفر';
            document.getElementById('match-details-teams').textContent = `${match.team1 || 'فريق غير متوفر'} vs ${match.team2 || 'فريق غير متوفر'}`;
            document.getElementById('match-details-stadium').textContent = match.stadium || 'غير متوفر';
            document.getElementById('match-details-status').textContent = match.status || 'غير متوفر';

            // Show/hide score and highlights based on match status
            const scoreContainer = document.getElementById('match-details-score-container');
            const highlightsContainer = document.getElementById('match-details-highlights-container');
            
            if (match.status === 'انتهت' || match.status === 'مؤجلة') { // Assuming 'انتهت' for finished matches
                if (scoreContainer) {
                    scoreContainer.classList.remove('hidden');
                    document.getElementById('match-details-score').textContent = match.score || 'غير متوفر';
                }
                if (highlightsContainer) {
                    if (match.highlights_url) {
                        highlightsContainer.classList.remove('hidden');
                        document.getElementById('match-details-highlights-link').href = match.highlights_url;
                    } else {
                        highlightsContainer.classList.add('hidden');
                    }
                }
            } else {
                if (scoreContainer) scoreContainer.classList.add('hidden');
                if (highlightsContainer) highlightsContainer.classList.add('hidden');
            }


            if (movieDetailsPoster) { // Renamed from movieDetailsPoster to match HTML ID
                movieDetailsPoster.src = match.thumbnail; // Changed from poster to thumbnail
                movieDetailsPoster.alt = match.title;
                movieDetailsPoster.setAttribute('width', '250'); // Consistent with HTML
                movieDetailsPoster.setAttribute('height', '180'); // Consistent with HTML
                console.log(`[تفاصيل] تم تعيين البوستر لـ ${match.title}`);
            }

            // The videoOverlay logic for iframe
            if (videoOverlay) {
                // Ensure overlay is visible and clickable initially
                videoOverlay.style.pointerEvents = 'auto';
                videoOverlay.classList.remove('hidden');
                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none'; // Hide spinner until user click/ad interaction
            }


            const matchSlug = match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const newUrl = new URL(window.location.origin);
            newUrl.searchParams.set('view', 'details');
            newUrl.searchParams.set('id', matchId);
            newUrl.searchParams.set('title', matchSlug);

            history.pushState({ view: 'details', id: matchId }, match.title, newUrl.toString());
            console.log(`🔗 [URL] تم تحديث URL إلى ${newUrl.toString()}`);

            // استدعاء الدوال المعدلة
            updatePageMetadata(match);
            generateAndInjectSchema(match);

            displaySuggestedMatches(matchId); // Renamed
            console.log(`✨ [اقتراحات] استدعاء displaySuggestedMatches للمعّرف: ${matchId}`);

        } else {
            console.error('❌ [توجيه] المباراة غير موجودة للمعّرف:', matchId, 'يتم إعادة التوجيه إلى الصفحة الرئيسية.');
            showHomePage();
        }
    }

    // START: Updated function for Meta Tags (Renamed from updateMetaTags)
    function updatePageMetadata(match = null) { // Renamed movie to match
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }

        let pageTitle, pageDescription, pageKeywords, ogUrl, ogTitle, ogDescription, ogImage, ogType;
        let twitterTitle, twitterDescription, twitterImage, twitterCard;

        if (match) {
            const matchUrl = `${window.location.origin}/view/?details&id=${match.id}&title=${match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-')}`;
            canonicalLink.setAttribute('href', matchUrl);

            pageTitle = `${match.title} - مشاهدة أونلاين على شاهد كورة بجودة عالية`;
            const shortDescription = (match.description || `شاهد مباراة ${match.title} بث مباشر بجودة عالية. استمتع بأحدث المباريات، الأهداف، والتحليلات الحصرية على شاهد كورة - Ultimate Pitch.`).substring(0, 155);
            pageDescription = shortDescription + (match.description && match.description.length > 155 ? '...' : '');

            const matchLeague = String(match.league || '').trim();
            const matchCommentators = Array.isArray(match.commentators) ? match.commentators.join(', ') : String(match.commentators || '').trim();
            pageKeywords = [
                match.title,
                matchLeague,
                match.team1,
                match.team2,
                matchCommentators,
                'شاهد كورة', 'بث مباشر', 'مشاهدة أونلاين', 'مباراة اليوم', 'أهداف', 'ملخصات', 'أخبار كرة قدم', 'دوريات عالمية', 'كرة القدم', 'مشاهدة مجانية', 'تحليل كروي', 'Ultimate Pitch'
            ].filter(Boolean).join(', ');

            ogUrl = matchUrl;
            ogTitle = `${match.title} - بث مباشر على شاهد كورة`;
            ogDescription = pageDescription;
            ogImage = match.thumbnail; // Use match thumbnail as OG image
            ogType = "video.other"; // Changed to video.other as it's a match, not a movie

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image";

        } else {
            // بيانات الصفحة الرئيسية الافتراضية
            pageTitle = 'شاهد كورة - Ultimate Pitch: تجربة كرة القدم النهائية';
            pageDescription = 'شاهد كورة - ملعبك النهائي لكرة القدم. بث مباشر بجودة فائقة، أهداف مجنونة، تحليلات عميقة، وآخر الأخبار من قلب الحدث. انغمس في عالم الكرة الحقيقية.';
            pageKeywords = 'شاهد كورة، بث مباشر، مباريات اليوم، أهداف، ملخصات، أخبار كرة قدم، دوريات عالمية، كرة القدم، مشاهدة مجانية، تحليل كروي، Ultimate Pitch';

            ogUrl = window.location.origin;
            canonicalLink.setAttribute('href', ogUrl + '/');
            ogTitle = 'شاهد كورة - Ultimate Pitch: كل كرة القدم في مكان واحد';
            ogDescription = pageDescription;
            ogImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png'; // Example image
            ogType = 'website';

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = 'https://shahidkora.online/images/shahidkora-ultimate-pitch-twitter.png'; // Example image
            twitterCard = "summary_large_image";
        }

        // تحديث جميع الـ meta tags باستخدام الـ IDs
        document.title = pageTitle;
        document.getElementById('dynamic-title').textContent = pageTitle;
        document.getElementById('dynamic-description').setAttribute('content', pageDescription);
        document.getElementById('dynamic-keywords').setAttribute('content', pageKeywords);

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

        console.log('📄 [SEO] تم تحديث الميتا تاجز.');
    }
    // END: Updated function for Meta Tags

    // START: Updated function for JSON-LD Schema
    function generateAndInjectSchema(match = null) { // Renamed movie to match
        let schemaScriptElement = document.getElementById('json-ld-schema'); // Corrected ID from HTML
        if (!schemaScriptElement) {
            schemaScriptElement = document.createElement('script');
            schemaScriptElement.type = 'application/ld+json';
            schemaScriptElement.id = 'json-ld-schema';
            document.head.appendChild(schemaScriptElement);
        }

        if (!match) {
            schemaScriptElement.textContent = '';
            console.log('📄 [SEO] لا يوجد مخطط JSON-LD للصفحة الرئيسية.');
            return;
        }

        const matchUrl = `${window.location.origin}/view/?details&id=${match.id}&title=${match.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-')}`;

        let formattedDate;
        if (match.date) {
            try {
                // Assuming date format is YYYY-MM-DD or parseable by Date constructor
                const dateParts = match.date.split('-');
                const timeParts = (match.time || '00:00').split(':');
                const dt = new Date(
                    parseInt(dateParts[0]), 
                    parseInt(dateParts[1]) - 1, 
                    parseInt(dateParts[2]), 
                    parseInt(timeParts[0]), 
                    parseInt(timeParts[1])
                );
                if (!isNaN(dt.getTime())) {
                    formattedDate = dt.toISOString();
                } else {
                    formattedDate = new Date().toISOString(); // fallback to current date if parse fails
                }
            } catch (e) {
                formattedDate = new Date().toISOString(); // fallback
            }
        } else {
            formattedDate = new Date().toISOString(); // fallback
        }
        
        const commentatorsArray = Array.isArray(match.commentators) ? match.commentators : String(match.commentators || '').split(',').map(s => s.trim()).filter(s => s !== '');
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "SportsEvent", // Changed type to SportsEvent for a match
            "name": match.title,
            "description": match.description || `مشاهدة بث مباشر لـ ${match.title} بجودة عالية على شاهد كورة.`,
            "startDate": formattedDate,
            "location": {
                "@type": "Place",
                "name": match.stadium || "غير متوفر",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": match.city || "غير متوفر", // Assuming a 'city' property in matches.json
                    "addressCountry": match.country || "غير متوفر" // Assuming a 'country' property in matches.json
                }
            },
            "performer": [ // Teams involved
                {
                    "@type": "SportsTeam",
                    "name": match.team1 || "فريق غير متوفر"
                },
                {
                    "@type": "SportsTeam",
                    "name": match.team2 || "فريق غير متوفر"
                }
            ],
            "competitor": [ // Same as performer for matches
                {
                    "@type": "SportsTeam",
                    "name": match.team1 || "فريق غير متوفر"
                },
                {
                    "@type": "SportsTeam",
                    "name": match.team2 || "فريق غير متوفر"
                }
            ],
            "sport": "كرة القدم", // Specific sport
            "url": matchUrl, // URL of the page
            "image": match.thumbnail, // Thumbnail image for the match

            // VideoObject embedded within SportsEvent
            "video": {
                "@type": "VideoObject",
                "name": match.title,
                "description": match.description || `بث مباشر لـ ${match.title} على شاهد كورة.`,
                "thumbnailUrl": match.thumbnail,
                "uploadDate": formattedDate, // Use match date/time for video upload date
                "contentUrl": match.embed_url, // Direct video URL
                "embedUrl": match.embed_url, // Embedded video URL
                "interactionCount": "100000", // Placeholder, ideally dynamic
                "duration": match.duration || "PT2H", // Example: PT2H for 2 hours. If duration is available in data, use it.
                "publisher": {
                    "@type": "Organization",
                    "name": "شاهد كورة - Ultimate Pitch",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://shahidkora.online/images/shahidkora-ultimate-pitch-og.png", // Use your logo for publisher
                        "width": 200,
                        "height": 50
                    }
                }
            },
            
            "eventStatus": (function() {
                if (match.status === 'جارية') return "https://schema.org/EventScheduled"; // Assuming live
                if (match.status === 'انتهت') return "https://schema.org/EventCompleted";
                if (match.status === 'ملغاة') return "https://schema.org/EventCancelled";
                if (match.status === 'مؤجلة') return "https://schema.org/EventPostponed";
                return "https://schema.org/EventScheduled"; // Default for upcoming/scheduled
            })(),

            // Add aggregate rating if available, similar to movies
            // "aggregateRating": { ... } // If you have rating for matches
        };

        schemaScriptElement.textContent = JSON.stringify(schema, null, 2); // تنسيق JSON للقراءة
        console.log('📄 [SEO] تم إضافة/تحديث مخطط JSON-LD الجديد.');
    }
    // END: Updated function for JSON-LD Schema

    function displaySuggestedMatches(currentMatchId) { // Renamed from displaySuggestedMovies
        if (!suggestedMovieGrid || !currentDetailedMatch) { // Using suggestedMovieGrid and currentDetailedMatch
            console.error('❌ displaySuggestedMatches: suggestedMatchGrid أو currentDetailedMatch غير موجودين. لا يمكن عرض المباريات المقترحة.');
            return;
        }

        const currentMatchLeague = currentDetailedMatch.league; // Suggest based on league
        let suggested = [];

        if (currentMatchLeague) {
            suggested = matchesData.filter(match =>
                match.id !== currentMatchId &&
                String(match.league || '').toLowerCase().includes(String(currentMatchLeague).toLowerCase().trim())
            );
            suggested = suggested.sort(() => 0.5 - Math.random());
        }

        if (suggested.length < 24) { // Populate with random matches if not enough suggested
            const otherMatches = matchesData.filter(match => match.id !== currentMatchId && !suggested.includes(match));
            const shuffledOthers = otherMatches.sort(() => 0.5 - Math.random());
            const needed = 24 - suggested.length;
            suggested = [...suggested, ...shuffledOthers.slice(0, needed)];
        }

        const finalSuggested = suggested.slice(0, 24);

        if (finalSuggested.length === 0) {
            suggestedMovieGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">لا توجد مباريات مقترحة حالياً.</p>';
            console.log('✨ [اقتراحات] لا توجد مباريات مقترحة متاحة بعد التصفية.');
            return;
        }

        displayMatches(finalSuggested, suggestedMovieGrid); // Renamed
        console.log(`✨ [اقتراحات] تم عرض ${finalSuggested.length} مباراة مقترحة في ${suggestedMovieGrid.id}.`);
    }

    function showHomePage() {
        console.log('🏠 [توجيه] عرض الصفحة الرئيسية.');
        // Hide all template views first
        document.querySelectorAll('.view-section').forEach(section => {
            section.style.display = 'none';
        });

        if (heroSection) heroSection.style.display = 'flex';
        if (movieGridSection) movieGridSection.style.display = 'block'; // Show home match grid section

        if (searchInput) searchInput.value = '';
        if (sectionTitleElement) sectionTitleElement.textContent = 'أبرز المباريات والجديد';

        matchesDataForPagination = matchesData.length > 0 ? [...matchesData].sort(() => 0.5 - Math.random()) : [];
        currentPage = 1;
        paginateMatches(matchesDataForPagination, currentPage);

        if (videoOverlay) {
            videoOverlay.style.pointerEvents = 'none';
            videoOverlay.classList.add('hidden');
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
        }

        // Clear video container content (iframe)
        if (videoContainer) {
            videoContainer.innerHTML = '';
            console.log('[مشغل الفيديو] تم مسح match-player-container عند الانتقال للصفحة الرئيسية.');
        }
        currentDetailedMatch = null;

        const newUrl = new URL(window.location.origin);
        history.pushState({ view: 'home' }, 'شاهد كورة - الصفحة الرئيسية', newUrl.toString());
        console.log(`🔗 [URL] تم تحديث URL إلى ${newUrl.toString()}`);

        // استدعاء الدوال المعدلة للصفحة الرئيسية
        updatePageMetadata();
        generateAndInjectSchema();
    }

    // --- 5. Event Listeners ---
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('nav-open');
            console.log('☰ [تفاعل] تم تبديل القائمة.');
        });
    }

    // Handle navigation clicks for dynamic view loading
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.dataset.targetView;
            if (targetView) {
                console.log(`🧭 [تفاعل] تم النقر على رابط التنقل: ${targetView}`);
                loadView(targetView); // Call a new function to load specific views
            }
            if (mainNav && mainNav.classList.contains('nav-open')) {
                mainNav.classList.remove('nav-open');
            }
        });
    });

    // New function to load different views based on data-target-view
    function loadView(viewName) {
        // Hide all sections first
        document.querySelectorAll('.view-section').forEach(section => {
            section.style.display = 'none';
        });
        if (heroSection) heroSection.style.display = 'none'; // Hide hero on view change

        let targetSection;
        let targetGrid;
        let titleElement;
        let paginationPrevBtn;
        let paginationNextBtn;
        let emptyStateElement;
        let currentMatchesToDisplay = [];

        // Determine which template to clone and which elements to target
        let templateId;
        switch (viewName) {
            case 'home':
                showHomePage(); // Re-use existing home page logic
                return;
            case 'live':
                templateId = 'live-matches-template';
                targetSection = document.getElementById('live-matches-section');
                targetGrid = document.getElementById('live-match-grid');
                titleElement = document.getElementById('live-matches-title');
                paginationPrevBtn = document.getElementById('live-prev-page-btn');
                paginationNextBtn = document.getElementById('live-next-page-btn');
                emptyStateElement = document.getElementById('live-empty-state');
                
                currentMatchesToDisplay = matchesData.filter(match => match.status === 'جارية'); // Filter live matches
                if (titleElement) titleElement.textContent = 'مباريات كرة القدم مباشرة الآن';
                break;
            case 'upcoming':
                templateId = 'upcoming-matches-template';
                targetSection = document.getElementById('upcoming-matches-section');
                targetGrid = document.getElementById('upcoming-match-grid');
                titleElement = document.getElementById('upcoming-matches-title');
                paginationPrevBtn = document.getElementById('upcoming-prev-page-btn');
                paginationNextBtn = document.getElementById('upcoming-next-page-btn');
                emptyStateElement = document.getElementById('upcoming-empty-state');

                currentMatchesToDisplay = matchesData.filter(match => match.status === 'قادمة' || match.status === 'مجدولة'); // Filter upcoming
                if (titleElement) titleElement.textContent = 'مواعيد مباريات كرة القدم القادمة';
                break;
            case 'highlights':
                templateId = 'highlights-template';
                targetSection = document.getElementById('highlights-section');
                targetGrid = document.getElementById('highlights-grid');
                titleElement = document.getElementById('highlights-title');
                paginationPrevBtn = document.getElementById('highlights-prev-page-btn');
                paginationNextBtn = document.getElementById('highlights-next-page-btn');
                emptyStateElement = document.getElementById('highlights-empty-state');

                currentMatchesToDisplay = matchesData.filter(match => match.highlights_url); // Matches with highlights
                if (titleElement) titleElement.textContent = 'أهداف وملخصات المباريات';
                break;
            case 'news':
                templateId = 'news-template';
                targetSection = document.getElementById('news-section');
                targetGrid = document.getElementById('news-grid');
                titleElement = document.getElementById('news-title');
                paginationPrevBtn = document.getElementById('news-prev-page-btn');
                paginationNextBtn = document.getElementById('news-next-page-btn');
                emptyStateElement = document.getElementById('news-empty-state');

                // For news, you'd fetch news data separately or have it in matches.json if applicable
                currentMatchesToDisplay = []; // Assuming news data is separate or not in matches.json
                if (titleElement) titleElement.textContent = 'آخر أخبار كرة القدم';
                // Placeholder for news, replace with actual news display logic
                if (targetGrid) targetGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">الأخبار قيد التحديث. تابعونا لكل جديد في عالم كرة القدم!</p>';
                if (emptyStateElement) emptyStateElement.style.display = 'block';
                break;
            default:
                console.warn(`⚠️ [View Loader] عرض غير معروف: ${viewName}`);
                showHomePage();
                return;
        }

        // If the section doesn't exist yet, clone from template
        if (!targetSection) {
            const template = document.getElementById(templateId);
            if (template) {
                targetSection = template.content.cloneNode(true).firstElementChild;
                document.getElementById('content-display').appendChild(targetSection);
                // Re-get references after cloning
                targetGrid = targetSection.querySelector('.match-grid') || targetSection.querySelector('.news-grid');
                titleElement = targetSection.querySelector('.section-title');
                paginationPrevBtn = targetSection.querySelector('.btn-page.prev');
                paginationNextBtn = targetSection.querySelector('.btn-page.next');
                emptyStateElement = targetSection.querySelector('.empty-state');
                console.log(`🏗️ [View Loader] تم استنساخ "${viewName}" من القالب.`);
            } else {
                console.error(`❌ [View Loader] قالب "${templateId}" غير موجود.`);
                showHomePage();
                return;
            }
        }
        
        // Always set the current page to 1 when changing views
        currentPage = 1; 
        
        // Handle pagination for specific views (if applicable)
        if (targetGrid) {
            // Store the currently filtered data for pagination on this specific view
            targetGrid.currentData = currentMatchesToDisplay; 
            targetGrid.currentPage = 1;
            
            const startIdx = (targetGrid.currentPage - 1) * matchesPerPage;
            const endIdx = startIdx + matchesPerPage;
            const paginatedData = targetGrid.currentData.slice(startIdx, endIdx);

            displayMatches(paginatedData, targetGrid);
            
            // Update pagination buttons for this view
            if (paginationPrevBtn && paginationNextBtn) {
                paginationPrevBtn.disabled = targetGrid.currentPage === 1;
                paginationNextBtn.disabled = targetGrid.currentPage * matchesPerPage >= targetGrid.currentData.length;
                
                // Add event listeners for pagination within the cloned section
                paginationPrevBtn.onclick = () => {
                    if (targetGrid.currentPage > 1) {
                        targetGrid.currentPage--;
                        paginateCurrentView(targetGrid, paginationPrevBtn, paginationNextBtn, targetGrid.currentData.length);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
                paginationNextBtn.onclick = () => {
                    const totalPages = Math.ceil(targetGrid.currentData.length / matchesPerPage);
                    if (targetGrid.currentPage < totalPages) {
                        targetGrid.currentPage++;
                        paginateCurrentView(targetGrid, paginationPrevBtn, paginationNextBtn, targetGrid.currentData.length);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            }
        }

        // Show/hide empty state
        if (emptyStateElement) {
            emptyStateElement.style.display = currentMatchesToDisplay.length === 0 ? 'block' : 'none';
        }
        
        targetSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update URL and SEO for the new view (if it's not match details)
        const newUrl = new URL(window.location.origin);
        if (viewName !== 'home') { // Don't add 'view' param for home
             newUrl.searchParams.set('view', viewName);
        }
       
        history.pushState({ view: viewName }, `${viewName} - شاهد كورة`, newUrl.toString());
        updatePageMetadata(); // Revert to homepage metadata if not a specific match
        generateAndInjectSchema(); // Clear schema if not a specific match
    }

    // Helper for pagination on specific views
    function paginateCurrentView(gridElement, prevBtn, nextBtn, totalItems) {
        const startIndex = (gridElement.currentPage - 1) * matchesPerPage;
        const endIndex = startIndex + matchesPerPage;
        const paginatedData = gridElement.currentData.slice(startIndex, endIndex);
        displayMatches(paginatedData, gridElement);

        prevBtn.disabled = gridElement.currentPage === 1;
        nextBtn.disabled = gridElement.currentPage * matchesPerPage >= totalItems;
        console.log(`➡️ [ترقيم الصفحات - ${gridElement.id}] يتم عرض الصفحة ${gridElement.currentPage}.`);
    }

    if (watchNowBtn && movieGridSection) {
        watchNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🎬 [تفاعل] تم النقر على زر "شاهد المباريات الآن".');
            movieGridSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            console.log('🔙 [تفاعل] تم النقر على زر العودة للصفحة الرئيسية.');
            showHomePage();
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
        console.log('🔍 [حدث] تم إرفاق مستمع زر البحث.');
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
                searchInput.blur();
            }
        });
        console.log('🔍 [حدث] تم إرفاق مستمع ضغط مفتاح البحث.');
    }

    // Pagination buttons for the HOME view
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                paginateMatches(matchesDataForPagination, currentPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            console.log(`⬅️ [ترقيم الصفحات] تم النقر على الصفحة السابقة. الصفحة الحالية: ${currentPage}`);
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(matchesDataForPagination.length / matchesPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                paginateMatches(matchesDataForPagination, currentPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            console.log(`➡️ [ترقيم الصفحات] تم النقر على الصفحة التالية. الصفحة الحالية: ${currentPage}`);
        });
    }

    if (homeLogoLink) {
        homeLogoLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🏠 [تفاعل] تم النقر على شعار الصفحة الرئيسية.');
            showHomePage();
        });
    }

    if (movieDetailsPoster) {
        movieDetailsPoster.addEventListener('click', () => {
            console.log('🖼️ [نقر إعلان] تم النقر على بوستر تفاصيل المباراة. محاولة فتح الرابط المباشر.');
            openAdLink(DIRECT_LINK_COOLDOWN_MOVIE_CARD, 'movieDetailsPoster');
        });
        console.log('[حدث] تم إرفاق مستمع النقر على بوستر تفاصيل المباراة.');
    }

    if (videoOverlay) {
        videoOverlay.addEventListener('click', async (e) => {
            console.log('⏯️ [نقر إعلان] تم النقر على غطاء الفيديو. محاولة فتح الرابط المباشر.');
            const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');

            if (adOpened) {
                // Give a brief moment for the ad window to pop up
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (videoOverlay) {
                    videoOverlay.style.pointerEvents = 'none';
                    videoOverlay.classList.add('hidden');
                }
                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                console.log('[غطاء الفيديو] تم فتح الإعلان. تم إخفاء الغطاء والسماح بتفاعل iframe.');
            } else {
                console.log('[غطاء الفيديو] الإعلان لم يفتح بسبب التهدئة. سيظل الغطاء نشطًا.');
            }
            e.stopPropagation();
        });
        console.log('[غطاء الفيديو] تم إرفاق مستمع النقر لتفاعل الإعلان.');
    }

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

    function initialPageLoadLogic() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        const idParam = urlParams.get('id');

        if (viewParam === 'details' && idParam) {
            const matchId = parseInt(idParam);
            const match = matchesData.find(m => m.id === matchId);

            if (!isNaN(matchId) && match) {
                console.log(`🚀 [تحميل أولي] محاولة تحميل تفاصيل المباراة من URL: المعّرف ${matchId}`);
                updatePageMetadata(match);
                generateAndInjectSchema(match);
                showMatchDetails(matchId);
            } else {
                console.warn('⚠️ [تحميل أولي] معّرف المباراة غير صالح في URL أو المباراة غير موجودة. يتم عرض الصفحة الرئيسية.');
                showHomePage();
            }
        } else if (viewParam) { // Handle other views loaded directly via URL
            console.log(`🚀 [تحميل أولي] محاولة تحميل العرض "${viewParam}" من URL.`);
            loadView(viewParam);
        } else {
            console.log('🚀 [تحميل أولي] لا يوجد عرض محدد في URL. يتم عرض الصفحة الرئيسية.');
            showHomePage();
        }
    }

    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] تم اكتشاف تصفح سجل المتصفح.', event.state);
        if (matchesData.length === 0) {
            console.warn('[Popstate] لم يتم تحميل بيانات المباريات، محاولة جلب البيانات وعرض الصفحة بناءً على الحالة.');
            fetchMatchesData().then(() => {
                if (event.state && event.state.view === 'details' && event.state.id) {
                    const match = matchesData.find(m => m.id === event.state.id);
                    if (match) {
                        updatePageMetadata(match);
                        generateAndInjectSchema(match);
                        showMatchDetails(event.state.id);
                    } else {
                        console.warn('[Popstate] المباراة غير موجودة عند popstate. يتم عرض الصفحة الرئيسية.');
                        showHomePage();
                    }
                } else if (event.state && event.state.view) {
                    loadView(event.state.view);
                } else {
                    showHomePage();
                }
            }).catch(err => {
                console.error('[Popstate] فشل جلب بيانات المباريات عند popstate:', err);
                showHomePage();
            });
            return;
        }

        if (event.state && event.state.view === 'details' && event.state.id) {
            const match = matchesData.find(m => m.id === event.state.id);
            if (match) {
                updatePageMetadata(match);
                generateAndInjectSchema(match);
                showMatchDetails(event.state.id);
            } else {
                console.warn('[Popstate] المباراة غير موجودة عند popstate. يتم عرض الصفحة الرئيسية.');
                showHomePage();
            }
        } else if (event.state && event.state.view) {
            loadView(event.state.view);
        }
        else {
            showHomePage();
        }
    });

    fetchMatchesData(); // Initial data fetch
});
