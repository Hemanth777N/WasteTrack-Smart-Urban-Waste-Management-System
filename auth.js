// auth.js (client-side)
(async function () {
  // Use the new API path
  const apiBase = '/api/employees';

  // helper for fetch
  async function postJson(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res;
  }

  // populate departments dropdown
  async function loadDepartments() {
    try {
      const res = await fetch('/api/departments'); // This endpoint is in routes/data.js
      const depts = await res.json();
      const sel = document.getElementById('deptSelect');
      sel.innerHTML = '<option value="">Select Department</option>';
      depts.forEach(d => sel.add(new Option(d.name, d.dept_id)));
    } catch (e) {
      console.error('Failed to load departments', e);
      const sel = document.getElementById('deptSelect');
      sel.innerHTML = '<option value="">Unable to load departments</option>';
    }
  }

  // sign-up
  if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const msg = document.getElementById('signupMsg'); msg.textContent = '';
      const data = {
        name: document.getElementById('fullName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        join_date: document.getElementById('joinDate').value || null,
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        dept_id: document.getElementById('deptSelect').value || null,
        role: document.getElementById('roleSelect').value,
        emp_code: document.getElementById('empCode').value.trim() || null
      };

      if (!data.name || !data.email || !data.password || !data.dept_id) {
        msg.textContent = 'Name, Email, Password, and Department are required.';
        return;
      }

      try {
        const res = await postJson(apiBase + '/register', data);
        const body = await res.json();
        if (!res.ok) {
          msg.textContent = body.error || 'Registration failed';
          return;
        }
        alert('Registered successfully. You can now log in.');
        document.getElementById('signupForm').reset();
      } catch (err) {
        console.error(err);
        msg.textContent = 'Registration failed (network).';
      }
    });
  }

  // login
  if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const msg = document.getElementById('loginMsg'); msg.textContent = '';
      const payload = {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value
      };
      try {
        // Use the new login path
        const res = await postJson(apiBase + '/login', payload);
        const body = await res.json();
        if (!res.ok) {
          msg.textContent = body.error || 'Login failed';
          return;
        }
        
        // This is a client-side session, NOT the server session.
        // It's just for the redirect. The server session is set by the cookie.
        const user = {
          emp_id: body.emp_id,
          name: body.name,
          role: body.role,
          dept_id: body.dept_id,
          email: body.email
        };
        // Using sessionStorage (clears when browser tab closes)
        sessionStorage.setItem('wt_user', JSON.stringify(user));

        // redirect by role
        if (user.role === 'Head') {
          window.location.href = '/head.html';
        } else if (user.role === 'Manager') {
          window.location.href = '/manager.html';
        } else {
          window.location.href = '/employee.html';
        }
      } catch (err) {
        console.error(err);
        msg.textContent = 'Login failed (network).';
      }
    });
  }

  // Button to go to public complaint page
  if (document.getElementById('toComplaintBtn')) {
    document.getElementById('toComplaintBtn').addEventListener('click', () => {
      window.location.href = '/complaint.html';
    });
  }

  // Load departments for the sign-up form
  if (document.getElementById('deptSelect')) {
    await loadDepartments();
  }
})();