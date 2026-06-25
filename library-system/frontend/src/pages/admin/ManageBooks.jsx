import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../../services/bookService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { resolveAsset } from '../../utils/helpers.js';

const EMPTY = {
  title: '',
  author: '',
  genre: '',
  description: '',
  publishedYear: new Date().getFullYear(),
  totalCopies: 1,
  pageCount: 0,
};

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // book being edited, or null
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState({ coverImage: null, pdfFile: null });
  const [status, setStatus] = useState({ busy: false, err: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await bookService.list({ limit: 50, sort: 'title' });
      setBooks(data.books);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFiles({ coverImage: null, pdfFile: null });
    setStatus({ busy: false, err: '' });
    setShowForm(true);
  };

  const openEdit = (book) => {
    setEditing(book);
    setForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      description: book.description || '',
      publishedYear: book.publishedYear,
      totalCopies: book.totalCopies,
      pageCount: book.pageCount || 0,
    });
    setFiles({ coverImage: null, pdfFile: null });
    setStatus({ busy: false, err: '' });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ busy: true, err: '' });

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (files.coverImage) fd.append('coverImage', files.coverImage);
    if (files.pdfFile) fd.append('pdfFile', files.pdfFile);

    try {
      if (editing) await bookService.update(editing._id, fd);
      else await bookService.create(fd);
      setShowForm(false);
      await load();
    } catch (err) {
      setStatus({ busy: false, err: err.response?.data?.message || 'Save failed' });
    }
  };

  const remove = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    await bookService.remove(book._id);
    setBooks((prev) => prev.filter((b) => b._id !== book._id));
  };

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin" className="text-sm text-forest-300 hover:underline">← Admin</Link>
          <h1 className="font-serif text-3xl md:text-4xl">Manage books</h1>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">+ Add book</button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-cream-300/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-800 text-cream-300/70">
              <tr>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">Genre</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Copies</th>
                <th className="px-4 py-3 font-medium">Borrows</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b._id} className="border-t border-cream-300/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.coverImage ? (
                        <img src={resolveAsset(b.coverImage)} alt="" className="h-12 w-8 rounded object-cover" />
                      ) : (
                        <div className="flex h-12 w-8 items-center justify-center rounded bg-navy-700">📕</div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-cream-100">{b.title}</div>
                        <div className="truncate text-xs text-cream-300/70">{b.author}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cream-300">{b.genre}</td>
                  <td className="px-4 py-3 text-cream-300">{b.publishedYear}</td>
                  <td className="px-4 py-3 text-cream-300">{b.availableCopies}/{b.totalCopies}</td>
                  <td className="px-4 py-3 text-cream-300">{b.totalBorrows}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(b)} className="btn-ghost px-3 py-1 text-xs">Edit</button>
                      <button onClick={() => remove(b)} className="btn-danger px-3 py-1 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <form onSubmit={submit} className="card my-8 w-full max-w-lg space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">{editing ? 'Edit book' : 'Add book'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-cream-300 hover:text-cream-100" aria-label="Close">✕</button>
            </div>

            {status.err && (
              <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{status.err}</p>
            )}

            <div>
              <label className="label" htmlFor="b-title">Title</label>
              <input id="b-title" className="input" value={form.title} onChange={field('title')} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="b-author">Author</label>
                <input id="b-author" className="input" value={form.author} onChange={field('author')} required />
              </div>
              <div>
                <label className="label" htmlFor="b-genre">Genre</label>
                <input id="b-genre" className="input" value={form.genre} onChange={field('genre')} required />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="b-desc">Description</label>
              <textarea id="b-desc" rows={3} className="input" value={form.description} onChange={field('description')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="b-year">Year</label>
                <input id="b-year" type="number" className="input" value={form.publishedYear} onChange={field('publishedYear')} required />
              </div>
              <div>
                <label className="label" htmlFor="b-copies">Copies</label>
                <input id="b-copies" type="number" min={0} className="input" value={form.totalCopies} onChange={field('totalCopies')} required />
              </div>
              <div>
                <label className="label" htmlFor="b-pages">Pages</label>
                <input id="b-pages" type="number" min={0} className="input" value={form.pageCount} onChange={field('pageCount')} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="b-cover">Cover image</label>
                <input id="b-cover" type="file" accept="image/*" className="text-sm text-cream-300" onChange={(e) => setFiles((f) => ({ ...f, coverImage: e.target.files?.[0] || null }))} />
              </div>
              <div>
                <label className="label" htmlFor="b-pdf">Book PDF</label>
                <input id="b-pdf" type="file" accept="application/pdf" className="text-sm text-cream-300" onChange={(e) => setFiles((f) => ({ ...f, pdfFile: e.target.files?.[0] || null }))} />
              </div>
            </div>
            {editing && (
              <p className="text-xs text-cream-300/60">
                Leave files empty to keep the existing cover/PDF.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary" disabled={status.busy}>
                {status.busy ? 'Saving…' : editing ? 'Save changes' : 'Add book'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageBooks;
