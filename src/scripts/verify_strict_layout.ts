
const TARGET_URL = 'http://localhost:3000/admin/menu';

async function verify() {
    console.log(`🔍 Verifying Strict Redirect for ${TARGET_URL}...`);

    // Test 1: Unauthenticated -> Redirect
    try {
        const res = await fetch(TARGET_URL, {
            redirect: 'manual'
        });

        console.log(`[Unauth] Status: ${res.status}, Location: ${res.headers.get('location')}`);

        if (res.status === 307 || res.status === 302 && res.headers.get('location')?.includes('/login')) {
            console.log('✅ SUCCESS: Unauthenticated redirects to /login');
        } else {
            console.error(`❌ FAILED (Unauth): Expected 307/302 Redirect, got ${res.status}`);
        }

    } catch (e) {
        console.error('❌ Error connecting to server:', e);
    }
}

verify();
