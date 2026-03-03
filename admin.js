/* GLOBAL ADMIN SYSTEM (NO External Dependencies) */

// 1. Navigation Logic
function toggleMenu() {
    const m = document.getElementById('navMenu');
    if (m) {
        m.style.display = (m.style.display === 'flex' ? 'none' : 'flex');
        m.style.flexDirection = 'column';
    }
}

function toggleDropdown(e, id) {
    e.preventDefault();
    document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d.id !== id) d.style.display = 'none';
    });
    const el = document.getElementById(id);
    if (el) {
        el.style.display = (el.style.display === 'flex' ? 'none' : 'flex');
    }
}

window.addEventListener('click', e => {
    if (!e.target.closest('#navMenu') && !e.target.closest('.hamburger')) {
        const nav = document.getElementById('navMenu');
        if (nav) nav.style.display = 'none';
    }
    if (!e.target.closest('.dropdown > a') && !e.target.closest('.dropdown-content')) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    }
});


// 2. Admin System Logic
document.addEventListener("DOMContentLoaded", () => {
    checkAdminSession();
});

function checkAdminSession() {
    if (sessionStorage.getItem('isAdmin') === 'true') {
        injectAdminToolbar();
    }
}

// --- DYNAMICALLY LOAD SWEETALERT2 ---
function loadSweetAlert(callback) {
    if (typeof Swal !== 'undefined') {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
    script.onload = callback;
    document.head.appendChild(script);
}

// --- NEW CUSTOM LOGIN UI ---
function requestAdminAccess() {
    loadSweetAlert(() => {
        // Check if modal already exists
        if (document.getElementById('admin-login-modal')) return;

        // Use SweetAlert2 for Login Input
        Swal.fire({
            title: 'Admin Login',
            input: 'password',
            inputPlaceholder: 'Enter Password',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Login',
            confirmButtonColor: '#fbc531',
            cancelButtonColor: '#d33',
            background: '#2f3640',
            color: '#fff',
            preConfirm: (password) => {
                if (password === "admin123") {
                    return true;
                } else {
                    Swal.showValidationMessage('Incorrect password!');
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                sessionStorage.setItem('isAdmin', 'true');
                Swal.fire({
                    title: 'Login Success!',
                    text: 'You are now in Edit Mode.',
                    icon: 'success',
                    background: '#2f3640',
                    color: '#fff',
                    confirmButtonColor: '#fbc531'
                }).then(() => {
                    location.reload();
                });
            }
        });
    });
}

function closeAdminModal() {
    // Legacy function support (not needed with SweetAlert, but kept for compatibility)
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.remove();
    Swal.close();
}

function attemptLogin() {
    // Legacy function support
}

// --- ADMIN TOOLBAR ---
function injectAdminToolbar() {
    loadSweetAlert(() => {
        const toolbar = document.createElement('div');
        toolbar.id = 'admin-toolbar-ui';
        toolbar.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: rgba(30, 39, 46, 0.95);
            border: 1px solid #fbc531; border-radius: 50px; padding: 10px 25px;
            z-index: 9999; display: flex; gap: 20px; align-items: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: sans-serif;
        `;

        // Edit Toggle
        const editBtn = document.createElement('button');
        editBtn.innerText = 'Edit Mode: OFF';
        editBtn.style.cssText = `background: none; border: none; color: #ccc; font-weight: bold; cursor: pointer; font-size: 14px;`;

        let isEditing = false;
        editBtn.onclick = () => {
            isEditing = !isEditing;
            toggleContentEditable(isEditing);
            editBtn.innerText = isEditing ? 'Edit Mode: ON' : 'Edit Mode: OFF';
            editBtn.style.color = isEditing ? '#2ed573' : '#ccc';
        };

        // Save Button
        const saveBtn = document.createElement('button');
        saveBtn.innerText = '💾 SAVE CHANGES';
        saveBtn.style.cssText = `
            background: #fbc531; border: none; padding: 8px 20px; border-radius: 20px; 
            color: #2f3640; font-weight: bold; cursor: pointer; transition: 0.3s;
        `;
        saveBtn.onmouseover = () => saveBtn.style.transform = 'scale(1.05)';
        saveBtn.onmouseout = () => saveBtn.style.transform = 'scale(1)';
        saveBtn.onclick = savePage;

        // Logout
        const logoutBtn = document.createElement('button');
        logoutBtn.innerText = 'Logout';
        logoutBtn.style.cssText = `background: none; border: none; color: #ff6b81; font-size: 14px; cursor: pointer; margin-left:10px;`;
        logoutBtn.onclick = () => {
            sessionStorage.removeItem('isAdmin');
            location.reload();
        };

        toolbar.appendChild(editBtn);
        toolbar.appendChild(saveBtn);
        toolbar.appendChild(logoutBtn);
        document.body.appendChild(toolbar);
    });
}

function toggleContentEditable(enable) {
    const elements = document.querySelectorAll('h1, h2, h3, h4, p, span, a, li, td, th');
    elements.forEach(el => {
        if (!el.closest('.navbar') && !el.closest('#admin-toolbar-ui') && !el.closest('.swal2-container')) {
            el.contentEditable = enable;
            el.style.border = enable ? '1px dashed rgba(251, 197, 49, 0.5)' : 'none';
        }
    });
}

// --- SAVE FUNCTION (RESTORED TO FETCH) ---
function savePage() {
    toggleContentEditable(false);

    const clone = document.documentElement.cloneNode(true);
    const toolbar = clone.querySelector('#admin-toolbar-ui');
    if (toolbar) toolbar.remove();

    // Remove SweetAlert containers from clone if any (though usually they are outside body or effectively auto-removed by logic)
    const swalContainer = clone.querySelector('.swal2-container');
    if (swalContainer) swalContainer.remove();

    const htmlContent = "<!DOCTYPE html>\n" + clone.outerHTML;

    let filename = window.location.pathname.split('/').pop();
    if (!filename || filename === '') filename = 'index.html';

    // Using FETCH to our PowerShell Server
    fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: htmlContent, filename: filename })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    title: 'Saved!',
                    text: 'Changes have been saved to the file.',
                    icon: 'success',
                    background: '#2f3640',
                    color: '#fff',
                    confirmButtonColor: '#2ed573'
                }).then(() => {
                    location.reload();
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: data.message,
                    icon: 'error',
                    background: '#2f3640',
                    color: '#fff'
                });
            }
        })
        .catch(err => {
            Swal.fire({
                title: 'Server Error!',
                text: "Failed! Ensure you opened the website using 'run_website.bat'",
                icon: 'warning',
                background: '#2f3640',
                color: '#fff'
            });
        });
}
// --- 3. GLOBAL SEARCH FUNCTIONALITY ---
document.addEventListener("DOMContentLoaded", () => {
    injectNavbarSearch();
});

