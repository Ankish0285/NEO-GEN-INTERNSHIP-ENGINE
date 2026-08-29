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

        const email = process.env.ADMIN_EMAIL || 'neogenbyankish@gmail.com';
        const newPassword = process.env.ADMIN_PASSWORD || 'Neogen@0285';
        const newName = process.env.ADMIN_NAME || 'Ankish(CEO)';

        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('Admin user not found, creating new one...');
            await User.create({
                name: newName,
                email: email,
                password: newPassword,
                role: 'super_admin',
                active: true,
                isVerified: true
            });
            console.log(`Admin created with email: ${email} and password: ${newPassword}`);
        } else {
            user.name = newName;
            user.password = newPassword;
            user.role = 'super_admin';
            await user.save();
            console.log(`Admin updated - email: ${email}, role: super_admin, password reset to: ${newPassword}`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
