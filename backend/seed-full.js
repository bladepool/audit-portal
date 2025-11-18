const mongoose = require('mongoose');
const Project = require('./src/models/Project');
const User = require('./src/models/User');
const { sampleProject, sakuraaiSample } = require('./sample-data');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists, create if not
    let admin = await User.findOne({ email: 'admin@cfg.ninja' });
    if (!admin) {
      admin = new User({
        email: 'admin@cfg.ninja',
        password: 'admin123',
        name: 'Blade Ninja',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Check if sample projects already exist
    const existingDogMaga = await Project.findOne({ slug: 'dogmaga' });
    const existingSakura = await Project.findOne({ slug: 'sakuraai' });

    // Create Dog MAGA if it doesn't exist
    if (!existingDogMaga) {
      const dogMaga = new Project(sampleProject);
      await dogMaga.save();
      console.log('✅ Dog MAGA project created');
    } else {
      console.log('ℹ️  Dog MAGA project already exists');
    }

    // Create SAKURAAI if it doesn't exist
    if (!existingSakura) {
      const sakura = new Project(sakuraaiSample);
      await sakura.save();
      console.log('✅ SAKURAAI project created');
    } else {
      console.log('ℹ️  SAKURAAI project already exists');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Admin credentials:');
    console.log('   Email: admin@cfg.ninja');
    console.log('   Password: admin123');
    console.log('\n🌐 Sample projects available:');
    console.log('   • http://localhost:3000/dogmaga');
    console.log('   • http://localhost:3000/sakuraai');
    console.log('\n⚠️  Remember to change the admin password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
