import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService.js';
import BookCard from '../components/BookCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import useAuth from '../hooks/useAuth.js';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&q=80';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    bookService
      .list({ sort: 'popular', limit: 4, page: 1 })
      .then((data) => active && setFeatured(data.books))
      .catch(() => active && setFeatured([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-900/80 via-navy-900/85 to-navy-900" />
        <div className="mx-auto max-w-7xl px-4 py-24 md:py-36">
          <div className="max-w-2xl">
            <p className="mb-4 inline-block rounded-full border border-forest-300/40 px-4 py-1 text-sm text-forest-300">
              A premium reading sanctuary
            </p>
            <h1 className="font-serif text-4xl font-bold leading-tight text-cream-100 md:text-6xl">
              Every book you’ll ever need, in one quiet place.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-cream-200/80">
              Browse the catalogue, borrow titles for two weeks, and read them
              online — bookmarks and reading progress kept exactly where you
              left off.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/library" className="btn-primary text-base">
                Browse the Library
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn-outline text-base">
                  Create a free account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: '📚', title: 'Curated catalogue', body: 'Thousands of titles across fiction, science, history and more.' },
            { icon: '🔖', title: 'Read & remember', body: 'Bookmark favourites and pick up reading right where you stopped.' },
            { icon: '⏳', title: 'Simple borrowing', body: 'Two-week loans with clear due dates and gentle overdue reminders.' },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-3 text-3xl" aria-hidden="true">{f.icon}</div>
              <h3 className="font-serif text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-cream-300">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl md:text-3xl">Popular right now</h2>
          <Link to="/library" className="text-sm text-forest-300 hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : featured.length ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-cream-300/60">
            No books yet. Seed the database to get started.
          </p>
        )}
      </section>
    </div>
  );
};

export default Home;
