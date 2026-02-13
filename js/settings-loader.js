// 網站設定載入器
// 讀取 localStorage 中的設定並應用到頁面

(function() {
    const defaults = {
        siteName: 'Aquarium Studio',
        siteSubtitle: '專業孔雀魚專賣店',
        lineId: 'tsAGZrm9vt',
        heroTitle: '專業孔雀魚養殖與販售',
        heroSubtitle: '精選優質品種 | 讓您輕鬆擁有美麗的水族世界',
        currency: 'NT$'
    };
    
    // 讀取設定
    const settings = JSON.parse(localStorage.getItem('aquarium_site_settings') || '{}');
    const merged = { ...defaults, ...settings };
    
    // 應用設定到頁面
    document.title = merged.siteName + ' - ' + merged.siteSubtitle;
    
    // Logo
    const logo = document.querySelector('.logo');
    if (logo) logo.innerHTML = '🐠 ' + merged.siteName;
    
    // Hero 標題
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroTitle) heroTitle.textContent = merged.heroTitle;
    if (heroSubtitle) heroSubtitle.textContent = merged.heroSubtitle;
    
    // LINE 連結
    document.querySelectorAll('a[href*="line.me/ti/p/"]').forEach(link => {
        if (merged.lineId) {
            link.href = 'https://line.me/ti/p/' + merged.lineId;
        }
    });
    
    // 購物車幣別
    window.CURRENCY = merged.currency;
    
    // 儲存到 window 供其他腳本使用
    window.SITE_SETTINGS = merged;
    
    console.log('✅ 網站設定已載入:', merged);
})();
