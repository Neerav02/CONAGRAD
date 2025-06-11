// Add a test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth endpoint is working' });
});

