// YouTube "click to play" facades: show the thumbnail, load the player only when tapped.
// Keeps the page fast on mobile data.
document.querySelectorAll('.yt[data-yt]').forEach((box) => {
  const id = box.dataset.yt;
  const title = box.dataset.title || 'YouTube video';
  box.style.backgroundImage = `url("https://i.ytimg.com/vi/${id}/hqdefault.jpg")`;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', `Play video: ${title}`);
  btn.innerHTML = '<span class="play" aria-hidden="true"></span>';
  btn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    iframe.title = title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    box.replaceChildren(iframe);
  }, { once: true });
  box.appendChild(btn);
});

// Sticky "Buy now" bar on phones, shown once the hero button has scrolled away.
const bar = document.querySelector('.mobile-buy');
const heroBtn = document.querySelector('.hero [data-buy]');
const finalSection = document.querySelector('.final');
if (bar && heroBtn && 'IntersectionObserver' in window) {
  let pastHero = false, atFinal = false;
  const update = () => bar.classList.toggle('show', pastHero && !atFinal);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(heroBtn);
  if (finalSection) new IntersectionObserver(([e]) => { atFinal = e.isIntersecting; update(); }).observe(finalSection);
}

// Meta Pixel: record a checkout start when any buy button is tapped, then continue to Selar.
document.querySelectorAll('a[data-buy]').forEach((link) => {
  link.addEventListener('click', (e) => {
    if (typeof window.fbq !== 'function' || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    window.fbq('track', 'InitiateCheckout', { value: {{PRICE_VALUE}}, currency: 'NGN', content_name: 'Cleaning Calculator Pro' });
    e.preventDefault();
    setTimeout(() => { window.location.href = link.href; }, 250);
  });
});
