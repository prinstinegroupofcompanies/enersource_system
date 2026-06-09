import { useEffect, useState } from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentsApi, CATEGORY_LABELS, DOCUMENT_CATEGORIES } from '../../lib/documentsApi';
import type { DocumentDetail, DocumentListItem } from '../../types/phase9';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FileInput } from '../../components/ui/FileInput';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function DocumentsLibraryPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<DocumentListItem[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'GENERAL', changeNotes: '' });
  const [file, setFile] = useState<File | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState('');

  const load = () => {
    if (!accessToken) return;
    documentsApi.list(accessToken, { category: category || undefined, search: search || undefined }).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken, category, search]);

  const openDetail = async (id: string) => {
    if (!accessToken) return;
    setDetail(await documentsApi.get(accessToken, id));
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    if (form.description) fd.append('description', form.description);
    fd.append('category', form.category);
    if (form.changeNotes) fd.append('changeNotes', form.changeNotes);
    await documentsApi.upload(accessToken, fd);
    setUploadOpen(false);
    setFile(null);
    load();
  };

  const downloadFile = async (url: string, fileName: string) => {
    if (!accessToken) return;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const submitVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !detail || !versionFile) return;
    const fd = new FormData();
    fd.append('file', versionFile);
    if (versionNotes) fd.append('changeNotes', versionNotes);
    await documentsApi.uploadVersion(accessToken, detail.id, fd);
    setVersionOpen(false);
    openDetail(detail.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        {hasPermission('documents', 'create') ? (
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" /> Upload document
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Documents">
          <ul className="divide-y divide-slate-50">
            {list.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => openDetail(d.id)} className="w-full py-3 text-left hover:bg-slate-50">
                  <span className="font-mono text-sm text-brand-800">{d.documentNumber}</span>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-slate-500">
                    {CATEGORY_LABELS[d.category] ?? d.category} · {d.versionCount} version(s)
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {detail ? (
          <Card
            title={detail.title}
            action={
              hasPermission('documents', 'edit') ? (
                <Button size="sm" onClick={() => setVersionOpen(true)}>
                  <Upload className="h-3 w-3" /> New version
                </Button>
              ) : undefined
            }
          >
            <p className="mb-3 text-sm text-slate-600">{detail.description ?? 'No description'}</p>
            <ul className="space-y-2 text-sm">
              {detail.versions?.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>
                    v{v.versionNumber} — {v.fileName}
                    {v.changeNotes ? <span className="block text-xs text-slate-500">{v.changeNotes}</span> : null}
                  </span>
                  {v.downloadUrl ? (
                    <button
                      type="button"
                      onClick={() => downloadFile(v.downloadUrl!, v.fileName)}
                      className="text-brand-700 hover:text-brand-900"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card title="Details">
            <p className="text-sm text-slate-500">Select a document to view versions.</p>
          </Card>
        )}
      </div>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload document">
        <form onSubmit={submitUpload} className={FORM_SPACING}>
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
          <FileInput label="File" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button type="submit" className="w-full" disabled={!file}>Upload</Button>
        </form>
      </Modal>

      <Modal open={versionOpen} onClose={() => setVersionOpen(false)} title="Upload new version">
        <form onSubmit={submitVersion} className={FORM_SPACING}>
          <Input label="Change notes" value={versionNotes} onChange={(e) => setVersionNotes(e.target.value)} />
          <FileInput label="File" required onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)} />
          <Button type="submit" className="w-full" disabled={!versionFile}>Save version</Button>
        </form>
      </Modal>
    </div>
  );
}
