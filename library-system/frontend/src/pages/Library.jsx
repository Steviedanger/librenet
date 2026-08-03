import { useEffect, useState } from 'react';
import useBooks from '../hooks/useBooks.js';
import useAuth from '../hooks/useAuth.js';
import bookService from '../services/bookService.js';
import SearchBar from '../components/SearchBar.jsx';
import BookCard from '../components/BookCard.jsx';
import Pagination from '../components/Pagination.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const Library = () => {
  const { isAuthenticated } = useAuth();
  const {
    filters,
    books,
    totalPages,
    total,
    loading,
    error,
    updateFilter,
    resetFilters,
  } = useBooks();

  const [genres, setGenres] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState(new Set());

  // Load genres once for the filter dropdown.
  useEffect(() => {
    bookService.genres().then((d) => setGenres(d.genres)).catch(() => {});
  }, []);

  // Load the user's bookmarks so cards reflect saved state.
  useEffect(() => {
    if (!isAuthenticated) {
      setBookmarkIds(new Set());
      return;
    }
    bookService
      .bookmarks()
      .then((d) => setBookmarkIds(new Set(d.books.map((b) => b._id))))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleToggleBookmark = async (bookId) => {
    try {
      const { bookmarked } = await bookService.toggleBookmark(bookId);
      setBookmarkIds((prev) => {
        const next = new Set(prev);
        if (bookmarked) next.add(bookId);
        else next.delete(bookId);
        return next;
      });
    } catch {
      /* ignore — UI will resync on next load */
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-serif text-3xl md:text-4xl">The Library</h1>
        <p className="mt-1 text-sm text-cream-300">
          {total} {total === 1 ? 'title' : 'titles'} in the collection
        </p>
      </header>

      <SearchBar
        filters={filters}
        genres={genres}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      <div className="mt-8">
        {loading ? (
          <LoadingSpinner className="py-20" label="Fetching books…" />
        ) : error ? (
          <p className="py-20 text-center text-red-300">{error}</p>
        ) : books.length === 0 ? (
          <div className="py-20 text-center text-cream-300/60">
            <p className="text-lg">No books match your filters.</p>
            <button onClick={resetFilters} className="btn-outline mt-4">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {books.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  bookmarked={bookmarkIds.has(book._id)}
                  onToggleBookmark={isAuthenticated ? handleToggleBookmark : undefined}
                />
              ))}
            </div>

            <div className="mt-10">
              <Pagination
                page={filters.page}
                totalPages={totalPages}
                onChange={(p) => updateFilter('page', p)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Library;
