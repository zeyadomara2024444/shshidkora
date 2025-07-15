document.addEventListener('DOMContentLoaded', () => {
    // ... (كود المتغيرات والثوابت والدوال المساعدة مثل formatDateTime, updateSEO, generateJsonLdSchema, lazyLoadImages, createMatchCard, createNewsCard, renderGrid) ...

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
        if (heroSection) { 
            heroSection.style.display = (viewName === 'home') ? 'block' : 'none';
            if (viewName === 'home') {
                heroSection.classList.add('active-view'); 
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

        // ... (بقية تعريفات متغيرات الـ SEO) ...

        let targetSectionClone; 

        // Render content based on the viewName
        // ... (كود التعامل مع home, live, upcoming, highlights, news views) ...

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
                // ... (بقية تعريفات عناصر الـ DOM لتفاصيل المباراة) ...
                const matchPlayerContainer = targetSectionClone.querySelector('#match-player-container');
                const videoOverlay = targetSectionClone.querySelector('#video-overlay');
                const overlayThumbnail = targetSectionClone.querySelector('#overlay-thumbnail');
                const loadingSpinner = targetSectionClone.querySelector('#video-loading-spinner');
                // ... (بقية تعريفات عناصر الـ DOM لتفاصيل المباراة) ...

                const backToHomeBtn = targetSectionClone.querySelector('#back-to-home-btn'); 
                if (backToHomeBtn) {
                    backToHomeBtn.onclick = (e) => {
                        e.preventDefault();
                        switchView('home');
                        window.history.pushState({ view: 'home' }, '', '#home');
                    };
                }


                matchDetailsTitleElement.textContent = match.title;
                // ... (بقية تعبئة البيانات في عناصر DOM) ...

                // Video Player & Overlay logic
                matchPlayerContainer.innerHTML = '';
                overlayThumbnail.src = match.thumbnail;
                videoOverlay.style.display = 'flex'; // Show the overlay
                loadingSpinner.style.display = 'none'; // Hide spinner initially


                // NEW CODE FOR SMOOTHER VIDEO LOADING / REDUCING STUTTERING
                // 1. Create a hidden iframe to preload the video stream
                const preloadIframe = document.createElement('iframe');
                preloadIframe.src = match.embed_url;
                preloadIframe.style.display = 'none'; // Keep it hidden
                preloadIframe.setAttribute('loading', 'eager'); // Suggest eager loading to browser
                preloadIframe.setAttribute('aria-hidden', 'true'); // For accessibility
                preloadIframe.setAttribute('allow', 'autoplay; fullscreen'); // Ensure permissions for preloading
                preloadIframe.frameBorder = "0"; // No border
                preloadIframe.scrolling = "no"; // No scrollbars
                preloadIframe.setAttribute('referrerpolicy', 'origin'); // Important for some embeds

                // Add event listeners for preload iframe loading state
                preloadIframe.onload = () => {
                    console.log('Video iframe preloaded successfully for:', match.title);
                };
                preloadIframe.onerror = () => {
                    console.error('Preload iframe failed to load for:', match.title);
                    // Optionally, remove it if it fails to load, or show an error to user earlier
                    // preloadIframe.remove();
                };
                document.body.appendChild(preloadIframe); // Append to body to load in background, outside the main content area

                // 2. When the user clicks the overlay to play
                videoOverlay.onclick = () => {
                    loadingSpinner.style.display = 'block'; // Show spinner
                    videoOverlay.classList.add('is-playing'); // Hide the overlay completely via CSS

                    // Try to use the preloaded iframe
                    if (preloadIframe && preloadIframe.parentNode) {
                        // Move the preloaded iframe into the player container
                        matchPlayerContainer.appendChild(preloadIframe);
                        preloadIframe.style.display = 'block'; // Make it visible
                        // Ensure spinner hides when video starts playing or is ready
                        preloadIframe.onload = () => {
                             loadingSpinner.style.display = 'none';
                             videoOverlay.style.display = 'none'; // Fully remove overlay after iframe is visible
                        };
                        preloadIframe.onerror = () => {
                            loadingSpinner.style.display = 'none';
                            matchPlayerContainer.innerHTML = '<p class="error-message">تعذر تحميل البث. يرجى المحاولة لاحقاً.</p>';
                            videoOverlay.style.display = 'none'; // Hide overlay on error
                        };
                    } else { 
                        // Fallback: If for some reason the preloaded iframe doesn't exist or was removed, create a new one
                        console.warn('Preloaded iframe not found or removed, creating new iframe.');
                        const newIframe = document.createElement('iframe');
                        newIframe.src = match.embed_url;
                        newIframe.allow = "autoplay; fullscreen";
                        newIframe.frameBorder = "0";
                        newIframe.scrolling = "no";
                        newIframe.setAttribute('referrerpolicy', 'origin');
                        newIframe.onload = () => {
                            loadingSpinner.style.display = 'none';
                            videoOverlay.style.display = 'none';
                        };
                        newIframe.onerror = () => {
                            loadingSpinner.style.display = 'none';
                            matchPlayerContainer.innerHTML = '<p class="error-message">تعذر تحميل البث. يرجى المحاولة لاحقاً.</p>';
                            videoOverlay.style.display = 'none';
                        };
                        matchPlayerContainer.appendChild(newIframe);
                    }

                    // ... (كود تحميل إعلان ad-banner-iframe-sync) ...
                };

                // ... (بقية كود التعامل مع score, highlights, suggested matches) ...

            } else {
                console.warn(`Match with ID ${dataId} not found. Redirecting to home.`);
                switchView('home');
                window.history.pushState({ view: 'home' }, '', '#home');
                return;
            }
        } 
        // ... (بقية كود التعامل مع search-results view) ...

        updateSEO(pageTitle, pageDescription, pageKeywords, pageUrl, ogImage, ogImageAlt);
        generateJsonLdSchema(jsonLdData, viewName);
    };

    // ... (بقية كود الـ Event Listeners والـ fetchData) ...
});