function injectSearchBar() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    // Create Search Container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = `
        margin-top: 10px;
        padding: 0 10px;
        display: flex;
        gap: 5px;
    `;

    // Search Input
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'globalSearchInput';
    input.placeholder = 'Search (e.g., Week 1)...';
    input.style.cssText = `
        padding: 8px;
        border-radius: 5px;
        border: none;
        width: 100%;
        background: rgba(255, 255, 255, 0.9);
        color: #333;
        font-family: 'Poppins', sans-serif;
    `;

    // Search Button
    const btn = document.createElement('button');
    btn.innerHTML = '🔍';
    btn.onclick = executeSearch;
    btn.style.cssText = `
        padding: 8px 12px;
        border-radius: 5px;
        border: none;
        background: #fbc531;
        cursor: pointer;
        transition: 0.3s;
    `;
    btn.onmouseover = () => btn.style.background = '#e1b12c';
    btn.onmouseout = () => btn.style.background = '#fbc531';

    // Enter Key Listener
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') executeSearch();
    });

    searchContainer.appendChild(input);
    searchContainer.appendChild(btn);


    // Append to Nav Menu (at the top or bottom - let's do top for visibility or bottom?)
    // Nav menu is flex-col. Let's put it at the top for easy access.
    navMenu.insertBefore(searchContainer, navMenu.firstChild);
}

function injectNavbarSearch() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');

    if (!navbar) return;

    // Create Search Container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = `
        display: flex;
        gap: 5px;
        align-items: center;
        margin-right: 15px;
    `;

    // Search Input
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'globalSearchInput';
    input.placeholder = 'Search...';
    input.style.cssText = `
        padding: 8px 12px;
        border-radius: 20px;
        border: none;
        width: 200px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-family: 'Poppins', sans-serif;
        outline: none;
        backdrop-filter: blur(5px);
        transition: 0.3s;
    `;

    // Focus effect
    input.onfocus = () => {
        input.style.background = 'rgba(255, 255, 255, 0.9)';
        input.style.color = '#333';
        input.style.width = '250px';
    };
    input.onblur = () => {
        input.style.background = 'rgba(255, 255, 255, 0.2)';
        input.style.color = 'white';
        input.style.width = '200px';
    };

    // Search Button
    const btn = document.createElement('button');
    btn.innerHTML = '🔍';
    btn.onclick = executeSearch;
    btn.style.cssText = `
        padding: 8px;
        border-radius: 50%;
        border: none;
        background: #fbc531;
        cursor: pointer;
        transition: 0.3s;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';

    // Enter Key Listener
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') executeSearch();
    });

    searchContainer.appendChild(input);
    searchContainer.appendChild(btn);

    if (hamburger) {
        navbar.insertBefore(searchContainer, hamburger);
    } else {
        navbar.appendChild(searchContainer);
    }
}

