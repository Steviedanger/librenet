import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Book from './models/Book.js';
import BorrowRecord from './models/BorrowRecord.js';

dotenv.config();

// Cover images use Unsplash source URLs so the catalogue looks populated
// without bundling binary assets. Replace with uploaded files via the admin
// panel as needed.
const books = [
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fiction',
    description:
      'Between life and death there is a library, and within it, infinite books that let you try the lives you could have lived.',
    publishedYear: 2020,
    totalCopies: 5,
    pageCount: 304,
    coverImage:
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    genre: 'History',
    description:
      'A sweeping account of how Homo sapiens came to dominate the planet, from the cognitive revolution to the present day.',
    publishedYear: 2011,
    totalCopies: 4,
    pageCount: 443,
    coverImage:
      'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&q=80',
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Science Fiction',
    description:
      'On the desert planet Arrakis, young Paul Atreides becomes embroiled in a struggle for the universe’s most valuable substance.',
    publishedYear: 1965,
    totalCopies: 6,
    pageCount: 688,
    coverImage:
      'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&q=80',
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    genre: 'Memoir',
    description:
      'A memoir about a young woman who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge.',
    publishedYear: 2018,
    totalCopies: 3,
    pageCount: 334,
    coverImage:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt & David Thomas',
    genre: 'Technology',
    description:
      'Timeless advice and practical techniques for writing better software and growing as a developer.',
    publishedYear: 1999,
    totalCopies: 5,
    pageCount: 352,
    coverImage:
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80',
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Classic',
    description:
      'The spirited Elizabeth Bennet matches wits with the proud Mr Darcy in this beloved comedy of manners.',
    publishedYear: 1813,
    totalCopies: 4,
    pageCount: 279,
    coverImage:
      'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=600&q=80',
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self-Help',
    description:
      'A practical framework for building good habits and breaking bad ones, one tiny change at a time.',
    publishedYear: 2018,
    totalCopies: 7,
    pageCount: 320,
    coverImage:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    description:
      'Bilbo Baggins is swept into an epic quest to reclaim a treasure guarded by the dragon Smaug.',
    publishedYear: 1937,
    totalCopies: 5,
    pageCount: 310,
    coverImage:
      'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=600&q=80',
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    genre: 'Psychology',
    description:
      'A Nobel laureate explores the two systems that drive the way we think — fast, intuitive thought and slow, deliberate reasoning.',
    publishedYear: 2011,
    totalCopies: 3,
    pageCount: 499,
    coverImage:
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
  },
  {
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    genre: 'Fantasy',
    description:
      'The legend of Kvothe, told in his own words — a tale of magic, music and the making of a hero.',
    publishedYear: 2007,
    totalCopies: 4,
    pageCount: 662,
    coverImage:
      'https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=600&q=80',
  },
];

const seed = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      BorrowRecord.deleteMany({}),
    ]);

    console.log('Creating default admin...');
    await User.create({
      name: 'Library Admin',
      email: 'admin@library.com',
      password: 'Admin@1234',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    console.log('Creating a verified demo student...');
    await User.create({
      name: 'Demo Student',
      email: 'student@library.com',
      password: 'Student@1234',
      role: 'student',
      isVerified: true,
      isActive: true,
    });

    console.log('Inserting sample books...');
    const docs = books.map((b) => ({ ...b, availableCopies: b.totalCopies }));
    await Book.insertMany(docs);

    console.log('\nSeed complete.');
    console.log('  Admin:   admin@library.com / Admin@1234');
    console.log('  Student: student@library.com / Student@1234');
    console.log(`  Books:   ${docs.length} inserted\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
