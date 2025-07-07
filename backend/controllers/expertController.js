const Expert = require('../Models/Expert');

exports.getExpertPublicProfile = async (req, res) => {
    try {
        const expert = await Expert.findById(req.params.expertId).select('-password'); // Exclude password

        if (!expert) {
            return res.status(404).json({ error: 'Expert not found' });
        }

        // Return only public-facing information
        res.json({
            id: expert._id,
            name: expert.name,
            username: expert.username,
            email: expert.email,
            bio: expert.bio || '',
            expertise: expert.expertise || [],
            education: expert.education || '',
            experience: expert.experience || '',
            // You can add more public fields here like average rating, number of completed assignments etc.
        });
    } catch (error) {
        console.error('Error fetching expert public profile:', error);
        res.status(500).json({ error: 'Failed to fetch expert profile.' });
    }
}; 