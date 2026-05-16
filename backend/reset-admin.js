const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@neogen.com';
        const newPassword = 'admin123';

        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('Admin user not found, creating new one...');
            await User.create({
                name: 'Super Admin',
                email: email,
                password: newPassword,
                role: 'admin',
                active: true,
                isVerified: true
            });
            console.log('Admin created with password: admin123');
        } else {
            user.password = newPassword;
            await user.save();
            console.log('Admin password reset to: admin123');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
