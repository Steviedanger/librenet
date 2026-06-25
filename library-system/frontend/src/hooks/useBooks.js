import { useCallback, useEffect, useRef, useState } from 'react';
import bookService from '../services/bookService.js';

const DEFAULT_FILTERS = {
  q: '',
  genre: '',
  year: '',
  availability: '',
  sort: 'newest',
  page: 1,
  limit: 10,
};

/**
 * Manage the catalogue: filters, debounced search, pagination and fetching.
 * Returns the current page of books plus helpers to update query state.
 */
export const useBooks = (initial = {}) => {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initial });
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce only the text query; other filters apply immediately.
  const [debouncedQ, setDebouncedQ] = useState(filters.q);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(filters.q), 400);
    return () => clearTimeout(debounceRef.current);
  }, [filters.q]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, q: debouncedQ };
      const data = await bookService.list(params);
      setBooks(data.books);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQ,
    filters.genre,
    filters.year,
    filters.availability,
    filters.sort,
    filters.page,
    filters.limit,
    filters,
  ]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Updating a filter (other than page) resets to page 1.
  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const resetFilters = () => setFilters({ ...DEFAULT_FILTERS });

  return {
    filters,
    books,
    totalPages,
    total,
    loading,
    error,
    updateFilter,
    resetFilters,
    refetch: fetchBooks,
  };
};

export default useBooks;
