const express = require('express');
const path = require('path');
const db = require('./db');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(compression());
app.use(express.static(path.join(__dirname, 'templates')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Route for each HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'About_us.html'));
});
app.get('/contacts', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'contacts.html'));
});
app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'events.html'));
});
app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'gallery.html'));
});
app.get('/leadership', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'leadership.html'));
});
app.get('/membership', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'membership.html'));
});
app.get('/news', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'news.html'));
});

// Donation endpoint
app.post('/donate', (req, res) => {
  const { name, email, amount, message } = req.body;
  if (!name || !email || !amount) {
    return res.status(400).json({ error: 'Name, email, and amount are required.' });
  }
  db.run(
    'INSERT INTO donations (name, email, amount, message) VALUES (?, ?, ?, ?)',
    [name, email, amount, message],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      res.json({ success: true, donationId: this.lastID });
    }
  );
});

// Membership endpoint
app.post('/join', (req, res) => {
  const { name, email, institution, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  db.run(
    'INSERT INTO members (name, email, institution, phone) VALUES (?, ?, ?, ?)', 
    [name, email, institution, phone],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      res.json({ success: true, memberId: this.lastID });
    }
  );
});

// Contact form endpoint
app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  db.run(
    'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [name, email, subject, message],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      res.json({ success: true, contactId: this.lastID });
    }
  );
});

// Simple admin authentication middleware
const adminAuth = (req, res, next) => {
  const auth = { login: 'admin', password: 'admin123' };
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  res.status(401).send('Authentication required.');
};

// Admin panel route
app.get('/admin', adminAuth, (req, res) => {
  db.all('SELECT * FROM members ORDER BY created_at DESC', [], (err, members) => {
    if (err) return res.status(500).send('DB error');
    db.all('SELECT * FROM donations ORDER BY created_at DESC', [], (err2, donations) => {
      if (err2) return res.status(500).send('DB error');
      db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err3, contacts) => {
        if (err3) return res.status(500).send('DB error');
        let html = `<h1>Admin Panel</h1><h2>Members</h2><table border='1'><tr><th>Name</th><th>Email</th><th>Institution</th><th>Phone</th><th>Joined</th></tr>`;
        members.forEach(m => {
          html += `<tr><td>${m.name}</td><td>${m.email}</td><td>${m.institution||''}</td><td>${m.phone||''}</td><td>${m.created_at}</td></tr>`;
        });
        html += `</table><h2>Donations</h2><table border='1'><tr><th>Name</th><th>Email</th><th>Amount</th><th>Message</th><th>Date</th></tr>`;
        donations.forEach(d => {
          html += `<tr><td>${d.name}</td><td>${d.email}</td><td>${d.amount}</td><td>${d.message||''}</td><td>${d.created_at}</td></tr>`;
        });
        html += `</table><h2>Contact Messages</h2><table border='1'><tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Date</th></tr>`;
        contacts.forEach(c => {
          html += `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.subject||''}</td><td>${c.message||''}</td><td>${c.created_at}</td></tr>`;
        });
        html += `</table>`;
        res.send(html);
      });
    });
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT} and accessible on your local network.`);
});
