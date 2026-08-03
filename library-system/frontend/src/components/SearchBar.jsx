/**
 * Controlled search + filter bar for the library catalogue. The text input is
 * debounced upstream in the useBooks hook, so this component stays presentational.
 */
const SearchBar = ({ filters, genres, onChange, onReset }) => {
  return (
    <div className="card space-y-4 p-4 md:p-5">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-300/50">
          🔍
        </span>
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange('q', e.target.value)}
          placeholder="Search by title, author or genre…"
          aria-label="Search books"
          className="input pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="label" htmlFor="filter-genre">Genre</label>
          <select
            id="filter-genre"
            value={filters.genre}
            onChange={(e) => onChange('genre', e.target.value)}
            className="input"
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-availability">Availability</label>
          <select
            id="filter-availability"
            value={filters.availability}
            onChange={(e) => onChange('availability', e.target.value)}
            className="input"
          >
            <option value="">Any</option>
            <option value="available">Available now</option>
            <option value="unavailable">Borrowed out</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-year">Year</label>
          <input
            id="filter-year"
            type="number"
            value={filters.year}
            onChange={(e) => onChange('year', e.target.value)}
            placeholder="e.g. 2020"
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="filter-sort">Sort by</label>
          <select
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => onChange('sort', e.target.value)}
            className="input"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most popular</option>
            <option value="title">Title A–Z</option>
            <option value="year">Publication year</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onReset} className="btn-ghost text-sm">
          Clear filters
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
