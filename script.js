// script.js - هذا الكود محسن وواضح لمحركات البحث والمطورين
// تم التركيز على أفضل أداء ممكن من جانب العميل مع الحفاظ على الوظائف والإعلانات
// والتأكد من إزالة أي عناصر قد تؤثر سلباً على الفهم من قبل محركات البحث
// تم تحديث هذا الإصدار لاستخدام iframe بدلاً من Video.js لمشغل الفيديو

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded. Script execution started.');

    // --- 1. DOM Element References ---
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const homeNavLink = document.getElementById('home-nav-link-actual');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const heroSection = document.getElementById('hero-section');
    const watchNowBtn = document.getElementById('watch-now-btn');
    const movieGridSection = document.getElementById('movie-grid-section');
    const movieDetailsSection = document.getElementById('movie-details-section');
    const movieGrid = document.getElementById('movie-grid');
    const suggestedMovieGrid = document.getElementById('suggested-movie-grid');
    const suggestedMoviesSection = document.getElementById('suggested-movies-section');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const videoContainer = document.getElementById('movie-player-container'); // هذا سيحتوي على الـ iframe الآن
    const videoOverlay = document.getElementById('video-overlay'); // سيبقى لإظهار الإعلانات
    const homeLogoLink = document.getElementById('home-logo-link');
    const videoLoadingSpinner = document.getElementById('video-loading-spinner'); // قد لا يكون ضرورياً جداً مع iframe
    const movieDetailsPoster = document.getElementById('movie-details-poster');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    
    // ****** تحسين الأداء على الموبايل: عدد الأفلام المعروضة لكل صفحة ******
    const moviesPerPage = 30; // القيمة الموصى بها لأداء أفضل على الموبايل

    let currentPage = 1;
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const sectionTitleElement = movieGridSection ? movieGridSection.querySelector('h2') : null;

    // --- 1.1. Critical DOM Element Verification ---
    const requiredElements = {
        '#movie-grid': movieGrid,
        '#movie-grid-section': movieGridSection,
        '#movie-details-section': movieDetailsSection,
        '#hero-section': heroSection,
        '#movie-player-container': videoContainer,
        '#video-overlay': videoOverlay,
        '#suggested-movie-grid': suggestedMovieGrid,
        '#suggested-movies-section': suggestedMoviesSection,
        '#video-loading-spinner': videoLoadingSpinner,
        '#movie-details-title': document.getElementById('movie-details-title'),
        '#movie-details-description': document.getElementById('movie-details-description'),
        '#movie-details-release-date': document.getElementById('movie-details-release-date'),
        '#movie-details-genre': document.getElementById('movie-details-genre'),
        '#movie-details-director': document.getElementById('movie-details-director'),
        '#movie-details-cast': document.getElementById('movie-details-cast'),
        '#movie-details-duration': document.getElementById('movie-details-duration'),
        '#movie-details-rating': document.getElementById('movie-details-rating'),
        '#home-nav-link-actual': homeNavLink
    };

    let criticalError = false;
    for (const [id, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`❌ خطأ فادح: العنصر بالمعرّف "${id}" غير موجود. يرجى التحقق من ملف HTML الخاص بك.`);
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

    // --- 2. Adsterra Configuration ---
    const ADSTERRA_DIRECT_LINK_URL = 'https://www.profitableratecpm.com/spqbhmyax?key=2469b039d4e7c471764bd04c57824cf2';
    const DIRECT_LINK_COOLDOWN_MOVIE_CARD = 3 * 60 * 1000;
    const DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION = 10 * 1000;

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

    // --- 3. Movie Data & Video URL Handling ---
    let moviesData = [];
    let moviesDataForPagination = [];
    let currentDetailedMovie = null;
    
    // دالة فك تشفير Base64 لم تعد مستخدمة لروابط الفيديو المباشرة (تم إزالتها في الإصدار السابق أيضاً)
    function decodeBase64(encodedString) {
        try {
            if (!encodedString || typeof encodedString !== 'string') {
                console.warn('تمت محاولة فك تشفير سلسلة Base64 غير صالحة:', encodedString);
                return '';
            }
            return atob(encodedString);
        } catch (e) {
            console.error('خطأ في فك تشفير سلسلة Base64:', e);
            return '';
        }
    }

    // Helper to parse ISO 8601 duration (e.g., PT1H54M to seconds) - لا تزال مفيدة لـ Schema
    function parseDurationToSeconds(isoDuration) {
        if (!isoDuration || typeof isoDuration !== 'string') return 0;
        const parts = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!parts) return 0;
        const hours = parseInt(parts[1] || 0);
        const minutes = parseInt(parts[2] || 0);
        const seconds = parseInt(parts[3] || 0);
        return hours * 3600 + minutes * 60 + seconds;
    }

    async function fetchMoviesData() {
        try {
            console.log('📡 جلب بيانات الأفلام من movies.json...');
            const response = await fetch('movies.json');
            if (!response.ok) {
                throw new Error(`خطأ HTTP! الحالة: ${response.status} - تعذر تحميل movies.json. تحقق من مسار الملف وتكوين الخادم.`);
            }
            moviesData = await response.json();
            if (!Array.isArray(moviesData)) {
                console.error('❌ البيانات التي تم جلبها ليست مصفوفة. يرجى التحقق من تنسيق movies.json. المتوقع مصفوفة من كائنات الأفلام.');
                moviesData = [];
            } else if (moviesData.length === 0) {
                console.warn('⚠️ تم تحميل movies.json، ولكنه فارغ.');
            }
            console.log('✅ تم تحميل بيانات الأفلام بنجاح من movies.json', moviesData.length, 'فيلمًا تم العثور عليهم.');
            initialPageLoadLogic();
        } catch (error) {
            console.error('❌ فشل تحميل بيانات الأفلام:', error.message);
            if (movieGrid) {
                movieGrid.innerHTML = '<p style="text-align: center; color: var(--text-color); margin-top: 50px;">عذرًا، لم نتمكن من تحميل بيانات الأفلام. يرجى المحاولة مرة أخرى لاحقًا أو التحقق من ملف movies.json.</p>';
            }
            if (sectionTitleElement) {
                sectionTitleElement.textContent = 'خطأ في تحميل الأفلام';
            }
        }
    }

    function createMovieCard(movie) {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        const webpSource = movie.poster.replace(/\.(png|jpe?g)/i, '.webp');
        movieCard.innerHTML = `
            <picture>
                <source srcset="${webpSource}" type="image/webp" onerror="this.remove()">
                <img data-src="${movie.poster}" src="${movie.poster}" alt="${movie.title}" class="lazyload" width="200" height="300" loading="lazy">
            </picture>
            <h3>${movie.title}</h3>
        `;
        movieCard.addEventListener('click', () => {
            console.log(`⚡ [تفاعل] تم النقر على بطاقة الفيلم للمعّرف: ${movie.id}`);
            openAdLink(DIRECT_LINK_COOLDOWN_MOVIE_CARD, 'movieCard');
            showMovieDetails(movie.id);
        });
        return movieCard;
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

    function displayMovies(moviesToDisplay, targetGridElement) {
        if (!targetGridElement) {
            console.error('❌ displayMovies: العنصر المستهدف للشبكة فارغ أو غير معرّف.');
            return;
        }
        targetGridElement.innerHTML = ''; // مسح المحتوى القديم

        if (!moviesToDisplay || moviesToDisplay.length === 0) {
            targetGridElement.innerHTML = '<p style="text-align: center; color: var(--text-muted);">لا توجد أفلام مطابقة للبحث أو مقترحة.</p>';
            console.log(`🎬 [عرض] لا توجد أفلام للعرض في ${targetGridElement.id}.`);
            return;
        }

        console.log(`🎬 [عرض] جاري عرض ${moviesToDisplay.length} فيلم في ${targetGridElement.id}.`);
        moviesToDisplay.forEach(movie => {
            targetGridElement.appendChild(createMovieCard(movie));
        });
        console.log(`🎬 [عرض] تم عرض ${moviesToDisplay.length} فيلمًا في ${targetGridElement.id}.`);
        initializeLazyLoad(); // إعادة تهيئة التحميل الكسول للعناصر الجديدة
    }

    function paginateMovies(moviesArray, page) {
        if (!Array.isArray(moviesArray) || moviesArray.length === 0) {
            displayMovies([], movieGrid);
            updatePaginationButtons(0);
            return;
        }

        const startIndex = (page - 1) * moviesPerPage;
        const endIndex = startIndex + moviesPerPage;
        const paginatedMovies = moviesArray.slice(startIndex, endIndex);

        displayMovies(paginatedMovies, movieGrid);
        updatePaginationButtons(moviesArray.length);
        console.log(`➡️ [ترقيم الصفحات] يتم عرض الصفحة ${page}. الأفلام من الفهرس ${startIndex} إلى ${Math.min(endIndex, moviesArray.length)-1}.`);
    }

    function updatePaginationButtons(totalMovies) {
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage * moviesPerPage >= totalMovies;
        console.log(`🔄 [ترقيم الصفحات] تم تحديث الأزرار. الصفحة الحالية: ${currentPage}, إجمالي الأفلام: ${totalMovies}`);
    }

    function performSearch() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filteredMovies = [];
        if (query) {
            filteredMovies = moviesData.filter(movie =>
                movie.title.toLowerCase().includes(query) ||
                (movie.director && movie.director.toLowerCase().includes(query)) ||
                (Array.isArray(movie.cast) ? movie.cast.some(actor => actor.toLowerCase().includes(query)) : (movie.cast && String(movie.cast).toLowerCase().includes(query))) ||
                (movie.genre && String(movie.genre).toLowerCase().includes(query))
            );
            if (sectionTitleElement) {
                sectionTitleElement.textContent = `نتائج البحث عن "${query}"`;
            }
            console.log(`🔍 [بحث] تم إجراء بحث عن "${query}". تم العثور على ${filteredMovies.length} نتيجة.`);
        } else {
            filteredMovies = [...moviesData].sort(() => 0.5 - Math.random());
            if (sectionTitleElement) {
                sectionTitleElement.textContent = 'أحدث الأفلام';
            }
            console.log('🔍 [بحث] استعلام البحث فارغ، يتم عرض جميع الأفلام (عشوائياً).');
        }
        currentPage = 1;
        moviesDataForPagination = filteredMovies;
        paginateMovies(moviesDataForPagination, currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function showMovieDetails(movieId) {
        console.log(`🔍 [توجيه] عرض تفاصيل الفيلم للمعّرف: ${movieId}`);
        const movie = moviesData.find(m => m.id === movieId);

        if (movie) {
            currentDetailedMovie = movie;

            if (heroSection) heroSection.style.display = 'none';
            if (movieGridSection) movieGridSection.style.display = 'none';

            // مسح أي محتوى سابق في حاوية الفيديو
            if (videoContainer) {
                videoContainer.innerHTML = '';
                // إنشاء iframe جديد
                const newIframeElement = document.createElement('iframe');
                newIframeElement.id = 'movie-player-iframe'; // يمكنك إضافة ID لسهولة التعامل معه مستقبلاً
                newIframeElement.setAttribute('src', movie.embed_url); // استخدام رابط التضمين مباشرةً
                newIframeElement.setAttribute('frameborder', '0');
                newIframeElement.setAttribute('allowfullscreen', '');
                newIframeElement.setAttribute('scrolling', 'no');
                // لمنع مشاكل النقر وتداخل الإعلانات، يجب أن يكون iframe معزولاً بقدر الإمكان
                newIframeElement.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture'); 
                newIframeElement.style.width = '100%';
                newIframeElement.style.height = '100%';
                videoContainer.appendChild(newIframeElement);
                console.log('[مشغل الفيديو] تم إنشاء iframe جديد للمشغل.');
            } else {
                console.error('❌ خطأ فادح: movie-player-container غير موجود. لا يمكن إنشاء مشغل الفيديو.');
                return;
            }

            if (movieDetailsSection) movieDetailsSection.style.display = 'block';
            if (suggestedMoviesSection) suggestedMoviesSection.style.display = 'block';

            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.log('[توجيه] تم التمرير للأعلى.');

            document.getElementById('movie-details-title').textContent = movie.title || 'غير متوفر';
            document.getElementById('movie-details-description').textContent = movie.description || 'لا يوجد وصف متاح.';
            const releaseDate = movie.release_date ? new Date(movie.release_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير متوفر';
            document.getElementById('movie-details-release-date').textContent = releaseDate;
            document.getElementById('movie-details-genre').textContent = movie.genre || 'غير محدد';
            document.getElementById('movie-details-director').textContent = movie.director || 'غير متوفر';
            document.getElementById('movie-details-cast').textContent = Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast || 'غير متوفر';
            document.getElementById('movie-details-duration').textContent = movie.duration || 'غير متوفر';
            document.getElementById('movie-details-rating').textContent = movie.rating || 'N/A';

            if (movieDetailsPoster) {
                movieDetailsPoster.src = movie.poster;
                movieDetailsPoster.alt = movie.title;
                movieDetailsPoster.setAttribute('width', '300');
                movieDetailsPoster.setAttribute('height', '450');
                console.log(`[تفاصيل] تم تعيين البوستر لـ ${movie.title}`);
            }

            const videoUrl = movie.embed_url; // هنا تم استخدام movie.embed_url مباشرةً

            if (!videoUrl) {
                console.error(`❌ فشل الحصول على رابط الفيديو لمعّرف الفيلم: ${movieId}. لا يمكن تهيئة المشغل.`);
                if (videoContainer) {
                    videoContainer.innerHTML = '<p style="text-align: center; color: var(--text-color); margin-top: 20px;">عذرًا، لا يمكن تشغيل الفيديو حاليًا (الرابط غير صالح).</p>';
                }
                if (videoOverlay) videoOverlay.style.display = 'none'; // إخفاء الغطاء إذا لم يكن هناك فيديو
                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                return;
            }

            // إظهار الغطاء الأولي إذا كان موجودًا
            if (videoOverlay) {
                videoOverlay.style.pointerEvents = 'auto'; // لتمكين النقر على الإعلان
                videoOverlay.classList.remove('hidden');
                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'block'; // يمكن إظهاره إذا كنت تريد مؤشر تحميل أولي
            }
            
            // بما أننا نستخدم iframe، لا توجد أحداث "playing", "waiting" وهكذا للتحكم المباشر
            // يمكنك إخفاء الـ spinner بعد فترة قصيرة إذا كنت تعتقد أن iframe سيبدأ التحميل
            setTimeout(() => {
                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                // يمكنك إبقاء الغطاء مرئياً لحين يضغط المستخدم على "تشغيل" داخل الـ iframe إذا كان المشغل يدعمه
                // أو إخفائه هنا، حسب سياسة الإعلانات
            }, 2000); // إخفاء spinner بعد ثانيتين، هذا تقديري

            const movieSlug = movie.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const newUrl = new URL(window.location.origin);
            newUrl.searchParams.set('view', 'details');
            newUrl.searchParams.set('id', movieId);
            newUrl.searchParams.set('title', movieSlug);

            history.pushState({ view: 'details', id: movieId }, movie.title, newUrl.toString());
            console.log(`🔗 [URL] تم تحديث URL إلى ${newUrl.toString()}`);

            // استدعاء الدوال المعدلة لـ SEO
            updatePageMetadata(movie);
            generateAndInjectSchema(movie);

            displaySuggestedMovies(movieId);
            console.log(`✨ [اقتراحات] استدعاء displaySuggestedMovies للمعّرف: ${movieId}`);

        } else {
            console.error('❌ [توجيه] الفيلم غير موجود للمعّرف:', movieId, 'يتم إعادة التوجيه إلى الصفحة الرئيسية.');
            showHomePage();
        }
    }

    // START: Updated function for Meta Tags (Renamed from updateMetaTags)
    function updatePageMetadata(movie = null) {
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }

        let pageTitle, pageDescription, pageKeywords, ogUrl, ogTitle, ogDescription, ogImage, ogType;
        let twitterTitle, twitterDescription, twitterImage, twitterCard;

        if (movie) {
            const movieSlug = movie.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
            const movieUrl = `${window.location.origin}/view/?details&id=${movie.id}&title=${movieSlug}`;
            canonicalLink.setAttribute('href', movieUrl);

            pageTitle = `${movie.title} - مشاهدة أونلاين على شاهد بلس بجودة عالية`;
            const shortDescription = (movie.description || `شاهد فيلم ${movie.title} أونلاين بجودة عالية. استمتع بأحدث الأفلام والمسلسلات العربية والأجنبية بجودة 4K فائقة الوضوح.`).substring(0, 155);
            pageDescription = shortDescription + (movie.description && movie.description.length > 155 ? '...' : '');

            const movieGenres = Array.isArray(movie.genre) ? movie.genre.join(', ') : String(movie.genre || '').trim();
            const movieCast = Array.isArray(movie.cast) ? movie.cast.join(', ') : String(movie.cast || '').trim();
            pageKeywords = [
                movie.title,
                movieGenres,
                movie.director,
                movieCast,
                'شاهد بلس', 'مشاهدة أونلاين', 'فيلم', 'بجودة عالية',
                'أفلام عربية', 'أفلام أجنبية', 'مسلسلات حصرية', 'أفلام 4K'
            ].filter(Boolean).join(', ');

            ogUrl = movieUrl;
            ogTitle = `${movie.title} - مشاهدة أونلاين على شاهد بلس`;
            ogDescription = pageDescription;
            ogImage = movie.poster; // استخدم بوستر الفيلم كصورة OG
            ogType = "video.movie"; // مهم جداً لتحديد نوع المحتوى كفيلم فيديو

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = ogImage;
            twitterCard = "summary_large_image"; // غالباً ما يكون هذا ثابتاً

        } else {
            // بيانات الصفحة الرئيسية الافتراضية
            pageTitle = 'شاهد بلس - بوابتك الفاخرة للترفيه السينمائي | أفلام ومسلسلات 4K أونلاين';
            pageDescription = 'شاهد بلس: بوابتك الفاخرة للترفيه السينمائي. استمتع بأحدث الأفلام والمسلسلات العربية والأجنبية بجودة 4K فائقة الوضوح، مترجمة ومدبلجة، مع تجربة مشاهدة احترافية لا مثيل لها. اكتشف عالمًا من المحتوى الحصري والمتجدد.';
            pageKeywords = 'شاهد بلس، أفلام، مسلسلات، مشاهدة أونلاين، 4K، أفلام عربية، أفلام أجنبية، مسلسلات حصرية، سينما، ترفيه فاخر، مترجم، دبلجة، أفلام 2025، مسلسلات جديدة، أكشن، دراما، خيال علمي، كوميديا';

            ogUrl = window.location.origin;
            canonicalLink.setAttribute('href', ogUrl + '/');
            ogTitle = 'شاهد بلس - بوابتك الفاخرة للترفيه السينمائي | أفلام ومسلسلات 4K';
            ogDescription = pageDescription;
            ogImage = 'https://shahidplus.online/images/your-site-logo-for-og.png'; // استبدل برابط شعار موقعك
            ogType = 'website';

            twitterTitle = ogTitle;
            twitterDescription = ogDescription;
            twitterImage = 'https://shahidplus.online/images/your-site-logo-for-twitter.png'; // استبدل برابط شعار موقعك
            twitterCard = "summary_large_image";
        }

        // تحديث جميع الـ meta tags باستخدام الـ IDs
        document.title = pageTitle;
        document.getElementById('dynamic-title').textContent = pageTitle; // تحديث الـ title element
        document.getElementById('dynamic-description').setAttribute('content', pageDescription);
        document.querySelector('meta[name="keywords"]').setAttribute('content', pageKeywords); // لا يوجد ID لهذا، لذا نستخدم querySelector

        document.getElementById('dynamic-og-title').setAttribute('content', ogTitle);
        document.getElementById('dynamic-og-description').setAttribute('content', ogDescription);
        document.getElementById('dynamic-og-image').setAttribute('content', ogImage);
        document.getElementById('dynamic-og-image-alt').setAttribute('content', ogTitle); // استخدم عنوان الـ OG كـ alt
        document.getElementById('dynamic-og-url').setAttribute('content', ogUrl);
        document.querySelector('meta[property="og:type"]').setAttribute('content', ogType); // لا يوجد ID لهذا، لذا نستخدم querySelector

        document.getElementById('dynamic-twitter-title').setAttribute('content', twitterTitle);
        document.getElementById('dynamic-twitter-description').setAttribute('content', twitterDescription);
        document.getElementById('dynamic-twitter-image').setAttribute('content', twitterImage);
        document.querySelector('meta[property="twitter:card"]').setAttribute('content', twitterCard); // لا يوجد ID لهذا، لذا نستخدم querySelector

        // تأكد من تحديث canonical link
        document.getElementById('dynamic-canonical').setAttribute('href', canonicalLink.getAttribute('href'));

        console.log('📄 [SEO] تم تحديث الميتا تاجز.');
    }
    // END: Updated function for Meta Tags

    // START: Updated function for JSON-LD Schema (Renamed from addJsonLdSchema)
    function generateAndInjectSchema(movie = null) {
        let schemaScriptElement = document.getElementById('video-schema-markup');
        if (!schemaScriptElement) {
            schemaScriptElement = document.createElement('script');
            schemaScriptElement.type = 'application/ld+json';
            schemaScriptElement.id = 'video-schema-markup';
            document.head.appendChild(schemaScriptElement);
        }

        if (!movie) {
            // مسح أي schema إذا لم يكن هناك فيلم محدد (لصفحة الرئيسية)
            schemaScriptElement.textContent = '';
            console.log('📄 [SEO] لا يوجد مخطط JSON-LD للصفحة الرئيسية.');
            return;
        }

        // استخدام رابط الصفحة الحالي لـ Movie URL
        const movieSlug = movie.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
        const movieUrl = `${window.location.origin}/view/?details&id=${movie.id}&title=${movieSlug}`;

        let formattedUploadDate;
        if (movie.release_date) {
            try {
                const date = new Date(movie.release_date);
                if (!isNaN(date.getTime())) {
                    formattedUploadDate = date.toISOString();
                } else {
                    formattedUploadDate = new Date().toISOString(); // fallback
                }
            } catch (e) {
                formattedUploadDate = new Date().toISOString(); // fallback
            }
        } else {
            formattedUploadDate = new Date().toISOString(); // fallback
        }

        const castArray = Array.isArray(movie.cast) ? movie.cast : String(movie.cast || '').split(',').map(s => s.trim()).filter(s => s !== '');
        const genreArray = Array.isArray(movie.genre) ? movie.genre : String(movie.genre || '').split(',').map(s => s.trim()).filter(s => s !== '');
        
        // هنا نستخدم movie.embed_url مباشرةً، والذي يفترض أنه الرابط المباشر في JSON
        const videoSourceUrl = movie.embed_url; // رابط التضمين الفعلي للـ iframe

        const schema = {
            "@context": "https://schema.org",
            "@type": "Movie", // تغيير النوع إلى Movie لأنه الأنسب
            "name": movie.title,
            "description": movie.description || `مشاهدة وتحميل فيلم ${movie.title} بجودة عالية على شاهد بلس. استمتع بمشاهدة أحدث الأفلام والمسلسلات الحصرية.`,
            "image": movie.poster, // صورة الفيلم
            "url": movieUrl, // رابط الصفحة الذي يحتوي على الفيلم
            "datePublished": formattedUploadDate, // تاريخ نشر الفيلم
            "director": { "@type": "Person", "name": movie.director || "غير متوفر" },
            "actor": castArray.map(actor => ({ "@type": "Person", "name": actor })),
            "genre": genreArray,
            
            // إضافة VideoObject كخاصية لـ Movie (مهم جداً لجوجل لتفهم أن هناك فيديو هنا)
            "video": {
                "@type": "VideoObject",
                "name": movie.title,
                "description": movie.description || `فيديو ${movie.title} بجودة عالية.`,
                "thumbnailUrl": movie.thumbnailUrl || movie.poster,
                "uploadDate": formattedUploadDate,
                "duration": movie.duration || "PT1H30M", // تأكد من وجود المدة
                "contentUrl": videoSourceUrl, // رابط الفيديو الفعلي (الرابط الأصلي المباشر)
                "embedUrl": videoSourceUrl, // نفس الرابط إذا كان هو نفسه الذي يتم تضمينه
                "interactionCount": "100000", // يمكنك استخدام عدد مشاهدات تقديري أو حقيقي
                "publisher": {
                    "@type": "Organization",
                    "name": "شاهد بلس",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://shahidplus.online/images/shahed-plus-logo.png", // استبدل برابط شعار موقعك
                        "width": 200,
                        "height": 50
                    }
                }
            },
            
            "potentialAction": {
                "@type": "WatchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": movieUrl,
                    "inLanguage": "ar",
                    "actionPlatform": [
                        "http://schema.org/DesktopWebPlatform",
                        "http://schema.org/MobileWebPlatform"
                    ]
                },
                "expectsAcceptanceOf": {
                    "@type": "Offer",
                    "name": "مشاهدة الفيلم",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "http://schema.org/InStock",
                    "url": movieUrl
                }
            }
        };

        // إضافة التقييم المجمع إذا كان متاحاً
        const ratingValue = parseFloat(movie.rating);
        if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 10) {
            schema.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": ratingValue.toFixed(1),
                "bestRating": "10",
                "ratingCount": "10000" // استخدم عدد التقييمات الفعلي إذا كان لديك
            };
        }

        schemaScriptElement.textContent = JSON.stringify(schema, null, 2); // تنسيق JSON للقراءة
        console.log('📄 [SEO] تم إضافة/تحديث مخطط JSON-LD الجديد.');
    }
    // END: Updated function for JSON-LD Schema

    function displaySuggestedMovies(currentMovieId) {
        if (!suggestedMovieGrid || !currentDetailedMovie) {
            console.error('❌ displaySuggestedMovies: suggestedMovieGrid أو currentDetailedMovie غير موجودين. لا يمكن عرض الأفلام المقترحة.');
            return;
        }

        const currentMovieGenre = currentDetailedMovie.genre;
        let suggested = [];

        if (currentMovieGenre) {
            const currentMovieGenresArray = Array.isArray(currentMovieGenre) ? currentMovieGenre.map(g => String(g).toLowerCase().trim()) : [String(currentMovieGenre).toLowerCase().trim()];

            suggested = moviesData.filter(movie =>
                movie.id !== currentMovieId &&
                (Array.isArray(movie.genre)
                    ? movie.genre.some(g => currentMovieGenresArray.includes(String(g).toLowerCase().trim()))
                    : currentMovieGenresArray.includes(String(movie.genre || '').toLowerCase().trim())
                )
            );
            suggested = suggested.sort(() => 0.5 - Math.random());
        }

        if (suggested.length < 24) {
            const otherMovies = moviesData.filter(movie => movie.id !== currentMovieId && !suggested.includes(movie));
            const shuffledOthers = otherMovies.sort(() => 0.5 - Math.random());
            const needed = 24 - suggested.length;
            suggested = [...suggested, ...shuffledOthers.slice(0, needed)];
        }

        const finalSuggested = suggested.slice(0, 24);

        if (finalSuggested.length === 0) {
            suggestedMovieGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">لا توجد أفلام مقترحة حالياً.</p>';
            console.log('✨ [اقتراحات] لا توجد أفلام مقترحة متاحة بعد التصفية.');
            return;
        }

        displayMovies(finalSuggested, suggestedMovieGrid);
        console.log(`✨ [اقتراحات] تم عرض ${finalSuggested.length} فيلمًا مقترحًا في ${suggestedMovieGrid.id}.`);
    }

    function showHomePage() {
        console.log('🏠 [توجيه] عرض الصفحة الرئيسية.');
        if (movieDetailsSection) movieDetailsSection.style.display = 'none';
        if (suggestedMoviesSection) suggestedMoviesSection.style.display = 'none';

        if (heroSection) heroSection.style.display = 'flex';
        if (movieGridSection) movieGridSection.style.display = 'block';

        if (searchInput) searchInput.value = '';
        if (sectionTitleElement) sectionTitleElement.textContent = 'أحدث الأفلام';

        moviesDataForPagination = moviesData.length > 0 ? [...moviesData].sort(() => 0.5 - Math.random()) : [];
        currentPage = 1;
        paginateMovies(moviesDataForPagination, currentPage);

        if (videoOverlay) {
            videoOverlay.style.pointerEvents = 'none';
            videoOverlay.classList.add('hidden');
            if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
        }

        // مسح محتوى iframe عند العودة للصفحة الرئيسية
        if (videoContainer) {
            videoContainer.innerHTML = '';
            console.log('[مشغل الفيديو] تم مسح movie-player-container عند الانتقال للصفحة الرئيسية.');
        }
        currentDetailedMovie = null;

        const newUrl = new URL(window.location.origin);
        history.pushState({ view: 'home' }, 'شاهد بلس - الصفحة الرئيسية', newUrl.toString());
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

    if (homeNavLink) {
        homeNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🏠 [تفاعل] تم النقر على رابط الرئيسية في قائمة التنقل.');
            showHomePage();
            if (mainNav && mainNav.classList.contains('nav-open')) {
                mainNav.classList.remove('nav-open');
            }
        });
    }

    navLinks.forEach(link => {
        if (link.id !== 'home-nav-link-actual') {
            link.addEventListener('click', () => {
                if (mainNav && mainNav.classList.contains('nav-open')) {
                    mainNav.classList.remove('nav-open');
                    console.log('📱 [تفاعل] تم النقر على رابط تنقل فرعي، تم إغلاق القائمة.');
                } else {
                    console.log('📱 [تفاعل] تم النقر على رابط تنقل فرعي.');
                }
            });
        }
    });

    if (watchNowBtn && movieGridSection) {
        watchNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🎬 [تفاعل] تم النقر على زر "شاهد الآن".');
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

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                paginateMovies(moviesDataForPagination, currentPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            console.log(`⬅️ [ترقيم الصفحات] تم النقر على الصفحة السابقة. الصفحة الحالية: ${currentPage}`);
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(moviesDataForPagination.length / moviesPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                paginateMovies(moviesDataForPagination, currentPage);
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
            console.log('🖼️ [نقر إعلان] تم النقر على بوستر تفاصيل الفيلم. محاولة فتح الرابط المباشر.');
            openAdLink(DIRECT_LINK_COOLDOWN_MOVIE_CARD, 'movieDetailsPoster');
        });
        console.log('[حدث] تم إرفاق مستمع النقر على بوستر تفاصيل الفيلم.');
    }

    if (videoOverlay) {
        videoOverlay.addEventListener('click', async (e) => {
            console.log('⏯️ [نقر إعلان] تم النقر على غطاء الفيديو. محاولة فتح الرابط المباشر.');
            const adOpened = openAdLink(DIRECT_LINK_COOLDOWN_VIDEO_INTERACTION, 'videoOverlay');

            if (adOpened) {
                // إذا تم فتح الإعلان بنجاح، يمكن إخفاء الغطاء والسماح بالتفاعل مع الـ iframe
                // لا يمكننا التحكم في تشغيل الفيديو داخل الـ iframe مباشرةً من هنا
                if (videoOverlay) {
                    videoOverlay.style.pointerEvents = 'none';
                    videoOverlay.classList.add('hidden');
                }
                if (videoLoadingSpinner) videoLoadingSpinner.style.display = 'none';
                console.log('[مشغل الفيديو] تم إخفاء الغطاء والسماح بالتعامل مع iframe بعد فتح الإعلان.');
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
            const movieId = parseInt(idParam);
            const movie = moviesData.find(m => m.id === movieId);

            if (!isNaN(movieId) && movie) {
                console.log(`🚀 [تحميل أولي] محاولة تحميل تفاصيل الفيلم من URL: المعّرف ${movieId}`);
                updatePageMetadata(movie); // استدعاء الدالة المعدلة
                generateAndInjectSchema(movie); // استدعاء الدالة المعدلة
                showMovieDetails(movieId);
            } else {
                console.warn('⚠️ [تحميل أولي] معّرف الفيلم غير صالح في URL أو الفيلم غير موجود. يتم عرض الصفحة الرئيسية.');
                showHomePage();
            }
        } else {
            console.log('🚀 [تحميل أولي] لا يوجد عرض محدد في URL. يتم عرض الصفحة الرئيسية.');
            showHomePage();
        }
    }

    window.addEventListener('popstate', (event) => {
        console.log('↩️ [Popstate] تم اكتشاف تصفح سجل المتصفح.', event.state);
        if (moviesData.length === 0) {
            console.warn('[Popstate] لم يتم تحميل بيانات الفيلم، محاولة جلب البيانات وعرض الصفحة بناءً على الحالة.');
            fetchMoviesData().then(() => {
                if (event.state && event.state.view === 'details' && event.state.id) {
                    const movie = moviesData.find(m => m.id === event.state.id);
                    if (movie) {
                        updatePageMetadata(movie); // استدعاء الدالة المعدلة
                        generateAndInjectSchema(movie); // استدعاء الدالة المعدلة
                        showMovieDetails(event.state.id);
                    } else {
                        console.warn('[Popstate] الفيلم غير موجود عند popstate. يتم عرض الصفحة الرئيسية.');
                        showHomePage();
                    }
                } else {
                    showHomePage();
                }
            }).catch(err => {
                console.error('[Popstate] فشل جلب بيانات الأفلام عند popstate:', err);
                showHomePage();
            });
            return;
        }

        if (event.state && event.state.view === 'details' && event.state.id) {
            const movie = moviesData.find(m => m.id === event.state.id);
            if (movie) {
                updatePageMetadata(movie); // استدعاء الدالة المعدلة
                generateAndInjectSchema(movie); // استدعاء الدالة المعدلة
                showMovieDetails(event.state.id);
            } else {
                console.warn('[Popstate] الفيلم غير موجود عند popstate. يتم عرض الصفحة الرئيسية.');
                showHomePage();
            }
        } else {
            showHomePage();
        }
    });

    fetchMoviesData();
});
