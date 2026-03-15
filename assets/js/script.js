/* ============================================================
   SHOPIFY THEME DEVELOPER HANDBOOK
   Interactive Documentation Script
   Author: Senior Shopify Theme Architect
   Student: Gamal
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONSTANTS & SELECTORS
     ---------------------------------------------------------- */
  const SELECTORS = {
    sidebar: '.sidebar',
    sidebarOverlay: '.sidebar-overlay',
    mobileMenuBtn: '.mobile-menu-btn',
    themeToggle: '.sidebar-theme-toggle',
    searchInput: '.sidebar-search-input',
    navLinks: '.sidebar-nav-link',
    navItems: '.sidebar-nav-item',
    copyBtns: '.copy-btn',
    codeBlocks: '.code-block',
    progressBar: '.progress-bar-fill',
    content: '.content',
    navGroups: '.sidebar-nav-group',
  };

  const CLASSES = {
    open: 'open',
    active: 'active',
    copied: 'copied',
    hidden: 'hidden',
    animateFadeIn: 'animate-fade-in',
  };

  const STORAGE_KEYS = {
    theme: 'shopify-handbook-theme',
  };

  const MOBILE_BREAKPOINT = 768;


  /* ----------------------------------------------------------
     STATE
     ---------------------------------------------------------- */
  let state = {
    sidebarOpen: false,
    darkMode: false,
    currentPage: '',
  };


  /* ----------------------------------------------------------
     UTILITY FUNCTIONS
     ---------------------------------------------------------- */

  /**
   * Safely query a single DOM element
   */
  function $(selector, context = document) {
    return context.querySelector(selector);
  }

  /**
   * Safely query all matching DOM elements
   */
  function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

  /**
   * Debounce function to limit rapid calls
   */
  function debounce(fn, delay = 200) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Check if viewport is mobile sized
   */
  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  /**
   * Get current page filename from URL
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    return filename;
  }

  /**
   * Simple text normalization for search
   */
  function normalizeText(text) {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }


  /* ----------------------------------------------------------
     THEME (DARK / LIGHT MODE) MANAGEMENT
     ---------------------------------------------------------- */

  const ThemeManager = {
    init() {
      // Check saved preference
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);

      if (savedTheme) {
        state.darkMode = savedTheme === 'dark';
      } else {
        // Check system preference
        state.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      this.apply();
      this.bindEvents();
    },

    apply() {
      document.documentElement.setAttribute(
        'data-theme',
        state.darkMode ? 'dark' : 'light'
      );
    },

    toggle() {
      state.darkMode = !state.darkMode;
      this.apply();
      localStorage.setItem(STORAGE_KEYS.theme, state.darkMode ? 'dark' : 'light');
    },

    bindEvents() {
      const toggleBtn = $(SELECTORS.themeToggle);
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggle();
        });
      }

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEYS.theme)) {
          state.darkMode = e.matches;
          this.apply();
        }
      });
    },
  };


  /* ----------------------------------------------------------
     SIDEBAR MANAGEMENT
     ---------------------------------------------------------- */

  const SidebarManager = {
    sidebar: null,
    overlay: null,
    menuBtn: null,

    init() {
      this.sidebar = $(SELECTORS.sidebar);
      this.overlay = $(SELECTORS.sidebarOverlay);
      this.menuBtn = $(SELECTORS.mobileMenuBtn);

      if (!this.sidebar) return;

      this.highlightCurrentPage();
      this.bindEvents();
    },

    open() {
      if (!this.sidebar) return;
      state.sidebarOpen = true;
      this.sidebar.classList.add(CLASSES.open);
      if (this.overlay) this.overlay.classList.add(CLASSES.active);
      document.body.style.overflow = 'hidden';

      // Update aria
      if (this.menuBtn) this.menuBtn.setAttribute('aria-expanded', 'true');
    },

    close() {
      if (!this.sidebar) return;
      state.sidebarOpen = false;
      this.sidebar.classList.remove(CLASSES.open);
      if (this.overlay) this.overlay.classList.remove(CLASSES.active);
      document.body.style.overflow = '';

      // Update aria
      if (this.menuBtn) this.menuBtn.setAttribute('aria-expanded', 'false');
    },

    toggle() {
      if (state.sidebarOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    highlightCurrentPage() {
      const currentPage = getCurrentPage();
      state.currentPage = currentPage;

      const navLinks = $$(SELECTORS.navLinks);
      navLinks.forEach((link) => {
        link.classList.remove(CLASSES.active);

        const href = link.getAttribute('href');
        if (!href) return;

        const linkPage = href.split('#')[0].split('/').pop() || 'index.html';

        if (linkPage === currentPage) {
          link.classList.add(CLASSES.active);

          // Scroll the sidebar to show active link
          setTimeout(() => {
            link.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            });
          }, 300);
        }
      });
    },

    bindEvents() {
      // Mobile menu button
      if (this.menuBtn) {
        this.menuBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggle();
        });
      }

      // Overlay click closes sidebar
      if (this.overlay) {
        this.overlay.addEventListener('click', () => {
          this.close();
        });
      }

      // Close sidebar on navigation click (mobile)
      const navLinks = $$(SELECTORS.navLinks);
      navLinks.forEach((link) => {
        link.addEventListener('click', () => {
          if (isMobile()) {
            this.close();
          }
        });
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.sidebarOpen) {
          this.close();
        }
      });

      // Handle resize
      window.addEventListener(
        'resize',
        debounce(() => {
          if (!isMobile() && state.sidebarOpen) {
            this.close();
          }
        }, 150)
      );
    },
  };


  /* ----------------------------------------------------------
     SIDEBAR SEARCH / FILTER
     ---------------------------------------------------------- */

  const SearchManager = {
    input: null,

    init() {
      this.input = $(SELECTORS.searchInput);
      if (!this.input) return;

      this.bindEvents();
    },

    filter(query) {
      const normalizedQuery = normalizeText(query);
      const navItems = $$(SELECTORS.navItems);
      const navGroups = $$(SELECTORS.navGroups);

      if (!normalizedQuery) {
        // Show everything
        navItems.forEach((item) => {
          item.style.display = '';
        });
        navGroups.forEach((group) => {
          group.style.display = '';
        });
        return;
      }

      // Filter nav items
      navItems.forEach((item) => {
        const link = $('a', item);
        if (!link) {
          item.style.display = '';
          return;
        }

        const text = normalizeText(link.textContent);
        const matches = text.includes(normalizedQuery);
        item.style.display = matches ? '' : 'none';
      });

      // Hide empty groups
      navGroups.forEach((group) => {
        const visibleItems = $$('.sidebar-nav-item', group).filter(
          (item) => item.style.display !== 'none'
        );
        group.style.display = visibleItems.length > 0 ? '' : 'none';
      });
    },

    bindEvents() {
      this.input.addEventListener(
        'input',
        debounce((e) => {
          this.filter(e.target.value);
        }, 120)
      );

      // Clear on Escape
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.target.value = '';
          this.filter('');
          e.target.blur();
        }
      });

      // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.input.focus();

          // Open sidebar on mobile if needed
          if (isMobile() && !state.sidebarOpen) {
            SidebarManager.open();
            setTimeout(() => this.input.focus(), 350);
          }
        }
      });
    },
  };


  /* ----------------------------------------------------------
     COPY TO CLIPBOARD
     ---------------------------------------------------------- */

  const CopyManager = {
    init() {
      this.bindEvents();
    },

    async copyText(text) {
      try {
        // Modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }

        // Fallback for older browsers or non-HTTPS
        return this.fallbackCopy(text);
      } catch (err) {
        console.warn('Copy failed, trying fallback:', err);
        return this.fallbackCopy(text);
      }
    },

    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }

      document.body.removeChild(textarea);
      return success;
    },

    showCopiedFeedback(button) {
      const originalHTML = button.innerHTML;
      button.classList.add(CLASSES.copied);
      button.innerHTML = '✓ Copied!';

      setTimeout(() => {
        button.classList.remove(CLASSES.copied);
        button.innerHTML = originalHTML;
      }, 2000);
    },

    bindEvents() {
      // Delegate click events on copy buttons
      document.addEventListener('click', async (e) => {
        const copyBtn = e.target.closest(SELECTORS.copyBtns);
        if (!copyBtn) return;

        e.preventDefault();

        // Find the associated code block
        const codeBlock = copyBtn.closest(SELECTORS.codeBlocks);
        if (!codeBlock) return;

        const codeElement = $('code', codeBlock);
        if (!codeElement) return;

        const text = codeElement.textContent;
        const success = await this.copyText(text);

        if (success) {
          this.showCopiedFeedback(copyBtn);
        }
      });
    },
  };


  /* ----------------------------------------------------------
     SCROLL PROGRESS BAR
     ---------------------------------------------------------- */

  const ProgressManager = {
    progressFill: null,

    init() {
      this.progressFill = $(SELECTORS.progressBar);
      if (!this.progressFill) return;

      this.bindEvents();
    },

    update() {
      if (!this.progressFill) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) {
        this.progressFill.style.width = '100%';
        return;
      }

      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      this.progressFill.style.width = progress + '%';
    },

    bindEvents() {
      window.addEventListener('scroll', () => {
        requestAnimationFrame(() => this.update());
      });

      // Initial calculation
      this.update();
    },
  };


  /* ----------------------------------------------------------
     SMOOTH SCROLLING
     ---------------------------------------------------------- */

  const SmoothScrollManager = {
    init() {
      this.bindEvents();
    },

    scrollToElement(element) {
      if (!element) return;

      const headerHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--header-height')
          .trim()
      ) || 60;

      const offset = headerHeight + 32;

      const elementTop =
        element.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: elementTop,
        behavior: 'smooth',
      });
    },

    bindEvents() {
      document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          e.preventDefault();
          this.scrollToElement(targetElement);

          // Update URL hash without jumping
          history.pushState(null, '', href);
        }
      });
    },
  };


  /* ----------------------------------------------------------
     HEADING ANCHOR LINKS
     ---------------------------------------------------------- */

  const HeadingAnchors = {
    init() {
      const content = $(SELECTORS.content);
      if (!content) return;

      const headings = $$('h2[id], h3[id]', content);

      headings.forEach((heading) => {
        // Don't add if already has anchor
        if ($('.heading-anchor', heading)) return;

        const anchor = document.createElement('a');
        anchor.classList.add('heading-anchor');
        anchor.href = '#' + heading.id;
        anchor.textContent = '#';
        anchor.setAttribute('aria-label', 'Link to this section');

        heading.appendChild(anchor);
      });
    },
  };


  /* ----------------------------------------------------------
     ACTIVE SECTION TRACKING (scroll spy for in-page anchors)
     ---------------------------------------------------------- */

  const ScrollSpy = {
    headings: [],
    navLinks: [],

    init() {
      const content = $(SELECTORS.content);
      if (!content) return;

      this.headings = $$('h2[id], h3[id]', content);

      // Only run scroll spy for in-page sub-navigation links
      this.navLinks = $$('.sidebar-subnav .sidebar-nav-link');

      if (this.headings.length === 0 || this.navLinks.length === 0) return;

      this.bindEvents();
    },

    update() {
      const headerHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--header-height')
          .trim()
      ) || 60;

      const offset = headerHeight + 80;

      let current = '';

      for (const heading of this.headings) {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= offset) {
          current = heading.id;
        }
      }

      this.navLinks.forEach((link) => {
        link.classList.remove(CLASSES.active);
        const href = link.getAttribute('href');
        if (href && href.includes('#' + current)) {
          link.classList.add(CLASSES.active);
        }
      });
    },

    bindEvents() {
      window.addEventListener(
        'scroll',
        debounce(() => this.update(), 50)
      );

      this.update();
    },
  };


  /* ----------------------------------------------------------
     CODE BLOCK ENHANCEMENTS
     ---------------------------------------------------------- */

  const CodeBlockEnhancer = {
    init() {
      const codeBlocks = $$(SELECTORS.codeBlocks);

      codeBlocks.forEach((block) => {
        this.addLineNumbers(block);
      });
    },

    addLineNumbers(block) {
      // Optional: Add line numbers to code blocks if desired
      // For now, we keep it clean without line numbers
      // This is a placeholder for future enhancement
    },
  };


  /* ----------------------------------------------------------
     KEYBOARD SHORTCUTS
     ---------------------------------------------------------- */

  const KeyboardShortcuts = {
    init() {
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: Focus search
        // (Handled in SearchManager)

        // Ctrl/Cmd + \: Toggle sidebar (desktop)
        if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
          e.preventDefault();
          SidebarManager.toggle();
        }

        // Ctrl/Cmd + Shift + L: Toggle dark mode
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
          e.preventDefault();
          ThemeManager.toggle();
        }
      });
    },
  };


  /* ----------------------------------------------------------
     PAGE TRANSITION ANIMATION
     ---------------------------------------------------------- */

  const PageAnimations = {
    init() {
      const content = $(SELECTORS.content);
      if (content) {
        content.classList.add(CLASSES.animateFadeIn);
      }
    },
  };


  /* ----------------------------------------------------------
     EXTERNAL LINK HANDLER
     ---------------------------------------------------------- */

  const ExternalLinks = {
    init() {
      const links = $$('a[href^="http"]');

      links.forEach((link) => {
        // Don't modify internal links
        if (link.hostname === window.location.hostname) return;

        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');

        // Add external icon if not already present
        if (!link.querySelector('.external-icon')) {
          const icon = document.createElement('span');
          icon.classList.add('external-icon');
          icon.textContent = ' ↗';
          icon.style.fontSize = '0.75em';
          icon.style.opacity = '0.6';
          link.appendChild(icon);
        }
      });
    },
  };


  /* ----------------------------------------------------------
     TABLE OF CONTENTS GENERATOR (Auto-generate for pages)
     ---------------------------------------------------------- */

  const TOCGenerator = {
    init() {
      const tocContainer = document.getElementById('table-of-contents');
      if (!tocContainer) return;

      const content = $(SELECTORS.content);
      if (!content) return;

      const headings = $$('h2[id]', content);
      if (headings.length === 0) return;

      const list = document.createElement('ul');
      list.style.listStyle = 'none';
      list.style.padding = '0';
      list.style.margin = '0';

      headings.forEach((heading) => {
        const li = document.createElement('li');
        li.style.marginBottom = '0.5rem';

        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent.replace('#', '').trim();
        link.style.color = 'var(--color-text-secondary)';
        link.style.textDecoration = 'none';
        link.style.fontSize = 'var(--font-size-sm)';
        link.style.fontWeight = 'var(--font-weight-medium)';
        link.style.transition = 'color var(--transition-fast)';
        link.style.borderBottom = 'none';

        link.addEventListener('mouseenter', () => {
          link.style.color = 'var(--color-text-link)';
        });
        link.addEventListener('mouseleave', () => {
          link.style.color = 'var(--color-text-secondary)';
        });

        li.appendChild(link);
        list.appendChild(li);
      });

      tocContainer.appendChild(list);
    },
  };


  /* ----------------------------------------------------------
     IMAGE LOADING OPTIMIZATION
     ---------------------------------------------------------- */

  const ImageOptimizer = {
    init() {
      // Add lazy loading to images that don't have it
      const images = $$('.content img:not([loading])');
      images.forEach((img) => {
        img.setAttribute('loading', 'lazy');
      });
    },
  };


  /* ----------------------------------------------------------
     BACK TO TOP BUTTON
     ---------------------------------------------------------- */

  const BackToTop = {
    button: null,

    init() {
      this.create();
      this.bindEvents();
    },

    create() {
      this.button = document.createElement('button');
      this.button.className = 'back-to-top';
      this.button.innerHTML = '↑';
      this.button.setAttribute('aria-label', 'Back to top');
      this.button.title = 'Back to top';

      // Inline styles (to avoid modifying CSS file)
      Object.assign(this.button.style, {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1px solid var(--color-border-primary)',
        backgroundColor: 'var(--color-bg-card)',
        color: 'var(--color-text-primary)',
        fontSize: '1.2rem',
        cursor: 'pointer',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-md)',
        zIndex: '50',
        transition: 'all 0.2s ease',
      });

      document.body.appendChild(this.button);
    },

    toggle() {
      if (!this.button) return;

      if (window.scrollY > 400) {
        this.button.style.display = 'flex';
      } else {
        this.button.style.display = 'none';
      }
    },

    bindEvents() {
      if (!this.button) return;

      this.button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      this.button.addEventListener('mouseenter', () => {
        this.button.style.transform = 'translateY(-2px)';
        this.button.style.boxShadow = 'var(--shadow-lg)';
      });

      this.button.addEventListener('mouseleave', () => {
        this.button.style.transform = 'translateY(0)';
        this.button.style.boxShadow = 'var(--shadow-md)';
      });

      window.addEventListener(
        'scroll',
        debounce(() => this.toggle(), 100)
      );
    },
  };


  /* ----------------------------------------------------------
     COLLAPSIBLE SECTIONS (for sidebar groups or content)
     ---------------------------------------------------------- */

  const CollapsibleManager = {
    init() {
      const toggles = $$('[data-collapse-toggle]');

      toggles.forEach((toggle) => {
        toggle.addEventListener('click', (e) => {
          e.preventDefault();

          const targetId = toggle.getAttribute('data-collapse-toggle');
          const target = document.getElementById(targetId);

          if (!target) return;

          const isExpanded = target.style.display !== 'none';

          if (isExpanded) {
            target.style.display = 'none';
            toggle.setAttribute('aria-expanded', 'false');
          } else {
            target.style.display = '';
            toggle.setAttribute('aria-expanded', 'true');
          }
        });
      });
    },
  };


  /* ----------------------------------------------------------
     TAB COMPONENTS (for code examples with multiple languages)
     ---------------------------------------------------------- */

  const TabManager = {
    init() {
      const tabGroups = $$('.tab-group');

      tabGroups.forEach((group) => {
        const tabs = $$('.tab-btn', group);
        const panels = $$('.tab-panel', group);

        tabs.forEach((tab, index) => {
          tab.addEventListener('click', (e) => {
            e.preventDefault();

            // Deactivate all tabs and panels
            tabs.forEach((t) => t.classList.remove(CLASSES.active));
            panels.forEach((p) => {
              p.style.display = 'none';
            });

            // Activate clicked tab
            tab.classList.add(CLASSES.active);
            if (panels[index]) {
              panels[index].style.display = '';
            }
          });
        });
      });
    },
  };


  /* ----------------------------------------------------------
     INITIALIZATION
     ---------------------------------------------------------- */

  function init() {
    // Core functionality
    ThemeManager.init();
    SidebarManager.init();
    SearchManager.init();
    CopyManager.init();
    ProgressManager.init();

    // Navigation and scrolling
    SmoothScrollManager.init();
    HeadingAnchors.init();
    ScrollSpy.init();

    // Enhancements
    CodeBlockEnhancer.init();
    KeyboardShortcuts.init();
    PageAnimations.init();
    ExternalLinks.init();
    TOCGenerator.init();
    ImageOptimizer.init();
    BackToTop.init();
    CollapsibleManager.init();
    TabManager.init();

    // Log init complete (dev only)
    console.log(
      '%c📚 Shopify Theme Handbook Loaded',
      'color: #6366f1; font-size: 14px; font-weight: bold;'
    );
    console.log(
      '%cKeyboard shortcuts: Ctrl+K (search) | Ctrl+\\ (sidebar) | Ctrl+Shift+L (dark mode)',
      'color: #718096; font-size: 11px;'
    );
  }


  /* ----------------------------------------------------------
     BOOT
     ---------------------------------------------------------- */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();