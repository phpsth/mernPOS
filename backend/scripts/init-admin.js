#!/usr/bin/env node
const mongoose = require('mongoose');
const { hashPassword, validatePassword } = require('../utils/passwordUtils');
const User = require('../models/User');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
};

const initializeAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('❌ Admin user already exists. Exiting...');
            process.exit(0);
        }

        console.log('\n🔐 Creating Initial Admin User');
        console.log('================================\n');

        // Collect admin information
        const firstName = await question('Enter admin first name: ');
        const lastName = await question('Enter admin last name: ');
        const email = await question('Enter admin email: ');
        const username = await question('Enter admin username: ');
        
        let password;
        let passwordValid = false;
        
        while (!passwordValid) {
            password = await question('Enter admin password (min 8 chars, must include uppercase, lowercase, number, special char): ');
            const validation = validatePassword(password);
            
            if (validation.isValid) {
                passwordValid = true;
            } else {
                console.log('❌ Password validation failed:');
                validation.errors.forEach(error => console.log(`   - ${error}`));
                console.log('');
            }
        }

        // Create admin user directly in database
        // const hashedPassword = await hashPassword(password);
        
        const adminUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            username: username.toLowerCase().trim(),
            password: password,
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            profile: {
                department: 'administration'
            }
        });

        await adminUser.save();
        
        console.log('\n✅ Admin user created successfully!');
        console.log(`   Name: ${firstName} ${lastName}`);
        console.log(`   Email: ${email}`);
        console.log(`   Username: ${username}`);
        console.log(`   Role: admin\n`);
        
        console.log('🚀 You can now start the application and login with these credentials.');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
    }
};

initializeAdmin();