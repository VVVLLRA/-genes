(() => {
  'use strict';

  const artboard = document.querySelector('.screen');
  const mobileSite = document.querySelector('.mobile-site');
  const intro = document.querySelector('#intro');
  const continueButton = document.querySelector('#intro-continue');
  const frontPhotos = [...document.querySelectorAll('.photo-front')];
  const stage = document.querySelector('.site-stage');
  const agreementTriggers = [...document.querySelectorAll('.agreement-trigger')];
  const agreementModal = document.querySelector('#agreement-modal');
  const agreementSign = document.querySelector('#agreement-sign');
  if (!artboard || !mobileSite || !stage || !intro || !continueButton || !frontPhotos.length || !agreementTriggers.length || !agreementModal || !agreementSign) return;

  const resize = () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      artboard.style.display = 'none';
      mobileSite.style.display = 'block';
      artboard.style.transform = 'none';
      stage.style.width = '100%';
      stage.style.height = 'auto';
      return;
    }
    const scale = Math.min(1, window.innerWidth / 1728);
    artboard.style.display = 'block';
    mobileSite.style.display = 'none';
    artboard.style.transform = `scale(${scale})`;
    stage.style.width = `${1728 * scale}px`;
    stage.style.height = `${7071 * scale}px`;
  };

  const enterSite = () => {
    intro.classList.add('intro-overlay--hidden');
    document.body.classList.remove('intro-open');
    window.setTimeout(() => intro.remove(), 450);
  };
  document.body.classList.add('intro-open');
  continueButton.addEventListener('click', enterSite);
  intro.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') enterSite();
  });

  frontPhotos.forEach((frontPhoto) => {
    const breakFrontPhoto = () => {
      if (frontPhoto.dataset.broken === 'true') return;
      frontPhoto.src = new URL('img/photo-front-broken.png', document.baseURI).href;
      frontPhoto.alt = 'Разбитая семейная фотография';
      frontPhoto.dataset.broken = 'true';
      frontPhoto.setAttribute('aria-label', 'Фотография разбита');
      frontPhoto.classList.add('photo-front--broken');
    };
    frontPhoto.addEventListener('click', breakFrontPhoto);
    frontPhoto.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        breakFrontPhoto();
      }
    });
  });

  let lastAgreementTrigger = agreementTriggers[0];
  const openAgreement = (trigger) => {
    lastAgreementTrigger = trigger;
    agreementModal.hidden = false;
    document.body.classList.add('agreement-open');
    agreementSign.focus();
  };
  const closeAgreement = () => {
    agreementModal.hidden = true;
    document.body.classList.remove('agreement-open');
    lastAgreementTrigger.focus();
  };
  agreementTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openAgreement(trigger));
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAgreement(trigger);
      }
    });
  });
  agreementSign.addEventListener('click', closeAgreement);
  agreementModal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAgreement();
  });

  const caseTriggers = [...document.querySelectorAll('.case-trigger')];
  const getSpeechBubble = (trigger) => trigger.closest('.mobile-section')?.querySelector('.speech-bubble')
    || trigger.closest('.screen')?.querySelector('.speech-bubble');
  const showCaseMessage = (trigger) => {
    const bubble = getSpeechBubble(trigger);
    if (!bubble) return;
    bubble.textContent = trigger.dataset.message;
    bubble.classList.add('speech-bubble--visible');
  };
  const clearCaseMessage = (trigger) => {
    const bubble = getSpeechBubble(trigger);
    if (!bubble) return;
    bubble.textContent = '';
    bubble.classList.remove('speech-bubble--visible');
  };
  caseTriggers.forEach((trigger) => {
    trigger.addEventListener('mouseenter', () => showCaseMessage(trigger));
    trigger.addEventListener('mouseleave', () => {
      if (document.activeElement !== trigger) clearCaseMessage(trigger);
    });
    trigger.addEventListener('focus', () => showCaseMessage(trigger));
    trigger.addEventListener('blur', () => clearCaseMessage(trigger));
    trigger.addEventListener('click', () => showCaseMessage(trigger));
  });

  const movableArt = [...document.querySelectorAll('.draggable-art')];
  let activeDrag = null;
  const getPoint = (event) => event.touches ? event.touches[0] : event;
  const startDrag = (art, event) => {
    if (event.type === 'mousedown' && event.button !== 0) return;
    const point = getPoint(event);
    const isMobileArt = Boolean(art.closest('.mobile-object-stack'));
    const scale = isMobileArt ? 1 : Math.min(1, window.innerWidth / 1728);
    activeDrag = {
      art,
      startX: point.clientX,
      startY: point.clientY,
      startMoveX: Number(art.dataset.moveX || 0),
      startMoveY: Number(art.dataset.moveY || 0),
      scale,
      isMobileArt,
      startLeft: art.getBoundingClientRect().left,
      startTop: art.getBoundingClientRect().top,
      containerRect: art.closest('.mobile-object-stack')?.getBoundingClientRect(),
    };
    art.classList.add('is-dragging');
    event.preventDefault();
  };
  const moveDrag = (event) => {
    if (!activeDrag) return;
    const point = getPoint(event);
    const { art, startX, startY, startMoveX, startMoveY, scale, isMobileArt, startLeft, startTop, containerRect } = activeDrag;
    if (isMobileArt && containerRect) {
      const rect = art.getBoundingClientRect();
      const dx = (point.clientX - startX) / scale;
      const dy = (point.clientY - startY) / scale;
      const boundedDx = Math.max((containerRect.left - startLeft) / scale,
        Math.min((containerRect.right - rect.width - startLeft) / scale, dx));
      const boundedDy = Math.max((containerRect.top - startTop) / scale,
        Math.min((containerRect.bottom - rect.height - startTop) / scale, dy));
      const x = startMoveX + boundedDx;
      const y = startMoveY + boundedDy;
      art.dataset.moveX = String(x);
      art.dataset.moveY = String(y);
      art.style.transform = `translate(${x}px, ${y}px)`;
      if (event.cancelable) event.preventDefault();
      return;
    }
    const width = art.offsetWidth;
    const height = art.offsetHeight;
    const x = Math.max(-art.offsetLeft, Math.min(1728 - art.offsetLeft - width,
      startMoveX + (point.clientX - startX) / scale));
    const y = Math.max(2250 - art.offsetTop, Math.min(3850 - art.offsetTop - height,
      startMoveY + (point.clientY - startY) / scale));
    art.dataset.moveX = String(x);
    art.dataset.moveY = String(y);
    art.style.transform = `translate(${x}px, ${y}px)`;
    if (event.cancelable) event.preventDefault();
  };
  const stopDrag = () => {
    if (!activeDrag) return;
    activeDrag.art.classList.remove('is-dragging');
    activeDrag = null;
  };

  movableArt.forEach((art) => {
    art.draggable = false;
    art.addEventListener('mousedown', (event) => startDrag(art, event));
    art.addEventListener('touchstart', (event) => startDrag(art, event), { passive: false });
    art.addEventListener('dragstart', (event) => event.preventDefault());
  });
  window.addEventListener('mousemove', moveDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', moveDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
  window.addEventListener('touchcancel', stopDrag);
  window.addEventListener('resize', resize, { passive: true });
  resize();
})();