function executeSearch() {
    const input = document.getElementById('globalSearchInput');
    const query = input.value.toLowerCase().trim();

    if (!query) return;

    let targetPage = '';

    // --- Search Logic / Mapping ---

    // 1. Weeks (Minggu)
    // Matches "week 1", "week 10", "minggu 5", "5" (if purely numeric, maybe assume week?)
    const weekMatch = query.match(/(?:week|minggu)\s*(\d+)/i);
    if (weekMatch) {
        targetPage = `minggu${weekMatch[1]}.html`;
    }
    // Direct number check (cautious)
    else if (/^\d+$/.test(query)) {
        const num = parseInt(query);
        if (num >= 1 && num <= 24) targetPage = `minggu${num}.html`;
    }

    // 2. Specific Pages
    else if (query.includes('home') || query.includes('uta') || query.includes('index')) {
        targetPage = 'index.html';
    }
    else if (query.includes('background') || query.includes('latar') || query.includes('company')) {
        targetPage = 'latar.html';
    }
    else if (query.includes('summary') || query.includes('ringkas') || query.includes('exec')) {
        targetPage = 'ringkasan.html'; // Assuming Weekly Summary or Executive? 
        // Note: 'pengenalan.html' is Executive Summary based on nav. 'ringkasan.html' is Weekly Summary.
        if (query.includes('exec') || query.includes('intro')) targetPage = 'pengenalan.html';
    }
    else if (query.includes('report') || query.includes('lapor') || query.includes('tekhnikal') || query.includes('technical')) {
        targetPage = 'laporan.html';
    }
    else if (query.includes('recommend') || query.includes('saran') || query.includes('cadang')) {
        targetPage = 'cadangan.html';
    }
    else if (query.includes('conclu') || query.includes('kesimpul') || query.includes('tamat')) {
        targetPage = 'kesimpulan.html';
    }
    else if (query.includes('reference') || query.includes('rujukan') || query.includes('lampir')) {
        targetPage = 'lampiran.html';
    }
    else if (query.includes('object') || query.includes('objektif')) {
        targetPage = 'objektif.html'; // If it exists separately, or handled in latar
    }
    else if (query.includes('vision') || query.includes('visi') || query.includes('misi')) {
        targetPage = 'latar.html'; // Since we merged them
    }
    else if (query.includes('appreciation') || query.includes('dedica') || query.includes('pengharga')) {
        targetPage = 'penghargaan.html';
    }

    // --- Redirection ---
    if (targetPage) {
        // Optional: Check if page exists? JS client-side can't easily without fetch.
        // We'll just redirect.
        window.location.href = targetPage;
    } else {
        alert("❌ No page found for: " + query + "\nTry 'Week 1', 'Report', 'Background', etc.");
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
    }
}

// Reuse shake animation style if not present
if (!document.getElementById('search-styles')) {
    const style = document.createElement('style');
    style.id = 'search-styles';
    style.innerHTML = `
        .shake { animation: shake 0.5s; }
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
}
