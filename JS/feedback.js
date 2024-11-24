app.post('/submit_feedback', (req, res) => {
    const { email, message } = req.body;
    if (email && message) {
        const feedbackFile = path.join(__dirname, 'feedback', `${email}.txt`);
        fs.writeFile(feedbackFile, `Email: ${email}\nMessage: ${message}`, (err) => {
            if (err) {
                res.status(500).json({ status: 'error', message: 'Failed to save feedback.' });
            } else {
                res.status(200).json({ status: 'success', message: 'Feedback submitted successfully.' });
            }
        });
    } else {
        res.status(400).json({ status: 'error', message: 'Both email and message are required.' });
    }
});
